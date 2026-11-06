"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface StoredAuth {
  token: string;
  user: AuthUser;
}

const KEY = "minuto.auth";
const listeners = new Set<() => void>();
let cache: StoredAuth | null | undefined;

function read(): StoredAuth | null {
  if (cache !== undefined) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    cache = null; // хувийн горим, хаалттай storage гэх мэт
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export function setAuth(auth: StoredAuth) {
  cache = auth;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(auth));
  } catch {
    // storage ажиллахгүй бол зөвхөн энэ tab-д нэвтэрсэн хэвээр байна
  }
  emit();
}

/** Хэрэглэгчийн мэдээлэл (нэр) өөрчлөгдөхөд токеныг хэвээр үлдээж шинэчилнэ */
export function updateStoredUser(user: AuthUser) {
  const current = read();
  if (current) setAuth({ ...current, user });
}

export function clearAuth() {
  cache = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return read()?.token ?? null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Өөр tab-д нэвтэрсэн/гарсныг мэдэх
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Нэвтэрсэн хэрэглэгч.
 * undefined = server render / hydration (хараахан мэдэгдээгүй), null = нэвтрээгүй.
 */
export function useAuth(): AuthUser | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read()?.user ?? null,
    () => undefined,
  );
}

/** Нэвтрээгүй бол /login руу шилжүүлнэ (буцаж ирэх хаягтай). */
export function useRequireAuth(): AuthUser | null | undefined {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (user === null) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [user, router, pathname]);
  return user;
}

/** 401 ирэхэд: токенийг устгаад нэвтрэх хуудас руу. */
export function handleUnauthorized() {
  if (typeof window === "undefined") return;
  clearAuth();
  const here = window.location.pathname;
  if (!here.startsWith("/login")) {
    window.location.assign(`/login?next=${encodeURIComponent(here)}`);
  }
}
