"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Mic, FileAudio, X, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";
import { api, friendlyError } from "@/lib/api";
import { AuthGuard } from "@/components/layout/auth-guard";

const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|opus|webm|flac|aac|mp4)$/i;

export default function UploadPage() {
  return (
    <AuthGuard>
      <UploadContent />
    </AuthGuard>
  );
}

function UploadContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("audio/") && !AUDIO_EXT.test(selected.name)) {
        setError("Зөвхөн аудио файл оруулна уу");
        return;
      }
      setFile(selected);
      setError(null);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Create meeting
      const meeting = await api.createMeeting(title || "Аудио бичлэг");

      await api.uploadAudio(meeting.id, file);

      // Боловсруулалт ард нь явна — хурлын хуудас явцыг харуулна
      try {
        await api.processMeeting(meeting.id);
        router.push(`/meetings/${meeting.id}`);
      } catch (err) {
        router.push(`/meetings/${meeting.id}?error=${encodeURIComponent(friendlyError(err))}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(friendlyError(err));
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Аудио файл оруулах</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Аудио файлаа оруулж, AI-р бичвэр үүсгээрэй
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {!file ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Аудио файл сонгох</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  MP3, WAV, M4A, WebM форматуудыг дэмжинэ
                </p>
                <label className="mt-6 cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground">
                    <FileAudio className="h-4 w-4" />
                    Файл сонгох
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileAudio className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Хурлын гарчиг
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Шинэ хурал"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={clearFile}
                    disabled={uploading}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 gap-2"
                  >
                    {uploading ? (
                      <>
                        <AudioLoadingAnimation className="h-6 w-6" />
                        <span>Боловсруулж байна...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload хийх
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Дэмжигдсэн формат</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• MP3, WAV, M4A, WebM, OGG</li>
            <li>• Максимум хэмжээ: 100 MB</li>
            <li>• Монгол хэлний бичвэр автоматаар үүснэ</li>
          </ul>
        </div>
      </main>
    </>
  );
}
