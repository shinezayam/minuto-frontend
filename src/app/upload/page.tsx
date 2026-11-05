"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Mic, FileAudio, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AudioLoadingAnimation } from "@/components/ui/audio-loading-animation";
import { api, friendlyError } from "@/lib/api";
import { AuthGuard } from "@/components/layout/auth-guard";

const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|opus|webm|flac|aac|mp4)$/i;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (selected: File) => {
    if (!selected.type.startsWith("audio/") && !AUDIO_EXT.test(selected.name)) {
      setError("Зөвхөн аудио файл оруулна уу (MP3, WAV, M4A, WebM)");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Файлын хэмжээ 100 MB-аас хэтрэхгүй байх ёстой");
      return;
    }
    setFile(selected);
    setError(null);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create meeting
      setUploadProgress(10);
      const meeting = await api.createMeeting(title || "Аудио бичлэг");

      setUploadProgress(30);
      await api.uploadAudio(meeting.id, file);

      setUploadProgress(70);
      // Боловсруулалт ард нь явна — хурлын хуудас явцыг харуулна
      try {
        setUploadProgress(90);
        await api.processMeeting(meeting.id);
        setUploadProgress(100);
        router.push(`/meetings/${meeting.id}`);
      } catch (err) {
        router.push(`/meetings/${meeting.id}?error=${encodeURIComponent(friendlyError(err))}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(friendlyError(err));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Аудио файл оруулах</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Аудио файлаа оруулж, AI-р бичвэр болон хурлын бичиг үүсгээрэй
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className={`flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                  isDragging ? "bg-primary/20 scale-110" : "bg-primary/10"
                }`}>
                  <Upload className={`h-10 w-10 transition-all ${isDragging ? "text-primary scale-110" : "text-primary"}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {isDragging ? "Тавиарай!" : "Аудио файл сонгох"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isDragging ? "Файлаа энд тавиарай" : "Файлаа чирж тавих эсвэл дарж сонгоно уу"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  MP3, WAV, M4A, WebM, OGG • Максимум 100 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.opus,.flac,.aac,.mp4"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            ) : (
              <div className="space-y-5">
                {/* File preview */}
                <div className="flex items-center gap-4 rounded-xl border border-border bg-gradient-to-r from-muted/50 to-muted/30 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileAudio className="h-6 w-6 text-primary" />
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
                    disabled={uploading}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Title input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Хурлын гарчиг
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Шинэ хурал"
                    disabled={uploading}
                  />
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {uploadProgress < 30 ? "Үүсгэж байна..." : uploadProgress < 70 ? "Хуулж байна..." : uploadProgress < 100 ? "Боловсруулж байна..." : "Дууслаа!"}
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={clearFile}
                    disabled={uploading}
                    className="rounded-full px-6"
                  >
                    Цуцлах
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {uploading ? (
                      <>
                        <AudioLoadingAnimation className="h-5 w-5" />
                        <span>Боловсруулж байна...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Оруулах
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info section */}
        <div className="mt-6 rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Дэмжигдсэн формат
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">🎵</span>
              MP3, WAV, M4A, WebM, OGG
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">📦</span>
              Максимум хэмжээ: 100 MB
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">🇲🇳</span>
              Монгол хэлний бичвэр
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">📝</span>
              Автомат хурлын бичиг
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
