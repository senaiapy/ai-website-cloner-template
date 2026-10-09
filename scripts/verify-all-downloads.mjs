import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("==================================================");
  console.log("VERIFICANDO TODOS OS DOWNLOADS E ROTAS DE ARQUIVOS");
  console.log("==================================================\n");

  // Collect test targets
  const targets = new Set();

  // 1. All downloadableResources in data.ts
  const dataTs = fs.readFileSync("src/lib/data.ts", "utf8");
  const dataUrls = [...dataTs.matchAll(/downloadUrl:\s*"([^"]+)"/g)].map((m) => m[1]);
  for (const u of dataUrls) targets.add(u);

  // 2. Direct public downloads files
  const pDownloads = path.resolve("public/downloads");
  function walkFiles(dir, prefix = "/downloads") {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walkFiles(full, `${prefix}/${f}`);
      } else {
        targets.add(`${prefix}/${f}`);
      }
    }
  }
  walkFiles(pDownloads);

  // 3. API gravacoes endpoints
  const gravacoes = [
    "/api/gravacoes/estudos-aula-1/transcricao",
    "/api/gravacoes/estudos-aula-1/mapa",
    "/api/gravacoes/estudos-aula-2/transcricao",
    "/api/gravacoes/estudos-aula-2/mapa",
    "/api/gravacoes/estudos-aula-3/transcricao",
    "/api/gravacoes/estudos-aula-3/mapa",
    "/api/gravacoes/estudos-aula-3/arquivos/orca-configuracao-claude-code.zip",
    "/api/gravacoes/estudos-aula-3/arquivos/pacote-1-criacao-erp-claude-code.zip",
    "/api/gravacoes/estudos-aula-4/transcricao",
    "/api/gravacoes/estudos-aula-4/mapa",
    "/api/gravacoes/estudos-aula-4/arquivos/pacote-2-modulos-opcionais-erp.zip",
    "/api/gravacoes/gravacao-aula-20/transcricao",
    "/api/gravacoes/gravacao-aula-21/transcricao",
  ];
  for (const g of gravacoes) targets.add(g);

  // 4. API imersao downloads endpoints
  const imersao = [
    "/api/imersao/downloads/dia-1/02-seguranca-da-naia.md",
    "/api/imersao/downloads/dia-1/03-comportamento-e-personalidade.md",
    "/api/imersao/downloads/dia-1/04-regras-naia.md",
    "/api/imersao/downloads/dia-1/06-isolamento-de-dados.md",
    "/api/imersao/downloads/dia-1/07-onboarding-entrevista-do-dono.md",
    "/api/imersao/downloads/dia-2/01-juliana-ops.md",
    "/api/imersao/downloads/dia-2/02-clone-do-dono-sdr.md",
    "/api/imersao/downloads/dia-2/03-paulo-dev.md",
    "/api/imersao/downloads/dia-2/04-jonathan-copy.md",
    "/api/imersao/downloads/dia-2/05-conectar-clone-no-instagram.md",
    "/api/imersao/downloads/dia-2/06-bonus-edicao-sanduiche-economico.md",
    "/api/imersao/downloads/dia-2/09-carrossel-instagram-publicacao.md",
    "/api/imersao/downloads/dia-2/29-metodo-criacao-landing-pages.md",
    "/api/imersao/downloads/dia-2/30-metodo-criacao-propostas.md",
    "/api/imersao/downloads/instalador-hermes-plano-b.zip",
  ];
  for (const im of imersao) targets.add(im);

  // 5. Skills API endpoints
  const manual = JSON.parse(
    fs.readFileSync("docs/research/apostila.denderson.ai/api-_api_manual.json", "utf8")
  );
  if (manual.catalog) {
    for (const [id, item] of Object.entries(manual.catalog)) {
      if (item.kind === "skill" && item.slug) {
        targets.add(`/api/skills/${item.slug}/download`);
      } else if (item.kind === "premium" && item.slug) {
        targets.add(`/api/premium/${item.slug}/download`);
      }
    }
  }

  console.log(`Total de rotas de download a testar: ${targets.size}\n`);

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const target of Array.from(targets).sort()) {
    const fullUrl = `${BASE_URL}${target}`;
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) {
        failed++;
        errors.push(`[HTTP ${res.status}] ${target}`);
        console.log(`❌ FALHA [${res.status}]: ${target}`);
        continue;
      }

      const buffer = await res.arrayBuffer();
      const size = buffer.byteLength;

      // Check if size is 24 bytes (the known unauthorized error)
      if (size === 24) {
        const text = new TextDecoder().decode(buffer);
        failed++;
        errors.push(`[ERRO 24 BYTES]: ${target} -> "${text}"`);
        console.log(`❌ FALHA [24 BYTES]: ${target} -> "${text}"`);
        continue;
      }

      if (size < 100) {
        failed++;
        errors.push(`[ARQUIVO MUITO PEQUENO (${size} bytes)]: ${target}`);
        console.log(`❌ FALHA [${size} BYTES]: ${target}`);
        continue;
      }

      passed++;
      console.log(`✅ OK (${(size / 1024).toFixed(1)} KB): ${target}`);
    } catch (e) {
      failed++;
      errors.push(`[ERRO DE CONEXÃO]: ${target} -> ${e.message}`);
      console.log(`❌ EXCEÇÃO: ${target} -> ${e.message}`);
    }
  }

  console.log("\n==================================================");
  console.log(`RESULTADO FINAL:`);
  console.log(`✅ PASSOU: ${passed}/${targets.size}`);
  console.log(`❌ FALHOU: ${failed}/${targets.size}`);
  console.log("==================================================");

  if (failed > 0) {
    console.error("\nDetalhes das falhas:");
    for (const err of errors) console.error(" - " + err);
    process.exit(1);
  } else {
    console.log("\nTODOS OS ARQUIVOS E ROTAS DE DOWNLOAD ESTÃO 100% OPERACIONAIS E ÍNTEGROS!");
    process.exit(0);
  }
}

run();

