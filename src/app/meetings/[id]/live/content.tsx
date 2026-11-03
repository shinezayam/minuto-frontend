"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useWebSocket } from "@/hooks/use-websocket";
import { api, friendlyError } from "@/lib/api";
import { formatDuration } from "@/lib/audio-utils";
import type { AudioChunkData, Meeting } from "@/lib/types";

export default function LiveMeetingContent() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [consent, setConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [chunksSent, setChunksSent] = useState(0);
  // Дуусгах товч дарсны дараах үе шат: илгээж дуусгах → бичвэр болгох
  const [finishing, setFinishing] = useState<null | "uploading" | "processing">(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const wsRef = useRef<ReturnType<typeof useWebSocket> | null>(null);
  const mimeTypeRef = useRef("");
  // "new" хуудаснаас үүсгэсэн хурлын ID (URL-ийг replaceState-ээр солих тул params шинэчлэгдэхгүй байж болно)
  const activeMeetingIdRef = useRef<string | null>(null);

  const handleChunk = useCallback(
    (chunk: AudioChunkData) => {
      if (wsRef.current) {
        wsRef.current.sendAudioChunk(chunk, mimeTypeRef.current);
      }
      setChunksSent(chunk.sequence + 1);
    },
    []
  );

  const audio = useAudioCapture(handleChunk);
  const ws = useWebSocket();

  useEffect(() => {
    wsRef.current = ws;
    mimeTypeRef.current = audio.mimeType;
  });

  const chunksAcked = ws.ackedCount;

  useEffect(() => {
    if (meetingId && meetingId !== "new" && !activeMeetingIdRef.current) {
      api.getMeeting(meetingId).then(setMeeting).catch(() => {});
    }
  }, [meetingId]);

  // Бичиж байх үед хуудсыг санамсаргүй хаахаас сэргийлнэ
  useEffect(() => {
    const active = audio.status === "recording" || audio.status === "paused" || finishing !== null;
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [audio.status, finishing]);

  useEffect(() => {
    if (audio.status === "recording") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audio.status]);

  const handleStart = async () => {
    if (!consent) return;

    let currentMeetingId = activeMeetingIdRef.current ?? meetingId;
    if (currentMeetingId === "new") {
      const newMeeting = await api.createMeeting();
      currentMeetingId = newMeeting.id;
      setMeeting(newMeeting);
      // router.replace() нь хуудсыг дахин mount хийж WebSocket, микрофоныг хаадаг тул
      // URL-ийг л солино (Next.js native history API-г дэмждэг)
      window.history.replaceState(null, "", `/meetings/${currentMeetingId}/live`);
    }
    activeMeetingIdRef.current = currentMeetingId;

    await api.startMeeting(currentMeetingId);
    ws.connect(currentMeetingId);
    await audio.startCapture();
  };

  const currentId = () => activeMeetingIdRef.current ?? meeting?.id ?? null;

  const handlePause = async () => {
    const id = currentId();
    if (id) await api.pauseMeeting(id);
    audio.pauseCapture();
  };

  const handleResume = async () => {
    const id = currentId();
    if (id) await api.resumeMeeting(id);
    audio.resumeCapture();
  };

  const handleStop = async () => {
    const id = currentId();
    setFinishing("uploading");

    // 1. Сүүлийн хэсгийг гаргаж дуустал хүлээнэ
    await audio.stopCapture();
    // 2. Бүх хэсэг сервер дээр баталгаажтал хүлээнэ
    const allDelivered = await ws.flush(30000);
    ws.disconnect();

    if (!id) {
      setFinishing(null);
      return;
    }

    let query = "";
    try {
      await api.endMeeting(id);
      if (!allDelivered) {
        query = `?error=${encodeURIComponent("Бичлэгийн зарим хэсэг сервер рүү хүрсэнгүй. Бичвэр дутуу байж болно.")}`;
      }
      // 3. Бичлэгийг текст болгож, хурлын бичиг үүсгэнэ. Алдааг нуулгүй дэлгэрэнгүй хуудсанд харуулна.
      setFinishing("processing");
      await api.processMeeting(id);
    } catch (err) {
      console.error("Processing failed:", err);
      query = `?error=${encodeURIComponent(friendlyError(err))}`;
    }

    router.push(`/meetings/${id}${query}`);
  };

  if (!consent) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex max-w-2xl flex-1 items-center justify-center px-4 py-8">
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mic className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Хурал бичих</h2>
              <p className="mt-2 text-muted-foreground">
                Хурлаа бичихийн өмнө оролцогчдын зөвшөөрлийг авна уу.
                Бичлэг нь зөвхөн таны төхөөрөмж дээр хадгалагдана.
              </p>

              <div className="mt-6 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">
                    Би оролцогчдын зөвшөөрлийг авсан гэдгээ баталж байна.
                    Энэ хурал бичлэг хийгдэнэ.
                  </span>
                </label>
              </div>

              <Button
                className="mt-6 w-full gap-2"
                disabled={!consent}
                onClick={handleStart}
              >
                <Mic className="h-4 w-4" />
                Бичлэг эхлүүлэх
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Meeting header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {meeting?.title || "Шинэ хурал"}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <RecordingIndicator status={audio.status} />
              <span className="font-mono text-lg tabular-nums">
                {formatDuration(elapsed)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionBadge status={ws.status} />
            <AudioFormatBadge mimeType={audio.mimeType} />
          </div>
        </div>

        {/* Status cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Микрофон"
            value={audio.status === "recording" ? "Идэвхтэй" : audio.status === "paused" ? "Зогссон" : "Бэлэн"}
            icon={audio.status === "recording" ? <Mic className="h-4 w-4 text-green-600" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
          />
          <StatusCard
            label="Илгээсэн чанк"
            value={`${chunksSent}`}
            icon={<Wifi className="h-4 w-4 text-primary" />}
          />
          <StatusCard
            label="Баталгаажсан"
            value={`${chunksAcked}`}
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          />
        </div>

        {/* Audio level meter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Дууны түвшин</span>
              <span>{Math.round(audio.audioLevel * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.max(2, audio.audioLevel * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transcript area */}
        <Card className="mb-6 min-h-[200px]">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Бичвэр
            </h3>
            {finishing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {finishing === "uploading"
                  ? `Бичлэгийг сервер рүү илгээж дуусгаж байна... (${ws.pendingCount} хэсэг үлдсэн)`
                  : "Яриаг текст болгож, хурлын бичиг үүсгэж байна. Урт бичлэгт хэдэн минут болно..."}
              </div>
            ) : audio.status === "recording" || audio.status === "paused" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Бичлэг хийгдэж байна. Бичвэр хурал дууссаны дараа гарна.
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Бичлэг эхлүүлсний дараа бичвэр энд харагдана.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error display */}
        {(audio.error || ws.error) && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                {audio.error && (
                  <p className="text-sm font-medium text-destructive">
                    {audio.error}
                  </p>
                )}
                {ws.error && (
                  <p className="mt-1 text-sm text-destructive/80">
                    Холболт: {ws.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {finishing ? null : audio.status === "idle" || audio.status === "stopped" ? (
            <Button
              size="lg"
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              onClick={handleStart}
            >
              <Mic className="h-5 w-5" />
              Бичлэг эхлүүлэх
            </Button>
          ) : (
            <>
              {audio.status === "recording" ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={handlePause}
                >
                  <Pause className="h-5 w-5" />
                  Түр зогсоох
                </Button>
              ) : audio.status === "paused" ? (
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handleResume}
                >
                  <Play className="h-5 w-5" />
                  Үргэлжлүүлэх
                </Button>
              ) : null}

              <Button
                size="lg"
                variant="destructive"
                className="gap-2"
                onClick={handleStop}
              >
                <Square className="h-5 w-5" />
                Дуусгах
              </Button>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function RecordingIndicator({ status }: { status: string }) {
  if (status === "recording") {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
        <span className="h-2.5 w-2.5 animate-pulse-recording rounded-full bg-red-600" />
        Бичиж байна
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-600">
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        Зогссон
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
      Бэлэн
    </span>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    connected: { label: "Холбогдсон", className: "bg-green-100 text-green-700" },
    connecting: { label: "Холбогдож байна", className: "bg-blue-100 text-blue-700" },
    reconnecting: { label: "Дахин холбогдож байна", className: "bg-yellow-100 text-yellow-700" },
    disconnected: { label: "Салсан", className: "bg-muted text-muted-foreground" },
  };
  const c = config[status] || config.disconnected;
  return (
    <Badge variant="outline" className={`gap-1 ${c.className}`}>
      {status === "connected" ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      {c.label}
    </Badge>
  );
}

function AudioFormatBadge({ mimeType }: { mimeType: string }) {
  if (!mimeType) return null;
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {mimeType.split(";")[0]}
    </Badge>
  );
}

function StatusCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
