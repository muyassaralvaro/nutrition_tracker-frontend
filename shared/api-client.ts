export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  code?: string;
  constructor(status: number, message: string, errors: Record<string, string[]> = {}, code?: string) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

function xsrfToken(): string {
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length)) : "";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    const csrf = await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, { credentials: "include" });
    if (!csrf.ok) throw new ApiError(csrf.status, "Could not start a secure session.");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!(options.body instanceof FormData) && options.body) headers.set("Content-Type", "application/json");
  if (method !== "GET" && method !== "HEAD") headers.set("X-XSRF-TOKEN", xsrfToken());

  const response = await fetch(`${API_ORIGIN}${path}`, { ...options, headers, credentials: "include", cache: "no-store" });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("nourish:unauthorized"));
  if (!response.ok) throw new ApiError(response.status, body?.message ?? `Request failed (${response.status}).`, body?.errors ?? {}, body?.code);
  return body as T;
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) return Object.values(error.errors)[0]?.[0] ?? error.message;
  return error instanceof Error ? error.message : "Could not reach the server.";
}
