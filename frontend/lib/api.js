import { supabase } from "./supabase";

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const matches = envUrl.match(/https?:\/\/[^\s"',()]+/g);
  if (matches && matches.length > 0) {
    const active = matches.find((u) => u === "https://malnad-roasters.onrender.com") || matches[0];
    return active.replace(/\/+$/, "");
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://malnad-roasters.onrender.com";
  }
  return "http://localhost:8000";
}

const BASE = getBaseUrl();
const TIMEOUT_MS = 45000; // the free Render tier can take ~40 s to wake up

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  if (auth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError("Sign in to continue.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(
      err.name === "AbortError"
        ? "The server took too long to respond. Try again."
        : "Cannot reach the server. Check your connection and try again.",
      0
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    let message = "Something went wrong. Try again.";
    if (typeof data?.detail === "string") message = data.detail;
    else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      const field = data.detail[0].loc?.slice(-1)[0];
      message = `Invalid value${field ? ` for ${field}` : ""}: ${data.detail[0].msg}`;
    }
    throw new ApiError(message, res.status);
  }
  return data;
}
