"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupportedMimeType } from "@/lib/audio-utils";
import type { AudioChunkData, RecordingStatus } from "@/lib/types";

const CHUNK_DURATION_MS = 3000;

/** "mic" — зөвхөн микрофон. "meeting" — онлайн хурлын таб/системийн дуу (+ сонголтоор микрофон). */
export type CaptureSource = "mic" | "meeting";

export interface CaptureOptions {
  source: CaptureSource;
  /** "meeting" үед өөрийн микрофоныг нийлүүлэх эсэх */
  includeMic?: boolean;
}

interface UseAudioCaptureReturn {
  status: RecordingStatus;
  error: string | null;
  /** Амжилттай эхэлбэл true. Хэрэглэгч цуцалсан/алдаа гарвал false (error-д шалтгаан). */
  startCapture: (options?: CaptureOptions) => Promise<boolean>;
  pauseCapture: () => void;
  resumeCapture: () => void;
  /** Сүүлийн хэсгийг onChunk-оор гаргаж дуусахыг хүлээгээд бүх эх үүсвэрийг хаана */
  stopCapture: () => Promise<void>;
  /** Түр зогсоосон хугацааг хасаад бичсэн хугацаа (таб далд байхад ч зөв) */
  elapsedMs: () => number;
  /** Хэрэглэгч хурлын табыг хуваалцахаа зогсоосон (Chrome-ийн "Stop sharing") */
  sourceEnded: boolean;
  audioLevel: number;
  mimeType: string;
}

export function isMeetingCaptureSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
}

const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

function captureErrorMessage(err: unknown, source: CaptureSource): string {
  if (err instanceof DOMException && err.name === "NotAllowedError") {
    return source === "meeting"
      ? "Хуваалцахыг цуцалсан эсвэл зөвшөөрөл олгоогүй байна. Дахин оролдоно уу."
      : "Микрофон руу хандах зөвшөөрөл олгогдсонгүй. Браузерын тохиргооноос микрофон зөвшөөрлийг идэвхжүүлнэ үү.";
  }
  if (err instanceof DOMException && err.name === "NotFoundError") {
    return "Микрофон олдсонгүй.";
  }
  return err instanceof Error ? err.message : "Дуу авахад алдаа гарлаа";
}

