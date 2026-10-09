import { chromium } from "playwright";
import path from "path";

async function generatePdfs() {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();

  // 1. Apostila Completa de Inteligência Artificial
  const apostilaHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Apostila Completa de Inteligência Artificial · Formação NAIA</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
      body {
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #1a1a1a;
        margin: 0;
        padding: 40px;
        line-height: 1.6;
      }
      .header {
        border-bottom: 3px solid #ff4d00;
        padding-bottom: 24px;
        margin-bottom: 32px;
      }
      .badge {
        background: #ff4d00;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 6px;
        display: inline-block;
        margin-bottom: 12px;
      }
      h1 {
        font-size: 32px;
        font-weight: 800;
        color: #0b1528;
        margin: 0 0 10px 0;
      }
      .subtitle {
        font-size: 16px;
        color: #555;
        margin-bottom: 24px;
      }
      h2 {
        font-size: 20px;
        color: #0b1528;
        border-left: 4px solid #ff4d00;
        padding-left: 12px;
        margin-top: 28px;
        margin-bottom: 12px;
      }
      p, li {
        font-size: 14px;
        color: #333;
      }
      .card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      .page-break {
        page-break-after: always;
      }
      code {
        background: #eee;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <span class="badge">Material Oficial · Avalanche Academy</span>
      <h1>Apostila Completa de Inteligência Artificial</h1>
      <div class="subtitle">Manual Definitivo da NAIA: Da Arquitetura Autônoma ao Desenvolvimento de Agentes em Produção</div>
    </div>

    <h2>1. Visão Geral da Arquitetura NAIA</h2>
    <p>A NAIA (Núcleo Autônomo de Inteligência e Ação) representa a nova geração de operadores digitais autônomos. Diferente de chatbots tradicionais, a NAIA possui memória persistente, ferramentas nativas de execução em linha de comando, integração direta via canais como Telegram e WhatsApp, e capacidade de orquestrar subagentes especializados.</p>

    <div class="card">
      <strong>Pilares Centrais da Formação:</strong>
      <ul>
        <li><strong>Isolamento e Segurança:</strong> Princípio de privilégio mínimo em VPS própria, garantindo soberania total dos seus dados.</li>
        <li><strong>Comportamento e Persona:</strong> Alinhamento contextual para comunicação natural, profissional e direcionada a objetivos.</li>
        <li><strong>Subagentes de Alta Performance:</strong> Equipe multidisciplinar cobrindo operações, prospecção, redação e desenvolvimento de software.</li>
        <li><strong>Claude Code & Codex:</strong> Automação de engenharia de software diretamente do terminal sem fricção manual.</li>
      </ul>
    </div>

    <h2>2. Princípios de Segurança e Isolamento</h2>
    <p>A blindagem da sua agente garante que credenciais, chaves de API, senhas bancárias e arquivos privados permaneçam restritos ao ambiente do dono:</p>
    <ul>
      <li>Nenhum dado é compartilhado com plataformas externas sem criptografia fim-a-fim.</li>
      <li>Uso de regras explícitas (System Prompts) com verificação de limites operacionais.</li>
      <li>Isolamento de variáveis sensíveis em arquivos <code>.env</code> com permissões <code>chmod 600</code>.</li>
    </ul>

    <h2>3. O Ecossistema de Subagentes</h2>
    <div class="card">
      <strong>Juliana (Ops & Coordenação):</strong> Gerencia filas de demandas, organiza tarefas da semana e direciona prioridades.<br><br>
      <strong>Davi (SDR & Vendas):</strong> Qualifica leads recebidos, conduz follow-ups consultivos e agenda reuniões no calendário.<br><br>
      <strong>Jonathan (Copywriter):</strong> Produz narrativas, carrosséis de autoridade, emails e roteiros com alta retenção.<br><br>
      <strong>Paulo (Desenvolvedor Fullstack):</strong> Cria landings, conserta bugs, executa deploys em Docker e constrói integrações.
    </div>

    <div class="page-break"></div>

    <h2>4. Guia de Instalação e Execução (Plano B & Hermes)</h2>
    <p>Para instalar a infraestrutura em qualquer VPS Ubuntu 22.04+:</p>
    <div class="card">
      <code>curl -sSL https://get.docker.com | sh</code><br>
      <code>git clone https://github.com/denderson/naia-core.git</code><br>
      <code>cp .env.example .env && docker compose up -d</code>
    </div>
    <p>Com o container em execução, associe o token do seu bot Telegram e inicie as conversas de calibração utilizando os scripts de Onboarding fornecidos no Dia 1.</p>

    <h2>5. Melhores Práticas e Manutenção Contínua</h2>
    <ul>
      <li>Execute backups diários do banco SQLite / Postgres local.</li>
      <li>Realize testes periódicos com as suites de testes E2E do repositório.</li>
      <li>Mantenha as dependências e o Node.js atualizados.</li>
    </ul>
  </body>
  </html>
  `;

  await page.setContent(apostilaHtml);
  await page.pdf({
    path: path.resolve("./public/downloads/apostila-ia-completa.pdf"),
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    printBackground: true,
  });
  console.log("apostila-ia-completa.pdf generated!");

  // 2. Slides e Resumo das Aulas
  const slidesHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Slides e Mapas Mentais · Formação NAIA</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
      body {
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #ffffff;
        background: #0f172a;
        margin: 0;
        padding: 40px;
        line-height: 1.5;
      }
      .slide {
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 32px;
        margin-bottom: 30px;
        page-break-after: always;
      }
      .slide-badge {
        color: #ff4d00;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      h1 {
        font-size: 26px;
        font-weight: 800;
        margin: 8px 0 16px 0;
        color: #f8fafc;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 20px;
      }
      .box {
        background: #0f172a;
        border: 1px solid #475569;
        border-radius: 8px;
        padding: 16px;
      }
      .box h3 {
        margin: 0 0 8px 0;
        color: #38bdf8;
        font-size: 16px;
      }
      p, li {
        font-size: 13px;
        color: #cbd5e1;
      }
    </style>
  </head>
  <body>
    <!-- SLIDE 1 -->
    <div class="slide">
      <div class="slide-badge">Módulo 1 · Imersão Dia 1</div>
      <h1>Fundação da Agente & Arquitetura na Nuvem</h1>
      <div class="grid">
        <div class="box">
          <h3>Infraestrutura Privada</h3>
          <ul>
            <li>Configuração VPS Hostinger / Hetzner</li>
            <li>Docker containerization</li>
            <li>Port forwarding & Firewall seguro</li>
          </ul>
        </div>
        <div class="box">
          <h3>Personalidade & Consciência</h3>
          <ul>
            <li>Modelagem de regras comportamentais</li>
            <li>Prompt de alinhamento com dono</li>
            <li>Integração Telegram Bot API</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SLIDE 2 -->
    <div class="slide">
      <div class="slide-badge">Módulo 2 · Imersão Dia 2</div>
      <h1>Operação Autônoma, Cópias & Automação</h1>
      <div class="grid">
        <div class="box">
          <h3>Equipe de Agentes Especialistas</h3>
          <ul>
            <li>Juliana (Operations & Workflows)</li>
            <li>Davi (Prospecção comercial & SDR)</li>
            <li>Paulo (Engenharia & Correção de Bugs)</li>
            <li>Jonathan (Geração de Conteúdo)</li>
          </ul>
        </div>
        <div class="box">
          <h3>Engenharia com Claude Code</h3>
          <ul>
            <li>Construção do ERP do zero em minutos</li>
            <li>Geração de Landing Pages automatizadas</li>
            <li>Integração de pagamento e CRM OpenSource</li>
          </ul>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(slidesHtml);
  await page.pdf({
    path: path.resolve("./public/downloads/slides-resumo-aulas.pdf"),
    format: "A4",
    margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
    printBackground: true,
  });
  console.log("slides-resumo-aulas.pdf generated!");

  await browser.close();
}

generatePdfs().catch(console.error);

