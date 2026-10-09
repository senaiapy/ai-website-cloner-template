import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const SESSION_DIR = path.resolve("./chrome_session_data");
const OUTPUT_RESEARCH_DIR = path.resolve("./docs/research/apostila.denderson.ai");
const PUBLIC_DIR = path.resolve("./public");

const lessonsJsonPath = path.join(OUTPUT_RESEARCH_DIR, "api-1791507180512.json");
const lessonsData = JSON.parse(fs.readFileSync(lessonsJsonPath, "utf-8"));
const lessonsList = lessonsData.json.lessons;

async function downloadFile(url, destFolder) {
  try {
    const filename = path.basename(new URL(url).pathname) || `asset-${Date.now()}`;
    const destPath = path.join(destFolder, filename);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`  [EXISTENTE] ${filename}`);
      return filename;
    }

    console.log(`  [BAIXANDO] ${url}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  [FALHA ${res.status}] ${url}`);
      return null;
    }
    const fileStream = fs.createWriteStream(destPath);
    await pipeline(res.body, fileStream);
    console.log(`  [CONCLUÍDO] ${filename} (${fs.statSync(destPath).size} bytes)`);
    return filename;
  } catch (err) {
    console.log(`  [ERRO AO BAIXAR ${url}]:`, err.message);
    return null;
  }
}

async function run() {
  console.log("=== INICIANDO CAPTURA DE TODAS AS AULAS E ASSETS ===");
  console.log(`Total de aulas para capturar: ${lessonsList.length}\n`);

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    channel: "chrome",
    headless: true,
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://apostila.denderson.ai/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const fullLessons = [];

  for (let i = 0; i < lessonsList.length; i++) {
    const item = lessonsList[i];
    console.log(`\n[${i + 1}/${lessonsList.length}] Coletando: ${item.id} (${item.title})`);

    const apiUrl = `https://api-apostila.denderson.ai/api/lessons/${item.id}`;
    let lessonDetail = null;

    try {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return { error: res.status, text: await res.text() };
        return await res.json();
      }, apiUrl);

      if (response && response.lesson) {
        lessonDetail = response.lesson;
        const savePath = path.join(OUTPUT_RESEARCH_DIR, `lesson-${item.id}.json`);
        fs.writeFileSync(savePath, JSON.stringify(lessonDetail, null, 2));
        console.log(`  Detalhes da aula salvos em lesson-${item.id}.json`);
      } else {
        console.log(`  Resposta da API:`, JSON.stringify(response));
      }
    } catch (err) {
      console.log(`  Erro ao consultar API: ${err.message}`);
    }

    if (lessonDetail) {
      // Check cover
      if (lessonDetail.cover) {
        const fullCoverUrl = lessonDetail.cover.startsWith("http")
          ? lessonDetail.cover
          : `https://apostila.denderson.ai${lessonDetail.cover}`;
        await downloadFile(fullCoverUrl, path.join(PUBLIC_DIR, "images"));
      }

      // Check video
      if (lessonDetail.video) {
        let videoSrc = null;
        if (lessonDetail.video.html) {
          const match = lessonDetail.video.html.match(/src=["']([^"']+)["']/);
          if (match) videoSrc = match[1];
        } else if (lessonDetail.video.src) {
          videoSrc = lessonDetail.video.src;
        }

        if (videoSrc) {
          console.log(`  Vídeo detectado: ${videoSrc}`);
          await downloadFile(videoSrc, path.join(PUBLIC_DIR, "videos"));
        }
      }

      // Extract downloadable links in material HTML
      if (lessonDetail.material) {
        const downloadMatches = [...lessonDetail.material.matchAll(/href=["']([^"']+\.(pdf|zip|mp4|json|py|ts|js))["']/gi)];
        for (const m of downloadMatches) {
          const fileUrl = m[1].startsWith("http") ? m[1] : `https://apostila.denderson.ai${m[1]}`;
          if (m[2].toLowerCase() === "mp4") {
            await downloadFile(fileUrl, path.join(PUBLIC_DIR, "videos"));
          } else {
            await downloadFile(fileUrl, path.join(PUBLIC_DIR, "downloads"));
          }
        }
      }

      fullLessons.push(lessonDetail);
    } else {
      fullLessons.push(item);
    }
  }

  // Save the master consolidated curriculum
  const masterCurriculumPath = path.join(OUTPUT_RESEARCH_DIR, "master-curriculum.json");
  fs.writeFileSync(masterCurriculumPath, JSON.stringify({ lessons: fullLessons }, null, 2));
  console.log(`\nCurriculum mestre completo salvo em ${masterCurriculumPath}`);

  await context.close();
  console.log("\n=== TODAS AS AULAS E ASSETS FORAM BAIXADOS COM SUCESSO! ===");
}

run().catch(console.error);
