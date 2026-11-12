"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Circle,
  Clock,
  Users,
  Filter,
  Search,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api, friendlyError } from "@/lib/api";
import { AuthGuard } from "@/components/layout/auth-guard";
import { formatDate } from "@/lib/audio-utils";
import type { Meeting, MeetingMinutes } from "@/lib/types";

interface ActionItemWithMeeting {
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  task: string;
  owner: string | null;
  due_date: string | null;
  status: string;
  source_segment_ids?: string[];
}

type FilterType = "all" | "open" | "done" | "overdue" | "my";

export default function ActionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<ActionItemWithMeeting[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadActionItems();
  }, []);

  const loadActionItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all meetings
      const meetingsRes = await api.listMeetings(false);
      const meetings = meetingsRes.meetings.filter((m) => m.status === "completed");

      // Get minutes for each meeting and extract action items
      const items: ActionItemWithMeeting[] = [];
      for (const meeting of meetings) {
        try {
          const minutes = await api.getMinutes(meeting.id);
          if (minutes?.action_items) {
            for (const item of minutes.action_items) {
              items.push({
                meeting_id: meeting.id,
                meeting_title: meeting.title,
                meeting_date: meeting.created_at,
                task: item.task,
                owner: item.owner || null,
                due_date: item.due_date || null,
                status: item.status || "open",
                source_segment_ids: item.source_segment_ids,
              });
            }
          }
        } catch {
          // Skip meetings without minutes
        }
      }
      setActionItems(items);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item: ActionItemWithMeeting, index: number) => {
    const newStatus = item.status === "done" ? "open" : "done";
    
    // Update local state immediately
    const updated = [...actionItems];
    updated[index] = { ...updated[index], status: newStatus };
    setActionItems(updated);

    // Update backend
    try {
      const minutes = await api.getMinutes(item.meeting_id);
      if (minutes?.action_items) {
        const updatedItems = minutes.action_items.map((ai, i) => {
          if (ai.task === item.task && ai.owner === item.owner) {
            return { ...ai, status: newStatus };
          }
          return ai;
        });
        await api.updateActionItems(item.meeting_id, updatedItems);
      }
    } catch (err) {
      setError(friendlyError(err));
      // Revert on error
      setActionItems(actionItems);
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "done") return false;
    const due = new Date(dueDate);
    return due < new Date();
  };

  const filteredItems = actionItems.filter((item) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.task.toLowerCase().includes(query) &&
        !item.meeting_title.toLowerCase().includes(query) &&
        !(item.owner || "").toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    switch (filter) {
      case "open":
        return item.status !== "done";
      case "done":
        return item.status === "done";
      case "overdue":
        return isOverdue(item.due_date, item.status);
      default:
        return true;
    }
  });

  const stats = {
    total: actionItems.length,
    open: actionItems.filter((i) => i.status !== "done").length,
    done: actionItems.filter((i) => i.status === "done").length,
    overdue: actionItems.filter((i) => isOverdue(i.due_date, i.status)).length,
  };

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Даалгаврууд</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Бүх хурлын даалгавруудыг нэг дор харна уу
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-muted-foreground">Нийт</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-muted-foreground">Хүлээгдэж буй</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.open}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-muted-foreground">Дууссан</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.done}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-muted-foreground">Хугацаа хэтэрсэн</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">{stats.overdue}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-full border-border/60 pl-10 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "open", "done", "overdue"] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="rounded-full h-11 px-5 text-sm font-medium"
                >
                  {f === "all" && "Бүгд"}
                  {f === "open" && "Хүлээгдэж буй"}
                  {f === "done" && "Дууссан"}
                  {f === "overdue" && "Хугацаа хэтэрсэн"}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : actionItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Даалгавар алга"
              description="Хурлуудад даалгавар үүсгэгдэхэд энд харагдана."
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Илэрц олдсонгүй"
              description="Хайлтын өөр түлхүүр үг эсвэл шүүлтүүр ашиглана уу"
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {filteredItems.map((item, index) => (
                    <li
                      key={`${item.meeting_id}-${index}`}
                      className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${
                        item.status === "done" ? "bg-green-50/50 dark:bg-green-950/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleStatus(item, index)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          item.status === "done"
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-muted-foreground/40 hover:border-primary"
                        }`}
                      >
                        {item.status === "done" && <CheckCircle className="h-3 w-3" />}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-medium ${
                            item.status === "done"
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          {item.task}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {/* Meeting link */}
                          <Link
                            href={`/meetings/${item.meeting_id}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {item.meeting_title}
                          </Link>
                          {/* Owner */}
                          {item.owner && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {item.owner}
                            </span>
                          )}
                          {/* Due date */}
                          {item.due_date && (
                            <span
                              className={`flex items-center gap-1 ${
                                isOverdue(item.due_date, item.status)
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {item.due_date}
                            </span>
                          )}
                          {/* Meeting date */}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.meeting_date)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </main>
      </AppShell>
    </AuthGuard>
  );
}
