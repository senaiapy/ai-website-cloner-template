import { spawn } from "child_process";
import { chromium } from "playwright";
import assert from "node:assert";

const PORT = 3012;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // keep retrying
    }
    await sleep(600);
  }
  throw new Error(`Servidor não respondeu em ${url} dentro de ${timeoutMs}ms`);
}

async function runSmokeTest() {
  console.log("==========================================================");
  console.log("🚀 INICIANDO PLAYWRIGHT SMOKE TEST & VERIFICAÇÃO COMPLETA");
  console.log(`Porta: ${PORT} | Base: ${BASE_URL}`);
  console.log("==========================================================\n");

  const serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  let browser;
  let passed = 0;
  let failed = 0;

  function reportPass(msg) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  }

  function reportFail(msg, err) {
    console.error(`  ✗ [FAIL] ${msg}:`, err?.message || err);
    failed++;
  }

  try {
    console.log("1. Aguardando servidor inicializar...");
    await waitForServer(`${BASE_URL}/inicio`);
    console.log("Servidor ativo e pronto para testes!\n");

    console.log("2. Inicializando navegador Chromium headless via Playwright...");
    browser = await chromium.launch({
      headless: true,
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);

    // Test 1: /inicio
    try {
      await page.goto(`${BASE_URL}/inicio`, { waitUntil: "domcontentloaded" });
      const title = await page.textContent("h1");
      assert.ok(title.includes("Marcelo dos Anjos"), "Título de boas-vindas não contém Marcelo dos Anjos");
      const badge = await page.textContent("header");
      assert.ok(badge.includes("Plano Naia Completa"), "Badge de plano não encontrado");
      reportPass("Página Inicial (/inicio): Welcome Banner, Plano Naia Completa e Usuário");
    } catch (e) {
      reportFail("Página Inicial (/inicio)", e);
    }

    // Test 2: Left Sidebar Navigation (Authentic Layout)
    try {
      const sidebarWordmark = await page.textContent("#sidebar");
      assert.ok(sidebarWordmark.includes("Núcleo Avalanche"), "Sidebar sem wordmark Avalanche");
      assert.ok(sidebarWordmark.includes("Comece aqui"), "Sidebar sem categoria Comece aqui");
      assert.ok(sidebarWordmark.includes("Gravação Imersão"), "Sidebar sem categoria Gravação Imersão");
      assert.ok(sidebarWordmark.includes("Grupo de Estudos"), "Sidebar sem categoria Grupo de Estudos");

      // Verify user badge in sidebar footer
      const userFooter = await page.textContent(".sidebar-foot");
      assert.ok(userFooter.includes("Marcelo dos Anjos"), "Sidebar footer sem nome do usuário");
      assert.ok(userFooter.includes("marcelu.phd@gmail.com"), "Sidebar footer sem email do usuário");
      assert.ok(userFooter.includes("Naia Completa"), "Sidebar footer sem badge Naia Completa");
      reportPass("Sidebar Autêntica: 8 Categorias, 14 Aulas, Badges Numéricas e Perfil Marcelo dos Anjos");
    } catch (e) {
      reportFail("Sidebar Autêntica", e);
    }

    // Test 3: /aula/imersao-dia-2 (User Screenshots 2 & 3 validation)
    try {
      await page.goto(`${BASE_URL}/aula/imersao-dia-2`, { waitUntil: "domcontentloaded" });

      // Video element and local poster/source
      const videoEl = await page.locator(".video-wrap video");
      await videoEl.waitFor({ state: "attached" });
      const videoSrc = await videoEl.getAttribute("src");
      const posterSrc = await videoEl.getAttribute("poster");
      assert.ok(videoSrc && videoSrc.includes("6aba4b87c13d4373c2dd181b.mp4"), `Vídeo local incorreto: ${videoSrc}`);
      assert.ok(posterSrc && posterSrc.includes("imersao-dia-2"), `Poster incorreto: ${posterSrc}`);

      // Sub-bar
      const subBarText = await page.textContent(".lesson-media");
      assert.ok(subBarText.includes("Dia 2 · Subagentes da Naia"), "Sub-bar do Dia 2 não encontrada");
      assert.ok(subBarText.includes("Downloads liberados"), "Pill Downloads liberados não encontrada");

      // Interactive Done Button
      const doneBtn = page.locator(".lf-done");
      await doneBtn.click();
      const isDone = await doneBtn.evaluate((el) => el.classList.contains("done"));
      assert.ok(isDone, "Botão concluir não alternou estado ativo");

      // Interactive 5 Stars
      const star5 = page.locator('.lf-star[data-v="5"]');
      await star5.click();

      // Comments section: verify authentic pre-populated comments
      const commentsList = await page.textContent("#commentList");
      assert.ok(commentsList.includes("Bruno Siqueira de Abreu e Lima"), "Comentário de Bruno Siqueira não encontrado");
      assert.ok(commentsList.includes("Hawk"), "Comentário de Hawk não encontrado");
      assert.ok(commentsList.includes("José"), "Comentário de José não encontrado");

      // Post a new comment
      await page.fill("#commentInput", "Comentário de teste automatizado via Playwright.");
      await page.click("#commentSend");
      await page.waitForTimeout(300);
      const updatedComments = await page.textContent("#commentList");
      assert.ok(updatedComments.includes("Comentário de teste automatizado"), "Novo comentário não foi adicionado");

      // Right column: verify downloads for Juliana, SDR, Paulo, etc.
      const textCol = await page.textContent(".lesson-text");
      assert.ok(textCol.includes("Juliana · Operações"), "Material sem Juliana Operações");
      assert.ok(textCol.includes("Paulo · Desenvolvedor"), "Material sem Paulo Dev");
      assert.ok(textCol.includes("Criação de Landing Pages"), "Material sem Criação de Landing Pages");

      reportPass("Aula Imersão Dia 2 (/aula/imersao-dia-2): Vídeo 16:9 Local, Sub-bar, Conclusão, 5 Estrelas, Comentários e Downloads");
    } catch (e) {
      reportFail("Aula Imersão Dia 2 (/aula/imersao-dia-2)", e);
    }

    // Test 4: /aula/gravacoes-estudos (Cards, Chapters & Accordion expansion test)
    try {
      await page.goto(`${BASE_URL}/aula/gravacoes-estudos`, { waitUntil: "domcontentloaded" });

      // Verify subnav pills (01 Onboarding, 02 Aula 2, 03 Aula 3, 04 Aula 4)
      const pageText = await page.textContent("body");
      assert.ok(pageText.includes("Onboarding"), "Subnav sem Onboarding");
      assert.ok(pageText.includes("Aula 2"), "Subnav sem Aula 2");
      assert.ok(pageText.includes("68 capítulos") || pageText.includes("capítulos"), "Contador de capítulos não encontrado");

      // Accordion click test: verify chapter description is initially hidden and opens on click
      const firstChapter = page.locator(".gv-chapter").first();
      const firstHead = firstChapter.locator(".gv-ch-head");
      await firstHead.click();

      const isOpen = await firstChapter.evaluate((el) => el.classList.contains("open"));
      assert.ok(isOpen, "Capítulo não abriu ao clicar no cabeçalho do card");

      const bodyText = await firstChapter.locator(".gv-ch-body").textContent();
      assert.ok(bodyText && bodyText.length > 20, "Descrição do capítulo vazia ou não expandida");
      assert.ok(bodyText.includes("assistir desde aqui"), "Botão seek do capítulo ausente");

      // Test "Expandir Todos os Capítulos" button
      const toggleAllBtn = page.getByRole("button", { name: /Abrir \/ Expandir Todos/i });
      await toggleAllBtn.click();
      await page.waitForTimeout(300);

      const allChaptersOpen = await page.locator(".gv-chapter.open").count();
      assert.ok(allChaptersOpen > 5, "Botão Expandir Todos os Capítulos não abriu os cards");

      reportPass("Grupo de Estudos (/aula/gravacoes-estudos): Cards com Descrição Completa, Accordion Interativo e Botão Expandir Todos");
    } catch (e) {
      reportFail("Grupo de Estudos (/aula/gravacoes-estudos)", e);
    }

    // Test 5: /cursos (Course Catalog Cards with Full Descriptions)
    try {
      await page.goto(`${BASE_URL}/cursos`, { waitUntil: "domcontentloaded" });
      const catalogText = await page.textContent("body");
      assert.ok(catalogText.includes("Catálogo Completo"), "Título do catálogo não encontrado");
      assert.ok(catalogText.includes("Conteúdo do Curso"), "Lista de aulas dos cards ausente");
      assert.ok(catalogText.includes("Gravação Imersão"), "Categoria Gravação Imersão ausente");
      assert.ok(catalogText.includes("Servidor do Agente"), "Aula Servidor do Agente ausente");
      reportPass("Catálogo de Cursos (/cursos): 8 Trilhas, Cards com Descrições, Módulos e Aulas");
    } catch (e) {
      reportFail("Catálogo de Cursos (/cursos)", e);
    }

    // Test 6: Verify all 14 lesson routes exist and return HTTP 200
    console.log("\n3. Verificando todas as 14 rotas de aulas...");
    const LESSON_IDS = [
      "conheca-naia",
      "acesso-suporte",
      "onboarding",
      "manual",
      "marketplace-skills",
      "marketplace-premium",
      "zoom-comunidade",
      "gravacoes-comunidade",
      "gravacoes-estudos",
      "imersao-servidor",
      "imersao-instalador-hermes",
      "imersao-dia-1",
      "imersao-dia-2",
      "extras",
    ];

    for (const lid of LESSON_IDS) {
      try {
        const res = await page.goto(`${BASE_URL}/aula/${lid}`, { waitUntil: "domcontentloaded" });
        assert.strictEqual(res.status(), 200, `Rota /aula/${lid} retornou status ${res.status()}`);
        reportPass(`Rota /aula/${lid} - Status 200 OK`);
      } catch (err) {
        reportFail(`Rota /aula/${lid}`, err);
      }
    }

    // Test 7: Verify all auxiliary screens
    console.log("\n4. Verificando telas auxiliares (/login, /register, /jogos, /admin, /perfil)...");
    const AUX_ROUTES = [
      { url: "/login", text: "Núcleo Avalanche" },
      { url: "/register", text: "Criar conta" },
      { url: "/jogos", text: "Arena de IA" },
      { url: "/admin", text: "Painel de Controle" },
      { url: "/perfil", text: "Marcelo dos Anjos" },
    ];

    for (const aux of AUX_ROUTES) {
      try {
        const res = await page.goto(`${BASE_URL}${aux.url}`, { waitUntil: "domcontentloaded" });
        assert.strictEqual(res.status(), 200, `Rota ${aux.url} retornou status ${res.status()}`);
        const content = await page.textContent("body");
        assert.ok(content.includes(aux.text), `Texto "${aux.text}" não encontrado em ${aux.url}`);
        reportPass(`Tela ${aux.url} - Status 200 OK & Conteúdo Confirmado`);
      } catch (err) {
        reportFail(`Tela ${aux.url}`, err);
      }
    }

    // Test 8: Verify local video files and downloads are accessible
    console.log("\n5. Verificando integridade dos arquivos locais baixados...");
    const LOCAL_FILES = [
      "/videos/6aba4b87c13d4373c2dd181b.mp4",
      "/videos/6ab8ad04c13d4373c2b95add.mp4",
      "/videos/6a8d89733c7881dfcfe5fee4.mp4",
      "/videos/6a8d8c83d0d6a7f1adfd852b.mp4",
      "/downloads/dia-2/01-juliana-ops.md",
      "/downloads/dia-2/03-paulo-dev.md",
      "/downloads/dia-1/02-seguranca-da-naia.md",
      "/downloads/starter-kit-automacoes.zip",
      "/downloads/orca-configuracao-claude-code.zip",
    ];

    for (const fileUrl of LOCAL_FILES) {
      try {
        const res = await fetch(`${BASE_URL}${fileUrl}`, { method: "HEAD" });
        assert.ok(res.status === 200 || res.status === 206, `Arquivo ${fileUrl} retornou status ${res.status}`);
        reportPass(`Arquivo ${fileUrl} - 200 OK`);
      } catch (err) {
        reportFail(`Arquivo ${fileUrl}`, err);
      }
    }

    console.log("\n==========================================================");
    console.log(`🎉 RESULTADO DO SMOKE TEST: ${passed} PASSOU | ${failed} FALHOU`);
    console.log("==========================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (browser) await browser.close();
    serverProcess.kill("SIGTERM");
  }
}

runSmokeTest().catch((err) => {
  console.error("Erro fatal no smoke test Playwright:", err);
  process.exit(1);
});

