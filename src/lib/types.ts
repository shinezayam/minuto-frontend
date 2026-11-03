export type MeetingStatus =
  | "draft"
  | "recording"
  | "paused"
  | "processing"
  | "completed"
  | "failed";

export interface Meeting {
  id: string;
  title: string;
  status: MeetingStatus;
  language: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingListResponse {
  meetings: Meeting[];
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  start_ms: number;
  end_ms: number;
  raw_text: string;
  edited_text: string | null;
  status: "provisional" | "final";
  sequence: number;
}

export type WSMessageType =
  | "recording.ready"
  | "audio.ack"
  | "audio.chunk"
  | "transcript.segment"
  | "processing.status"
  | "error";

export interface WSMessage {
  type: WSMessageType;
  [key: string]: unknown;
}

export interface WSAudioChunk {
  type: "audio.chunk";
  meeting_id: string;
  sequence: number;
  mime_type: string;
  timestamp_ms: number;
}

export interface WSAck {
  type: "audio.ack";
  sequence: number;
  meeting_id: string;
}

export interface WSError {
  type: "error";
  code: string;
  message: string;
}

export interface WSRecordingReady {
  type: "recording.ready";
  meeting_id: string;
}

export interface WSProcessingStatus {
  type: "processing.status";
  stage: string;
  queued_chunks: number;
}

export interface WSTranscriptSegment {
  type: "transcript.segment";
  segment_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  status: "provisional" | "final";
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export type RecordingStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export interface AudioChunkData {
  blob: Blob;
  sequence: number;
  timestamp_ms: number;
  duration_ms: number;
}
