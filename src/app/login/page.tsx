"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  // DEV-ONLY: no authentication. Pressing the button enters the app directly.
  // TODO: wire real auth (Google OAuth / session) before production.
  function enter() {
    router.push("/inicio");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Núcleo Avalanche de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para continuar seus estudos.</p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          enter();
        }}
      >
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
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </span>
        </label>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
