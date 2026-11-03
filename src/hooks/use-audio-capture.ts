"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupportedMimeType } from "@/lib/audio-utils";
import type { AudioChunkData, RecordingStatus } from "@/lib/types";

const CHUNK_DURATION_MS = 3000;

interface UseAudioCaptureReturn {
  status: RecordingStatus;
  error: string | null;
  startCapture: () => Promise<void>;
  pauseCapture: () => void;
  resumeCapture: () => void;
  stopCapture: () => void;
  audioLevel: number;
  mimeType: string;
}

export function useAudioCapture(
  onChunk: (chunk: AudioChunkData) => void
): UseAudioCaptureReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mimeType, setMimeType] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sequenceRef = useRef(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const accumulatedPauseRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const onChunkRef = useRef(onChunk);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const startCapture = useCallback(async () => {
    setError(null);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);

      const supportedType = getSupportedMimeType();
      if (!supportedType) {
        throw new Error("No supported audio format found in this browser");
      }
      setMimeType(supportedType);

      const recorder = new MediaRecorder(stream, {
        mimeType: supportedType,
      });
      recorderRef.current = recorder;

      sequenceRef.current = 0;
      startTimeRef.current = Date.now();
      accumulatedPauseRef.current = 0;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const now = Date.now();
          const elapsed = now - startTimeRef.current - accumulatedPauseRef.current;
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
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Микрофон руу хандах зөвшөөрөл олгдсонгүй. Браузерын тохиргооноос микрофон зөвшөөрлийг идэвхжүүлнэ үү."
          : err instanceof Error
            ? err.message
            : "Микрофон руу хандахад алдаа гарлаа";
      setError(message);
      setStatus("error");
    }
  }, []);

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

  const stopCapture = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setStatus("stopped");
  }, []);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    status,
    error,
    startCapture,
    pauseCapture,
    resumeCapture,
    stopCapture,
    audioLevel,
    mimeType,
  };
}
