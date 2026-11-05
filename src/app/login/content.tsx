"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Mic } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, friendlyError } from "@/lib/api";
import { setAuth, useAuth } from "@/lib/auth";

/** Зөвхөн сайт доторх хаяг руу буцаана (open redirect-ээс сэргийлнэ) */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/dashboard";
}

export default function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const user = useAuth();

  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Аль хэдийн нэвтэрсэн бол шууд үргэлжлүүлнэ
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Нууц үг дор хаяж 8 тэмдэгт байх ёстой.");
      return;
    }
    setBusy(true);
    try {
      const res = mode === "login" ? await api.login(email, password) : await api.register(email, password);
      setAuth(res);
      router.replace(next);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin ? "Хурлуудаа үзэхийн тулд нэвтэрнэ үү." : "Шинэ бүртгэл үүсгэнэ үү."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Имэйл</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Нууц үг</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
                {!isLogin && <p className="text-xs text-muted-foreground">Дор хаяж 8 тэмдэгт</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="h-10 w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Бүртгэлгүй юу? " : "Бүртгэлтэй юу? "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode(isLogin ? "register" : "login");
                  setError(null);
                }}
              >
                {isLogin ? "Бүртгүүлэх" : "Нэвтрэх"}
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
