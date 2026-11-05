"use client";

import { Navbar } from "@/components/layout/navbar";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AskPanel } from "@/components/ask/ask-panel";

const EXAMPLES = [
  "Маркетингийн баг ямар ажлууд хийхээр болсон бэ?",
  "Сүүлийн хурлуудад ямар шийдвэр гаргасан бэ?",
  "Хэнд ямар үүрэг даалгавар өгсөн бэ?",
  "Шийдэгдээгүй үлдсэн асуудлууд юу байна?",
];

export default function AskPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-6">
        <AskPanel examples={EXAMPLES} className="min-h-0 flex-1" />
      </main>
    </AuthGuard>
  );
}
