"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Course, DownloadableResource, Lesson } from "@/types";
import type { ManualViewPayload } from "@/lib/manual-views";

interface CommentItem {
  id: string;
  avatar: string;
  author: string;
  date: string;
  text: string;
}

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: "c1",
    avatar: "BS",
    author: "Bruno Siqueira de Abreu e Lima",
    date: "24 de jun. · 15:25",
    text: "Excelente a NAIA. Tenho trabalhando todos os dias desde que fiz a mentoria. Aliás a minha NAIA (ANA) esta comigo desde a imersão porque ao final do 2º dia ela já estava no ar. De lá para cá só evoluiu e tem me ajudado muito em minha rotina dinâmica de trabalho e inclusive em minha vida pessoal. Hoje em dia a participação da ANA em minha vida é super relevante. Ela é obstinada, organizada, e carrega meus valores. Só entende quem entra na COMUNIDADE AVALANCHE e aprende como configurá-la.",
  },
  {
    id: "c2",
    avatar: "H",
    author: "Hawk",
    date: "29 de ago. · 12:30",
    text: "Pra quem entrou para a comunidade, tem a Naia completa com banco de dados?\n\nEu já tinha uma Naia OpenClaw instalada, eu consigo \"melhorar\" ela para ficar como a Naia completa?",
  },
  {
    id: "c3",
    avatar: "J",
    author: "José",
    date: "03 de set. · 16:57",
    text: "Muito bom! Posso usar a Naia como Claude e como Codex?",
  },
  {
    id: "c4",
    avatar: "IM",
    author: "Ivã Marcio Rego Santos",
    date: "08 de set. · 23:38",
    text: "Acabei de entrar na comunidade!",
  },
  {
    id: "c5",
    avatar: "VJ",
    author: "VITOR JOSE SANTOS CAMELO",
    date: "15 de set. · 13:21",
    text: "As skills que eu compro e instalo na NAIA, eu preciso por exemplo para editar Reels contratar alguma plataforma que a NAIA vai utilizar para edição dos Reels?",
  },
  {
    id: "c6",
    avatar: "ML",
    author: "Mônica Lopes Rios",
    date: "29 de set. · 09:22",
    text: "quando você diz instalar é só subir o arquivo no chat do telegram?",
  },
];

