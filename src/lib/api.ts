import type { Meeting, MeetingListResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
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

  getWsUrl: (meetingId: string) => {
    const wsBase = API_BASE.replace(/^http/, "ws");
    return `${wsBase}/ws/meetings/${meetingId}/audio`;
  },
};
