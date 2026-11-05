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
  MonitorSpeaker,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  isMeetingCaptureSupported,
  useAudioCapture,
  type CaptureSource,
} from "@/hooks/use-audio-capture";
import { useWebSocket } from "@/hooks/use-websocket";
import { api, friendlyError } from "@/lib/api";
import { ParticipantsInput } from "@/components/meetings/participants-input";
import { formatDuration, formatTimestamp } from "@/lib/audio-utils";
import type { AudioChunkData, Meeting } from "@/lib/types";

const RECORDING_NOTICE =
  "Энэ хурлыг Minuto-гоор бичиж, хурлын тэмдэглэл хөтөлж байна. Татгалзах бол хэлнэ үү.";

export default function LiveMeetingContent() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Сервер рүү хандахаас өмнө (хөтөч дээр) тодорхойлогддог тул шууд тооцно
  const [meetingSupported] = useState(() => isMeetingCaptureSupported());
  const [source, setSource] = useState<CaptureSource>(() =>
    isMeetingCaptureSupported() ? "meeting" : "mic",
  );
  const [includeMic, setIncludeMic] = useState(true);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [liveEnabled, setLiveEnabled] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [chunksSent, setChunksSent] = useState(0);
  // Дуусгах товч дарсны дараах үе шат: илгээж дуусгах → бичвэр болгох
  const [finishing, setFinishing] = useState<null | "uploading" | "processing">(null);
  const wsRef = useRef<ReturnType<typeof useWebSocket> | null>(null);
  const mimeTypeRef = useRef("");
  // "new" хуудаснаас үүсгэсэн хурлын ID (URL-ийг replaceState-ээр солих тул params шинэчлэгдэхгүй байж болно)
  const activeMeetingIdRef = useRef<string | null>(null);
  const transcriptBoxRef = useRef<HTMLDivElement | null>(null);

  const handleChunk = useCallback((chunk: AudioChunkData) => {
    // WebSocket холбогдоогүй байсан ч хэсэг хадгалагдаж, холбогдмогц илгээгдэнэ
    wsRef.current?.sendAudioChunk(chunk, mimeTypeRef.current);
    setChunksSent(chunk.sequence + 1);
  }, []);

  const audio = useAudioCapture(handleChunk);
  const ws = useWebSocket();

  useEffect(() => {
    wsRef.current = ws;
    mimeTypeRef.current = audio.mimeType;
  });

  useEffect(() => {
    if (meetingId && meetingId !== "new" && !activeMeetingIdRef.current) {
      api
        .getMeeting(meetingId)
        .then((m) => {
          setMeeting(m);
          setTitle(m.title);
          setParticipants(m.participants ?? []);
        })
        .catch(() => {});
    }
  }, [meetingId]);

  useEffect(() => {
    api
      .health()
      .then((h) => setLiveEnabled(!!h.live_transcription))
      .catch(() => setLiveEnabled(false));
  }, []);

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

  // Хугацааг бодит цагаас тооцно — хэрэглэгч хурлын таб дээр байхад энэ табын timer удааширдаг
  const { elapsedMs } = audio;
  useEffect(() => {
    if (audio.status !== "recording" && audio.status !== "paused") return;
    const t = setInterval(() => setElapsed(elapsedMs()), 500);
    return () => clearInterval(t);
  }, [audio.status, elapsedMs]);

  // Шинэ бичвэр ирэхэд доош гүйлгэнэ
  useEffect(() => {
    const box = transcriptBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [ws.liveSegments.length]);

  const handleStart = async () => {
    if (!consent || starting) return;
    setStarting(true);
    setStartError(null);

    // 1. Дуу авах зөвшөөрлийг ЭХЛЭЭД асууна: таб хуваалцах цонх товч дарсны дараа шууд нээгдэх ёстой,
    //    мөн хэрэглэгч цуцалбал хоосон хурал үүсгэхгүй
    const ok = await audio.startCapture({ source, includeMic });
    if (!ok) {
      setStarting(false);
      return;
    }

    // 2. Хурлыг үүсгэж/эхлүүлээд WebSocket-оор хэсгүүдийг илгээнэ (энэ хооронд гарсан хэсгүүд хүлээгдэнэ)
    try {
      let currentMeetingId = activeMeetingIdRef.current ?? meetingId;
      if (currentMeetingId === "new") {
        const newMeeting = await api.createMeeting(title.trim() || defaultTitle(source), participants);
        currentMeetingId = newMeeting.id;
        setMeeting(newMeeting);
        // router.replace() нь хуудсыг дахин mount хийж WebSocket, микрофоныг хаадаг тул URL-ийг л солино
        window.history.replaceState(null, "", `/meetings/${currentMeetingId}/live`);
      } else if (meeting) {
        const changes: { title?: string; participants?: string[] } = {};
        if (title.trim() && title.trim() !== meeting.title) changes.title = title.trim();
        if (participants.join("|") !== (meeting.participants ?? []).join("|")) changes.participants = participants;
        if (Object.keys(changes).length) setMeeting(await api.updateMeeting(currentMeetingId, changes));
      }
      activeMeetingIdRef.current = currentMeetingId;

      await api.startMeeting(currentMeetingId);
      ws.connect(currentMeetingId);
      setStarted(true);
    } catch (err) {
      await audio.stopCapture();
      setStartError(friendlyError(err));
    } finally {
      setStarting(false);
    }
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
      // 3. Бүтэн бичлэгийг текст болгож, хурлын бичиг үүсгэнэ. Явцыг хурлын хуудсанд харуулна.
      setFinishing("processing");
      await api.processMeeting(id);
    } catch (err) {
      console.error("Processing failed:", err);
      query = `?error=${encodeURIComponent(friendlyError(err))}`;
    }

    router.push(`/meetings/${id}${query}`);
  };

  if (!started) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex max-w-2xl flex-1 items-center justify-center px-4 py-8">
          <Card className="w-full">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Хурал бичих</h2>
              <p className="mt-2 text-muted-foreground">
                Хурлын үеэр бичвэр шууд гарч, дууссаны дараа хурлын тэмдэглэл автоматаар үүснэ.
              </p>

              {/* Эх үүсвэр */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SourceOption
                  active={source === "meeting"}
                  disabled={!meetingSupported}
                  onClick={() => setSource("meeting")}
                  icon={<MonitorSpeaker className="h-5 w-5" />}
                  title="Онлайн хурал"
                  description={
                    meetingSupported
                      ? "Google Meet, Teams, Discord, Zoom..."
                      : "Chrome эсвэл Edge дээр ажиллана"
                  }
                />
                <SourceOption
                  active={source === "mic"}
                  onClick={() => setSource("mic")}
                  icon={<Mic className="h-5 w-5" />}
                  title="Танхимын хурал"
                  description="Энэ төхөөрөмжийн микрофоноор"
                />
              </div>

              {source === "meeting" && (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">Хэрхэн бичих вэ</p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                    <li>Хурлаа энэ браузерын өөр таб дээр нээнэ (meet.google.com, teams.microsoft.com, discord.com).</li>
                    <li>
                      &quot;Бичлэг эхлүүлэх&quot; дарахад гарах цонхноос <b>Chrome Tab</b> → хурлын табыг сонгоно.
                    </li>
                    <li>
                      Доор байгаа <b>&quot;Also share tab audio&quot;</b>-г асаалттай эсэхийг шалгаад <b>Share</b> дарна.
                    </li>
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    Teams/Discord-ийн desktop апп ашиглаж байвал <b>Entire screen</b>-ийг сонгоод{" "}
                    <b>&quot;Share system audio&quot;</b>-г асаана (Windows). Дэлгэцийн дүрс бичигдэхгүй, зөвхөн дуу авна.
                  </p>
                  <label className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      checked={includeMic}
                      onChange={(e) => setIncludeMic(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border"
                    />
                    <span>
                      Миний микрофоныг мөн оруулах
                      <span className="block text-xs text-muted-foreground">
                        Өөрийн хэлсэн үг бичигдэнэ. Чихэвч зүүвэл бусдын дуу давхар орохгүй.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium" htmlFor="meeting-title">
                  Хурлын нэр <span className="font-normal text-muted-foreground">(заавал биш)</span>
                </label>
                <Input
                  id="meeting-title"
                  className="mt-1.5"
                  placeholder={defaultTitle(source)}
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium" htmlFor="participants">
                  Оролцогчид <span className="font-normal text-muted-foreground">(заавал биш)</span>
                </label>
                <div className="mt-1.5">
                  <ParticipantsInput value={participants} onChange={setParticipants} disabled={starting} />
                </div>
              </div>

              {/* Зөвшөөрөл */}
              <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm">
                    Хурал бичигдэж байгааг оролцогчдод мэдэгдсэн бөгөөд тэдний зөвшөөрлийг авсан.
                    Бичлэг Minuto-гийн сервер рүү илгээгдэж, бичвэр болон тэмдэглэл гаргахад ашиглагдана.
                  </span>
                </label>
                <NoticeCopy />
              </div>

              {(startError || audio.error) && (
                <p className="mt-4 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {startError || audio.error}
                </p>
              )}

              <Button
                className="mt-6 w-full gap-2"
                disabled={!consent || starting}
                onClick={handleStart}
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : source === "meeting" ? (
                  <MonitorSpeaker className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                Бичлэг эхлүүлэх
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const recordingActive = audio.status === "recording" || audio.status === "paused";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Meeting header */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">{meeting?.title || "Шинэ хурал"}</h1>
            <div className="mt-1 flex items-center gap-3">
              <RecordingIndicator status={audio.status} />
              <span className="font-mono text-lg tabular-nums">{formatDuration(elapsed)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {source === "meeting" ? <MonitorSpeaker className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              {source === "meeting" ? (includeMic ? "Хурал + микрофон" : "Онлайн хурал") : "Микрофон"}
            </Badge>
            <ConnectionBadge status={ws.status} />
          </div>
        </div>

        {recordingActive && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            <span className="flex items-center gap-2">
              <Radio className="h-4 w-4 shrink-0" />
              Энэ хурал бичигдэж байна. Оролцогчдод мэдэгдсэн эсэхээ шалгаарай.
            </span>
            <NoticeCopy compact />
          </div>
        )}

        {audio.sourceEnded && recordingActive && (
          <Card className="mb-4 border-yellow-300 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30">
            <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                Хурлын табын хуваалцалт зогслоо. {includeMic ? "Одоо зөвхөн таны микрофон бичигдэж байна." : "Дуу бичигдэхгүй байна."}{" "}
                Хурал дууссан бол &quot;Дуусгах&quot; дарна уу.
              </span>
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleStop}>
                <Square className="h-3.5 w-3.5" />
                Дуусгах
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status cards */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatusCard
            label="Дуу"
            value={audio.status === "recording" ? "Идэвхтэй" : audio.status === "paused" ? "Зогссон" : "Бэлэн"}
            icon={
              audio.status === "recording" ? (
                <Mic className="h-4 w-4 text-green-600" />
              ) : (
                <MicOff className="h-4 w-4 text-muted-foreground" />
              )
            }
            extra={
              <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100"
                  style={{ width: `${Math.max(2, audio.audioLevel * 100)}%` }}
                />
              </div>
            }
          />
          <StatusCard label="Илгээсэн хэсэг" value={`${chunksSent}`} icon={<Wifi className="h-4 w-4 text-primary" />} />
          <StatusCard
            label="Баталгаажсан"
            value={`${ws.ackedCount}`}
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          />
        </div>

        {/* Live transcript */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {liveEnabled ? "Шууд бичвэр" : "Бичвэр"}
              </h3>
              {liveEnabled && ws.liveSegments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Урьдчилсан — дууссаны дараа бүтэн бичвэр гарна
                </span>
              )}
            </div>

            <div ref={transcriptBoxRef} className="max-h-[50vh] min-h-[160px] space-y-3 overflow-y-auto pr-1">
              {ws.liveSegments.map((seg) => (
                <div key={seg.id} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatTimestamp(seg.start_ms)}
                  </span>
                  <p>{seg.text}</p>
                </div>
              ))}

              {finishing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {finishing === "uploading"
                    ? `Бичлэгийг сервер рүү илгээж дуусгаж байна... (${ws.pendingCount} хэсэг үлдсэн)`
                    : "Хурлын тэмдэглэл үүсгэж эхэлж байна..."}
                </div>
              ) : recordingActive ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {audio.status === "paused"
                    ? "Түр зогссон."
                    : liveEnabled
                      ? ws.liveSegments.length === 0
                        ? "Сонсож байна. Яриа эхэлснээс хойш 15-20 секундын дараа бичвэр гарч эхэлнэ..."
                        : "Сонсож байна..."
                      : "Бичлэг хийгдэж байна. Бичвэр хурал дууссаны дараа гарна."}
                </div>
              ) : null}

              {ws.liveError && recordingActive && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {ws.liveError}. Бичлэг хэвийн үргэлжилж байгаа бөгөөд хурал дууссаны дараа бүтэн бичвэр гарна.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {(audio.error || ws.error) && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                {audio.error && <p className="text-sm font-medium text-destructive">{audio.error}</p>}
                {ws.error && <p className="mt-1 text-sm text-destructive/80">Холболт: {ws.error}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {finishing || !recordingActive ? null : (
            <>
              {audio.status === "recording" ? (
                <Button size="lg" variant="outline" className="gap-2" onClick={handlePause}>
                  <Pause className="h-5 w-5" />
                  Түр зогсоох
                </Button>
              ) : (
                <Button size="lg" className="gap-2" onClick={handleResume}>
                  <Play className="h-5 w-5" />
                  Үргэлжлүүлэх
                </Button>
              )}

              <Button size="lg" variant="destructive" className="gap-2" onClick={handleStop}>
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

function defaultTitle(source: CaptureSource): string {
  // mn-MN locale зарим браузерт байдаггүй (англиар гардаг) тул гараар бүрдүүлнэ
  const now = new Date();
  const date = `${now.getMonth() + 1}-р сарын ${now.getDate()}`;
  return source === "meeting" ? `Онлайн хурал — ${date}` : `Хурал — ${date}`;
}

function SourceOption({
  active,
  disabled,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

/** Хурлын чат руу хуулж тавих мэдэгдэл */
function NoticeCopy({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(RECORDING_NOTICE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard зөвшөөрөлгүй бол юу ч хийхгүй
    }
  };
  return (
    <div className={compact ? "" : "flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between"}>
      {!compact && <p className="text-xs text-muted-foreground">Хурлын чатад: &quot;{RECORDING_NOTICE}&quot;</p>}
      <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={copy} type="button">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Хуулсан" : "Мэдэгдэл хуулах"}
      </Button>
    </div>
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
      {status === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {c.label}
    </Badge>
  );
}

function StatusCard({
  label,
  value,
  icon,
  extra,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}
