"use client";

import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Уншиж байна...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-4", className)}>
      <AudioLoadingAnimation className="scale-150" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
