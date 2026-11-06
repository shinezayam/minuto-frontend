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
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Хурлууд", icon: LayoutDashboard },
  { href: "/meetings/new/live", label: "Шинэ хурал", icon: Mic },
  { href: "/meetings", label: "Миний хурлууд", icon: Folder },
  { href: "/actions", label: "Даалгаврууд", icon: CheckSquare },
  { href: "/ask", label: "AI хайлт", icon: Search },
  { href: "/templates", label: "Загварууд", icon: FileText },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-200",
        isCollapsed ? "w-16" : "w-60"
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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: Settings + Theme + Profile */}
        <div className="border-t border-border px-3 py-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? "Тохиргоо" : undefined}
              >
                <Settings className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Тохиргоо</span>}
              </Link>
            </li>
            <li>
              <button
                onClick={toggleTheme}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? (resolvedTheme === "dark" ? "Гэрэл горим" : "Харанхуй горим") : undefined}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5 shrink-0" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" />
                )}
                {!isCollapsed && (
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
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {!isCollapsed && (
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
