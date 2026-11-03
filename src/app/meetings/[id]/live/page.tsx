import { Suspense } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import LiveMeetingContent from "./content";

export default function LiveMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-muted-foreground">Уншиж байна...</div>
        </div>
      }
    >
      <AuthGuard>
        <LiveMeetingContent />
      </AuthGuard>
    </Suspense>
  );
}
