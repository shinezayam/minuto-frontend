"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Mic, Menu, X, ChevronDown, User, Upload, Sparkles, LayoutDashboard, PenLine } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { clearAuth, useAuth } from "@/lib/auth";
import { ProfileNameDialog } from "@/components/layout/profile-name-dialog";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const user = useAuth();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const logout = () => {
    clearAuth();
    setMobileOpen(false);
    setProfileOpen(false);
    router.push("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Minuto нүүр хуудас">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Миний хурлууд
              </Link>
              
              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="max-w-[120px] truncate font-medium">{user.name || user.email}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-xs text-muted-foreground">Нэвтэрсэн</p>
                      {user.name && <p className="mt-0.5 truncate text-sm font-medium">{user.name}</p>}
                      <p className={user.name ? "truncate text-xs text-muted-foreground" : "mt-0.5 truncate text-sm font-medium"}>
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setNameOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <PenLine className="h-4 w-4 text-muted-foreground" />
                        {user.name ? "Нэрээ засах" : "Нэрээ оруулах"}
                      </button>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Миний хурлууд
                      </Link>
                      <Link
                        href="/ask"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        Ask Minuto
                      </Link>
                      <Link
                        href="/upload"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        Аудио оруулах
                      </Link>
                    </div>
                    <div className="border-t border-border p-1.5">
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Гарах
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <Link
                href="/meetings/new/live"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Mic className="h-4 w-4" />
                Шинэ хурал
              </Link>
            </>
          ) : user === null ? (
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Нэвтрэх
            </Link>
          ) : null}
        </div>

        {/* Mobile menu button */}
        <button 
          className="rounded-full p-2 md:hidden hover:bg-muted" 
          onClick={() => setMobileOpen(!mobileOpen)} 
          aria-label={mobileOpen ? "Цэс хаах" : "Цэс нээх"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                {/* User info */}
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
                    <p className={user.name ? "truncate text-xs text-muted-foreground" : "truncate text-sm font-medium"}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setNameOpen(true);
                    }}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                    aria-label="Нэрээ засах"
                  >
                    <PenLine className="h-4 w-4" />
                  </button>
                </div>

                {/* Primary action */}
                <Link
                  href="/meetings/new/live"
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background"
                  onClick={() => setMobileOpen(false)}
                >
                  <Mic className="h-4 w-4" />
                  Шинэ хурал эхлүүлэх
                </Link>

                {/* Navigation */}
                <div className="mt-2 flex flex-col gap-1">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Миний хурлууд
                  </Link>
                  <Link 
                    href="/ask" 
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    Ask Minuto
                  </Link>
                  <Link 
                    href="/upload" 
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Аудио оруулах
                  </Link>
                </div>

                {/* Logout */}
                <button 
                  onClick={logout} 
                  className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Гарах
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
                onClick={() => setMobileOpen(false)}
              >
                Нэвтрэх
              </Link>
            )}
          </div>
        </div>
      )}
      {user && <ProfileNameDialog user={user} open={nameOpen} onOpenChange={setNameOpen} />}
    </header>
  );
}
