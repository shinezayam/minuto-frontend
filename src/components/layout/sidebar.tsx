"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  Folder,
  CheckSquare,
  Search,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  Moon,
  Sun,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { clearAuth, useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Нүүр", icon: LayoutDashboard },
  { href: "/meetings/new/live", label: "Шинэ хурал", icon: Mic },
  { href: "/meetings", label: "Бүх хурал", icon: Folder },
  { href: "/actions", label: "Даалгаврууд", icon: CheckSquare },
  { href: "/ask", label: "AI хайлт", icon: Search },
  { href: "/templates", label: "Загварууд", icon: FileText },
];

export function Sidebar({ collapsed = false, onToggle, isMobile = false, mobileOpen = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleNav = (href: string) => {
    if (isMobile) {
      onToggle?.();
    }
    router.push(href);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const isActive = (href: string) => {
    // Dashboard: зөвхөн /dashboard эсвэл /
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    // /meetings/new/live - exact match
    if (href === "/meetings/new/live") {
      return pathname === "/meetings/new/live" || pathname.startsWith("/meetings/new/live");
    }
    // /meetings - зөвхөн /meetings эсвэл /meetings/[id] (гэхдээ /meetings/new биш)
    if (href === "/meetings") {
      return pathname === "/meetings" ||
        (pathname.startsWith("/meetings/") && !pathname.startsWith("/meetings/new"));
    }
    // Бусад - exact match эсвэл startsWith
    return pathname === href || pathname.startsWith(href + "/");
  };

  const showLabelFooter = isMobile ? true : !isCollapsed;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-200",
        isMobile
          ? cn("w-60", mobileOpen ? "translate-x-0" : "-translate-x-full")
          : isCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header: Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={isCollapsed ? "Цэсийг задлах" : "Цэсийг хураах"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showLabel = isMobile ? true : !isCollapsed;
              return (
                <li key={item.href}>
                  <button
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !showLabel && "justify-center px-2"
                    )}
                    title={!showLabel ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {showLabel && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: Settings + Theme + Profile */}
        <div className="border-t border-border px-3 py-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNav("/settings")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  !showLabelFooter && "justify-center px-2"
                )}
                title={!showLabelFooter ? "Тохиргоо" : undefined}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {showLabelFooter && <span>Тохиргоо</span>}
              </button>
            </li>
            <li>
              <button
                onClick={toggleTheme}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  !showLabelFooter && "justify-center px-2"
                )}
                title={!showLabelFooter ? (resolvedTheme === "dark" ? "Гэрэл горим" : "Харанхуй горим") : undefined}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5 shrink-0" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" />
                )}
                {showLabelFooter && (
                  <span>{resolvedTheme === "dark" ? "Гэрэл горим" : "Харанхуй горим"}</span>
                )}
              </button>
            </li>
            {user && (
              <>
                <li>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      !showLabelFooter && "justify-center px-2"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {showLabelFooter && (
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user.email}</p>
                      </div>
                    )}
                  </div>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Гарах" : undefined}
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>Гарах</span>}
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
