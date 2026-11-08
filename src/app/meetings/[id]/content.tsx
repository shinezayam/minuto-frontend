"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  List,
  Volume2,
  Download,
  HelpCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  PlayCircle,
  MessageCircleQuestion,
  PenLine,
  UserRound,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { ParticipantsInput } from "@/components/meetings/participants-input";
import { Highlight, TranscriptReplacePanel, buildMatcher, type ReplaceOptions } from "@/components/meetings/transcript-replace";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AskPanel, formatTimestamp } from "@/components/ask/ask-panel";
import { AudioPlayer, type AudioPlayerRef } from "@/components/meeting/audio-player";
import { api, friendlyError, friendlyErrorText } from "@/lib/api";
import type { AskCitation, Meeting, MeetingMinutes, TranscriptSegment } from "@/lib/types";

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const POLL_MS = 3000;

const ASK_EXAMPLES = ["Ямар шийдвэр гаргасан бэ?", "Хэнд ямар даалгавар өгсөн бэ?", "Гол маргаан юу байсан бэ?"];

/** Хурлын бичгийн мөр бүрийн эх сурвалж — дарахад бичвэрийн тэр хэсэг рүү очиж аудиог тоглуулна */
function SourceLinks({
  ids,
  segments,
  onSeek,
}: {
  ids?: string[];
  segments: Map<string, TranscriptSegment>;
  onSeek: (seg: TranscriptSegment) => void;
}) {
  const found = (ids ?? []).map((id) => segments.get(id)).filter((s): s is TranscriptSegment => !!s);
  if (found.length === 0) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {found.map((seg) => (
        <button
          key={seg.id}
          type="button"
          onClick={() => onSeek(seg)}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          title="Бичвэрээс харах"
        >
          <PlayCircle className="h-3 w-3" />
          {formatTimestamp(seg.start_ms)}
        </button>
      ))}
    </span>
  );
}

const SPEAKER_COLORS = [
  "text-blue-600 dark:text-blue-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-amber-600 dark:text-amber-400",
  "text-fuchsia-600 dark:text-fuchsia-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-rose-600 dark:text-rose-400",
];

/** Яригч бүрт тогтмол өнгө (бичвэр, асуулт-хариултад ижил) */
function speakerColor(name: string | null | undefined, order: string[]): string {
  if (!name) return "text-muted-foreground";
  const i = order.indexOf(name);
  return SPEAKER_COLORS[(i < 0 ? order.length : i) % SPEAKER_COLORS.length];
}

