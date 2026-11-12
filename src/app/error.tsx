"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Алдаа гарлаа</h1>
        <p className="mt-2 text-muted-foreground">
          Хүссэн үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2 rounded-full">
            <RotateCcw className="h-4 w-4" />
            Дахин оролдох
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="gap-2 rounded-full">
            <Home className="h-4 w-4" />
            Нүүр хуудас
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium">Техникийн дэлгэрэнгүй</summary>
            <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
