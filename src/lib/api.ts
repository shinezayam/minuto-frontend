import type {
  Contact,
  AskMessage,
  AskResponse,
  Meeting,
  MeetingListResponse,
  MeetingMinutes,
  TranscriptSegment,
  VocabularyTerm,
} from "./types";
import { getToken, handleUnauthorized, type AuthUser } from "./auth";

/** Backend-ийн хаяг. Production build-д NEXT_PUBLIC_API_BASE_URL заавал тохируулна. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`API ${status}: ${detail}`);
  }
}

/** Backend-ийн "CODE: тайлбар" алдааг хэрэглэгчид ойлгомжтой монгол мессеж болгоно. */
export function friendlyErrorText(detail: string | null | undefined): string {
  const d = detail || "";
  if (d.startsWith("NO_SPEECH")) return "Бичлэгээс яриа танигдсангүй. Микрофон ойр байгаа эсэхийг шалгана уу.";
  if (d.startsWith("NO_AUDIO")) return "Аудио бичлэг олдсонгүй. Сервер дахин эхэлсэн бол бичлэгээ дахин оруулна уу.";
  if (d.startsWith("ASR_FAILED")) return "Яриаг текст болгоход алдаа гарлаа. Дахин оролдоно уу.";
  if (d.startsWith("SUMMARY_FAILED")) return "Бичвэр бэлэн боллоо, гэхдээ хурлын бичиг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.";
  if (d.startsWith("INTERRUPTED")) return "Сервер дахин эхэлсэн тул боловсруулалт тасарсан. Дахин оролдоно уу.";
  if (d.startsWith("ALREADY_PROCESSING")) return "Энэ хурлыг боловсруулж байна.";
  if (d.startsWith("INVALID_CREDENTIALS")) return "Имэйл эсвэл нууц үг буруу байна.";
  if (d.startsWith("EMAIL_TAKEN")) return "Энэ имэйлээр бүртгэл үүссэн байна. Нэвтэрнэ үү.";
  if (d.startsWith("REGISTRATION_CLOSED")) return "Шинэ бүртгэл хаалттай байна.";
  if (d.startsWith("NO_MINUTES")) return "Хурлын бичиг үүсээгүй байна. Хурлыг нээж боловсруулалтын алдааг шалгаад дахин боловсруулна уу.";
  if (d.startsWith("ASK_FAILED")) return "AI хариулт өгч чадсангүй. Түр хүлээгээд дахин асууна уу.";
  if (d.startsWith("INVALID_AUDIO")) return "Аудио файл гэмтсэн эсвэл дутуу байна. Файлаа тоглуулж шалгаад дахин оруулна уу.";
  if (d.startsWith("INTERNAL_ERROR")) return "Серверт алдаа гарлаа. Дахин оролдоно уу.";
  return d.replace(/^[A-Z_]+:\s*/, "") || "Тодорхойгүй алдаа";
}

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422 && err.detail.startsWith("[")) return "Оруулсан мэдээлэл буруу байна. Имэйл зөв, нууц үг 8+ тэмдэгт байх ёстой.";
    if (err.status === 404 && !err.detail.startsWith("NO_MINUTES")) return "Хурал олдсонгүй.";
    return friendlyErrorText(err.detail) || `Серверийн алдаа (${err.status})`;
  }
  if (err instanceof TypeError) return "Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгана уу. (Сервер унтсан бол 1 минут орчим хүлээнэ үү.)";
  return err instanceof Error ? err.message : "Тодорхойгүй алдаа";
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      if (typeof json.detail === "string") detail = json.detail;
      else if (json.detail) detail = JSON.stringify(json.detail);
    } catch {
      // JSON биш хариу — текстээр нь үлдээнэ
    }
    if (res.status === 401 && !path.startsWith("/api/auth/")) handleUnauthorized();
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Header явуулж чаддаггүй хүсэлтүүдэд (<audio src>, татах линк, WebSocket) токенийг query-д нэмнэ. */
function withToken(url: string): string {
  const token = getToken();
  return token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;
}

type AuthResponse = { token: string; user: AuthUser };

