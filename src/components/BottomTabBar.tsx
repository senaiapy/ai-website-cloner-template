"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpen, Gamepad2, LayoutDashboard, User, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { href: "/inicio", label: "Início", icon: House },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
  { href: "/jogos", label: "Jogos", icon: Gamepad2 },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul className="mx-auto flex w-full max-w-screen-sm items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
