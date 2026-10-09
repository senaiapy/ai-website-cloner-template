import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = "./chrome_session_data";
const targetUrls = [
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-1/mapa",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-1/transcricao",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-2/mapa",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-2/transcricao",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-3/mapa",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-3/transcricao",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-4/mapa",
  "https://api-apostila.denderson.ai/api/gravacoes/estudos-aula-4/transcricao",
  "https://api-apostila.denderson.ai/api/gravacoes/gravacao-aula-20/transcricao",
  "https://api-apostila.denderson.ai/api/gravacoes/gravacao-aula-21/transcricao",
];

async function run() {
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    channel: "chrome",
    headless: true,
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://apostila.denderson.ai/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  fs.mkdirSync("public/gravacoes", { recursive: true });

  for (const url of targetUrls) {
    console.log(`Fetching: ${url}`);
    const res = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, { credentials: "include" });
        const ct = r.headers.get("content-type") || "";
        const isJson = ct.includes("json");
        const body = await r.text();
        return { status: r.status, contentType: ct, body };
      } catch (e) {
        return { error: e.message };
      }
    }, url);

    if (res.status === 200) {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/").filter(Boolean); // ['api', 'gravacoes', 'estudos-aula-1', 'transcricao']
      const folder = path.join("public/gravacoes", parts[2]);
      fs.mkdirSync(folder, { recursive: true });
      const filename = parts[3] + (res.contentType.includes("json") ? ".json" : ".txt");
      const filePath = path.join(folder, filename);
      fs.writeFileSync(filePath, res.body);
      console.log(`  Saved to ${filePath} (${res.body.length} chars)`);
    } else {
      console.log(`  Failed:`, res.status, res.error);
    }
  }

  await context.close();
}

run();

