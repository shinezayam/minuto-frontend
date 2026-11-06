"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { VocabularyCard } from "@/components/settings/vocabulary-card";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Тохиргоо</h1>
          </div>
          <VocabularyCard />
        </main>
      </AppShell>
    </AuthGuard>
  );
}
