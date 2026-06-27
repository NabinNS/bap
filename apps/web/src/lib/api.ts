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
      "Content-Type": "application/json",
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

  return res.json();
}

// ── token refresh ────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user: { ulid: string; name: string; email: string };
}

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await request<AuthResponse>("/auth/refresh", { method: "POST" }, true);
    setAccessToken(data.access_token);
    scheduleRefresh(data.expires_in);
    return true;
  } catch {
    return false;
  }
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
  try {
    const data = await request<AuthResponse>("/auth/refresh", { method: "POST" }, true);
    setAccessToken(data.access_token);
    scheduleRefresh(data.expires_in);
    return data;
  } catch {
    return null;
  }
}
