"use client";

import { useState, useEffect } from "react";
import { User, Palette, Bell, Shield, Save, Check } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { VocabularyCard } from "@/components/settings/vocabulary-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { api, friendlyError } from "@/lib/api";

type TabType = "profile" | "preferences" | "vocabulary";

export default function SettingsPage() {
  const user = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("mn");
  const [summaryLength, setSummaryLength] = useState("medium");

  useEffect(() => {
    // Load preferences from localStorage
    const savedTheme = localStorage.getItem("minuto-theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setTheme(savedTheme);
    
    const savedLang = localStorage.getItem("minuto-language");
    if (savedLang) setLanguage(savedLang);
    
    const savedSummaryLength = localStorage.getItem("minuto-summary-length");
    if (savedSummaryLength) setSummaryLength(savedSummaryLength);
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem("minuto-theme", theme);
    localStorage.setItem("minuto-language", language);
    localStorage.setItem("minuto-summary-length", summaryLength);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile" as TabType, label: "Профайл", icon: User },
    { id: "preferences" as TabType, label: "Тохируулга", icon: Palette },
    { id: "vocabulary" as TabType, label: "Толь бичиг", icon: BookIcon },
  ];

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Тохиргоо</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Профайл, тохируулга, толь бичиг
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-2 rounded-full border border-border/60 bg-background p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-xl">Профайл</CardTitle>
                <CardDescription>Хувийн мэдээлэл</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Имэйл</label>
                  <Input value={user?.email || ""} disabled className="h-10 rounded-full bg-muted border-border/60" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Имэйл өөрчлөх боломжгүй
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Нэр</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Таны нэр"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !name.trim()}
                  className="gap-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 hover:opacity-90 h-11 px-6 text-sm font-semibold"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Хадгалагдсан
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {saving ? "Хадгалж байна..." : "Хадгалах"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle>Тохируулга</CardTitle>
                <CardDescription>Хэрэглэгчийн тохиргоо</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Загвар</label>
                  <div className="flex gap-2">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                          theme === t
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {t === "light" ? "Гэрэлтэй" : t === "dark" ? "Харанхуй" : "Систем"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Хэл</label>
                  <div className="flex gap-2">
                    {[
                      { value: "mn", label: "Монгол" },
                      { value: "en", label: "English" },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                          language === lang.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <p className="text-sm font-medium">{lang.label}</p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Хэлний тохиргоо хурлын бичиг, AI хариултын хэлэнд нөлөөлнө
                  </p>
                </div>

                {/* Summary Length */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Товч агуулгын урт</label>
                  <div className="flex gap-2">
                    {[
                      { value: "short", label: "Богино" },
                      { value: "medium", label: "Дунд" },
                      { value: "long", label: "Урт" },
                    ].map((len) => (
                      <button
                        key={len.value}
                        onClick={() => setSummaryLength(len.value)}
                        className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                          summaryLength === len.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <p className="text-sm font-medium">{len.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSavePreferences} className="gap-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 hover:opacity-90 h-11 px-6 text-sm font-semibold">
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Хадгалагдсан
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Хадгалах
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Vocabulary Tab */}
          {activeTab === "vocabulary" && <VocabularyCard />}
        </main>
      </AppShell>
    </AuthGuard>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
