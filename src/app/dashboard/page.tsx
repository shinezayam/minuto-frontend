"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Clock, Calendar, Trash2, FileText, Download } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, friendlyError } from "@/lib/api";
import { AuthGuard } from "@/components/layout/auth-guard";
import { formatDate, formatDuration } from "@/lib/audio-utils";
import type { Meeting } from "@/lib/types";

function DashboardContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listMeetings()
      .then((res) => setMeetings(res.meetings))
      .catch((err) => setLoadError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Боловсруулж буй хурал байвал төлөвийг 5 секунд тутам шинэчилнэ
  const anyProcessing = meetings.some((m) => m.status === "processing");
  useEffect(() => {
    if (!anyProcessing) return;
    const t = setInterval(() => {
      api.listMeetings().then((res) => setMeetings(res.meetings)).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [anyProcessing]);

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хурлыг устгах уу?")) return;
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Устгахад алдаа гарлаа");
    }
  };

  const handleNewMeeting = async () => {
    try {
      const meeting = await api.createMeeting();
      router.push(`/meetings/${meeting.id}/live`);
    } catch {
      alert("Хурал үүсгэхэд алдаа гарлаа");
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Хурлууд</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Таны бүх хурлын бичлэг болон бичвэр
            </p>
          </div>
          <Button onClick={handleNewMeeting} className="gap-2">
            <Mic className="h-4 w-4" />
            Шинэ хурал
          </Button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-8 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{loadError}</div>
        ) : meetings.length === 0 ? (
          <EmptyState onCreateNew={handleNewMeeting} />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={() => handleDelete(meeting.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function MeetingCard({
  meeting,
  onDelete,
}: {
  meeting: Meeting;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    recording: "bg-red-100 text-red-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    failed: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    draft: "Ноорог",
    recording: "Бичиж байна",
    paused: "Зогссон",
    completed: "Дууссан",
    processing: "Боловсруулж байна",
    failed: "Алдаа",
  };

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{meeting.title}</h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(meeting.created_at)}
              </span>
              {meeting.duration_ms > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(meeting.duration_ms)}
                </span>
              )}
            </div>
          </div>
          <span
            className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[meeting.status] || "bg-muted"}`}
          >
            {statusLabels[meeting.status] || meeting.status}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={meeting.status === "recording" || meeting.status === "paused" ? `/meetings/${meeting.id}/live` : `/meetings/${meeting.id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {meeting.status === "recording" || meeting.status === "paused" ? "Үргэлжлүүлэх" : "Нээх"}
            </Button>
          </Link>
          {meeting.status === "completed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="DOCX татах"
              onClick={() => api.downloadDocx(meeting.id).catch((err) => alert(friendlyError(err)))}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Mic className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Хурал алга байна</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Эхний хурлаа бичиж, AI-р хурлын бичиг үүсгээрэй.
      </p>
      <Button onClick={onCreateNew} className="mt-6 gap-2">
        <Mic className="h-4 w-4" />
        Шинэ хурал эхлүүлэх
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
