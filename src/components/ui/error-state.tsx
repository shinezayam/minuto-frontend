"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({ message, action, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">Алдаа гарлаа</h3>
      <p className="mt-2 max-w-md text-sm text-destructive">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
