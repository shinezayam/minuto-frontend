"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Clock, Calendar, Trash2, FileText, Download, Upload, Search, Filter, SortAsc, SortDesc, BarChart3, Pencil, LayoutGrid, List, Archive, ArchiveRestore } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api, friendlyError } from "@/lib/api";
import { AuthGuard } from "@/components/layout/auth-guard";
import { formatDate, formatDuration } from "@/lib/audio-utils";
import type { Meeting } from "@/lib/types";

type SortField = "date" | "title" | "duration";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list";

function DashboardContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    api
      .listMeetings(showArchived)
      .then((res) => setMeetings(res.meetings))
      .catch((err) => setLoadError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [showArchived]);

  // Боловсруулж буй хурал байвал төлөвийг 5 секунд тутам шинэчилнэ
  const anyProcessing = meetings.some((m) => m.status === "processing");
  useEffect(() => {
    if (!anyProcessing) return;
    const t = setInterval(() => {
      api.listMeetings().then((res) => setMeetings(res.meetings)).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [anyProcessing]);

  // Filter and sort meetings
  const filteredAndSortedMeetings = useMemo(() => {
    let filtered = meetings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => 
        m.title.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "duration") {
        comparison = a.duration_ms - b.duration_ms;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [meetings, searchQuery, statusFilter, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = meetings.length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    const totalDuration = meetings.reduce((sum, m) => sum + m.duration_ms, 0);
    const processing = meetings.filter((m) => m.status === "processing").length;
    
    return { total, completed, totalDuration, processing };
  }, [meetings]);

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хурлыг устгах уу?")) return;
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Устгахад алдаа гарлаа");
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      await api.updateMeeting(id, { title: newTitle });
      setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m)));
    } catch {
      alert("Нэр солиход алдаа гарлаа");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.archiveMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Архивлахад алдаа гарлаа");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await api.unarchiveMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Архиваас гаргахад алдаа гарлаа");
    }
  };

  const handleNewMeeting = async () => {
    try {
      const meeting = await api.createMeeting();
      router.push(`/meetings/${meeting.id}/live`);
    } catch {
      alert("Хурал үүсгэхэд алдаа гарлаа");
    }
  };

  return (
    <>
      <AppShell>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Хурлууд</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Таны бүх хурлын бичлэг болон бичвэр
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upload" className={buttonVariants({ variant: "outline", className: "gap-2 rounded-full" })}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Аудио оруулах</span>
            </Link>
            <Button onClick={handleNewMeeting} className="gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Mic className="h-4 w-4" />
              Шинэ хурал
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && meetings.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Нийт хурал</p>
                    <p className="mt-1 font-display text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Дууссан</p>
                    <p className="mt-1 font-display text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[oklch(0.95_0.05_150)] dark:bg-[oklch(0.3_0.05_150)]">
                    <FileText className="h-6 w-6 text-[oklch(0.42_0.12_150)] dark:text-[oklch(0.7_0.15_150)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Нийт хугацаа</p>
                    <p className="mt-1 font-display text-3xl font-bold">{formatDuration(stats.totalDuration)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Боловсруулж буй</p>
                    <p className="mt-1 font-display text-3xl font-bold">{stats.processing}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[oklch(0.96_0.06_85)] dark:bg-[oklch(0.3_0.06_85)]">
                    <Clock className="h-6 w-6 animate-pulse text-[oklch(0.47_0.11_70)] dark:text-[oklch(0.7_0.11_70)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {!loading && meetings.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Хурал хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-full border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Бүх төлөв</option>
                <option value="completed">Дууссан</option>
                <option value="processing">Боловсруулж буй</option>
                <option value="recording">Бичиж буй</option>
                <option value="draft">Ноорог</option>
              </select>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="h-10 rounded-full border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="date">Огноогоор</option>
                <option value="title">Гарчигаар</option>
                <option value="duration">Хугацаагаар</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Өсөх" : "Буурах"}
                className="rounded-full"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                title={showArchived ? "Идэвхтэй хурлууд руу буцах" : "Архивласан хурлуудыг харуулах"}
                className="rounded-full gap-1.5"
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    <span className="text-xs">Идэвхтэй</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    <span className="text-xs">Архив</span>
                  </>
                )}
              </Button>
              <div className="flex items-center rounded-full border border-input">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  className="h-9 w-9 rounded-full"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className="h-9 w-9 rounded-full"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} className="mt-8" />
        ) : meetings.length === 0 ? (
          <DashboardEmptyState onCreateNew={handleNewMeeting} />
        ) : filteredAndSortedMeetings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Хурал олдсонгүй"
            description="Хайлтын өөр түлхүүр үг эсвэл шүүлтүүр ашиглана уу"
            action={
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Шүүлтүүр цэвэрлэх
              </Button>
            }
            className="mt-8"
          />
        ) : (
          viewMode === "grid" ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onDelete={() => handleDelete(meeting.id)}
                  onRename={(newTitle) => handleRename(meeting.id, newTitle)}
                  onArchive={() => handleArchive(meeting.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-2">
              {filteredAndSortedMeetings.map((meeting) => (
                <MeetingListItem
                  key={meeting.id}
                  meeting={meeting}
                  onDelete={() => handleDelete(meeting.id)}
                  onRename={(newTitle) => handleRename(meeting.id, newTitle)}
                  onArchive={() => handleArchive(meeting.id)}
                />
              ))}
            </div>
          )
        )}
        </main>
      </AppShell>
    </>
  );
}

