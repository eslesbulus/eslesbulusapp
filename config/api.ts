import { auth } from "./firebase";

const BASE_URL = "http://178.251.238.228";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

type ReqInit = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

async function apiFetch<T = any>(path: string, init?: ReqInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...init?.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: init?.method || "GET",
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),

  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "POST", body }),

  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PUT", body }),

  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),

  /** Upload a file (image) — uses FormData, not JSON */
  upload: async (folder: string, uri: string): Promise<{ url: string; filename: string }> => {
    const token = await getToken();
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    const res = await fetch(`${BASE_URL}/api/upload/${folder}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type is set automatically for FormData
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }

    return res.json();
  },
};

export { BASE_URL };
