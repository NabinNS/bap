import { queryClient } from "@/lib/query-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory access token — never touches localStorage or a readable cookie
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// ── core fetch ───────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include", // sends httpOnly refresh_token cookie automatically
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  // Access token expired — silently refresh and retry once
  if (res.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    // Refresh also failed — user must log in again
    clearAccessToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw error;
  }

  // Any successful write (create/update/delete) can produce a new activity-log row on the
  // backend — invalidate the cache here, once, centrally, rather than remembering to do it
  // at every one of the dozens of mutation call sites across the app. A panel left open
  // during the write picks up the change on its next background refetch instead of going
  // stale until it's closed and reopened.
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && !path.startsWith("/activity-logs")) {
    queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
  }

  return res.json();
}

// ── token refresh ────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user: { ulid: string; name: string; email: string };
}

// Deduplicate concurrent refresh calls — only one request goes out at a time
let refreshPromise: Promise<AuthResponse | null> | null = null;

function doRefresh(): Promise<AuthResponse | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = request<AuthResponse>("/auth/refresh", { method: "POST" }, true)
    .then((data) => {
      setAccessToken(data.access_token);
      scheduleRefresh(data.expires_in);
      return data;
    })
    .catch(() => null)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function tryRefresh(): Promise<boolean> {
  const data = await doRefresh();
  return data !== null;
}

// Proactively refresh 60 seconds before expiry so requests never hit a 401
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleRefresh(expiresInSeconds: number) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max((expiresInSeconds - 60) * 1000, 0);
  refreshTimer = setTimeout(async () => {
    await tryRefresh();
  }, delay);
}

export function cancelRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// ── public API ───────────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

// Called once on app boot to restore session from the httpOnly refresh cookie
export async function restoreSession(): Promise<AuthResponse | null> {
  return doRefresh();
}