function MeetingCard({
  meeting,
  onDelete,
  onRename,
  onArchive,
}: {
  meeting: Meeting;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onArchive: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== meeting.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(meeting.title);
    setIsEditing(false);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    recording: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    failed: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    draft: "Ноорог",
    recording: "Бичиж байна",
    paused: "Зогссон",
    completed: "Дууссан",
    processing: "Боловсруулж байна",
    failed: "Алдаа",
  };

  const statusIcons: Record<string, string> = {
    draft: "📝",
    recording: "🔴",
    paused: "⏸️",
    completed: "✅",
    processing: "⚙️",
    failed: "❌",
  };

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border shadow-sm transition-all hover:shadow-md">
      {/* Status indicator bar */}
      <div className={`h-1 w-full ${statusColors[meeting.status]?.split(" ")[0] || "bg-muted"}`} />
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-8 text-lg font-bold"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 px-2">
                  Хадгалах
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 px-2">
                  Цуцлах
                </Button>
              </div>
            ) : (
              <h3 className="truncate font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                {meeting.title}
              </h3>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(meeting.created_at)}
              </span>
              {meeting.duration_ms > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(meeting.duration_ms)}
                </span>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[meeting.status] || "bg-muted"}`}
          >
            <span className="text-xs">{statusIcons[meeting.status]}</span>
            {statusLabels[meeting.status] || meeting.status}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={meeting.status === "recording" || meeting.status === "paused" ? `/meetings/${meeting.id}/live` : `/meetings/${meeting.id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-full transition-all group-hover:bg-foreground group-hover:text-background group-hover:border-foreground">
              <FileText className="h-3.5 w-3.5" />
              {meeting.status === "recording" || meeting.status === "paused" ? "Үргэлжлүүлэх" : "Нээх"}
            </Button>
          </Link>
          {meeting.status === "completed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              title="DOCX татах"
              onClick={() => api.downloadDocx(meeting.id).catch((err) => alert(friendlyError(err)))}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            title="Нэр солих"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground gap-1"
            title="Архивлах - Хурлыг устгахгүйгээр жагсаалтаас нуух"
            onClick={onArchive}
          >
            <Archive className="h-4 w-4" />
            <span className="text-xs">Архив</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
            title="Бүрмөсөн устгах"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingListItem({
  meeting,
  onDelete,
  onRename,
  onArchive,
}: {
  meeting: Meeting;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onArchive: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== meeting.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(meeting.title);
    setIsEditing(false);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    recording: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    failed: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    draft: "Ноорог",
    recording: "Бичиж байна",
    paused: "Зогссон",
    completed: "Дууссан",
    processing: "Боловсруулж байна",
    failed: "Алдаа",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="h-8 font-bold"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 px-2">
              Хадгалах
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 px-2">
              Цуцлах
            </Button>
          </div>
        ) : (
          <Link
            href={meeting.status === "recording" || meeting.status === "paused" ? `/meetings/${meeting.id}/live` : `/meetings/${meeting.id}`}
            className="font-display text-base font-bold hover:text-primary transition-colors"
          >
            {meeting.title}
          </Link>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(meeting.created_at)}
          </span>
          {meeting.duration_ms > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(meeting.duration_ms)}
            </span>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[meeting.status] || "bg-muted"}`}
      >
        {statusLabels[meeting.status] || meeting.status}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          title="Нэр солих"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {meeting.status === "completed" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            title="DOCX татах"
            onClick={() => api.downloadDocx(meeting.id).catch((err) => alert(friendlyError(err)))}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground gap-1"
          title="Архивлах - Хурлыг устгахгүйгээр жагсаалтаас нуух"
          onClick={onArchive}
        >
          <Archive className="h-4 w-4" />
          <span className="text-xs">Архив</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
          title="Бүрмөсөн устгах"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DashboardEmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Mic className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.95_0.05_150)] dark:bg-[oklch(0.3_0.05_150)]">
          <span className="text-xl">✨</span>
        </div>
      </div>
      <h3 className="mt-6 font-display text-xl font-bold">Хурал алга байна</h3>
      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        Эхний хурлаа бичих эсвэл бэлэн аудио бичлэгээ оруулаад AI-р хурлын тэмдэглэл үүсгээрэй. 
        Монгол хэлний бичвэр, хурлын бичиг автоматаар үүснэ.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onCreateNew} className="gap-2 h-12 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90">
          <Mic className="h-4 w-4" />
          Шинэ хурал эхлүүлэх
        </Button>
        <Link href="/upload" className={buttonVariants({ variant: "outline", className: "gap-2 h-12 px-7 rounded-full" })}>
          <Upload className="h-4 w-4" />
          Аудио файл оруулах
        </Link>
      </div>
      <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-lg">🎙️</span>
          </div>
          <p className="font-display text-sm font-bold">Онлайн хурал</p>
          <p className="text-xs text-muted-foreground text-center">Браузераас шууд бичих</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-lg">📤</span>
          </div>
          <p className="font-display text-sm font-bold">Файл оруулах</p>
          <p className="text-xs text-muted-foreground text-center">Аудио файл хуулах</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-lg">📝</span>
          </div>
          <p className="font-display text-sm font-bold">AI бичиг</p>
          <p className="text-xs text-muted-foreground text-center">Автомат хурлын бичиг</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
