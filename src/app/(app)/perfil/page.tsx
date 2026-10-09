import Link from "next/link";
import { LogOut, User, Award, ShieldCheck, Gamepad2, Sparkles, BookOpen } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6 pb-20">
      <header className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="size-8" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Marcelo dos Anjos</h1>
          <p className="text-xs text-muted-foreground">marcelu.phd@gmail.com</p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Naia Completa • Acesso Liberado</span>
          </div>
        </div>
      </header>

      {/* Progress Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
          <Award className="size-5 text-primary" />
          <span className="mt-1 font-bold text-sm">3 Trilhas</span>
          <span className="text-[10px] text-muted-foreground">Em andamento</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
          <Sparkles className="size-5 text-amber-500" />
          <span className="mt-1 font-bold text-sm">520 XP</span>
          <span className="text-[10px] text-muted-foreground">Nível 3</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
          <BookOpen className="size-5 text-blue-500" />
          <span className="mt-1 font-bold text-sm">14 Aulas</span>
          <span className="text-[10px] text-muted-foreground">Liberadas</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        <li className="rounded-xl border border-border bg-card p-3.5 text-xs">
          <span className="block text-muted-foreground text-[11px]">Plano</span>
          <span className="font-semibold text-sm">Naia Completa (Estudos Avançados em IA Agêntica)</span>
        </li>
        <li className="rounded-xl border border-border bg-card p-3.5 text-xs">
          <span className="block text-muted-foreground text-[11px]">ID do Aluno</span>
          <span className="font-mono text-xs">STU-2026-9929</span>
        </li>
      </ul>

      {/* Shortcuts */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-xs font-semibold hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span>Acessar Painel Administrativo</span>
          </div>
          <span>→</span>
        </Link>
        <Link
          href="/jogos"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-xs font-semibold hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gamepad2 className="size-4 text-primary" />
            <span>Arena de IA & Treinamentos Gamificados</span>
          </div>
          <span>→</span>
        </Link>
      </div>

      {/* DEV-ONLY: logout returns to the login screen */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-xs font-semibold text-destructive transition-colors hover:bg-muted mt-2"
      >
        <LogOut className="size-4" aria-hidden />
        Sair da Conta
      </Link>
    </div>
  );
}

