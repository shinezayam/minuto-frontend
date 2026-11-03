"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FileText, Clock, Users, CheckCircle, List, Volume2, Download, HelpCircle, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";
import { API_BASE, api } from "@/lib/api";

interface TranscriptSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker?: string;
}

interface MeetingMinutes {
  title: string;
  summary: string;
  topics: Array<{ title: string; description: string }>;
  decisions: Array<{ text: string; rationale?: string }>;
  action_items: Array<{ task: string; owner?: string; due_date?: string }>;
  open_questions?: Array<{ text: string }>;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function MeetingDetailContent() {
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Боловсруулалтын алдаа (upload/live хуудаснаас ?error=... гэж дамжина)
  const processError = useSearchParams().get("error");

  useEffect(() => {
    async function loadData() {
      try {
        // Load meeting details
        const meetingData = await api.getMeeting(meetingId);
        setMeeting(meetingData);

        // Load transcript
        const transcriptRes = await fetch(`${API_BASE}/api/meetings/${meetingId}/transcript`);
        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json();
          setTranscript(transcriptData.segments || []);
        }

        // Load minutes
        const minutesRes = await fetch(`${API_BASE}/api/meetings/${meetingId}/minutes`);
        if (minutesRes.ok) {
          const minutesData = await minutesRes.json();
          setMinutes(minutesData);
        }

        // Check if audio is available
        const audioRes = await fetch(`${API_BASE}/api/meetings/${meetingId}/audio`);
        if (audioRes.ok) {
          setAudioUrl(`${API_BASE}/api/meetings/${meetingId}/audio`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meeting");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [meetingId]);

  const handleExport = () => {
    window.open(api.exportDocxUrl(meetingId), "_blank");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <AudioLoadingAnimation className="scale-150" />
          <p className="text-muted-foreground">Бичвэр уншиж байна...</p>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{meeting?.title || "Хурлын дэлгэрэнгүй"}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(meeting?.created_at).toLocaleString("mn-MN")}
              </span>
            </div>
          </div>
          {minutes && (
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              DOCX татах
            </Button>
          )}
        </div>

        {processError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{processError}</span>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Аудио бичлэг</p>
                  <audio controls src={audioUrl} className="mt-2 w-full" />
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
                  Хурлын бичиг үүсгээгүй байна
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
                    Бичвэр алга
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
