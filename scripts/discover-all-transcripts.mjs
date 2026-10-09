import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SESSION_DIR = "./chrome_session_data";

async function run() {
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    channel: "chrome",
    headless: true,
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://apostila.denderson.ai/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Check all gravacao-aula-1..25 and estudos-aula-1..10
  const candidates = [];
  for (let i = 1; i <= 25; i++) {
    candidates.push(`gravacao-aula-${i}`);
  }
  for (let i = 1; i <= 10; i++) {
    candidates.push(`estudos-aula-${i}`);
  }

  for (const c of candidates) {
    for (const sub of ["transcricao", "mapa"]) {
      const url = `https://api-apostila.denderson.ai/api/gravacoes/${c}/${sub}`;
      const res = await page.evaluate(async (u) => {
        try {
          const r = await fetch(u, { credentials: "include" });
          if (r.status === 200) {
            const ct = r.headers.get("content-type") || "";
            const body = await r.text();
            return { status: 200, contentType: ct, length: body.length, body };
          }
          return { status: r.status };
        } catch (e) {
          return { error: e.message };
        }
      }, url);

      if (res.status === 200) {
        console.log(`FOUND ${url}: ${res.length} bytes`);
        const folder = path.join("public/gravacoes", c);
        fs.mkdirSync(folder, { recursive: true });
        const ext = res.contentType.includes("json") ? ".json" : ".txt";
        fs.writeFileSync(path.join(folder, `${sub}${ext}`), res.body);
      }
    }
  }

  await context.close();
}

run();

