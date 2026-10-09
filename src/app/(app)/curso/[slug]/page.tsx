import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/data";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Link
        href="/cursos"
        style={{
          color: "var(--coral-2)",
          fontWeight: 700,
          fontSize: "13px",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        ← Voltar para catálogo de cursos
      </Link>

      {/* Course Header Paper Card */}
      <header
        style={{
          background: "var(--paper-light)",
          border: "2px solid var(--linha)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
          padding: "26px 28px",
        }}
      >
        <span className="lesson-kicker">
          {course.categorySlug.toUpperCase().replace("-", " ")}
        </span>
        <h1 className="lesson-title" style={{ marginTop: "12px" }}>
          {course.title}
        </h1>
        {course.subtitle && (
          <p className="lesson-subtitle">{course.subtitle}</p>
        )}
        {course.description && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "2px solid var(--linha-soft)",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            {course.description}
          </div>
        )}
      </header>

      {/* Modules & Lesson Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {course.modules.map((mod, modIdx) => (
          <section
            key={mod.id}
            style={{
              background: "var(--paper-light)",
              border: "2px solid var(--linha)",
              borderRadius: "14px",
              boxShadow: "var(--shadow-card)",
              padding: "24px 26px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid var(--linha)",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontWeight: 800, fontSize: "18px", color: "var(--ink)" }}>
                Módulo {modIdx + 1} · {mod.title}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--ink-3)", fontWeight: 700 }}>
                {mod.lessons.length} {mod.lessons.length === 1 ? "aula" : "aulas"}
              </span>
            </div>

            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {mod.lessons.map((lesson, lessonIdx) => (
                <li key={lesson.id}>
                  <Link
                    href={`/aula/${lesson.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "16px 18px",
                      background: "var(--paper-cream)",
                      border: "2px solid var(--linha)",
                      borderRadius: "12px",
                      boxShadow: "var(--shadow-small)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "transform 0.15s var(--ease)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: lessonIdx % 2 === 0 ? "var(--navy)" : "var(--teal)",
                            color: "white",
                            fontWeight: 800,
                            fontSize: "12px",
                          }}
                        >
                          {lessonIdx + 1}
                        </span>
                        <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--ink)" }}>
                          {lesson.title}
                        </h3>
                      </div>
                      {lesson.durationMin && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--ink-3)",
                            background: "var(--paper-light)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--linha-soft)",
                          }}
                        >
                          {lesson.durationMin} min
                        </span>
                      )}
                    </div>

                    {lesson.subtitle && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--coral-2)",
                          fontWeight: 700,
                          marginBottom: "6px",
                        }}
                      >
                        {lesson.subtitle}
                      </p>
                    )}

                    {lesson.description && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--ink-2)",
                          lineHeight: 1.5,
                        }}
                      >
                        {lesson.description}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px dashed var(--linha)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "var(--coral)",
                        }}
                      >
                        Acessar Aula & Vídeo →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
