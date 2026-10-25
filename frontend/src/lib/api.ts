import { API_PREFIX, API_URL } from "./config";
import { tokenStore } from "./token-store";

export interface FieldProblem {
  field: string;
  message: string;
}

/** Every backend error has the shape {"error": {"code", "message", "details?"}}. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: FieldProblem[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field -> message, for showing validation errors next to inputs ("body." prefix removed). */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const problem of this.details) {
      const field = problem.field.replace(/^(body|query)\./, "");
      result[field] ??= problem.message;
    }
    return result;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Query;
  json?: unknown;
  /** application/x-www-form-urlencoded body (only the login endpoint uses this). */
  form?: Record<string, string>;
  /** Send the Bearer token (default). Login/register pass false. */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_URL}${API_PREFIX}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", query, json, form, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = auth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Is the backend running?");
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (parseJson(text) as Record<string, unknown> | null) : null;

  if (!response.ok) {
    const error = (data?.error ?? {}) as { code?: string; message?: string; details?: FieldProblem[] };
    // A rejected token means the session is over: forget it so the UI sends the user to /login.
    if (response.status === 401 && token) tokenStore.clear();
    throw new ApiError(
      response.status,
      error.code ?? "HTTP_ERROR",
      error.message ?? (response.statusText || "Request failed"),
      error.details ?? [],
    );
  }
  return data as T;
}
