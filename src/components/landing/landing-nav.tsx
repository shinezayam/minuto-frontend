"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "#how", label: "Хэрхэн ажилладаг" },
  { href: "#features", label: "Боломжууд" },
  { href: "#use-cases", label: "Хэрэглээ" },
  { href: "#faq", label: "Түгээмэл асуулт" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const user = useAuth();

  const cta = user ? (
    <Link
      href="/dashboard"
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      Миний хурлууд
      <ArrowRight className="h-4 w-4" />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Нэвтрэх
      </Link>
      <Link
        href="/login?mode=register"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Эхлэх
        <ArrowRight className="h-4 w-4" />
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Minuto нүүр хуудас">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-5 md:flex">{user !== undefined && cta}</div>

        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Цэс хаах" : "Цэс нээх"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex items-center gap-5 px-2">{user !== undefined && cta}</div>
          </div>
        </div>
      )}
    </header>
  );
}
