"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Trash2, X, Check } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api, friendlyError } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  sections: string[];
  custom_prompt: string | null;
  is_default: boolean;
  owner_id: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Товч агуулга",
  topics: "Сэдвүүд",
  decisions: "Шийдвэрүүд",
  action_items: "Даалгаврууд",
  open_questions: "Нээлттэй асуултууд",
};

const ICONS = ["📋", "⚡", "💡", "🎤", "📚", "📊", "🎯", "🔍", "💼", "🏢"];

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newSections, setNewSections] = useState<string[]>(["summary", "topics", "decisions", "action_items"]);
  const [newPrompt, setNewPrompt] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTemplates();
      setTemplates(data);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.createTemplate({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        icon: newIcon,
        sections: newSections,
        custom_prompt: newPrompt.trim() || undefined,
      });
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewIcon("📋");
      setNewSections(["summary", "topics", "decisions", "action_items"]);
      setNewPrompt("");
      loadTemplates();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ загварыг устгах уу?")) return;
    try {
      await api.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const toggleSection = (section: string) => {
    setNewSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Загварууд</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Хурлын бичгийн загваруудыг удирдах
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 hover:opacity-90 h-12 px-7 text-base font-semibold">
              <Plus className="h-5 w-5" />
              Шинэ загвар
            </Button>
          </div>

          {/* Create dialog */}
          {showCreate && (
            <Card className="mb-8 rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl">Шинэ загвар үүсгэх</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Нэр</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Жишээ: Төслийн уулзалт"
                    className="h-10 rounded-full border-border/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Тайлбар</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Загварын товч тайлбар"
                    className="h-10 rounded-full border-border/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Тэмдэг</label>
                  <div className="flex gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewIcon(icon)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors ${
                          newIcon === icon
                            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                            : "border-border/60 hover:bg-muted"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Хэсгүүд</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SECTION_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleSection(key)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          newSections.includes(key)
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {newSections.includes(key) && <Check className="h-3 w-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Нэмэлт заавар (AI-д өгөх)
                  </label>
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Жишээ: Албан ёсны хэлбэрээр бичнэ үү..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim()}>
                    Үүсгэх
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Цуцлах
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : templates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Загвар алга"
              description="Эхний загвараа үүсгэнэ үү"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tmpl) => (
                <Card key={tmpl.id} className="relative rounded-2xl border-border/60 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/20">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                          {tmpl.icon}
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold tracking-tight">{tmpl.name}</h3>
                          {tmpl.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{tmpl.description}</p>
                          )}
                        </div>
                      </div>
                      {tmpl.is_default && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/10">
                          Үндсэн
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.sections.map((section) => (
                        <span
                          key={section}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {SECTION_LABELS[section] || section}
                        </span>
                      ))}
                    </div>
                    {!tmpl.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(tmpl.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </AppShell>
    </AuthGuard>
  );
}
