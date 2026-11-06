"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookA, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, friendlyError } from "@/lib/api";
import type { VocabularyTerm } from "@/lib/types";

/**
 * Хэрэглэгчийн толь бичиг. Энд байгаа үгсийг ASR-д "гарч болох үгс" гэж урьдчилан өгнө,
 * буруу хэлбэр нь бүртгэгдсэн бол шинэ бичвэрт автоматаар засна.
 */
export function VocabularyCard() {
  const [terms, setTerms] = useState<VocabularyTerm[] | null>(null);
  const [term, setTerm] = useState("");
  const [wrong, setWrong] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listVocabulary()
      .then((r) => setTerms(r.terms))
      .catch((err) => {
        setError(friendlyError(err));
        setTerms([]);
      });
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const t = await api.addVocabulary(term.trim(), wrong.trim() || undefined);
      setTerms((prev) => [t, ...(prev ?? []).filter((x) => x.id !== t.id)]);
      setTerm("");
      setWrong("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await api.deleteVocabulary(id);
      setTerms((prev) => (prev ?? []).filter((x) => x.id !== id));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookA className="h-5 w-5" />
          Миний толь бичиг
        </CardTitle>
        <CardDescription>
          Хүний нэр, байгууллага, мэргэжлийн үгсээ нэмбэл Minuto бичвэр гаргахдаа тэдгээрийг зөв бичихийг хичээнэ.
          Бичвэр дээр <b>&quot;Үг засах&quot;</b>-аар хийсэн засварууд энд автоматаар нэмэгдэж, дараагийн хурлуудад
          автоматаар засагдана. Хурлын оролцогчдын нэрийг тусад нь нэмэх шаардлагагүй.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1 text-xs font-medium">
            Зөв бичлэг
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="жишээ: Батэрдэнэ" maxLength={200} />
          </label>
          <label className="space-y-1 text-xs font-medium">
            Буруу танигддаг хэлбэр <span className="font-normal text-muted-foreground">(заавал биш)</span>
            <Input value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="жишээ: Бат Эрдэнэ" maxLength={200} />
          </label>
          <Button type="submit" disabled={!term.trim() || saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />}
            Нэмэх
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {terms === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
          </p>
        ) : terms.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Толь бичиг хоосон байна.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {terms.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  {t.wrong && (
                    <>
                      <span className="text-muted-foreground line-through">{t.wrong}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="автоматаар засна" />
                    </>
                  )}
                  <span className="font-medium">{t.term}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(t.id)}
                  disabled={deleting === t.id}
                  aria-label={`${t.term}-г устгах`}
                >
                  {deleting === t.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
