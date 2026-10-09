import type { AdminStats, Category, Course, DownloadableResource, GameItem, Lesson } from "@/types";
import { lessonMaterials } from "./lesson-materials";

// ---------------------------------------------------------------------------
// REAL CAPTURED CURRICULUM & COURSES FROM apostila.denderson.ai
// Member: Marcelo dos Anjos (marcelu.phd@gmail.com)
// Plan: Naia Completa (Estudos Avançados em IA Agêntica)
// ---------------------------------------------------------------------------

export const categories: Category[] = [
  { 
    id: "cat-comece-aqui", 
    slug: "comece-aqui", 
    name: "Comece aqui", 
    description: "Visão geral da sua agente de inteligência artificial, time de subagentes e acesso ao suporte oficial." 
  },
  { 
    id: "cat-sua-naia", 
    slug: "sua-naia", 
    name: "Sua Naia", 
    description: "Onboarding inicial, calibração do modelo de negócio e manual operacional para comandos no Telegram." 
  },
  { 
    id: "cat-skills-naia", 
    slug: "skills-naia", 
    name: "Skills Naia", 
    description: "Catálogo de habilidades práticas para produção: landing pages, propostas, carrosséis, copywriting e tráfego." 
  },
  { 
    id: "cat-marketplace", 
    slug: "marketplace-premium", 
    name: "Marketplace Premium", 
    description: "Recursos avançados para automação empresarial: prospecção em lote, SDR multicanal e CRM open-source." 
  },
  { 
    id: "cat-comunidade", 
    slug: "comunidade", 
    name: "Comunidade", 
    description: "Encontros semanais ao vivo no Zoom toda segunda-feira e gravação com capítulos das aulas práticas." 
  },
  { 
    id: "cat-grupo-estudos", 
    slug: "grupo-de-estudos", 
    name: "Grupo de Estudos", 
    description: "Laboratórios práticos de desenvolvimento de software agêntico com Claude Code, Orca e ERP modular." 
  },
  { 
    id: "cat-imersao", 
    slug: "gravacao-imersao", 
    name: "Gravação Imersão", 
    description: "Passo a passo definitivo para subir o servidor VPS Ubuntu na Hostinger, instalar o Hermes e treinar subagentes." 
  },
  { 
    id: "cat-extras", 
    slug: "extras", 
    name: "EXTRAS", 
    description: "Podcasts técnicos, mapas mentais, estratégias de precificação e materiais complementares." 
  },
];

