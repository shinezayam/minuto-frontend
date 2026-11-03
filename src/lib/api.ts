import type { Meeting, MeetingListResponse } from "./types";

/** Backend-ийн хаяг. Production build-д NEXT_PUBLIC_API_BASE_URL заавал тохируулна. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`API ${status}: ${detail}`);
  }
}

/** Backend-ийн алдааг хэрэглэгчид ойлгомжтой монгол мессеж болгоно. */
export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.detail;
    if (d.startsWith("NO_SPEECH")) return "Бичлэгээс яриа танигдсангүй. Микрофон ойр байгаа эсэхийг шалгана уу.";
    if (d.startsWith("ASR_FAILED")) return "Яриаг текст болгоход алдаа гарлаа. Дахин оролдоно уу.";
    if (d.startsWith("SUMMARY_FAILED")) return "Бичвэр бэлэн боллоо, гэхдээ хурлын бичиг үүсгэхэд алдаа гарлаа.";
    if (err.status === 404) return "Хурал олдсонгүй.";
    return d || `Серверийн алдаа (${err.status})`;
  }
  if (err instanceof TypeError) return "Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгана уу.";
  return err instanceof Error ? err.message : "Тодорхойгүй алдаа";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      if (typeof json.detail === "string") detail = json.detail;
    } catch {
      // JSON биш хариу — текстээр нь үлдээнэ
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  health: () => request<{ status: string; version: string }>("/api/health"),

  createMeeting: (title?: string) =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title: title || "Шинэ хурал" }),
    }),

  listMeetings: () => request<MeetingListResponse>("/api/meetings"),

  getMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}`),

  updateMeeting: (id: string, title: string) =>
    request<Meeting>(`/api/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  startMeeting: (id: string) =>
    request<Meeting>(`/api/meetings/${id}/start`, { method: "POST" }),

  pauseMeeting: (id: string) =>
    request<Meeting>(`/api/meetings/${id}/pause`, { method: "POST" }),

  resumeMeeting: (id: string) =>
    request<Meeting>(`/api/meetings/${id}/resume`, { method: "POST" }),

  endMeeting: (id: string) =>
    request<Meeting>(`/api/meetings/${id}/end`, { method: "POST" }),

  deleteMeeting: (id: string) =>
    request<void>(`/api/meetings/${id}`, { method: "DELETE" }),

  /** Бичлэгийг текст болгож, хурлын бичиг үүсгэнэ (урт бичлэгт хэдэн минут болно) */
  processMeeting: (id: string) =>
    request<{ meeting_id: string; status: string; transcript_segments: number }>(
      `/api/meetings/${id}/process`,
      { method: "POST" },
    ),

  exportDocxUrl: (id: string) => `${API_BASE}/api/meetings/${id}/export.docx`,

  getWsUrl: (meetingId: string) => {
    const wsBase = API_BASE.replace(/^http/, "ws");
    return `${wsBase}/ws/meetings/${meetingId}/audio`;
  },
};
