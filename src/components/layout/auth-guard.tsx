"use client";

import { Loader2 } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";

/** Нэвтэрсэн хэрэглэгчид л хүүхэд элементийг харуулна; нэвтрээгүй бол /login руу шилжүүлнэ. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useRequireAuth();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
