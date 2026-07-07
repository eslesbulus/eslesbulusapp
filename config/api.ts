import { auth } from "./firebase";

const BASE_URL = "https://api.eslesbulus.com";

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

  /** Upload a file (image / video / audio) — uses FormData, not JSON */
  upload: async (
    folder: string,
    uri: string,
    kind: "image" | "video" | "audio" = "image"
  ): Promise<{ url: string; filename: string; type?: string }> => {
    const token = await getToken();
    const formData = new FormData();
    let filename = uri.split("/").pop() || "file";
    const ext = (/\.(\w+)$/.exec(filename)?.[1] || "").toLowerCase();

    // Doğru MIME type belirle — server video/audio'yu mimetype ile ayırt ediyor
    const MIME: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic",
      mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", mkv: "video/x-matroska", webm: "video/webm",
      m4a: "audio/m4a", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg", caf: "audio/x-caf", "3gp": "audio/3gpp", amr: "audio/amr",
    };
    let type = MIME[ext];
    if (!type) {
      // Uzantı yoksa kind'e göre varsayılan ata
      type = kind === "video" ? "video/mp4" : kind === "audio" ? "audio/m4a" : "image/jpeg";
      if (!/\.\w+$/.test(filename)) {
        filename += kind === "video" ? ".mp4" : kind === "audio" ? ".m4a" : ".jpg";
      }
    }

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
