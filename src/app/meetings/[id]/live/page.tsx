import { Suspense } from "react";
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
      <LiveMeetingContent />
    </Suspense>
  );
}
