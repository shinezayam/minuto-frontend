"use client";

import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, MessageSquareText, PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, friendlyError } from "@/lib/api";
import type { AskCitation, AskMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  citations?: AskCitation[];
  error?: boolean;
}

interface AskPanelProps {
  /** Өгвөл зөвхөн энэ хурлаас асууна */
  meetingId?: string;
  /** Эх сурвалж дээр дарахад. true буцаавал өөрөө шийдсэн (жишээ нь тухайн хуудсанд аудиог гүйлгэсэн) */
  onCitation?: (c: AskCitation) => boolean | void;
  examples?: string[];
  /** Шүүлтүүрүүд (огноо, оролцогч) */
  filters?: {
    date_from?: string;
    date_to?: string;
    meeting_ids?: string[];
    participant?: string;
  };
  className?: string;
}

const REF_RE = /\[(S\d+)\]/g;

export function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Хариулт дахь [S12] шошгыг дугаартай товч болгоно */
function renderAnswer(text: string, citations: AskCitation[], onPick: (c: AskCitation) => void): ReactNode[] {
  const index = new Map(citations.map((c, i) => [c.ref, i]));
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(REF_RE)) {
    const i = index.get(m[1]);
    out.push(<Fragment key={`t${last}`}>{text.slice(last, m.index)}</Fragment>);
    if (i !== undefined) {
      const c = citations[i];
      out.push(
        <button
          key={`c${m.index}`}
          type="button"
          onClick={() => onPick(c)}
          title={`${c.meeting_title} · ${formatTimestamp(c.start_ms)}`}
          className="mx-0.5 inline-flex h-5 min-w-5 -translate-y-px items-center justify-center rounded-md bg-primary/10 px-1 align-middle text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {i + 1}
        </button>,
      );
    }
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return out;
}

export function AskPanel({ meetingId, onCitation, examples = [], filters, className }: AskPanelProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const multiMeeting = !meetingId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries, loading]);

  const pick = (c: AskCitation) => {
    if (onCitation?.(c)) return;
    router.push(`/meetings/${c.meeting_id}?t=${c.start_ms}&seg=${encodeURIComponent(c.segment_id)}`);
  };

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || loading) return;
    const history: AskMessage[] = entries.filter((e) => !e.error).map(({ role, content }) => ({ role, content }));
    setEntries((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.ask(question, meetingId, history, filters);
      setEntries((prev) => [...prev, { role: "assistant", content: res.answer, citations: res.citations }]);
    } catch (err) {
      setEntries((prev) => [...prev, { role: "assistant", content: friendlyError(err), error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Ask Minuto</p>
            <p className="text-xs text-muted-foreground">
              {multiMeeting ? "Бүх хурлаасаа асуугаарай" : "Энэ хурлаас асуугаарай"}
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setEntries([])} disabled={loading}>
            <RotateCcw className="h-3.5 w-3.5" />
            Шинэ яриа
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center py-6 text-center">
            <MessageSquareText className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Хурлын бичвэрээс хайж хариулна. Хариулт бүр бичвэрийн тухайн цаг руу холбогдсон байна.
            </p>
            {examples.length > 0 && (
              <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
                {examples.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {entries.map((e, i) =>
          e.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {e.content}
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[95%]">
              <div
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed",
                  e.error && "rounded-lg bg-destructive/10 px-3 py-2 text-destructive",
                )}
              >
                {e.error ? e.content : renderAnswer(e.content, e.citations ?? [], pick)}
              </div>
              {(e.citations?.length ?? 0) > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Эх сурвалж</p>
                  {e.citations!.map((c, ci) => (
                    <button
                      key={c.ref}
                      type="button"
                      onClick={() => pick(c)}
                      className="group flex w-full items-start gap-2.5 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 px-1 text-[11px] font-semibold text-primary">
                        {ci + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <PlayCircle className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium text-primary">{formatTimestamp(c.start_ms)}</span>
                          {multiMeeting && <span className="truncate">· {c.meeting_title}</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-foreground/80">{c.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Бичвэрээс хайж байна...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Жишээ: Ямар шийдвэр гаргасан бэ?"
          className="max-h-32 min-h-9 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || loading} aria-label="Илгээх">
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
