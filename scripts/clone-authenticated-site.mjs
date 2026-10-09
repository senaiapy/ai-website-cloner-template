import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const TARGET_DOMAIN = "apostila.denderson.ai";
const START_URL = `https://${TARGET_DOMAIN}/login`;
const SESSION_DIR = path.resolve("./chrome_session_data");
const OUTPUT_RESEARCH_DIR = path.resolve("./docs/research/apostila.denderson.ai");
const PUBLIC_DIR = path.resolve("./public");

fs.mkdirSync(OUTPUT_RESEARCH_DIR, { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "images"), { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "downloads"), { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "videos"), { recursive: true });

async function downloadAsset(url, destFolder) {
  try {
    const filename = path.basename(new URL(url).pathname) || `asset-${Date.now()}`;
    const destPath = path.join(destFolder, filename);
    if (fs.existsSync(destPath)) return filename;

    const res = await fetch(url);
    if (!res.ok) return null;
    const fileStream = fs.createWriteStream(destPath);
    await pipeline(res.body, fileStream);
    console.log(`  [DOWNLOADED] ${filename}`);
    return filename;
  } catch (err) {
    // ignore individual asset download errors
    return null;
  }
}

async function run() {
  console.log("==================================================================");
  console.log("INICIANDO NAVEGADOR GOOGLE CHROME OFICIAL COM PERFIL PERSISTENTE");
  console.log(`URL ALVO: ${START_URL}`);
  console.log("==================================================================\n");

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] || (await context.newPage());

  const discoveredAssets = new Set();
  const capturedApiData = [];

  // Intercept network responses for APIs and assets
  page.on("response", async (response) => {
    try {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";

      // Capture JSON APIs
      if (contentType.includes("application/json") && url.includes(TARGET_DOMAIN)) {
        try {
          const json = await response.json();
          capturedApiData.push({ url, data: json });
          const apiFile = path.join(OUTPUT_RESEARCH_DIR, `api-${Date.now()}.json`);
          fs.writeFileSync(apiFile, JSON.stringify({ url, json }, null, 2));
          console.log(`[API INTERCEPTADA] ${url}`);
        } catch {}
      }

      // Capture images and downloadable files
      if (
        contentType.includes("image/") ||
        contentType.includes("pdf") ||
        contentType.includes("zip") ||
        url.match(/\.(png|jpg|jpeg|webp|svg|pdf|zip|mp4)$/i)
      ) {
        if (!discoveredAssets.has(url)) {
          discoveredAssets.add(url);
          if (url.match(/\.(pdf|zip)$/i) || contentType.includes("pdf") || contentType.includes("zip")) {
            await downloadAsset(url, path.join(PUBLIC_DIR, "downloads"));
          } else if (url.match(/\.mp4$/i) || contentType.includes("video/")) {
            await downloadAsset(url, path.join(PUBLIC_DIR, "videos"));
          } else {
            await downloadAsset(url, path.join(PUBLIC_DIR, "images"));
          }
        }
      }
    } catch {}
  });

  // Handle browser native downloads
  page.on("download", async (download) => {
    const filename = path.join(PUBLIC_DIR, "downloads", download.suggestedFilename());
    await download.saveAs(filename);
    console.log(`[ARQUIVO BAIXADO VIA DOWNLOAD NATIVO] ${filename}`);
  });

  console.log(`Navegando para ${START_URL}...`);
  try {
    await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (err) {
    console.log("Nota: prosseguindo enquanto a página carrega:", err.message);
  }

  console.log("\n==================================================================");
  console.log(">>> AÇÃO NECESSÁRIA NO CHROME ABERTO <<<");
  console.log("1. Clique em 'Entrar com o Google'.");
  console.log("2. Faça o login com sua conta: marcelu.phd@gmail.com.");
  console.log("3. Assim que você entrar na plataforma (área autenticada),");
  console.log("   o robô detectará a sessão e iniciará o download e mapeamento de tudo!");
  console.log("==================================================================\n");

  // Wait until user is authenticated (leaves /login or cookies are set)
  console.log("Aguardando login do usuário no Google...");
  while (true) {
    const currentUrl = page.url();
    if (
      currentUrl.includes(TARGET_DOMAIN) &&
      !currentUrl.includes("/login") &&
      !currentUrl.includes("accounts.google.com")
    ) {
      console.log(`\nSESSÃO AUTENTICADA DETECTADA NA URL: ${currentUrl}`);
      break;
    }
    await page.waitForTimeout(2000);
  }

  // Allow authenticated dashboard to finish initial hydration
  await page.waitForTimeout(5000);

  const visitedUrls = new Set();
  const queue = [page.url()];

  console.log("\n=== INICIANDO MAPEAMENTO RECURSIVO E DOWNLOAD DE TODAS AS PÁGINAS ===");

  while (queue.length > 0) {
    const nextUrl = queue.shift();
    if (visitedUrls.has(nextUrl)) continue;
    visitedUrls.add(nextUrl);

    console.log(`\nProcessando página [${visitedUrls.size}]: ${nextUrl}`);
    try {
      await page.goto(nextUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2500); // Wait time big as requested

      // Save HTML snapshot
      const parsed = new URL(nextUrl);
      const cleanName = (parsed.pathname === "/" ? "index" : parsed.pathname.replace(/\//g, "_")) + ".html";
      const htmlPath = path.join(OUTPUT_RESEARCH_DIR, cleanName);
      fs.writeFileSync(htmlPath, await page.content());
      console.log(`  HTML salvo em: ${cleanName}`);

      // Extract internal links
      const links = await page.$$eval("a[href]", (elements) =>
        elements.map((el) => el.href).filter(Boolean)
      );

      for (const link of links) {
        try {
          const lUrl = new URL(link);
          if (
            lUrl.hostname === TARGET_DOMAIN &&
            !lUrl.pathname.includes("/logout") &&
            !visitedUrls.has(link) &&
            !queue.includes(link)
          ) {
            queue.push(link);
          }
        } catch {}
      }

      // Extract all image/video/download links
      const mediaUrls = await page.$$eval(
        "img[src], video[src], source[src], a[href$='.pdf'], a[href$='.zip']",
        (elements) => elements.map((el) => el.src || el.href).filter(Boolean)
      );

      for (const mediaUrl of mediaUrls) {
        if (!discoveredAssets.has(mediaUrl)) {
          discoveredAssets.add(mediaUrl);
          if (mediaUrl.match(/\.(pdf|zip)$/i)) {
            await downloadAsset(mediaUrl, path.join(PUBLIC_DIR, "downloads"));
          } else if (mediaUrl.match(/\.mp4$/i)) {
            await downloadAsset(mediaUrl, path.join(PUBLIC_DIR, "videos"));
          } else {
            await downloadAsset(mediaUrl, path.join(PUBLIC_DIR, "images"));
          }
        }
      }
    } catch (err) {
      console.log(`  Aviso ao processar ${nextUrl}: ${err.message}`);
    }
  }

  console.log("\n==================================================================");
  console.log(`CLONAGEM COMPLETA CONCLUÍDA!`);
  console.log(`- Páginas visitadas: ${visitedUrls.size}`);
  console.log(`- Assets/Arquivos baixados: ${discoveredAssets.size}`);
  console.log(`- APIs capturadas: ${capturedApiData.length}`);
  console.log(`Os arquivos foram organizados em:`);
  console.log(`  • HTMLs & APIs: docs/research/apostila.denderson.ai/`);
  console.log(`  • Imagens: public/images/`);
  console.log(`  • Downloads (PDF/ZIP): public/downloads/`);
  console.log(`  • Vídeos: public/videos/`);
  console.log("==================================================================\n");

  await context.close();
}

run().catch((err) => {
  console.error("Erro no script de clonagem:", err);
  process.exit(1);
});

