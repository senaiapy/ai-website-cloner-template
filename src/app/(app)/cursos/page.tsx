import Link from "next/link";
import Image from "next/image";
import { getCategories, getCoursesByCategory } from "@/lib/data";

export default async function CursosPage() {
  const categories = await getCategories();
  const byCategory = await Promise.all(
    categories.map(async (category) => ({
      category,
      courses: await getCoursesByCategory(category.slug),
    }))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <header
        style={{
          background: "var(--paper-light)",
          border: "2px solid var(--linha)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
          padding: "26px 28px",
        }}
      >
        <span className="lesson-kicker">FORMAÇÃO CONTINUA</span>
        <h1 className="lesson-title" style={{ marginTop: "10px" }}>
          Catálogo Completo de Cursos & Apostilas
        </h1>
        <p className="lesson-subtitle" style={{ marginTop: "6px" }}>
          Explore todas as trilhas, desde a configuração de infraestrutura na VPS até a criação de subagentes autônomos.
        </p>
      </header>

      {byCategory.map(({ category, courses }) => (
        <section
          key={category.id}
          style={{
            background: "var(--paper-light)",
            border: "2px solid var(--linha)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-card)",
            padding: "26px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              borderBottom: "2px solid var(--linha)",
              paddingBottom: "12px",
            }}
          >
            <h2 style={{ fontWeight: 800, fontSize: "20px", color: "var(--ink)" }}>
              {category.name}
            </h2>
            {category.description && (
              <p style={{ fontSize: "13px", color: "var(--ink-2)", marginTop: "4px" }}>
                {category.description}
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/curso/${course.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--paper-cream)",
                  border: "2px solid var(--linha)",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-small)",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {course.coverImage && (
                  <div style={{ position: "relative", width: "100%", height: "130px", background: "var(--navy)" }}>
                    <Image
                      src={course.coverImage}
                      alt={course.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  </div>
                )}

                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                  <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--ink)" }}>
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p style={{ fontSize: "12px", color: "var(--coral-2)", fontWeight: 700 }}>
                      {course.subtitle}
                    </p>
                  )}
                  {course.description && (
                    <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                      {course.description}
                    </p>
                  )}

                  {/* Modules & Lessons Details */}
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px 12px",
                      background: "var(--paper-light)",
                      border: "1px solid var(--linha-soft)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  >
                    <strong style={{ display: "block", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Conteúdo do Curso ({course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas):
                    </strong>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {course.modules.flatMap((m) => m.lessons).map((les, lIdx) => (
                        <div key={les.id} style={{ display: "flex", justifyContent: "space-between", color: "var(--ink)" }}>
                          <span>{lIdx + 1}. {les.title}</span>
                          {les.durationMin && <span style={{ color: "var(--ink-3)" }}>{les.durationMin}m</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "12px",
                      borderTop: "1px dashed var(--linha)",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    <span style={{ color: "var(--ink-3)" }}>{course.modules.length} módulos</span>
                    <span style={{ color: "var(--coral)" }}>Acessar Curso Completo →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
