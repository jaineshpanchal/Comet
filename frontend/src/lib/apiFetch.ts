// lib/apiFetch.ts
// Utility to make authenticated API requests with JWT and handle auth errors

export async function apiFetch(url: string, options: RequestInit = {}) {
  if (typeof window === "undefined") throw new Error("apiFetch can only be used in the browser");
  const token = localStorage.getItem("golive_jwt");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    // Clear token and redirect to login
    localStorage.removeItem("golive_jwt");
    window.location.href = "/auth/login";
    throw new Error("Session expired. Please log in again.");
  }
  return res;
}