function ProcessingCard({ meeting }: { meeting: Meeting }) {
  const { processing_stage: stage, processing_done: done, processing_total: total } = meeting;
  const pct = stage === "summarizing" ? 100 : total > 0 ? Math.round((done / total) * 100) : 0;
  const label =
    stage === "summarizing"
      ? "Хурлын бичиг (шийдвэр, даалгавар) үүсгэж байна..."
      : stage === "transcribing" && total > 0
        ? `Яриаг текст болгож байна: ${done}/${total} хэсэг`
        : "Бичлэгийг бэлтгэж байна...";
  return (
    <Card className="mb-6 border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{label}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Урт бичлэгт хэдэн минут болно. Энэ хуудсыг хааж, дараа нь буцаж ирж болно.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MeetingDetailContent() {
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [audioOk, setAudioOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [tab, setTab] = useState("minutes");
  const [activeSeg, setActiveSeg] = useState<string | null>(null);
  const [editingPeople, setEditingPeople] = useState(false);
  const [peopleDraft, setPeopleDraft] = useState<string[]>([]);
  const [transcriptEditMode, setTranscriptEditMode] = useState(false);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState("");
  const [speakerDraft, setSpeakerDraft] = useState("");
  const [summaryEditMode, setSummaryEditMode] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);
  const [savingPeople, setSavingPeople] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceOpts, setReplaceOpts] = useState<ReplaceOptions>({ find: "", replacement: "", wholeWord: true });
  const [replaceFocus, setReplaceFocus] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [actionItemsDraft, setActionItemsDraft] = useState<Array<{
    task: string;
    owner?: string | null;
    due_date?: string | null;
    status: string;
    source_segment_ids?: string[];
  }>>([]);
  const [editingActionItem, setEditingActionItem] = useState<number | null>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const searchParams = useSearchParams();
  // Боловсруулалт эхлүүлэх үеийн алдаа (upload/live хуудаснаас ?error=... гэж дамжина)
  const startError = searchParams.get("error");
  // Ask Minuto-гийн эх сурвалжаас ирсэн бол (?t=мс&seg=id) тэр хэсэг рүү очно
  const linkT = searchParams.get("t");
  const linkSeg = searchParams.get("seg");

  const segmentsById = new Map(transcript.map((s) => [s.id, s]));
  const replaceMatcher = replaceOpen ? buildMatcher(replaceOpts) : null;

  /** Бичвэрээс үг сонгоход (давхар товшиж/чирж) засах самбарыг нээж тэр үгийг бөглөнө */
  const handleTranscriptSelect = () => {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (!text || text.length > 200 || text.includes("\n")) return;
    setReplaceOpen(true);
    // "Зөв үг"-ийг сонгосон үгээр бөглөнө — хэрэглэгч зөвхөн буруу үсгийг засна
    setReplaceOpts((o) => ({ ...o, find: text, replacement: text }));
    setReplaceFocus((n) => n + 1);
  };

  // Яригчдын дараалал (анх ярьсан дарааллаар) — өнгө оноохад
  const speakerOrder: string[] = [];
  for (const seg of transcript)
    for (const t of seg.turns ?? []) if (t.speaker && !speakerOrder.includes(t.speaker)) speakerOrder.push(t.speaker);
  for (const p of minutes?.participants ?? []) if (!speakerOrder.includes(p)) speakerOrder.push(p);

  /** Бичвэрийн хэсэг рүү очиж, аудиог тэр цагаас тоглуулна */
  const seekTo = useCallback((ms: number, segId: string | null) => {
    setTab("transcript");
    setActiveSeg(segId);
    const player = audioPlayerRef.current;
    if (player) {
      player.seekTo(ms / 1000);
      player.play();
    }
    if (segId) {
      // таб солигдож бичвэр харагдсаны дараа гүйлгэнэ
      setTimeout(() => document.getElementById(`seg-${segId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    }
  }, []);

  const handleCitation = (c: AskCitation) => {
    if (c.meeting_id !== meetingId) return false;
    seekTo(c.start_ms, c.segment_id);
    return true;
  };

  const linkHandled = useRef(false);
  useEffect(() => {
    if (linkHandled.current || loading || linkT === null) return;
    linkHandled.current = true;
    seekTo(Number(linkT) || 0, linkSeg);
  }, [loading, linkT, linkSeg, seekTo]);

  const loadResults = useCallback(async () => {
    const [t, m] = await Promise.all([api.getTranscript(meetingId), api.getMinutes(meetingId)]);
    setTranscript(t.segments || []);
    setMinutes(m);
  }, [meetingId]);

  // Эхний ачаалал
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await api.getMeeting(meetingId);
        if (cancelled) return;
        setMeeting(m);
        await loadResults();
      } catch (err) {
        if (!cancelled) setError(friendlyError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingId, loadResults]);

  // Боловсруулж байх үед төлөвийг асууж, дуусмагц үр дүнг ачаална
  const isProcessing = meeting?.status === "processing";
  useEffect(() => {
    if (!isProcessing) return;
    const t = setInterval(async () => {
      try {
        const m = await api.getMeeting(meetingId);
        setMeeting(m);
        if (m.status !== "processing") await loadResults();
      } catch {
        // түр зуурын сүлжээний алдаа — дараагийн удаа дахин асууна
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [isProcessing, meetingId, loadResults]);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await api.processMeeting(meetingId);
      setMeeting(await api.getMeeting(meetingId));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRetrying(false);
    }
  };

  const startEditSegment = (seg: TranscriptSegment) => {
    setEditingSegment(seg.id);
    // Хэрэв turns байгаа бол эхний turn-ийн текстийг авна
    const text = seg.turns?.[0]?.text ?? seg.text ?? "";
    const speaker = seg.turns?.[0]?.speaker ?? seg.speaker ?? "";
    setSegmentDraft(text);
    setSpeakerDraft(speaker);
  };

  const cancelEditSegment = () => {
    setEditingSegment(null);
    setSegmentDraft("");
    setSpeakerDraft("");
  };

  const saveSegment = async () => {
    if (!editingSegment) return;
    try {
      const result = await api.updateTranscript(meetingId, [
        { id: editingSegment, text: segmentDraft, speaker: speakerDraft || undefined },
      ]);
      setTranscript(result.segments);
      cancelEditSegment();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleRegenerateSummary = async () => {
    if (!confirm("Товч агуулгыг дахин үүсгэх үү?")) return;
    setRegeneratingSummary(true);
    setError(null);
    try {
      const result = await api.regenerateSummary(meetingId);
      if (minutes) {
        setMinutes({ ...minutes, summary: result.summary });
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRegeneratingSummary(false);
    }
  };

  const startEditSummary = () => {
    if (!minutes) return;
    setSummaryEditMode(true);
    setSummaryDraft(minutes.summary);
  };

  const cancelEditSummary = () => {
    setSummaryEditMode(false);
    setSummaryDraft("");
  };

  const saveSummary = async () => {
    if (!minutes) return;
    // TODO: Backend дээр summary update endpoint нэмэх хэрэгтэй
    // Одоогоор зөвхөн frontend дээр хадгална (дахин ачаалхад алга болно)
    setMinutes({ ...minutes, summary: summaryDraft });
    setSummaryEditMode(false);
  };

  const copySummary = () => {
    if (!minutes) return;
    navigator.clipboard.writeText(minutes.summary);
  };

  const saveTitle = async () => {
    if (!meeting || !titleDraft.trim()) return;
    try {
      const updated = await api.updateMeeting(meetingId, { title: titleDraft.trim() });
      setMeeting(updated);
      setEditingTitle(false);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  // Action items load хийх
  useEffect(() => {
    if (minutes?.action_items) {
      setActionItemsDraft(minutes.action_items.map(item => ({
        task: item.task,
        owner: item.owner,
        due_date: item.due_date,
        status: item.status || "open",
        source_segment_ids: item.source_segment_ids,
      })));
    }
  }, [minutes]);

  const toggleActionItemStatus = async (index: number) => {
    const updated = [...actionItemsDraft];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "done" ? "open" : "done",
    };
    setActionItemsDraft(updated);
    try {
      await api.updateActionItems(meetingId, updated);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateActionItemField = async (index: number, field: string, value: string) => {
    const updated = [...actionItemsDraft];
    updated[index] = { ...updated[index], [field]: value || null };
    setActionItemsDraft(updated);
    try {
      await api.updateActionItems(meetingId, updated);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const savePeople = async (reprocess: boolean) => {
    setSavingPeople(true);
    setError(null);
    try {
      setMeeting(await api.updateMeeting(meetingId, { participants: peopleDraft }));
      setEditingPeople(false);
      if (reprocess) {
        await api.processMeeting(meetingId);
        setMeeting(await api.getMeeting(meetingId));
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSavingPeople(false);
    }
  };

  const handleExport = () => {
    api.downloadDocx(meetingId).catch((err) => setError(friendlyError(err)));
  };

  if (loading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (error && !meeting) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <ErrorState message={error} />
        </main>
      </AppShell>
    );
  }

  const failedMessage =
    meeting?.status === "failed"
      ? friendlyErrorText(meeting.processing_error)
      : !isProcessing
        ? startError
        : null;

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="text-3xl font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={saveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="group truncate text-3xl font-bold cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  if (meeting) {
                    setTitleDraft(meeting.title);
                    setEditingTitle(true);
                  }
                }}
                title="Дарж засах"
              >
                {meeting?.title || "Хурлын дэлгэрэнгүй"}
                <Pencil className="ml-2 inline h-5 w-5 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h1>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {meeting ? new Date(meeting.created_at).toLocaleString("mn-MN") : ""}
              </span>
              {minutes?.prepared_by && (
                <span className="flex items-center gap-1" title="Хурлын тэмдэглэл хөтөлсөн">
                  <PenLine className="h-4 w-4" />
                  Хөтөлсөн: {minutes.prepared_by}
                </span>
              )}
            </div>
            {meeting && !editingPeople && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                {meeting.participants.length > 0 ? (
                  meeting.participants.map((p) => (
                    <span key={p} className="rounded-md bg-muted px-2 py-0.5">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">Оролцогч оруулаагүй</span>
                )}
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => {
                      setPeopleDraft(meeting.participants);
                      setEditingPeople(true);
                    }}
                    className="ml-1 text-xs font-medium text-primary hover:underline"
                  >
                    {meeting.participants.length > 0 ? "Засах" : "Нэмэх"}
                  </button>
                )}
              </div>
            )}
          </div>
          {minutes && !isProcessing && (
            <Button onClick={handleExport} variant="outline" className="shrink-0 gap-2">
              <Download className="h-4 w-4" />
              DOCX татах
            </Button>
          )}
        </div>

        {editingPeople && (
          <Card className="mb-6">
            <CardContent className="space-y-3 p-4">
              <label htmlFor="participants" className="block text-sm font-medium">
                Оролцогчид
              </label>
              <ParticipantsInput value={peopleDraft} onChange={setPeopleDraft} disabled={savingPeople} />
              <p className="text-xs text-muted-foreground">
                Дахин боловсруулбал AI яригчдыг эдгээр нэрээр таних оролдлого хийнэ (ярианаас нь тодорхой бол).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingPeople(false)} disabled={savingPeople}>
                  Цуцлах
                </Button>
                <Button size="sm" variant="outline" onClick={() => savePeople(false)} disabled={savingPeople}>
                  Хадгалах
                </Button>
                <Button size="sm" onClick={() => savePeople(true)} disabled={savingPeople} className="gap-1.5">
                  {savingPeople ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Хадгалаад дахин боловсруулах
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {meeting && isProcessing && <ProcessingCard meeting={meeting} />}

        {(failedMessage || error) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error || failedMessage}</span>
            {meeting?.status === "failed" && (
              <Button size="sm" variant="outline" onClick={handleRetry} disabled={retrying} className="shrink-0 gap-1.5">
                {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Дахин боловсруулах
              </Button>
            )}
          </div>
        )}

        {/* Audio Player */}
        {audioOk && (
          <AudioPlayer
            ref={audioPlayerRef}
            src={api.audioUrl(meetingId)}
            onTimeUpdate={(time) => {
              // Highlight active transcript segment during playback
              const currentTimeMs = time * 1000;
              const activeSegment = transcript.find(
                (seg) => currentTimeMs >= seg.start_ms && currentTimeMs < seg.end_ms
              );
              if (activeSegment && activeSegment.id !== activeSeg) {
                setActiveSeg(activeSegment.id);
              }
            }}
            onError={() => setAudioOk(false)}
          />
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="minutes">Хурлын бичиг</TabsTrigger>
            <TabsTrigger value="transcript">Бичвэр</TabsTrigger>
            <TabsTrigger value="ask">Асуух</TabsTrigger>
          </TabsList>

          <TabsContent value="minutes" className="space-y-6">
            {minutes ? (
              <>
                {/* Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Товч агуулга
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateSummary}
                        disabled={regeneratingSummary || isProcessing}
                        className="gap-1.5"
                      >
                        {regeneratingSummary ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        {regeneratingSummary ? "Үүсгэж байна..." : "Дахин үүсгэх"}
                      </Button>
                      {!summaryEditMode && (
                        <>
                          <Button variant="outline" size="sm" onClick={startEditSummary} disabled={isProcessing}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Засварлах
                          </Button>
                          <Button variant="outline" size="sm" onClick={copySummary}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Хуулах
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {summaryEditMode ? (
                      <div className="space-y-3">
                        <textarea
                          value={summaryDraft}
                          onChange={(e) => setSummaryDraft(e.target.value)}
                          rows={6}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveSummary}>
                            <Check className="h-4 w-4 mr-1" />
                            Хадгалах
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditSummary}>
                            <X className="h-4 w-4 mr-1" />
                            Цуцлах
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed">{minutes.summary}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          AI-аар автоматаар үүсгэсэн тул шийдвэр, хариуцагч, хугацааг бичвэртэй тулган шалгана уу.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Topics */}
                {minutes.topics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        Хэлэлцсэн асуудлууд
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {minutes.topics.map((topic, i) => (
                          <li key={i} className="rounded-lg border border-border p-3">
                            <h4 className="font-semibold">{topic.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
                            <SourceLinks ids={topic.source_segment_ids} segments={segmentsById} onSeek={(seg) => seekTo(seg.start_ms, seg.id)} />
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Decisions */}
                {minutes.decisions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Шийдвэрүүд
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {minutes.decisions.map((decision, i) => (
                          <li key={i} className="rounded-lg border border-border p-3">
                            <p className="font-medium">{decision.text}</p>
                            {decision.rationale && (
                              <p className="mt-1 text-sm text-muted-foreground">{decision.rationale}</p>
                            )}
                            <SourceLinks ids={decision.source_segment_ids} segments={segmentsById} onSeek={(seg) => seekTo(seg.start_ms, seg.id)} />
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Items */}
                {actionItemsDraft.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Үүрэг даалгавар
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
                          {actionItemsDraft.filter(i => i.status === "done").length}/{actionItemsDraft.length} дууссан
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {actionItemsDraft.map((item, i) => (
                          <li key={i} className={`rounded-lg border p-3 transition-colors ${
                            item.status === "done" ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20" : "border-border"
                          }`}>
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleActionItemStatus(i)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                  item.status === "done"
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-muted-foreground/40 hover:border-primary"
                                }`}
                              >
                                {item.status === "done" && <Check className="h-3 w-3" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium ${item.status === "done" ? "text-muted-foreground line-through" : ""}`}>
                                  {item.task}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                  {/* Owner */}
                                  {editingActionItem === i ? (
                                    <input
                                      type="text"
                                      value={item.owner || ""}
                                      onChange={(e) => updateActionItemField(i, "owner", e.target.value)}
                                      onBlur={() => setEditingActionItem(null)}
                                      onKeyDown={(e) => e.key === "Enter" && setEditingActionItem(null)}
                                      placeholder="Хариуцагч..."
                                      className="h-7 rounded border border-input bg-background px-2 text-sm"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setEditingActionItem(i)}
                                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      <Users className="h-3 w-3" />
                                      {item.owner || "Хариуцагч томилоогүй"}
                                    </button>
                                  )}
                                  {/* Due date */}
                                  {editingActionItem === i ? (
                                    <input
                                      type="date"
                                      value={item.due_date || ""}
                                      onChange={(e) => updateActionItemField(i, "due_date", e.target.value)}
                                      onBlur={() => setEditingActionItem(null)}
                                      className="h-7 rounded border border-input bg-background px-2 text-sm"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setEditingActionItem(i)}
                                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      <Clock className="h-3 w-3" />
                                      {item.due_date || "Хугацаа томилоогүй"}
                                    </button>
                                  )}
                                </div>
                                <SourceLinks ids={item.source_segment_ids} segments={segmentsById} onSeek={(seg) => seekTo(seg.start_ms, seg.id)} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Open Questions */}
                {(minutes.open_questions?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Нээлттэй асуудлууд
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {minutes.open_questions!.map((q, i) => (
                          <li key={i} className="rounded-lg border border-border p-3 text-sm">
                            {q.text}
                            <SourceLinks ids={q.source_segment_ids} segments={segmentsById} onSeek={(seg) => seekTo(seg.start_ms, seg.id)} />
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Questions & answers */}
                {(minutes.qa?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircleQuestion className="h-5 w-5" />
                        Асуулт, хариулт
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {minutes.qa!.map((qa, i) => (
                          <li key={i} className="space-y-2 rounded-lg border border-border p-3 text-sm">
                            <div>
                              <span className={`font-semibold ${speakerColor(qa.asked_by, speakerOrder)}`}>
                                {qa.asked_by || "Асуулт"}:
                              </span>{" "}
                              <span className="font-medium">{qa.question}</span>
                            </div>
                            <div className="border-l-2 border-border pl-3">
                              {qa.answer ? (
                                <>
                                  <span className={`font-semibold ${speakerColor(qa.answered_by, speakerOrder)}`}>
                                    {qa.answered_by || "Хариулт"}:
                                  </span>{" "}
                                  {qa.answer}
                                </>
                              ) : (
                                <span className="italic text-muted-foreground">Хариулаагүй</span>
                              )}
                            </div>
                            <SourceLinks ids={qa.source_segment_ids} segments={segmentsById} onSeek={(seg) => seekTo(seg.start_ms, seg.id)} />
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isProcessing ? "Боловсруулж байна..." : "Хурлын бичиг үүсгээгүй байна"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Бичвэр</CardTitle>
                <div className="flex items-center gap-2">
                  {transcript.length > 0 && (
                    <Button
                      variant={transcriptEditMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTranscriptEditMode(!transcriptEditMode)}
                      disabled={isProcessing}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {transcriptEditMode ? "Засварлах горим" : "Засварлах"}
                    </Button>
                  )}
                  {transcript.length > 0 && !replaceOpen && !transcriptEditMode && (
                    <Button variant="outline" size="sm" onClick={() => setReplaceOpen(true)} disabled={isProcessing}>
                      <PenLine />
                      Үг засах
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {replaceOpen && transcript.length > 0 && (
                  <TranscriptReplacePanel
                    meetingId={meetingId}
                    segments={transcript}
                    hasMinutes={!!minutes}
                    disabled={isProcessing}
                    focusSignal={replaceFocus}
                    options={replaceOpts}
                    onOptionsChange={setReplaceOpts}
                    onClose={() => {
                      setReplaceOpen(false);
                      setReplaceOpts((o) => ({ ...o, find: "", replacement: "" }));
                    }}
                    onReplaced={(segs, minutesChanged) => {
                      setTranscript(segs);
                      if (minutesChanged) api.getMinutes(meetingId).then(setMinutes).catch(() => {});
                    }}
                  />
                )}
                {transcript.length > 0 ? (
                  <div className="space-y-3" onMouseUp={replaceOpen && !transcriptEditMode ? handleTranscriptSelect : undefined} onDoubleClick={transcriptEditMode ? undefined : handleTranscriptSelect}>
                    {transcript.map((segment) => {
                      const isEditing = editingSegment === segment.id;
                      const firstTurn = segment.turns?.[0];
                      const displayText = firstTurn?.text ?? segment.text ?? "";
                      const displaySpeaker = firstTurn?.speaker ?? segment.speaker ?? "";

                      return (
                        <div
                          key={segment.id}
                          id={`seg-${segment.id}`}
                          className={`scroll-mt-24 rounded-lg border p-3 transition-colors ${
                            activeSeg === segment.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                          } ${transcriptEditMode ? "cursor-pointer hover:border-primary/50" : ""}`}
                          onClick={() => transcriptEditMode && !isEditing && startEditSegment(segment)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                seekTo(segment.start_ms, segment.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              title="Энэ хэсгээс тоглуулах"
                            >
                              <PlayCircle className="h-3 w-3" />
                              {formatTime(segment.start_ms)} - {formatTime(segment.end_ms)}
                            </button>
                            {transcriptEditMode && !isEditing && (
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="text-xs text-muted-foreground">Яригч</label>
                                <Input
                                  value={speakerDraft}
                                  onChange={(e) => setSpeakerDraft(e.target.value)}
                                  placeholder="Яригчийн нэр..."
                                  className="h-8 mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Текст</label>
                                <textarea
                                  value={segmentDraft}
                                  onChange={(e) => setSegmentDraft(e.target.value)}
                                  rows={3}
                                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveSegment}>
                                  <Check className="h-4 w-4 mr-1" />
                                  Хадгалах
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditSegment}>
                                  <X className="h-4 w-4 mr-1" />
                                  Цуцлах
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {displaySpeaker && (
                                <p className="text-sm">
                                  <span className={`mr-1.5 inline-flex items-center gap-1 font-semibold ${speakerColor(displaySpeaker, speakerOrder)}`}>
                                    <UserRound className="h-3.5 w-3.5" />
                                    {displaySpeaker}:
                                  </span>
                                  <Highlight text={displayText} matcher={replaceMatcher} />
                                </p>
                              )}
                              {!displaySpeaker && (
                                <p className="whitespace-pre-line text-sm">
                                  <Highlight text={displayText} matcher={replaceMatcher} />
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    {isProcessing ? "Боловсруулж байна..." : "Бичвэр алга"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ask">
            {transcript.length > 0 ? (
              <AskPanel
                meetingId={meetingId}
                onCitation={handleCitation}
                examples={ASK_EXAMPLES}
                className="h-[min(640px,70dvh)]"
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isProcessing ? "Боловсруулж дууссаны дараа асуулт асууж болно." : "Асуулт асуух бичвэр алга байна."}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
