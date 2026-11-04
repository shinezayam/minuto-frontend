"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AudioChunkData, ConnectionStatus, LiveSegment, WSMessage } from "@/lib/types";

interface UseWebSocketReturn {
  status: ConnectionStatus;
  error: string | null;
  connect: (meetingId: string) => void;
  disconnect: () => void;
  sendAudioChunk: (chunk: AudioChunkData, mimeType: string) => void;
  /** Бүх хэсэг сервер дээр баталгаажтал хүлээнэ. Хугацаа дуусвал false. */
  flush: (timeoutMs?: number) => Promise<boolean>;
  /** Сервер баталгаажуулсан хэсгийн тоо */
  ackedCount: number;
  /** Баталгаажаагүй (илгээх гэж буй) хэсгийн тоо */
  pendingCount: number;
  /** Хурлын үеэр серверээс ирж буй урьдчилсан бичвэр (цагийн дарааллаар) */
  liveSegments: LiveSegment[];
  /** Шууд бичвэр түр гарахгүй байгаа үед */
  liveError: string | null;
}

const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [ackedCount, setAckedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [liveSegments, setLiveSegments] = useState<LiveSegment[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const meetingIdRef = useRef("");
  const reconnectAttemptsRef = useRef(0);
  const intentionalDisconnectRef = useRef(false);
  const mimeTypeRef = useRef("");
  const connectRef = useRef<(meetingId: string) => void>(() => {});

  // Сервер баталгаажуулах хүртэл хэсгүүдийг хадгална — тасарвал дахин илгээнэ
  const unackedRef = useRef(new Map<number, AudioChunkData>());
  const ackedRef = useRef(new Set<number>());
  // meta (JSON) болон аудио (binary) хоёрыг яг дараалан илгээхийн тулд нэг promise гинжээр явуулна
  const sendChainRef = useRef<Promise<void>>(Promise.resolve());

  const syncCounts = useCallback(() => {
    setPendingCount(unackedRef.current.size);
    setAckedCount(ackedRef.current.size);
  }, []);

  const transmit = useCallback((chunk: AudioChunkData) => {
    sendChainRef.current = sendChainRef.current
      .then(async () => {
        // Аудиог эхлээд бэлдэж, дараа нь meta + binary-г хооронд нь юу ч оруулалгүй илгээнэ
        const buffer = await chunk.blob.arrayBuffer();
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return; // дахин холбогдоход илгээгдэнэ
        if (!unackedRef.current.has(chunk.sequence)) return; // энэ хооронд баталгаажсан
        ws.send(
          JSON.stringify({
            type: "audio.chunk",
            meeting_id: meetingIdRef.current,
            sequence: chunk.sequence,
            mime_type: mimeTypeRef.current,
            timestamp_ms: chunk.timestamp_ms,
          }),
        );
        ws.send(buffer);
      })
      .catch(() => {
        // Нэг хэсгийн алдаа гинжийг таслахгүй — баталгаажаагүй хэвээр үлдэж дахин илгээгдэнэ
      });
  }, []);

  const resendUnacked = useCallback(() => {
    [...unackedRef.current.values()]
      .sort((a, b) => a.sequence - b.sequence)
      .forEach(transmit);
  }, [transmit]);

  const processMessage = useCallback(
    (event: MessageEvent) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case "recording.ready":
          setStatus("connected");
          reconnectAttemptsRef.current = 0;
          break;
        case "audio.ack": {
          const seq = msg.sequence as number;
          unackedRef.current.delete(seq);
          ackedRef.current.add(seq);
          syncCounts();
          break;
        }
        case "transcript.segment": {
          const seg: LiveSegment = {
            id: msg.segment_id as string,
            start_ms: msg.start_ms as number,
            end_ms: msg.end_ms as number,
            text: msg.text as string,
          };
          // Дахин холбогдоход сервер бүх хэсгийг дахин илгээдэг — id-аар давхардлыг арилгана
          setLiveSegments((prev) =>
            prev.some((s) => s.id === seg.id)
              ? prev
              : [...prev, seg].sort((a, b) => a.start_ms - b.start_ms),
          );
          setLiveError(null);
          break;
        }
        case "transcript.error":
          setLiveError((msg.message as string) || "Шууд бичвэр түр гарахгүй байна");
          break;
        case "error":
          setError(`${msg.code}: ${msg.message}`);
          break;
      }
    },
    [syncCounts],
  );

  const connect = useCallback(
    (meetingId: string) => {
      if (meetingIdRef.current && meetingIdRef.current !== meetingId) {
        setLiveSegments([]);
      }
      meetingIdRef.current = meetingId;
      intentionalDisconnectRef.current = false;
      setError(null);
      setStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");

      const ws = new WebSocket(api.getWsUrl(meetingId));
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        setStatus("connected");
        setError(null);
        resendUnacked();
      };

      ws.onmessage = processMessage;

      ws.onclose = () => {
        // Хуучин (солигдсон) холболтын close-ыг тоохгүй
        if (wsRef.current !== ws) return;
        wsRef.current = null;

        if (intentionalDisconnectRef.current || !meetingIdRef.current) {
          setStatus("disconnected");
          return;
        }
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus("disconnected");
          setError("Сервертэй холболт тасарсан. Бичлэг таны төхөөрөмж дээр хадгалагдаж байна, интернэтээ шалгана уу.");
          return;
        }
        setStatus("reconnecting");
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => connectRef.current(meetingIdRef.current), delay);
      };

      ws.onerror = () => {
        setError("Сервертэй холбогдоход алдаа гарлаа. Дахин холбогдож байна...");
      };
    },
    [processMessage, resendUnacked],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const sendAudioChunk = useCallback(
    (chunk: AudioChunkData, mimeType: string) => {
      if (mimeType) mimeTypeRef.current = mimeType;
      unackedRef.current.set(chunk.sequence, chunk);
      syncCounts();
      transmit(chunk); // холболтгүй бол onopen дээр дахин илгээгдэнэ
    },
    [syncCounts, transmit],
  );

  const flush = useCallback(async (timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs;
    while (unackedRef.current.size > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return unackedRef.current.size === 0;
  }, []);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    meetingIdRef.current = "";
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
    setStatus("disconnected");
    unackedRef.current.clear();
    ackedRef.current.clear();
    sendChainRef.current = Promise.resolve();
    syncCounts();
  }, [syncCounts]);

  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return {
    status,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    flush,
    ackedCount,
    pendingCount,
    liveSegments,
    liveError,
  };
}