export const api = {
  health: () => request<{ status: string; version: string; live_transcription?: boolean }>("/api/health"),

  // ---------- Нэвтрэлт ----------
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name: name?.trim() || null }),
    }),

  /** Хэрэглэгчийн нэр — хурлын тэмдэглэлд "Хөтөлсөн: Minuto / нэр" гэж гарна */
  updateMe: (name: string) =>
    request<AuthUser>("/api/auth/me", { method: "PATCH", body: JSON.stringify({ name }) }),

  // ---------- Байнгын оролцогчид ----------
  listContacts: () => request<{ contacts: Contact[] }>("/api/contacts"),

  deleteContact: (id: string) => request<void>(`/api/contacts/${id}`, { method: "DELETE" }),

  // ---------- Толь бичиг ----------

  listVocabulary: () => request<{ terms: VocabularyTerm[] }>("/api/vocabulary"),

  addVocabulary: (term: string, wrong?: string) =>
    request<VocabularyTerm>("/api/vocabulary", {
      method: "POST",
      body: JSON.stringify({ term, wrong: wrong || null }),
    }),

  deleteVocabulary: (id: string) => request<void>(`/api/vocabulary/${id}`, { method: "DELETE" }),

  // ---------- Хурал ----------
  createMeeting: (title?: string, participants: string[] = []) =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title: title || "Шинэ хурал", participants }),
    }),

  listMeetings: (includeArchived: boolean = false) => request<MeetingListResponse>(`/api/meetings?include_archived=${includeArchived}`),

  getMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}`),

  updateMeeting: (id: string, data: { title?: string; participants?: string[] }) =>
    request<Meeting>(`/api/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  startMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/start`, { method: "POST" }),

  pauseMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/pause`, { method: "POST" }),

  resumeMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/resume`, { method: "POST" }),

  endMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/end`, { method: "POST" }),

  deleteMeeting: (id: string) => request<void>(`/api/meetings/${id}`, { method: "DELETE" }),

  archiveMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/archive`, { method: "POST" }),

  unarchiveMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}/unarchive`, { method: "POST" }),

  uploadAudio: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ meeting_id: string; size_bytes: number }>(`/api/meetings/${id}/upload`, {
      method: "POST",
      body: form,
    });
  },

  /** Боловсруулалтыг ард нь эхлүүлнэ. Явцыг getMeeting()-ээр (processing_*) харна. */
  processMeeting: (id: string) =>
    request<{ meeting_id: string; status: string }>(`/api/meetings/${id}/process`, { method: "POST" }),

  getTranscript: (id: string) =>
    request<{ meeting_id: string; segments: TranscriptSegment[] }>(`/api/meetings/${id}/transcript`),

  /** Бичвэрийн сегментүүдийг засварлах */
  updateTranscript: (id: string, segments: Array<{ id: string; text?: string; speaker?: string }>) =>
    request<{ meeting_id: string; segments: TranscriptSegment[] }>(`/api/meetings/${id}/transcript`, {
      method: "PUT",
      body: JSON.stringify({ segments }),
    }),

  /** Буруу танигдсан үгийг бичвэр (include_minutes үед хурлын бичиг)-ийн бүх газарт засна */
  replaceInTranscript: (
    id: string,
    body: {
      find: string;
      replace: string;
      whole_word?: boolean;
      case_sensitive?: boolean;
      include_minutes?: boolean;
      /** Засварыг толь бичигт хадгалж, дараагийн хурлуудад автоматаар засна (default: true) */
      remember?: boolean;
    },
  ) =>
    request<{
      meeting_id: string;
      replaced: number;
      minutes_replaced: number;
      remembered?: boolean;
      segments: TranscriptSegment[];
    }>(
      `/api/meetings/${id}/transcript/replace`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  /** Хурлын бичиг үүсээгүй бол null */
  getMinutes: async (id: string): Promise<MeetingMinutes | null> => {
    try {
      return await request<MeetingMinutes>(`/api/meetings/${id}/minutes`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** Зөвхөн summary-г дахин үүсгэнэ */
  regenerateSummary: (id: string) =>
    request<{ meeting_id: string; summary: string }>(`/api/meetings/${id}/regenerate-summary`, {
      method: "POST",
    }),

  /** Action items-г update хийх */
  updateActionItems: (id: string, actionItems: Array<Record<string, unknown>>) =>
    request<{ meeting_id: string; action_items: Array<Record<string, unknown>> }>(
      `/api/meetings/${id}/action-items`,
      {
        method: "PUT",
        body: JSON.stringify({ action_items: actionItems }),
      }
    ),

  /** Сэдвүүд үүсгэх */
  generateTopics: (id: string) =>
    request<{
      meeting_id: string;
      topics: Array<{
        title: string;
        description: string;
        start_ms: number;
        end_ms: number;
        segment_ids: string[];
      }>;
    }>(`/api/meetings/${id}/topics`, { method: "POST" }),

  /** Ask Minuto — meetingId өгвөл зөвхөн тэр хурлаас, үгүй бол бүх хурлаас асууна */
  ask: (question: string, meetingId?: string, history: AskMessage[] = [], filters?: {
    date_from?: string;
    date_to?: string;
    meeting_ids?: string[];
    participant?: string;
  }) =>
    request<AskResponse>("/api/ask", {
      method: "POST",
      body: JSON.stringify({
        question,
        meeting_id: meetingId ?? null,
        history,
        ...filters,
      }),
    }),

  audioUrl: (id: string) => withToken(`${API_BASE}/api/meetings/${id}/audio`),

  exportDocxUrl: (id: string) => withToken(`${API_BASE}/api/meetings/${id}/export.docx`),

  /** Бүх template жагсаах */
  listTemplates: () =>
    request<Array<{
      id: string;
      name: string;
      description: string | null;
      icon: string;
      sections: string[];
      custom_prompt: string | null;
      is_default: boolean;
      owner_id: string | null;
    }>>("/api/templates"),

  /** Шинэ template үүсгэх */
  createTemplate: (data: {
    name: string;
    description?: string;
    icon?: string;
    sections?: string[];
    custom_prompt?: string;
  }) =>
    request<{
      id: string;
      name: string;
      description: string | null;
      icon: string;
      sections: string[];
      custom_prompt: string | null;
      is_default: boolean;
      owner_id: string | null;
    }>("/api/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Template устгах */
  deleteTemplate: (id: string) =>
    request<void>(`/api/templates/${id}`, { method: "DELETE" }),

  /** Бүх workspace жагсаах */
  listWorkspaces: () =>
    request<Array<{
      id: string;
      name: string;
      description: string | null;
      workspace_type: string;
      owner_id: string;
      role: string;
    }>>("/api/workspaces"),

  /** Шинэ workspace үүсгэх */
  createWorkspace: (data: { name: string; description?: string }) =>
    request<{
      id: string;
      name: string;
      description: string | null;
      workspace_type: string;
      owner_id: string;
      role: string;
    }>("/api/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Workspace-ийн гишүүд жагсаах */
  listWorkspaceMembers: (workspaceId: string) =>
    request<Array<{
      user_id: string;
      email: string;
      name: string | null;
      role: string;
      joined_at: string | null;
    }>>(`/api/workspaces/${workspaceId}/members`),

  /** Гишүүн урих */
  inviteWorkspaceMember: (workspaceId: string, email: string, role: string = "viewer") =>
    request<{
      user_id: string;
      email: string;
      name: string | null;
      role: string;
    }>(`/api/workspaces/${workspaceId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  /** Гишүүн хасах */
  removeWorkspaceMember: (workspaceId: string, userId: string) =>
    request<void>(`/api/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" }),

  /** Workspace-ийн project-ууд жагсаах */
  listProjects: (workspaceId: string) =>
    request<Array<{
      id: string;
      name: string;
      description: string | null;
      color: string;
      workspace_id: string;
    }>>(`/api/workspaces/${workspaceId}/projects`),

  /** Project үүсгэх */
  createProject: (workspaceId: string, data: { name: string; description?: string; color?: string }) =>
    request<{
      id: string;
      name: string;
      description: string | null;
      color: string;
      workspace_id: string;
    }>(`/api/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Project устгах */
  deleteProject: (workspaceId: string, projectId: string) =>
    request<void>(`/api/workspaces/${workspaceId}/projects/${projectId}`, { method: "DELETE" }),

  /** DOCX-ийг татна. Хурлын бичиг үүсээгүй бол серверийн JSON-ийг харуулахын оронд алдаа шиднэ. */
  downloadDocx: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/meetings/${id}/export.docx`, { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) handleUnauthorized();
      throw new ApiError(
        res.status,
        res.status === 404 ? "NO_MINUTES: Хурлын бичиг үүсээгүй байна" : await res.text(),
      );
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting_${id}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },

  /** PDF-ийг татна. */
  downloadPdf: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/meetings/${id}/export.pdf`, { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) handleUnauthorized();
      throw new ApiError(
        res.status,
        res.status === 404 ? "NO_MINUTES: Хурлын бичиг үүсээгүй байна" : await res.text(),
      );
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },

  getWsUrl: (meetingId: string) => withToken(`${API_BASE.replace(/^http/, "ws")}/ws/meetings/${meetingId}/audio`),
};
