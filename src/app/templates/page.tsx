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
        <main className="mx-auto max-w-5xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Загварууд</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Хурлын бичгийн загваруудыг удирдах
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Шинэ загвар
            </Button>
          </div>

          {/* Create dialog */}
          {showCreate && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Шинэ загвар үүсгэх</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Нэр</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Жишээ: Төслийн уулзалт"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Тайлбар</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Загварын товч тайлбар"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Тэмдэг</label>
                  <div className="flex gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewIcon(icon)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors ${
                          newIcon === icon
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Хэсгүүд</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SECTION_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleSection(key)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
                          newSections.includes(key)
                            ? "bg-primary text-primary-foreground"
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tmpl) => (
                <Card key={tmpl.id} className="relative">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{tmpl.icon}</span>
                        <div>
                          <h3 className="font-semibold">{tmpl.name}</h3>
                          {tmpl.description && (
                            <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                          )}
                        </div>
                      </div>
                      {tmpl.is_default && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Үндсэн
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.sections.map((section) => (
                        <span
                          key={section}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {SECTION_LABELS[section] || section}
                        </span>
                      ))}
                    </div>
                    {!tmpl.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
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
