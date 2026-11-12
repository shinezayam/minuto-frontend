"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
        setMobileOpen(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={cn(isMobile && !mobileOpen && "hidden md:block")}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => {
            if (isMobile) {
              setMobileOpen(!mobileOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
        />
      </div>

      {/* Mobile top bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Цэс нээх"
            aria-expanded={mobileOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          <span className="font-display text-sm font-bold" aria-label="Minuto">Minuto</span>
          <div className="w-10" aria-hidden="true" />
        </div>
      )}

      <main
        className={cn(
          "transition-all duration-200",
          isMobile ? "pt-14" : sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        {children}
      </main>
    </div>
  );
}
