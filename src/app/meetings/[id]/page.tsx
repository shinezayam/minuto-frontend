import { Suspense } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import MeetingDetailContent from "./content";

export default function MeetingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-muted-foreground">Уншиж байна...</div>
        </div>
      }
    >
      <AuthGuard>
        <MeetingDetailContent />
      </AuthGuard>
    </Suspense>
  );
}