let courses: Course[] = [
  {
    id: "course-gravacao-imersao",
    slug: "gravacao-imersao",
    title: "Gravação Imersão · Servidor, Hermes & Subagentes",
    subtitle: "O passo a passo da infraestrutura até os agentes operacionais no Telegram",
    description: "Formação completa e estruturada para colocar um agente de IA 24h na nuvem rodando na sua própria VPS. Aprenda a configurar a Hostinger (Ubuntu 22.04), executar o instalador Hermes, proteger suas chaves, blindar dados e equipar subagentes especialistas (Juliana, Davi SDR, Paulo Dev e Jonathan Copy).",
    categorySlug: "gravacao-imersao",
    coverImage: "/covers/imersao-dia-1.webp",
    modules: [
      {
        id: "mod-imersao-infra",
        title: "Infraestrutura de Servidor & Instalação",
        lessons: [
          {
            id: "imersao-servidor",
            title: "Servidor do Agente",
            subtitle: "Configuração de VPS na Hostinger e Bot no Telegram",
            description: "Aprenda a escolher o servidor ideal (KVM8 ou KVM4), configurar o Ubuntu 22.04 no Brasil, coletar credenciais de root, aplicar o cupom AVALANCHE e criar seu bot no Telegram via @BotFather com ID verificado.",
            durationMin: 35,
            videoUrl: "/videos/9b60b865-d89a-407c-827a-779c648f8606.mp4",
            cover: "/covers/imersao-dia-1.webp",
            section: "Gravação Imersão",
          },
          {
            id: "imersao-instalador-hermes",
            title: "Instalador Hermes",
            subtitle: "Montagem do agente direto na sua VPS sem digitação de comandos",
            description: "Conecte o instalador automático na sua VPS informando IP, senha de root, token do bot e ID do Telegram. Em 20 a 30 minutos o Hermes está configurado e respondendo no Telegram, com Plano B alternativo conduzido pelo Claude Code.",
            durationMin: 28,
            videoUrl: "/videos/a0ae3c2d-8593-46c2-9580-dd732cd9d0aa.mp4",
            cover: "/covers/imersao-dia-1.webp",
            section: "Gravação Imersão",
          },
        ],
      },
      {
        id: "mod-imersao-treinamento",
        title: "Treinamento & Criação do Time de Subagentes",
        lessons: [
          {
            id: "imersao-dia-1",
            title: "Dia 1 · Instalação e Treinamento da Naia",
            subtitle: "Envio de documentos de segurança, blindagem e entrevista inicial",
            description: "Envie os 5 documentos essenciais de treinamento pelo Telegram do agente: segurança contra vazamentos, comportamento e tom de voz, regras operacionais invioláveis, isolamento de dados e entrevista de onboarding para mapeamento do negócio.",
            durationMin: 140,
            videoUrl: "/videos/6ab8ad04c13d4373c2b95add.mp4",
            cover: "/covers/imersao-dia-1.webp",
            section: "Gravação Imersão",
          },
          {
            id: "imersao-dia-2",
            title: "Dia 2 · Subagentes e Skills de Produção",
            subtitle: "Criação de Juliana (Ops), Davi (SDR), Paulo (Dev) e Skills",
            description: "Crie subagentes especializados para cuidar da operação, desenvolvimento de código, geração de landing pages, montagem de propostas comerciais e publicação de carrosséis no Instagram.",
            durationMin: 135,
            videoUrl: "/videos/6aba4b87c13d4373c2dd181b.mp4",
            cover: "/covers/imersao-dia-2.webp",
            section: "Gravação Imersão",
          },
        ],
      },
    ],
  },
  {
    id: "course-comece-aqui",
    slug: "comece-aqui",
    title: "Comece Aqui · Conheça a sua Agente Naia",
    subtitle: "Quem é a sua agente, como o time funciona e suporte oficial",
    description: "Módulo fundamental de introdução à Naia. Entenda o papel da agente como orquestradora de uma equipe digital (Juliana, Paulo e Davi), como ela executa comandos em português pelo Telegram e como ter suporte técnico direto com o time da Avalanche.",
    categorySlug: "comece-aqui",
    coverImage: "/covers/conheca-naia.webp",
    modules: [
      {
        id: "mod-comece-intro",
        title: "Apresentação & Primeiros Passos",
        lessons: [
          {
            id: "conheca-naia",
            title: "Conheça a Naia",
            subtitle: "Quem é a sua agente e o que ela faz por você",
            description: "A Naia é a sua agente de inteligência artificial. Ela orquestra um time de especialistas digitais (Juliana para conteúdo e operações, Paulo para sites e código, Davi SDR para vendas). Mora numa VPS na nuvem e pensa com o modelo mais avançado.",
            durationMin: 18,
            videoUrl: "/videos/6a8d89733c7881dfcfe5fee4.mp4",
            cover: "/covers/conheca-naia.webp",
            section: "Comece aqui",
          },
          {
            id: "acesso-suporte",
            title: "Acesso ao suporte",
            subtitle: "Faça seu cadastro para liberar o suporte",
            description: "Libere seu canal prioritário de atendimento com a equipe para esclarecer dúvidas de configuração de servidor, integrações de APIs e calibragem de subagentes.",
            durationMin: 10,
            videoUrl: "/videos/6a8d8e10f9b062f814e2dc1f.mp4",
            cover: "/covers/acesso-suporte.webp",
            section: "Comece aqui",
          },
        ],
      },
    ],
  },
  {
    id: "course-sua-naia",
    slug: "sua-naia",
    title: "Sua Naia · Onboarding & Manual Operacional",
    subtitle: "Os primeiros minutos e como extrair máxima performance",
    description: "Aprenda a iniciar a comunicação no Telegram e responder as 15 perguntas de onboarding que definem o perfil, valores, produtos e tom de voz da sua empresa. Inclui o manual completo de prompt e instruções de delegação.",
    categorySlug: "sua-naia",
    coverImage: "/covers/onboarding.webp",
    modules: [
      {
        id: "mod-sua-naia-exec",
        title: "Configuração Prática & Operação",
        lessons: [
          {
            id: "onboarding",
            title: "Onboarding da Naia",
            subtitle: "Os primeiros minutos com a sua agente",
            description: "Mande um 'oi' no Telegram da Naia para despertar o agente. Responda a entrevista guiada de 15 perguntas para que ela compreenda exatamente o seu público-alvo, serviços oferecidos e estilo de atendimento.",
            durationMin: 22,
            videoUrl: "/videos/6a8d8c83d0d6a7f1adfd852b.mp4",
            cover: "/covers/onboarding.webp",
            section: "Sua Naia",
          },
          {
            id: "manual",
            title: "Manual da Naia",
            subtitle: "Como pedir as coisas e tirar o máximo da sua agente",
            description: "Guia completo de prompts estruturados, comandos eficientes, gerenciamento de contexto e melhores práticas para delegar tarefas operacionais sem retrabalho.",
            durationMin: 25,
            cover: "/covers/onboarding.webp",
            section: "Sua Naia",
          },
        ],
      },
    ],
  },
  {
    id: "course-skills-naia",
    slug: "skills-naia",
    title: "Skills Naia Completa · Catálogo de Habilidades",
    subtitle: "Todas as habilidades da sua Naia para liberar e instalar quando quiser",
    description: "Acesso ao ecossistema de habilidades prontas para instalar na Naia. Inclui gerador de landing pages de alta conversão, montagem automática de propostas comerciais a partir de áudios, criação de carrosséis e scripts de Reels.",
    categorySlug: "skills-naia",
    coverImage: "/covers/conheca-naia.webp",
    modules: [
      {
        id: "mod-skills-catalogo",
        title: "Habilidades de Produção & Entrega",
        lessons: [
          {
            id: "marketplace-skills",
            title: "Skills Naia Completa",
            subtitle: "Todas as habilidades da sua Naia — libere e instale quando quiser",
            description: "Explore o catálogo modular de skills. Cada skill adiciona novas ferramentas e capacidades aos subagentes da Naia com um simples comando no Telegram.",
            durationMin: 30,
            videoUrl: "/videos/skills-intro.mp4",
            cover: "/covers/conheca-naia.webp",
            section: "Skills Naia",
          },
        ],
      },
    ],
  },
  {
    id: "course-marketplace-premium",
    slug: "marketplace-premium",
    title: "Marketplace Premium · Recursos Avançados",
    subtitle: "Recursos premium da sua Naia, à parte da Naia Completa",
    description: "Módulos de alta escala para operações corporativas: prospecção automatizada em massa no Google e Instagram, agentes com banco de dados próprio, integração com CRMs open-source e robôs de edição de vídeo.",
    categorySlug: "marketplace-premium",
    coverImage: "/covers/imersao-dia-2.webp",
    modules: [
      {
        id: "mod-marketplace-prem",
        title: "Recursos Corporativos & Escala",
        lessons: [
          {
            id: "marketplace-premium",
            title: "Marketplace Premium",
            subtitle: "Recursos premium da sua Naia, à parte da Naia Completa",
            description: "Conheça os módulos avançados de banco de dados vetorial, prospecção multicanal e agentes autônomos para escalar seu faturamento.",
            durationMin: 35,
            cover: "/covers/imersao-dia-2.webp",
            section: "Marketplace Premium",
          },
        ],
      },
    ],
  },
  {
    id: "course-comunidade",
    slug: "comunidade",
    title: "Comunidade Avalanche · Gravações & Encontros Zoom",
    subtitle: "30 dias grátis na comunidade + Zoom comigo toda segunda",
    description: "Acesso a todos os encontros de mentoria e acompanhamento semanal. Troca de experiências com outros donos de agências e negócios digitais, debates sobre novos modelos de IA e resolução de dúvidas práticas ao vivo.",
    categorySlug: "comunidade",
    coverImage: "/covers/grupo-20261001-orca-print.webp",
    modules: [
      {
        id: "mod-comunidade-aulas",
        title: "Acompanhamento & Mentorias Semanais",
        lessons: [
          {
            id: "zoom-comunidade",
            title: "Zoom Semanal + Comunidade",
            subtitle: "Seu bônus: 30 dias grátis na comunidade + Zoom comigo toda segunda",
            description: "Gravações semanais dos encontros ao vivo no Zoom. Análise de agentes dos alunos, novas estratégias de posicionamento e suporte em tempo real.",
            durationMin: 60,
            videoUrl: "/videos/6a8d85e6e1df8e540bc149e9.mp4",
            cover: "/covers/grupo-20261001-orca-print.webp",
            section: "Comunidade",
          },
          {
            id: "gravacoes-comunidade",
            title: "Gravações Comunidade",
            subtitle: "As aulas da comunidade + a imersão, com os capítulos",
            description: "Biblioteca completa com mais de 20 aulas gravadas divididas em capítulos detalhados cobrindo automações, vendas e agentes autônomos.",
            durationMin: 120,
            cover: "/covers/grupo-20261001-orca-print.webp",
            section: "Comunidade",
          },
        ],
      },
    ],
  },
  {
    id: "course-grupo-estudos",
    slug: "grupo-de-estudos",
    title: "Grupo de Estudos · IA Agêntica e Desenvolvimento",
    subtitle: "As 5 aulas técnicas do Grupo de Estudos, com os capítulos",
    description: "Laboratórios avançados de engenharia de software para agentes autônomos. Passo a passo para configurar o Orca no Claude Code, construir um ERP completo do zero com pacotes modulares e integrar fluxos com APIs modernas.",
    categorySlug: "grupo-de-estudos",
    coverImage: "/covers/grupo-20261001-orca-print.webp",
    modules: [
      {
        id: "mod-estudos-lab",
        title: "Laboratórios Técnicos de Desenvolvimento",
        lessons: [
          {
            id: "gravacoes-estudos",
            title: "Grupo de Estudos",
            subtitle: "As 5 aulas do Grupo de Estudos, com os capítulos",
            description: "Aulas completas de construção de software agêntico, automação de código com Claude Code e arquivos ZIP prontos para download.",
            durationMin: 90,
            cover: "/covers/grupo-20261001-orca-print.webp",
            section: "Grupo de Estudos",
          },
        ],
      },
    ],
  },
  {
    id: "course-extras",
    slug: "extras",
    title: "EXTRAS · Podcasts & Conteúdos Complementares",
    subtitle: "Podcasts e conteúdos extras com bastidores e estratégias",
    description: "Áudios e podcasts com análises estratégicas sobre precificação de serviços com IA, escala de operações de agentes e recados dos mentores.",
    categorySlug: "extras",
    coverImage: "/covers/conheca-naia.webp",
    modules: [
      {
        id: "mod-extras-podcasts",
        title: "Podcasts & Bastidores",
        lessons: [
          {
            id: "extras",
            title: "EXTRAS",
            subtitle: "Podcasts e conteúdos extras",
            description: "Conteúdos especiais em áudio e vídeo com dicas práticas sobre fechamento de contratos, posicionamento de mercado e gestão da equipe de IA.",
            durationMin: 45,
            videoUrl: "/videos/recado-denderson.mp4",
            cover: "/covers/conheca-naia.webp",
            section: "EXTRAS",
          },
        ],
      },
    ],
  },
];

