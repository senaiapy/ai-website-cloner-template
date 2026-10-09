"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();

  // DEV-ONLY: no validation. Pressing the button enters the app directly.
  // TODO: wire real account creation before production.
  function enter() {
    router.push("/inicio");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comece sua jornada em IA.</p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          enter();
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nome</span>
          <span className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <User className="size-4 text-muted-foreground" aria-hidden />
            <input
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">E-mail</span>
          <span className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Mail className="size-4 text-muted-foreground" aria-hidden />
            <input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Senha</span>
          <span className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Lock className="size-4 text-muted-foreground" aria-hidden />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </span>
        </label>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
