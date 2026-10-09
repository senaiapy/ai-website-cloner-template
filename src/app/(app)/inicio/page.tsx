import Link from "next/link";
import Image from "next/image";
import { getCourses, getDownloadableResources } from "@/lib/data";

export default async function InicioPage() {
  const [courses, resources] = await Promise.all([
    getCourses(),
    getDownloadableResources(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Welcome Banner Paper Card */}
      <header
        style={{
          background: "var(--paper-light)",
          border: "2px solid var(--linha)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
          padding: "26px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="lesson-kicker">ESTUDOS AVANÇADOS EM IA AGÊNTICA</span>
          <span
            style={{
              background: "var(--teal)",
              color: "white",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Plano Naia Completa
          </span>
        </div>

        <h1 className="lesson-title" style={{ marginTop: "6px" }}>
          Painel do Aluno · Marcelo dos Anjos
        </h1>
        <p className="lesson-subtitle" style={{ marginTop: "4px" }}>
          Bem-vindo à sua área de membros. Escolha uma trilha no menu lateral ou continue sua imersão prática abaixo.
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <Link
            href="/aula/imersao-dia-2"
            className="btn"
            style={{
              background: "var(--coral)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "var(--shadow-small)",
            }}
          >
            Continuar: Dia 2 · Subagentes da Naia →
          </Link>

          <Link
            href="/aula/conheca-naia"
            className="btn"
            style={{
              background: "var(--paper-cream)",
              color: "var(--navy)",
              border: "2px solid var(--linha)",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Começar do Zero: Conheça a Naia
          </Link>
        </div>
      </header>

      {/* Courses Grid */}
      <section>
        <h2
          style={{
            fontWeight: 800,
            fontSize: "20px",
            color: "var(--ink)",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>Trilhas & Módulos Disponíveis</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
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
                background: "var(--paper-light)",
                border: "2px solid var(--linha)",
                borderRadius: "14px",
                boxShadow: "var(--shadow-card)",
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                transition: "transform 0.15s var(--ease)",
              }}
            >
              {course.coverImage && (
                <div style={{ position: "relative", width: "100%", height: "140px", background: "var(--navy)" }}>
                  <Image
                    src={course.coverImage}
                    alt={course.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 350px"
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(20, 45, 70, 0.9)",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    {course.categorySlug}
                  </span>
                </div>
              )}

              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--ink)" }}>
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p style={{ fontSize: "12.5px", color: "var(--coral-2)", fontWeight: 700, marginTop: "4px" }}>
                      {course.subtitle}
                    </p>
                  )}
                </div>

                {course.description && (
                  <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {course.description}
                  </p>
                )}

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "12px",
                    borderTop: "1px dashed var(--linha)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--ink-3)",
                  }}
                >
                  <span>{course.modules.length} módulos</span>
                  <span style={{ color: "var(--coral)", fontWeight: 800 }}>Acessar aulas →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Downloads / Materials Section */}
      <section
        style={{
          background: "var(--paper-light)",
          border: "2px solid var(--linha)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
          padding: "24px 26px",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: "18px", color: "var(--ink)", marginBottom: "14px" }}>
          Downloads de Apostilas & Códigos (Locais)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {resources.map((res) => (
            <div
              key={res.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "var(--paper-cream)",
                border: "2px solid var(--linha)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-small)",
                gap: "14px",
              }}
            >
              <div>
                <strong style={{ fontSize: "14px", display: "block", color: "var(--ink)" }}>
                  {res.title}
                </strong>
                {res.description && (
                  <p style={{ fontSize: "12px", color: "var(--ink-2)", margin: "3px 0" }}>
                    {res.description}
                  </p>
                )}
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
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "13px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Baixar
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
