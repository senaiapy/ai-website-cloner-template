"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLesson {
  id: string;
  num: number;
  label: string;
}

interface NavSection {
  id: string;
  label: string;
  lessons: NavLesson[];
}

const SECTIONS: NavSection[] = [
  {
    id: "comece-aqui",
    label: "Comece aqui",
    lessons: [
      { id: "conheca-naia", num: 1, label: "Conheça a Naia" },
      { id: "acesso-suporte", num: 2, label: "Acesso ao suporte" },
    ],
  },
  {
    id: "sua-naia",
    label: "Sua Naia",
    lessons: [
      { id: "onboarding", num: 7, label: "Onboarding da Naia" },
      { id: "manual", num: 8, label: "Manual da Naia" },
    ],
  },
  {
    id: "skills-naia",
    label: "Skills Naia",
    lessons: [
      { id: "marketplace-skills", num: 9, label: "Skills Naia Completa" },
    ],
  },
  {
    id: "marketplace-premium",
    label: "Marketplace Premium",
    lessons: [
      { id: "marketplace-premium", num: 11, label: "Marketplace Premium" },
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    lessons: [
      { id: "zoom-comunidade", num: 12, label: "Zoom Semanal + Comunidade" },
      { id: "gravacoes-comunidade", num: 13, label: "Gravações Comunidade" },
    ],
  },
  {
    id: "grupo-estudos",
    label: "Grupo de Estudos",
    lessons: [
      { id: "gravacoes-estudos", num: 14, label: "Grupo de Estudos" },
    ],
  },
  {
    id: "gravacao-imersao",
    label: "Gravação Imersão",
    lessons: [
      { id: "imersao-servidor", num: 15, label: "Servidor do Agente" },
      { id: "imersao-instalador-hermes", num: 16, label: "Instalador Hermes" },
      { id: "imersao-dia-1", num: 17, label: "Dia 1" },
      { id: "imersao-dia-2", num: 18, label: "Dia 2" },
    ],
  },
  {
    id: "extras",
    label: "EXTRAS",
    lessons: [
      { id: "extras", num: 19, label: "EXTRAS" },
    ],
  },
];

export function RealSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Identify active lesson from route (e.g. /aula/dia-2, /aula/imersao-dia-2, etc.)
  const activeLessonId = pathname.startsWith("/aula/")
    ? pathname.replace("/aula/", "")
    : pathname.startsWith("/curso/")
    ? pathname.replace("/curso/", "")
    : "imersao-dia-2";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  function toggleSection(secId: string) {
    const defaultOpen =
      secId === "comece-aqui" ||
      secId === "gravacao-imersao" ||
      SECTIONS.find((s) => s.id === secId)?.lessons.some((l) => l.id === activeLessonId) ||
      false;
    const current = openSections[secId] !== undefined ? openSections[secId] : defaultOpen;
    setOpenSections((prev) => ({ ...prev, [secId]: !current }));
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return (
    <>
      {/* Topbar mobile */}
      <div className="topbar">
        <button
          className={`hamburger ${mobileOpen ? "open" : ""}`}
          id="menuBtn"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span></span>
        </button>
        <Link className="wordmark wordmark-nucleo" href="/inicio">
          <span className="wm-main">
            Núcleo <em>Avalanche</em>
          </span>
          <span className="wm-sub">Estudos avançados em IA Agêntica</span>
        </Link>
      </div>

      {/* Scrim for mobile drawer */}
      <div
        className={`scrim ${mobileOpen ? "open" : ""}`}
        id="scrim"
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar navigation */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`} id="sidebar">
        <div className="sidebar-top">
          <span className="kicker">Denderson.ai</span>
          <Link className="wordmark wordmark-nucleo" href="/inicio">
            <span className="wm-main">
              Núcleo <em>Avalanche</em>
            </span>
            <span className="wm-sub">Estudos avançados em IA Agêntica</span>
          </Link>
        </div>

        <nav className="nav" id="nav" aria-label="Aulas">
          {SECTIONS.map((section) => {
            const isOpen =
              openSections[section.id] !== undefined
                ? openSections[section.id]
                : section.id === "comece-aqui" ||
                  section.id === "gravacao-imersao" ||
                  section.lessons.some((l) => l.id === activeLessonId);
            return (
              <div
                key={section.id}
                className={`nav-section ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="nav-section-head"
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="nav-section-label">{section.label}</span>
                  <span className="nav-section-chev" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </span>
                </button>

                <div className="nav-section-items">
                  <div className="nav-section-inner">
                    {section.lessons.map((lesson) => {
                      const isActive = activeLessonId === lesson.id;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/aula/${lesson.id}`}
                          className={`nav-item ${isActive ? "active" : ""}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span className="num">{lesson.num}</span>
                          <span className="label">{lesson.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="user-row">
            <div className="avatar" id="avatar">
              MD
            </div>
            <div className="user-meta">
              <div className="founder-badge fb-completa" id="founderBadge">
                <span className="founder-star" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"></path>
                  </svg>
                </span>{" "}
                Naia Completa
              </div>
              <div className="name" id="userName">
                Marcelo dos Anjos
              </div>
              <div className="email" id="userEmail">
                marcelu.phd@gmail.com
              </div>
            </div>
          </div>

          <button
            className="theme-toggle"
            id="themeToggle"
            type="button"
            aria-label="Alternar tema"
            aria-pressed={isDark}
            onClick={toggleTheme}
          >
            <span className="theme-toggle-ic" id="themeToggleIc" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </span>
            <span className="theme-toggle-label" id="themeToggleLabel">
              {isDark ? "Tema claro" : "Tema escuro"}
            </span>
          </button>

          <div className="foot-actions">
            <Link className="btn-ghost" id="adminLink" href="/admin">
              Painel admin
            </Link>
            <Link className="btn-ghost" id="logoutBtn" href="/login">
              Sair
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
