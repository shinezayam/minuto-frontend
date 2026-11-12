import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <AudioLoadingAnimation className="mx-auto mb-4 scale-150" />
        <p className="text-sm text-muted-foreground">Ачаалж байна...</p>
      </div>
    </div>
  );
}
