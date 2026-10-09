"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Gamepad2, 
  FileText, 
  Plus, 
  Download, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminStats, Course, DownloadableResource } from "@/types";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<DownloadableResource[]>([]);
  const [activeTab, setActiveTab] = useState<"courses" | "files" | "analytics">("courses");

  // New course form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState("aplicacoes");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.ok) setStats(await statsRes.json());

        const coursesRes = await fetch("/api/courses");
        if (coursesRes.ok) setCourses(await coursesRes.json());

        const downloadsRes = await fetch("/api/downloads");
        if (downloadsRes.ok) setResources(await downloadsRes.json());
      } catch (err) {
        console.error("Erro ao carregar dados admin:", err);
      }
    }
    loadData();
  }, []);

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          subtitle: newSubtitle,
          categorySlug: newCategory,
          description: "Novo módulo adicionado via painel de administração.",
          coverImage: "/images/grupo-20261001-orca-print.webp",
          modules: [
            {
              id: `mod-${Date.now()}`,
              title: "Módulo Inicial",
              lessons: [
                { id: `les-${Date.now()}`, title: "Aula de Boas-vindas", durationMin: 10 },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCourses((prev) => [created, ...prev]);
        setShowAddModal(false);
        setNewTitle("");
        setNewSubtitle("");
        setSuccessToast("Curso publicado com sucesso!");
        setTimeout(() => setSuccessToast(""), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">Painel de Controle</p>
          <h1 className="text-2xl font-bold tracking-tight">Administração & Métricas</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>Novo Curso</span>
        </Button>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <Check className="size-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Alunos Totais</span>
            <Users className="size-4" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{stats?.totalStudents ?? 1420}</span>
          <span className="text-[11px] text-emerald-600 font-medium">+38 hoje</span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Cursos Ativos</span>
            <BookOpen className="size-4" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{courses.length || (stats?.totalCourses ?? 3)}</span>
          <span className="text-[11px] text-muted-foreground">Todos online</span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Conclusão</span>
            <CheckCircle className="size-4" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{stats?.completionRatePercent ?? 88.4}%</span>
          <span className="text-[11px] text-emerald-600 font-medium">+4.2% este mês</span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Partidas Jogadas</span>
            <Gamepad2 className="size-4" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{stats?.gamesPlayed ?? 5612}</span>
          <span className="text-[11px] text-primary font-medium">Arena ativa</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-1.5 pb-1 transition-colors ${
            activeTab === "courses" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Gestão de Cursos ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-1.5 pb-1 transition-colors ${
            activeTab === "files" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-4" />
          <span>Materiais & Arquivos ({resources.length})</span>
        </button>
      </div>

      {/* Courses Table / List */}
      {activeTab === "courses" && (
        <section className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {courses.map((course) => {
              const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
              return (
                <li
                  key={course.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                        {course.categorySlug}
                      </span>
                      <h3 className="mt-1 font-semibold text-sm">{course.title}</h3>
                      {course.subtitle && (
                        <p className="text-xs text-muted-foreground">{course.subtitle}</p>
                      )}
                      {course.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90 border-t border-border/40 pt-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Publicado
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    <span>{course.modules.length} módulos • {lessonCount} aulas</span>
                    <a
                      href={`/curso/${course.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Visualizar Curso →
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Files / Materials Manager */}
      {activeTab === "files" && (
        <section className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {resources.map((res) => (
              <li
                key={res.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold">{res.title}</h4>
                    {res.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{res.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/75 mt-0.5">
                      {res.fileName} • {res.size}
                    </p>
                  </div>
                </div>
                <a
                  href={res.downloadUrl}
                  download
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="size-3.5" />
                  <span>Baixar</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Modal: Add New Course */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold">Criar Novo Curso</h2>
            <p className="text-xs text-muted-foreground">Adicione um novo módulo à plataforma.</p>

            <form onSubmit={handleAddCourse} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium">
                <span>Título do Curso</span>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Engenharia de Prompts com LangChain"
                  className="rounded-lg border border-input bg-background p-2.5 text-xs outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                <span>Subtítulo / Breve Descrição</span>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Ex: Do básico ao avançado com agentes autônomos"
                  className="rounded-lg border border-input bg-background p-2.5 text-xs outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                <span>Categoria</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="rounded-lg border border-input bg-background p-2.5 text-xs outline-none"
                >
                  <option value="fundamentos">Fundamentos de IA</option>
                  <option value="aplicacoes">Aplicações Práticas</option>
                  <option value="agentes">Agentes Autônomos</option>
                </select>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Publicando..." : "Publicar Curso"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

