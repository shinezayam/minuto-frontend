"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { AudioChunkData, ConnectionStatus, WSMessage } from "@/lib/types";

interface UseWebSocketReturn {
  status: ConnectionStatus;
  error: string | null;
  connect: (meetingId: string) => void;
  disconnect: () => void;
  sendAudioChunk: (chunk: AudioChunkData, mimeType: string) => void;
  lastAck: number | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [lastAck, setLastAck] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const meetingIdRef = useRef<string>("");
  const reconnectAttemptsRef = useRef(0);
  const pendingChunksRef = useRef<AudioChunkData[]>([]);
  const mimeTypeRef = useRef("");
  const connectRef = useRef<(meetingId: string) => void>(() => {});

  const intentionalDisconnectRef = useRef(false);
  const maxReconnectAttempts = 5;

  const processMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);
      switch (msg.type) {
        case "recording.ready":
          setStatus("connected");
          reconnectAttemptsRef.current = 0;
          break;
        case "audio.ack":
          setLastAck(msg.sequence as number);
          break;
        case "error":
          setError(`${msg.code}: ${msg.message}`);
          break;
      }
    } catch {
      // Binary messages or non-JSON — ignore
    }
  }, []);

  const flushPending = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    while (pendingChunksRef.current.length > 0) {
      const chunk = pendingChunksRef.current.shift()!;
      const meta = JSON.stringify({
        type: "audio.chunk",
        meeting_id: meetingIdRef.current,
        sequence: chunk.sequence,
        mime_type: mimeTypeRef.current,
        timestamp_ms: chunk.timestamp_ms,
      });
      ws.send(meta);
      chunk.blob.arrayBuffer().then((buffer) => {
        ws.send(buffer);
      });
    }
  }, []);

  const connect = useCallback(
    (meetingId: string) => {
      meetingIdRef.current = meetingId;
      intentionalDisconnectRef.current = false;
      reconnectAttemptsRef.current = 0;
      setError(null);
      setStatus("connecting");

      const url = api.getWsUrl(meetingId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        flushPending();
      };

      ws.onmessage = processMessage;

      ws.onclose = () => {
        // Don't reconnect if this was an intentional disconnect
        if (intentionalDisconnectRef.current) {
          setStatus("disconnected");
          return;
        }

        // Cap reconnect attempts to prevent infinite loops
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setStatus("disconnected");
          setError("Холболт тогтворгүй байна. Дахин оролдоно уу.");
          return;
        }

        if (meetingIdRef.current) {
          setStatus("reconnecting");
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connectRef.current(meetingIdRef.current);
          }, delay);
        } else {
          setStatus("disconnected");
        }
      };

      ws.onerror = () => {
        setError("WebSocket холболтод алдаа гарлаа");
      };
    },
    [processMessage, flushPending]
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    meetingIdRef.current = "";
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
    setLastAck(null);
    pendingChunksRef.current = [];
  }, []);

  const sendAudioChunk = useCallback(
    (chunk: AudioChunkData, mimeType: string) => {
      mimeTypeRef.current = mimeType;
      const ws = wsRef.current;

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pendingChunksRef.current.push(chunk);
        return;
      }

      const meta = JSON.stringify({
        type: "audio.chunk",
        meeting_id: meetingIdRef.current,
        sequence: chunk.sequence,
        mime_type: mimeType,
        timestamp_ms: chunk.timestamp_ms,
      });
      ws.send(meta);
      chunk.blob.arrayBuffer().then((buffer) => {
        ws.send(buffer);
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    lastAck,
  };
}