export function useAudioCapture(
  onChunk: (chunk: AudioChunkData) => void
): UseAudioCaptureReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [sourceEnded, setSourceEnded] = useState(false);

  // Хаах шаардлагатай бүх MediaStream (микрофон, дэлгэц хуваалцах)
  const streamsRef = useRef<MediaStream[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sequenceRef = useRef(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const accumulatedPauseRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const onChunkRef = useRef(onChunk);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const releaseAll = useCallback(() => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    analyserRef.current = null;
  }, []);

  const startCapture = useCallback(
    async (options: CaptureOptions = { source: "mic" }) => {
      const { source, includeMic = true } = options;
      setError(null);
      setSourceEnded(false);
      setStatus("requesting");

      try {
        const supportedType = getSupportedMimeType();
        if (!supportedType) throw new Error("Энэ браузер дуу бичихийг дэмжихгүй байна");
        if (source === "meeting" && !isMeetingCaptureSupported()) {
          throw new Error("Энэ браузер табын дуу хуваалцахыг дэмжихгүй. Chrome эсвэл Edge ашиглана уу.");
        }

        // Эх үүсвэр бүрийг нэг "destination" руу нийлүүлж, түүнийгээ бичнэ
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        if (source === "meeting") {
          // Хэрэглэгчийн товч дарснаас хойш удалгүй дуудах ёстой (transient activation)
          const display = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Chrome видеогүйгээр зөвшөөрдөггүй — бичихгүй, зөвхөн дууг авна
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
            // Chrome-ийн нэмэлт сонголтууд: системийн дууг санал болгох, өөрийн табыг жагсаалтаас нуух
            systemAudio: "include",
            selfBrowserSurface: "exclude",
            preferCurrentTab: false,
          } as DisplayMediaStreamOptions);
          streamsRef.current.push(display);

          const audioTracks = display.getAudioTracks();
          if (audioTracks.length === 0) {
            throw new Error(
              "Дуу хуваалцагдаагүй байна. Хурлын табыг сонгохдоо \"Also share tab audio\" (бүтэн дэлгэц бол \"Share system audio\")-г асаана уу.",
            );
          }
          // Хэрэглэгч "Stop sharing" дарвал мэдэгдэнэ
          audioTracks[0].addEventListener("ended", () => setSourceEnded(true));
          audioContext.createMediaStreamSource(new MediaStream(audioTracks)).connect(destination);

          if (includeMic) {
            try {
              const mic = await navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS });
              streamsRef.current.push(mic);
              audioContext.createMediaStreamSource(mic).connect(destination);
            } catch (err) {
              // Микрофонгүй ч хурлын дууг бичсээр байна
              console.warn("Microphone unavailable, recording meeting audio only:", err);
            }
          }
        } else {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS });
          streamsRef.current.push(mic);
          audioContext.createMediaStreamSource(mic).connect(destination);
        }

        if (audioContext.state === "suspended") await audioContext.resume();

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioContext.createMediaStreamSource(destination.stream).connect(analyser);
        analyserRef.current = analyser;

        // requestAnimationFrame нь таб далд үед зогсдог (хэрэглэгч хурлын таб дээр байна) тул interval ашиглана
        const levels = new Uint8Array(analyser.frequencyBinCount);
        levelTimerRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(levels);
          const avg = levels.reduce((sum, val) => sum + val, 0) / levels.length;
          setAudioLevel(avg / 255);
        }, 100);

        setMimeType(supportedType);
        const recorder = new MediaRecorder(destination.stream, { mimeType: supportedType });
        recorderRef.current = recorder;

        sequenceRef.current = 0;
        startTimeRef.current = Date.now();
        accumulatedPauseRef.current = 0;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const elapsed = Date.now() - startTimeRef.current - accumulatedPauseRef.current;
            const chunk: AudioChunkData = {
              blob: event.data,
              sequence: sequenceRef.current,
              timestamp_ms: elapsed,
              duration_ms: CHUNK_DURATION_MS,
            };
            sequenceRef.current += 1;
            onChunkRef.current(chunk);
          }
        };

        recorder.start(CHUNK_DURATION_MS);
        setStatus("recording");
        return true;
      } catch (err) {
        releaseAll();
        setError(captureErrorMessage(err, source));
        setStatus("error");
        return false;
      }
    },
    [releaseAll],
  );

  const pauseCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.pause();
      pausedAtRef.current = Date.now();
      setStatus("paused");
    }
  }, []);

  const resumeCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "paused") {
      recorderRef.current.resume();
      accumulatedPauseRef.current += Date.now() - pausedAtRef.current;
      setStatus("recording");
    }
  }, []);

  const elapsedMs = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || !startTimeRef.current) return 0;
    const end = recorder.state === "paused" ? pausedAtRef.current : Date.now();
    return Math.max(0, end - startTimeRef.current - accumulatedPauseRef.current);
  }, []);

  const stopCapture = useCallback(async () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      // stop() дуудсаны дараа MediaRecorder сүүлийн хэсгээ dataavailable-аар гаргаад, дараа нь "stop" event өгнө.
      // Тэр хэсгийг алдахгүйн тулд "stop"-ийг хүлээнэ.
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
    }
    recorderRef.current = null;
    releaseAll();
    setAudioLevel(0);
    setStatus("stopped");
  }, [releaseAll]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      releaseAll();
    };
  }, [releaseAll]);

  return {
    status,
    error,
    startCapture,
    pauseCapture,
    resumeCapture,
    stopCapture,
    elapsedMs,
    sourceEnded,
    audioLevel,
    mimeType,
  };
}
