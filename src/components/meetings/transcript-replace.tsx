"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Loader2, Replace, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, friendlyError } from "@/lib/api";
import type { TranscriptSegment } from "@/lib/types";

export interface ReplaceOptions {
  find: string;
  replacement: string;
  wholeWord: boolean;
}

/**
 * Backend-ийн (app/services/text_replace.py) хайлттай ижил: том жижиг үсэг ялгахгүй,
 * wholeWord үед үсэг/тоонд наалдсан хэсгийг ("Бат" → "Батын") алгасна. JS-ийн \b кирилл таньдаггүй тул \p{L}.
 */
export function buildMatcher({ find, wholeWord }: Pick<ReplaceOptions, "find" | "wholeWord">): RegExp | null {
  const q = find.trim();
  if (!q) return null;
  const body = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(wholeWord ? `(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])` : body, "giu");
}

/** Дэлгэцэнд харагдах текстээр тоолно (backend-тэй ижил): turns байвал тэдгээр, үгүй бол segment.text */
export function countMatches(segments: TranscriptSegment[], matcher: RegExp | null): number {
  if (!matcher) return 0;
  const count = (t: string) => t.match(matcher)?.length ?? 0;
  return segments.reduce(
    (n, s) => n + (s.turns && s.turns.length > 0 ? s.turns.reduce((k, t) => k + count(t.text), 0) : count(s.text)),
    0,
  );
}

/** Олдсон үгсийг тодруулж харуулна */
export function Highlight({ text, matcher }: { text: string; matcher: RegExp | null }) {
  if (!matcher) return <>{text}</>;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(matcher)) {
    const start = m.index ?? 0;
    if (!m[0]) continue;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <mark key={start} className="rounded bg-amber-200 px-0.5 text-foreground dark:bg-amber-500/40">
        {m[0]}
      </mark>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => (typeof p === "string" ? <Fragment key={`t${i}`}>{p}</Fragment> : p))}</>;
}

/**
 * Бичвэрт буруу танигдсан үгийг бүх газарт нь засах самбар.
 * Бичвэрээс үг сонгоход эцэг компонент `options`-ийг бөглөж `focusSignal`-ийг нэмэгдүүлнэ.
 */
export function TranscriptReplacePanel({
  meetingId,
  segments,
  hasMinutes,
  disabled,
  focusSignal,
  options,
  onOptionsChange,
  onClose,
  onReplaced,
}: {
  meetingId: string;
  segments: TranscriptSegment[];
  hasMinutes: boolean;
  disabled?: boolean;
  /** Өөрчлөгдөх бүрд "Зөв үг" талбарт фокуслана */
  focusSignal: number;
  options: ReplaceOptions;
  onOptionsChange: (o: ReplaceOptions) => void;
  onClose: () => void;
  onReplaced: (segments: TranscriptSegment[], minutesChanged: boolean) => void;
}) {
  const [includeMinutes, setIncludeMinutes] = useState(true);
  const [remember, setRemember] = useState(true);
  const [saving, setSaving] = useState(false);
  // forFind: мессеж аль хайлтад хамаарах — хайх үг солигдоход хуучин мессеж нуугдана
  const [result, setResult] = useState<{ ok: boolean; text: string; forFind: string; remembered?: boolean } | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal > 0) replaceRef.current?.select();
  }, [focusSignal]);

  const { replacement } = options;
  const matcher = buildMatcher(options);
  const count = countMatches(segments, matcher);
  const unchanged = replacement.trim() === options.find.trim();
  const message = result && result.forFind === options.find ? result : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matcher || count === 0 || unchanged || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const res = await api.replaceInTranscript(meetingId, {
        find: options.find.trim(),
        replace: replacement.trim(),
        whole_word: options.wholeWord,
        include_minutes: hasMinutes && includeMinutes,
        remember,
      });
      onReplaced(res.segments, res.minutes_replaced > 0);
      setResult({
        ok: true,
        forFind: "",
        text:
          `${res.replaced} газар засагдлаа` +
          (res.minutes_replaced > 0 ? `, хурлын бичигт ${res.minutes_replaced} газар` : "") +
          "." +
          (res.remembered ? " Дараагийн хурлуудад автоматаар засагдана." : ""),
        remembered: !!res.remembered,
      });
      onOptionsChange({ ...options, find: "", replacement: "" });
    } catch (err) {
      setResult({ ok: false, text: friendlyError(err), forFind: options.find });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Бичвэрээс үгийг <b>давхар товшиж</b> сонгох эсвэл доор бичнэ. Ижил үг бүх газарт засагдана.
        </p>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose} aria-label="Хаах">
          <X />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium">
          Буруу үг
          <Input
            value={options.find}
            onChange={(e) => onOptionsChange({ ...options, find: e.target.value })}
            placeholder="жишээ: Бат"
            maxLength={200}
            disabled={disabled || saving}
          />
        </label>
        <label className="space-y-1 text-xs font-medium">
          Зөв үг
          <Input
            ref={replaceRef}
            value={replacement}
            onChange={(e) => onOptionsChange({ ...options, replacement: e.target.value })}
            placeholder="жишээ: Баатар"
            maxLength={200}
            disabled={disabled || saving}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.wholeWord}
            onChange={(e) => onOptionsChange({ ...options, wholeWord: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Зөвхөн бүтэн үг <span className="text-muted-foreground">(&quot;Батын&quot;-ийг оролцуулахгүй)</span>
        </label>
        {hasMinutes && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeMinutes}
              onChange={(e) => setIncludeMinutes(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Хурлын бичигт мөн засах
          </label>
        )}
        <label className="flex items-center gap-2" title="Дараагийн хурлуудад энэ үгийг автоматаар засна">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Толь бичигт хадгалах
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={disabled || saving || !matcher || count === 0 || unchanged}>
          {saving ? <Loader2 className="animate-spin" /> : <Replace />}
          {count > 0 ? `Бүгдийг засах (${count})` : "Бүгдийг засах"}
        </Button>
        {matcher && !message && (
          <span className="text-xs text-muted-foreground">
            {count > 0 ? `${count} газар олдлоо` : "Олдсонгүй"}
          </span>
        )}
        {message && (
          <span className={`inline-flex items-center gap-1 text-xs ${message.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {message.ok && <Check className="h-3.5 w-3.5" />}
            {message.text}
            {message.remembered && (
              <Link href="/settings" className="ml-1 underline underline-offset-2 hover:no-underline">
                Толь бичиг
              </Link>
            )}
          </span>
        )}
      </div>
    </form>
  );
}