export function LessonView({
  lesson,
  course,
  prevLesson,
  nextLesson,
  relevantResources = [],
  manualView,
}: {
  lesson: Lesson;
  course: Course;
  prevLesson?: Lesson | null;
  nextLesson?: Lesson | null;
  relevantResources?: DownloadableResource[];
  manualView?: ManualViewPayload | null;
}) {
  const [isDone, setIsDone] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [commentInput, setCommentInput] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);

  // Active sub-item for views with multiple chapters/sections (like estudos, gravacoes, manual, skills, premium)
  const firstSubId = manualView?.groups?.[0]?.items?.[0]?.id || "";
  const [activeSubId, setActiveSubId] = useState<string>(firstSubId);

  const containerRef = useRef<HTMLDivElement>(null);

  // When sub-item changes, default accordions or restore them
  useEffect(() => {
    if (manualView && !activeSubId && firstSubId) {
      setActiveSubId(firstSubId);
    }
  }, [manualView, firstSubId, activeSubId]);

  // Synchronize all-expanded state to chapter DOM nodes after innerHTML updates
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.querySelectorAll(".gv-chapter").forEach((ch) => {
        if (allExpanded) {
          ch.classList.add("open");
        } else {
          ch.classList.remove("open");
        }
      });
    }
  }, [allExpanded, activeSubId]);

  // Click handler delegation for interactive elements:
  // - Accordion chapter header toggling (.gv-ch-head)
  // - Video timestamp seek (.gv-seek)
  // - Copy buttons (.copy-btn, .cmd__copy, #hw-code-copy)
  const handleDelegatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Chapter accordion header toggle
    const chHead = target.closest(".gv-ch-head");
    if (chHead) {
      const chapter = chHead.closest(".gv-chapter");
      if (chapter) {
        chapter.classList.toggle("open");
      }
      return;
    }

    // 2. Video seeking button
    const seekBtn = target.closest(".gv-seek");
    if (seekBtn) {
      const t = parseFloat(seekBtn.getAttribute("data-t") || "0");
      const videoId = seekBtn.getAttribute("data-video");
      const video = (videoId ? document.getElementById(videoId) : document.querySelector("video")) as HTMLVideoElement | null;
      if (video) {
        video.currentTime = t;
        video.play().catch(() => {});
        video.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // 3. Copy button
    const copyBtn = target.closest(".copy-btn, .cmd__copy, #hw-code-copy");
    if (copyBtn) {
      let textToCopy = copyBtn.getAttribute("data-copy") || "";
      if (!textToCopy) {
        const codeEl = copyBtn.closest(".cmd")?.querySelector(".cmd__text") || document.getElementById("hw-code");
        textToCopy = codeEl?.textContent || "";
      }
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).catch(() => {});
        const origText = copyBtn.textContent;
        copyBtn.textContent = "Copiado! ✓";
        setTimeout(() => {
          copyBtn.textContent = origText;
        }, 2000);
      }
      return;
    }
  };

  const toggleAllChapters = () => {
    setAllExpanded((prev) => !prev);
  };

  const posterImage =
    lesson.cover ||
    (lesson.id.includes("dia-1")
      ? "/covers/imersao-dia-1.webp"
      : lesson.id.includes("dia-2")
      ? "/covers/imersao-dia-2.webp"
      : lesson.id.includes("servidor") || lesson.id.includes("hermes")
      ? "/covers/imersao-dia-1.webp"
      : "/covers/conheca-naia.webp");

  function handleAddComment() {
    if (!commentInput.trim()) return;
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      avatar: "MD",
      author: "Marcelo dos Anjos",
      date: "Agora mesmo",
      text: commentInput.trim(),
    };
    setComments([newComment, ...comments]);
    setCommentInput("");
  }

  // Active section HTML for multi-section views
  const activeSectionHtml = manualView?.sections?.[activeSubId] || "";

  return (
    <div
      ref={containerRef}
      onClick={handleDelegatedClick}
      style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}
    >
      {/* ------------------------------------------------------------- */}
      {/* MULTI-SECTION SUB-NAV / TABS (FOR ESTUDOS, GRAVACOES, MANUAL, SKILLS, PREMIUM) */}
      {/* ------------------------------------------------------------- */}
      {manualView && manualView.groups && manualView.groups.length > 0 && (
        <div
          style={{
            background: "var(--paper-light)",
            border: "2px solid var(--linha)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-card)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="lesson-kicker">{lesson.section || course.title}</span>
              <h1 className="lesson-title" style={{ fontSize: "22px", margin: "2px 0 0" }}>
                {lesson.title}
              </h1>
            </div>

            {/* Toggle all chapters accordion helper button */}
            <button
              type="button"
              onClick={toggleAllChapters}
              style={{
                background: "var(--paper-cream)",
                border: "2px solid var(--linha)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--navy)",
                cursor: "pointer",
                boxShadow: "var(--shadow-small)",
              }}
            >
              {allExpanded ? "Recolher Todos os Capítulos" : "Abrir / Expandir Todos os Capítulos"}
            </button>
          </div>

          {/* Subnav items pills */}
          {manualView.groups.map((grp, gIdx) => (
            <div key={gIdx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {manualView.groups.length > 1 && (
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-3)", textTransform: "uppercase" }}>
                  {grp.group}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                }}
              >
                {grp.items.map((item) => {
                  const isActive = activeSubId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSubId(item.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "2px solid var(--linha)",
                        background: isActive ? "var(--coral)" : "var(--paper-cream)",
                        color: isActive ? "white" : "var(--navy)",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: isActive ? "var(--shadow-small)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          background: isActive ? "rgba(0,0,0,0.2)" : "var(--navy)",
                          color: "white",
                          borderRadius: "6px",
                          padding: "2px 6px",
                          fontSize: "10.5px",
                        }}
                      >
                        {item.index}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* IF MULTI-SECTION: RENDER ACTIVE SECTION CONTENT */}
      {/* ------------------------------------------------------------- */}
      {manualView && activeSectionHtml ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Authentic Section Inner HTML with accordions, descriptions, mindmap, etc. */}
          <div
            className={`material ${allExpanded ? "all-chapters-open" : ""}`}
            dangerouslySetInnerHTML={{ __html: activeSectionHtml }}
          />

          {/* Action Bar (Done + Rating) */}
          <div className="lesson-footer" style={{ margin: "16px 0 0" }}>
            <button
              type="button"
              className={`lf-done ${isDone ? "done" : ""}`}
              onClick={() => setIsDone(!isDone)}
            >
              <span className="lf-check">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </span>
              <span className="lf-done-txt">
                {isDone ? "Aula concluída" : "Marcar como concluída"}
              </span>
            </button>

            <div className="lf-rate">
              <span className="lf-rate-label">Sua nota:</span>
              <div className="lf-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`lf-star ${star <= rating ? "on" : ""}`}
                    data-v={star}
                    aria-label={`${star} estrela(s)`}
                    onClick={() => setRating(star)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={star <= rating ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"></path>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <section className="comments">
            <h2 className="comments-title">Perguntas e comentarios</h2>

            <div className="comment-form">
              <textarea
                id="commentInput"
                rows={3}
                maxLength={2000}
                placeholder="Escreva uma pergunta ou comentario pra turma..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <div className="comment-form-foot">
                <span className="comment-msg" id="commentMsg"></span>
                <button
                  className="btn-primary"
                  id="commentSend"
                  type="button"
                  onClick={handleAddComment}
                >
                  Comentar
                </button>
              </div>
            </div>

            <div className="comment-list" id="commentList">
              {comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="comment-avatar">{c.avatar}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-author">{c.author}</span>
                      <span className="comment-date">{c.date}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* STANDARD / IMERSÃO SPLIT VIEW (IMAGES 2 & 3) */
        /* ------------------------------------------------------------- */
        <div className="lesson-split">
          {/* Media Column (Video, Rating & Comments) */}
          <div className="lesson-media">
            <div>
              <span className="lesson-kicker">
                {lesson.section || course.categorySlug.toUpperCase().replace("-", " ")}
              </span>
              <h1 className="lesson-title">{lesson.title}</h1>
            </div>

            {/* Video Player */}
            <div className="video-wrap" data-rawvideo="1">
              {lesson.videoUrl ? (
                <video
                  poster={posterImage}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  preload="metadata"
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    background: "#15140f",
                  }}
                  src={lesson.videoUrl}
                />
              ) : (
                <div className="video-placeholder">
                  <div className="play">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      width="24"
                      height="24"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span className="txt">Aula teórica & Material de estudo</span>
                </div>
              )}
            </div>

            {/* Hero sub-bar if Dia 1 or Dia 2 */}
            {lesson.id.includes("dia-2") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "var(--paper-light)",
                  border: "2px solid var(--linha)",
                  boxShadow: "var(--shadow-small)",
                }}
              >
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "var(--coral)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                  }}
                >
                  D2
                </span>
                <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--ink)" }}>
                  Dia 2 · Subagentes da Naia
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    background: "var(--navy)",
                    color: "var(--white-ink)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Downloads liberados
                </span>
              </div>
            )}

            {lesson.id.includes("dia-1") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "var(--paper-light)",
                  border: "2px solid var(--linha)",
                  boxShadow: "var(--shadow-small)",
                }}
              >
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "var(--mustard)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                  }}
                >
                  D1
                </span>
                <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--ink)" }}>
                  Dia 1 · Instalação e Treinamento
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    background: "var(--navy)",
                    color: "var(--white-ink)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Downloads liberados
                </span>
              </div>
            )}

            {/* Footer actions: Concluir + Rating */}
            <div className="lesson-footer">
              <button
                type="button"
                className={`lf-done ${isDone ? "done" : ""}`}
                onClick={() => setIsDone(!isDone)}
              >
                <span className="lf-check">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </span>
                <span className="lf-done-txt">
                  {isDone ? "Aula concluída" : "Marcar como concluída"}
                </span>
              </button>

              <div className="lf-rate">
                <span className="lf-rate-label">Sua nota:</span>
                <div className="lf-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`lf-star ${star <= rating ? "on" : ""}`}
                      data-v={star}
                      aria-label={`${star} estrela(s)`}
                      onClick={() => setRating(star)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={star <= rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"></path>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <section className="comments">
              <h2 className="comments-title">Perguntas e comentarios</h2>

              <div className="comment-form">
                <textarea
                  id="commentInput"
                  rows={3}
                  maxLength={2000}
                  placeholder="Escreva uma pergunta ou comentario pra turma..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <div className="comment-form-foot">
                  <span className="comment-msg" id="commentMsg"></span>
                  <button
                    className="btn-primary"
                    id="commentSend"
                    type="button"
                    onClick={handleAddComment}
                  >
                    Comentar
                  </button>
                </div>
              </div>

              <div className="comment-list" id="commentList">
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="comment-avatar">{c.avatar}</div>
                    <div className="comment-body">
                      <div className="comment-head">
                        <span className="comment-author">{c.author}</span>
                        <span className="comment-date">{c.date}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Text & Materials Column */}
          <div className="lesson-text">
            <div className="lesson-kicker">
              {lesson.section || course.title}
            </div>
            <h1 className="lesson-title" style={{ marginTop: "10px" }}>
              {lesson.title}
            </h1>
            {lesson.subtitle && (
              <p className="lesson-subtitle">{lesson.subtitle}</p>
            )}

            {/* Complete Description */}
            {lesson.description && (
              <div
                style={{
                  padding: "16px",
                  background: "var(--paper-cream)",
                  borderRadius: "12px",
                  border: "2px solid var(--linha)",
                  margin: "14px 0",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                <b>Sobre esta aula:</b> {lesson.description}
              </div>
            )}

            {/* Material Body */}
            {lesson.materialHtml ? (
              <div
                className="material"
                dangerouslySetInnerHTML={{ __html: lesson.materialHtml }}
              />
            ) : (
              <div className="material">
                <p>
                  Esta aula faz parte da formação avançada da Naia. Consulte os códigos e
                  materiais para download abaixo.
                </p>
              </div>
            )}

            {/* Downloadable files box */}
            {relevantResources.length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "2px solid var(--linha-soft)",
                }}
              >
                <h3 style={{ fontWeight: 800, fontSize: "16px", marginBottom: "12px" }}>
                  Materiais & Downloads da Aula:
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {relevantResources.map((res) => (
                    <div
                      key={res.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "var(--paper-cream)",
                        border: "2px solid var(--linha)",
                        borderRadius: "10px",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "13px", display: "block" }}>
                          {res.title}
                        </strong>
                        <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                          {res.fileName} • {res.size}
                        </span>
                      </div>
                      <a
                        href={res.downloadUrl}
                        download
                        className="btn"
                        style={{
                          background: "var(--coral)",
                          color: "white",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 800,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Baixar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "32px",
                paddingTop: "18px",
                borderTop: "2px solid var(--linha)",
              }}
            >
              {prevLesson ? (
                <Link
                  href={`/aula/${prevLesson.id}`}
                  className="btn"
                  style={{
                    background: "var(--paper-cream)",
                    color: "var(--navy)",
                    border: "2px solid var(--linha)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  ← Aula anterior
                </Link>
              ) : (
                <div></div>
              )}

              {nextLesson && (
                <Link
                  href={`/aula/${nextLesson.id}`}
                  className="btn"
                  style={{
                    background: "var(--navy)",
                    color: "var(--white-ink)",
                    border: "2px solid rgba(87,61,33,.4)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Próxima: {nextLesson.title} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