const games: GameItem[] = [
  {
    id: "game-1",
    slug: "prompt-battle",
    title: "Prompt Battle Arena",
    category: "Engenharia de Prompt",
    xpReward: 150,
    description: "Desafie a IA a produzir o código mais limpo ou a resposta mais concisa e receba nota do juiz neural.",
    status: "available",
    iconName: "Swords",
  },
  {
    id: "game-2",
    slug: "ai-memory-match",
    title: "AI Concept Match",
    category: "Fundamentos",
    xpReward: 100,
    description: "Jogo de memória conectando termos de Inteligência Artificial: LLM, RAG, Token, Embeddings e Agentes.",
    status: "available",
    iconName: "BrainCircuit",
  },
  {
    id: "game-3",
    slug: "neural-quiz",
    title: "Desafio Neural de IA",
    category: "Certificação Rápida",
    xpReward: 200,
    description: "Perguntas de múltipla escolha cronometradas com cálculo instantâneo de precisão e ranking ao vivo.",
    status: "available",
    iconName: "Trophy",
  },
];

const downloadableResources: DownloadableResource[] = [
  {
    id: "res-orca",
    title: "Orca · Configuração Claude Code (ZIP)",
    fileType: "zip",
    size: "2.6 KB",
    fileName: "orca-configuracao-claude-code.zip",
    downloadUrl: "/downloads/orca-configuracao-claude-code.zip",
    description: "Configuração completa do Orca com regras e prompts para Claude Code.",
  },
  {
    id: "res-erp-1",
    title: "Pacote 1 · Criação ERP Claude Code (ZIP)",
    fileType: "zip",
    size: "30.5 KB",
    fileName: "pacote-1-criacao-erp-claude-code.zip",
    downloadUrl: "/downloads/pacote-1-criacao-erp-claude-code.zip",
    description: "Estrutura do ERP, migrations e schemas prontos para subir com Claude Code.",
  },
  {
    id: "res-erp-2",
    title: "Pacote 2 · Módulos Opcionais ERP (ZIP)",
    fileType: "zip",
    size: "27.0 KB",
    fileName: "pacote-2-modulos-opcionais-erp.zip",
    downloadUrl: "/downloads/pacote-2-modulos-opcionais-erp.zip",
    description: "Módulos adicionais, relatórios e componentes customizados do ERP.",
  },
  {
    id: "res-hermes",
    title: "Instalador Hermes · Plano B (ZIP)",
    fileType: "zip",
    size: "4.8 MB",
    fileName: "starter-kit-automacoes.zip",
    downloadUrl: "/downloads/starter-kit-automacoes.zip",
    description: "Pacote com prompt e script para o Claude ou Codex conduzir a instalação na sua VPS.",
  },
  {
    id: "res-seguranca",
    title: "Segurança da Naia (Markdown)",
    fileType: "code",
    size: "12 KB",
    fileName: "02-seguranca-da-naia.md",
    downloadUrl: "/downloads/dia-1/02-seguranca-da-naia.md",
    description: "Blindagem contra vazamento e uso indevido da agente.",
  },
  {
    id: "res-comportamento",
    title: "Comportamento e Personalidade (Markdown)",
    fileType: "code",
    size: "18 KB",
    fileName: "03-comportamento-e-personalidade.md",
    downloadUrl: "/downloads/dia-1/03-comportamento-e-personalidade.md",
    description: "Como a agente fala, age e se apresenta nas conversas.",
  },
  {
    id: "res-regras",
    title: "Regras da Naia (Markdown)",
    fileType: "code",
    size: "15 KB",
    fileName: "04-regras-naia.md",
    downloadUrl: "/downloads/dia-1/04-regras-naia.md",
    description: "O que ela pode e o que nunca deve fazer operacionalmente.",
  },
  {
    id: "res-isolamento",
    title: "Isolamento de Dados (Markdown)",
    fileType: "code",
    size: "10 KB",
    fileName: "06-isolamento-de-dados.md",
    downloadUrl: "/downloads/dia-1/06-isolamento-de-dados.md",
    description: "Separação de dados e segurança de credenciais na VPS.",
  },
  {
    id: "res-onboarding-entrevista",
    title: "Onboarding · Entrevista do Dono (Markdown)",
    fileType: "code",
    size: "14 KB",
    fileName: "07-onboarding-entrevista-do-dono.md",
    downloadUrl: "/downloads/dia-1/07-onboarding-entrevista-do-dono.md",
    description: "Roteiro e perguntas de entrevista para o agente aprender sua operação.",
  },
  {
    id: "res-juliana",
    title: "Subagente Juliana · Operações (Markdown)",
    fileType: "code",
    size: "24 KB",
    fileName: "01-juliana-ops.md",
    downloadUrl: "/downloads/dia-2/01-juliana-ops.md",
    description: "Subgerente operacional, design e coordenação do time.",
  },
  {
    id: "res-sdr",
    title: "Subagente Davi · SDR (Markdown)",
    fileType: "code",
    size: "20 KB",
    fileName: "02-clone-do-dono-sdr.md",
    downloadUrl: "/downloads/dia-2/02-clone-do-dono-sdr.md",
    description: "Atendimento, qualificação e registro de leads.",
  },
  {
    id: "res-paulo",
    title: "Subagente Paulo · Desenvolvedor (Markdown)",
    fileType: "code",
    size: "28 KB",
    fileName: "03-paulo-dev.md",
    downloadUrl: "/downloads/dia-2/03-paulo-dev.md",
    description: "Código, API, deploy, infraestrutura e debug do time.",
  },
  {
    id: "res-jonathan",
    title: "Subagente Jonathan · Copywriter (Markdown)",
    fileType: "code",
    size: "22 KB",
    fileName: "04-jonathan-copy.md",
    downloadUrl: "/downloads/dia-2/04-jonathan-copy.md",
    description: "Criação de copys, roteiros, emails e conteúdos de alta conversão.",
  },
  {
    id: "res-landing-pages",
    title: "Método de Criação de Landing Pages (Markdown)",
    fileType: "code",
    size: "19 KB",
    fileName: "29-metodo-criacao-landing-pages.md",
    downloadUrl: "/downloads/dia-2/29-metodo-criacao-landing-pages.md",
    description: "Instruções operacionais para construção de LPs com agentes.",
  },
  {
    id: "res-propostas",
    title: "Método de Criação de Propostas Comerciais (Markdown)",
    fileType: "code",
    size: "16 KB",
    fileName: "30-metodo-criacao-propostas.md",
    downloadUrl: "/downloads/dia-2/30-metodo-criacao-propostas.md",
    description: "Como transformar calls de vendas em propostas irrecusáveis.",
  },
];

