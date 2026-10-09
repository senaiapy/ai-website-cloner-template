import { spawn } from "child_process";
import assert from "node:assert";

const PORT = 3008;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // wait and retry
    }
    await sleep(600);
  }
  throw new Error(`Servidor não respondeu em ${url} dentro de ${timeoutMs}ms`);
}

async function runTests() {
  console.log("=== INICIANDO SERVIDOR NEXT.JS NA PORTA", PORT, "===");

  const serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    console.log("Aguardando servidor inicializar...");
    await waitForServer(`${BASE_URL}/login`);
    console.log("Servidor pronto!\n");

    const tests = [
      { name: "Página de Login (/login)", url: "/login", expectedStatus: 200, checkText: "Núcleo Avalanche" },
      { name: "Página de Registro (/register)", url: "/register", expectedStatus: 200, checkText: "Criar conta" },
      { name: "Página Inicial (/inicio)", url: "/inicio", expectedStatus: 200, checkText: "Painel do Aluno" },
      { name: "Verificação de Descrições em Cards (/inicio)", url: "/inicio", expectedStatus: 200, checkText: "Formação completa e estruturada para colocar um agente de IA 24h na nuvem" },
      { name: "Catálogo de Cursos (/cursos)", url: "/cursos", expectedStatus: 200, checkText: "Catálogo de Cursos" },
      { name: "Verificação de Descrições e Aulas em Cards (/cursos)", url: "/cursos", expectedStatus: 200, checkText: "Conteúdo do Curso" },
      { name: "Detalhes do Curso (/curso/gravacao-imersao)", url: "/curso/gravacao-imersao", expectedStatus: 200, checkText: "Gravação Imersão" },
      { name: "Verificação de Cards de Aula com Descrição (/curso/gravacao-imersao)", url: "/curso/gravacao-imersao", expectedStatus: 200, checkText: "Aprenda a escolher o servidor ideal (KVM8 ou KVM4)" },
      { name: "Player da Aula (/aula/imersao-servidor)", url: "/aula/imersao-servidor", expectedStatus: 200, checkText: "Servidor do Agente" },
      { name: "Verificação de Conteúdo & Descrição da Aula (/aula/imersao-servidor)", url: "/aula/imersao-servidor", expectedStatus: 200, checkText: "Compre sua VPS na Hostinger" },
      { name: "Arena de Jogos (/jogos)", url: "/jogos", expectedStatus: 200, checkText: "Arena de IA" },
      { name: "Painel Administrativo (/admin)", url: "/admin", expectedStatus: 200, checkText: "Painel de Controle" },
      { name: "Perfil do Usuário (/perfil)", url: "/perfil", expectedStatus: 200, checkText: "Marcelo dos Anjos" },
      { name: "API: Cursos (/api/courses)", url: "/api/courses", expectedStatus: 200, jsonCheck: (data) => Array.isArray(data) && data.length > 0 },
      { name: "API: Categorias (/api/categories)", url: "/api/categories", expectedStatus: 200, jsonCheck: (data) => Array.isArray(data) && data.length > 0 },
      { name: "API: Jogos (/api/games)", url: "/api/games", expectedStatus: 200, jsonCheck: (data) => Array.isArray(data) && data.length > 0 },
      { name: "API: Downloads (/api/downloads)", url: "/api/downloads", expectedStatus: 200, jsonCheck: (data) => Array.isArray(data) && data.length > 0 },
      { name: "API: Admin Stats (/api/admin/stats)", url: "/api/admin/stats", expectedStatus: 200, jsonCheck: (data) => typeof data.totalStudents === "number" },
      { name: "Arquivo Download: Segurança da Naia MD", url: "/downloads/dia-1/02-seguranca-da-naia.md", expectedStatus: 200 },
      { name: "Arquivo Download: Subagente Juliana MD", url: "/downloads/dia-2/01-juliana-ops.md", expectedStatus: 200 },
      { name: "Arquivo Download: Starter Kit ZIP", url: "/downloads/starter-kit-automacoes.zip", expectedStatus: 200 },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const res = await fetch(`${BASE_URL}${test.url}`);
        assert.strictEqual(res.status, test.expectedStatus, `Status incorreto para ${test.url}`);

        if (test.checkText) {
          const bodyText = await res.text();
          assert.ok(bodyText.includes(test.checkText), `Texto "${test.checkText}" não encontrado na rota ${test.url}`);
        }

        if (test.jsonCheck) {
          const jsonData = await res.json();
          assert.ok(test.jsonCheck(jsonData), `Validação JSON falhou para ${test.url}`);
        }

        console.log(`✓ [PASS] ${test.name}`);
        passed++;
      } catch (err) {
        console.error(`✗ [FAIL] ${test.name}:`, err.message);
        failed++;
      }
    }

    // Test API Course creation (POST)
    try {
      const postRes = await fetch(`${BASE_URL}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Novo Curso E2E Test",
          subtitle: "Criado pelo teste automatizado",
          categorySlug: "fundamentos",
          description: "Validação de endpoint POST de criação de curso.",
        }),
      });
      assert.strictEqual(postRes.status, 201, "Status POST esperado 201");
      const postData = await postRes.json();
      assert.strictEqual(postData.title, "Novo Curso E2E Test");
      console.log("✓ [PASS] API: Criar Novo Curso via POST (/api/courses)");
      passed++;
    } catch (err) {
      console.error("✗ [FAIL] API: Criar Novo Curso via POST:", err.message);
      failed++;
    }

    console.log(`\n===================================`);
    console.log(`RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log(`===================================\n`);

    if (failed > 0) process.exit(1);
  } finally {
    serverProcess.kill("SIGTERM");
  }
}

runTests().catch((err) => {
  console.error("Erro na execução dos testes E2E:", err);
  process.exit(1);
});

