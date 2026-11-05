"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Mic, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { clearAuth, useAuth } from "@/lib/auth";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuth();
  const router = useRouter();

  const logout = () => {
    clearAuth();
    setMobileOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mic className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">AI Minutes</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Хурлууд
              </Link>
              <Link
                href="/ask"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Sparkles className="h-4 w-4" />
                Ask Minuto
              </Link>
              <Link
                href="/meetings/new/live"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Mic className="h-4 w-4" />
                Шинэ хурал
              </Link>
              <span className="max-w-[180px] truncate text-sm text-muted-foreground" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Гарах
              </button>
            </>
          ) : user === null ? (
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Нэвтрэх
            </Link>
          ) : null}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Цэс нээх">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  Хурлууд
                </Link>
                <Link href="/ask" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  <Sparkles className="h-4 w-4" />
                  Ask Minuto
                </Link>
                <Link
                  href="/meetings/new/live"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <Mic className="h-4 w-4" />
                  Шинэ хурал
                </Link>
                <button onClick={logout} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                  Гарах
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Нэвтрэх
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
