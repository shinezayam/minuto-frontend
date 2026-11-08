"use client";

import { useState } from "react";
import { Calendar, Filter, Users, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AskPanel } from "@/components/ask/ask-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXAMPLES = [
  "Маркетингийн баг ямар ажлууд хийхээр болсон бэ?",
  "Сүүлийн хурлуудад ямар шийдвэр гаргасан бэ?",
  "Хэнд ямар үүрэг даалгавар өгсөн бэ?",
  "Шийдэгдээгүй үлдсэн асуудлууд юу байна?",
];

interface Filters {
  date_from?: string;
  date_to?: string;
  participant?: string;
}

export default function AskPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const hasActiveFilters = filters.date_from || filters.date_to || filters.participant;

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-6">
          {/* Filter toggle */}
          <div className="mb-3 flex items-center gap-2">
            <Button
              variant={showFilters || hasActiveFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Шүүлтүүр
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px]">
                  ✓
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
                Цэвэрлэх
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Эхлэх огноо
                  </label>
                  <Input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Дуусах огноо
                  </label>
                  <Input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                    className="h-9"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Оролцогч
                  </label>
                  <Input
                    type="text"
                    placeholder="Жишээ: Бат, Гүрдаваа..."
                    value={filters.participant || ""}
                    onChange={(e) => setFilters({ ...filters, participant: e.target.value || undefined })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          )}

          <AskPanel
            examples={EXAMPLES}
            filters={filters}
            className="min-h-0 flex-1"
          />
        </main>
      </AppShell>
    </AuthGuard>
  );
}