const adminStats: AdminStats = {
  totalStudents: 1420,
  activeStudentsToday: 382,
  totalCourses: courses.length,
  totalLessons: courses.reduce((sum, c) => sum + c.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0),
  completionRatePercent: 94.2,
  gamesPlayed: 5612,
};

// --- Accessors -------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCourses(): Promise<Course[]> {
  return courses.map((course) => ({
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        materialHtml: l.materialHtml || lessonMaterials[l.id] || "",
      })),
    })),
  }));
}

export async function getCoursesByCategory(categorySlug: string): Promise<Course[]> {
  const all = await getCourses();
  return all.filter((c) => c.categorySlug === categorySlug);
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const course = courses.find((c) => c.slug === slug);
  if (!course) return undefined;
  return {
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        materialHtml: l.materialHtml || lessonMaterials[l.id] || "",
      })),
    })),
  };
}

export async function getLesson(
  id: string,
): Promise<{ lesson: Lesson; course: Course } | undefined> {
  for (const course of courses) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === id);
      if (lesson) {
        return {
          lesson: {
            ...lesson,
            materialHtml: lesson.materialHtml || lessonMaterials[lesson.id] || "",
          },
          course,
        };
      }
    }
  }
  return undefined;
}

export async function getGames(): Promise<GameItem[]> {
  return games;
}

export async function getGameBySlug(slug: string): Promise<GameItem | undefined> {
  return games.find((g) => g.slug === slug);
}

export async function getDownloadableResources(): Promise<DownloadableResource[]> {
  return downloadableResources;
}

export async function getAdminStats(): Promise<AdminStats> {
  return {
    ...adminStats,
    totalCourses: courses.length,
    totalLessons: courses.reduce((sum, c) => sum + c.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0),
  };
}

export async function createCourse(newCourse: Omit<Course, "id">): Promise<Course> {
  const created: Course = {
    ...newCourse,
    id: `course-${Date.now()}`,
  };
  courses = [created, ...courses];
  return created;
}
