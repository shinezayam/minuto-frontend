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
  /** queued → transcribing → summarizing → done | failed */
  processing_stage: "queued" | "transcribing" | "summarizing" | "done" | "failed" | null;
  processing_done: number;
  processing_total: number;
  /** "CODE: тайлбар" */
  processing_error: string | null;
  /** Хэрэглэгчийн оруулсан оролцогчид */
  participants: string[];
}

/** Хэрэглэгчийн өмнө нь оруулсан оролцогч (дараагийн хуралд дахин бичихгүй сонгоно) */
export interface Contact {
  id: string;
  name: string;
}

/** Сегмент доторх нэг хүний яриа */
export interface SpeakerTurn {
  /** "Яригч 1" эсвэл тодорхой бол нэр */
  speaker: string | null;
  text: string;
}

export interface MeetingListResponse {
  meetings: Meeting[];
}

/** Backend-ийн бичвэрийн хэсэг */
export interface TranscriptSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  speaker?: string | null;
  turns?: SpeakerTurn[];
}

export interface QAPair {
  question: string;
  asked_by?: string | null;
  /** Хариулаагүй бол null */
  answer?: string | null;
  answered_by?: string | null;
  source_segment_ids?: string[];
}

export interface MeetingMinutes {
  title: string;
  summary: string;
  topics: Array<{ title: string; description: string; source_segment_ids?: string[] }>;
  decisions: Array<{ text: string; rationale?: string | null; source_segment_ids?: string[] }>;
  action_items: Array<{ task: string; owner?: string | null; due_date?: string | null; source_segment_ids?: string[] }>;
  open_questions?: Array<{ text: string; source_segment_ids?: string[] }>;
  /** Ярьсан хүмүүс ("Яригч 1"... эсвэл нэр) */
  participants?: string[];
  qa?: QAPair[];
  /** "Minuto / <хөтлөгчийн нэр>" */
  prepared_by?: string | null;
}

export type WSMessageType =
  | "recording.ready"
  | "audio.ack"
  | "audio.chunk"
  | "transcript.segment"
  | "processing.status"
  | "transcript.error"
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

/** Хурлын үеэр харуулах урьдчилсан бичвэр (хурал дууссаны дараа бүтэн бичвэрээр солигдоно) */
export interface LiveSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export type RecordingStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export interface AudioChunkData {
  blob: Blob;
  sequence: number;
  timestamp_ms: number;
  duration_ms: number;
}

// ---------- Ask Minuto ----------

/** Хариултын эх сурвалж — бичвэрийн тодорхой хэсэг, цаг */
export interface AskCitation {
  /** Хариулт дахь "[S12]" шошго */
  ref: string;
  meeting_id: string;
  meeting_title: string;
  segment_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface AskResponse {
  answer: string;
  citations: AskCitation[];
  meetings_searched: number;
}

export interface AskMessage {
  role: "user" | "assistant";
  content: string;
}
