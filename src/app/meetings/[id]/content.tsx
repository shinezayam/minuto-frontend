"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";
import { api, friendlyError, friendlyErrorText } from "@/lib/api";
import type { Meeting, MeetingMinutes, TranscriptSegment } from "@/lib/types";

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const POLL_MS = 3000;

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
  // Боловсруулалт эхлүүлэх үеийн алдаа (upload/live хуудаснаас ?error=... гэж дамжина)
  const startError = useSearchParams().get("error");

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

  const handleExport = () => {
    window.open(api.exportDocxUrl(meetingId), "_blank");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <AudioLoadingAnimation className="scale-150" />
          <p className="text-muted-foreground">Уншиж байна...</p>
        </main>
      </>
    );
  }

  if (error && !meeting) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        </main>
      </>
    );
  }

  const failedMessage =
    meeting?.status === "failed"
      ? friendlyErrorText(meeting.processing_error)
      : !isProcessing
        ? startError
        : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">{meeting?.title || "Хурлын дэлгэрэнгүй"}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {meeting ? new Date(meeting.created_at).toLocaleString("mn-MN") : ""}
              </span>
            </div>
          </div>
          {minutes && !isProcessing && (
            <Button onClick={handleExport} variant="outline" className="shrink-0 gap-2">
              <Download className="h-4 w-4" />
              DOCX татах
            </Button>
          )}
        </div>

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
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Аудио бичлэг</p>
                  <audio
                    controls
                    preload="metadata"
                    src={api.audioUrl(meetingId)}
                    className="mt-2 w-full"
                    onError={() => setAudioOk(false)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="minutes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="minutes">Хурлын бичиг</TabsTrigger>
            <TabsTrigger value="transcript">Бичвэр</TabsTrigger>
          </TabsList>

          <TabsContent value="minutes" className="space-y-6">
            {minutes ? (
              <>
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Товч агуулга
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{minutes.summary}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      AI-аар автоматаар үүсгэсэн тул шийдвэр, хариуцагч, хугацааг бичвэртэй тулган шалгана уу.
                    </p>
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
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Action Items */}
                {minutes.action_items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Үүрэг даалгавар
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {minutes.action_items.map((item, i) => (
                          <li key={i} className="rounded-lg border border-border p-3">
                            <p className="font-medium">{item.task}</p>
                            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                              {item.owner && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {item.owner}
                                </span>
                              )}
                              {item.due_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.due_date}
                                </span>
                              )}
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
              <CardHeader>
                <CardTitle>Бичвэр</CardTitle>
              </CardHeader>
              <CardContent>
                {transcript.length > 0 ? (
                  <div className="space-y-3">
                    {transcript.map((segment) => (
                      <div key={segment.id} className="rounded-lg border border-border p-3">
                        <div className="mb-1 text-xs font-medium text-primary">
                          {formatTime(segment.start_ms)} - {formatTime(segment.end_ms)}
                        </div>
                        <p className="text-sm">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    {isProcessing ? "Боловсруулж байна..." : "Бичвэр алга"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
