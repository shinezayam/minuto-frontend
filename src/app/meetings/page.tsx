"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  Clock,
  Calendar,
  Trash2,
  FileText,
  Download,
  Upload,
  Search,
  SortAsc,
  SortDesc,
  Pencil,
  LayoutGrid,
  List,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Square,
} from "lucide-react";
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

const PAGE_SIZE = 12;

function MeetingsContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      api.listMeetings(showArchived).then((res) => setMeetings(res.meetings)).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [anyProcessing, showArchived]);

  // Filter and sort meetings
  const filteredAndSortedMeetings = useMemo(() => {
    let filtered = meetings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(query));
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMeetings.length / PAGE_SIZE);
  const paginatedMeetings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredAndSortedMeetings.slice(start, end);
  }, [filteredAndSortedMeetings, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortField, sortOrder, showArchived]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedMeetings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedMeetings.map((m) => m.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хурлыг устгах уу?")) return;
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      alert("Архивлахад алдаа гарлаа");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} хурлыг устгах уу?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => api.deleteMeeting(id)));
      setMeetings((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } catch {
      alert("Устгахад алдаа гарлаа");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => api.archiveMeeting(id)));
      setMeetings((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } catch {
      alert("Архивлахад алдаа гарлаа");
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
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Миний хурлууд</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Бүх хурлын бичлэг болон бичвэр
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/upload" className={buttonVariants({ variant: "outline", className: "gap-2 rounded-full h-12 px-7 text-base font-semibold" })}>
                <Upload className="h-5 w-5" />
                <span className="hidden sm:inline">Аудио оруулах</span>
              </Link>
              <Button onClick={handleNewMeeting} className="gap-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 hover:opacity-90 h-12 px-7 text-base font-semibold">
                <Mic className="h-5 w-5" />
                Шинэ хурал
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <span className="text-sm font-medium">{selectedIds.size} хурал сонгосон</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkArchive} className="gap-1.5 rounded-full">
                  <Archive className="h-3.5 w-3.5" />
                  Архивлах
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5 rounded-full">
                  <Trash2 className="h-3.5 w-3.5" />
                  Устгах
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="rounded-full">
                  Цуцлах
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          {!loading && meetings.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Хурал хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-full border-border/60 pl-10 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-12 rounded-full border border-border/60 bg-background px-5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="h-12 rounded-full border border-border/60 bg-background px-5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="h-12 w-12 rounded-full border-border/60 shadow-sm"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  title={showArchived ? "Идэвхтэй хурлууд руу буцах" : "Архивласан хурлуудыг харуулах"}
                  className="rounded-full gap-1.5 h-12 px-5"
                >
                  {showArchived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      <span className="text-sm">Идэвхтэй</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      <span className="text-sm">Архив</span>
                    </>
                  )}
                </Button>
                <div className="flex items-center rounded-full border border-border/60 shadow-sm">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                    className="h-11 w-11 rounded-full"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className="h-11 w-11 rounded-full"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
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
            <EmptyState
              icon={Mic}
              title="Хурал алга байна"
              description="Эхний хурлаа бичих эсвэл бэлэн аудио бичлэгээ оруулаад AI-р хурлын тэмдэглэл үүсгээрэй."
              action={
                <Button onClick={handleNewMeeting} className="gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90">
                  <Mic className="h-4 w-4" />
                  Шинэ хурал эхлүүлэх
                </Button>
              }
              className="mt-16"
            />
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
            <>
              {/* Select All */}
              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {selectedIds.size === paginatedMeetings.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Бүгдийг сонгох
                </button>
              </div>

              {/* Meetings */}
              {viewMode === "grid" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      selected={selectedIds.has(meeting.id)}
                      onSelect={() => toggleSelect(meeting.id)}
                      onDelete={() => handleDelete(meeting.id)}
                      onRename={(newTitle) => handleRename(meeting.id, newTitle)}
                      onArchive={() => handleArchive(meeting.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  {paginatedMeetings.map((meeting) => (
                    <MeetingListItem
                      key={meeting.id}
                      meeting={meeting}
                      selected={selectedIds.has(meeting.id)}
                      onSelect={() => toggleSelect(meeting.id)}
                      onDelete={() => handleDelete(meeting.id)}
                      onRename={(newTitle) => handleRename(meeting.id, newTitle)}
                      onArchive={() => handleArchive(meeting.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full"
                  >
                    Өмнөх
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    Дараах
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </AppShell>
    </>
  );
}

function MeetingCard({
  meeting,
  selected,
  onSelect,
  onDelete,
  onRename,
  onArchive,
}: {
  meeting: Meeting;
  selected: boolean;
  onSelect: () => void;
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
    <Card className={`group relative overflow-hidden rounded-2xl border-border shadow-sm transition-all hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
      {/* Selection checkbox */}
      <button
        onClick={onSelect}
        className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
      >
        {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
      </button>

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
  selected,
  onSelect,
  onDelete,
  onRename,
  onArchive,
}: {
  meeting: Meeting;
  selected: boolean;
  onSelect: () => void;
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
    <div className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
      {/* Selection checkbox */}
      <button
        onClick={onSelect}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted"
      >
        {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
      </button>

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

export default function MeetingsPage() {
  return (
    <AuthGuard>
      <MeetingsContent />
    </AuthGuard>
  );
}
