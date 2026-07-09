import imageCompression from "browser-image-compression";
import { apiFetch } from "@/lib/api";

export type UploadResult = { url: string; path: string };

export type FileUploadState = {
  file: File;
  progress: number;   // 0–100
  status: "pending" | "compressing" | "uploading" | "done" | "error";
  error?: string;
};

// Compress a single image before upload
async function compress(file: File): Promise<File> {
  // gif can't be compressed — skip
  if (file.type === "image/gif") return file;

  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
}

// Upload a single file with XHR so we get progress events
function uploadFile(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const form = new FormData();
    form.append("image", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          resolve(body);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    // attach access token from module-level getter
    const { getAccessToken } = require("@/lib/api");
    const token = getAccessToken();

    xhr.open("POST", `${API_URL}/api/upload/${folder}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.send(form);
  });
}

// Upload one file with compression + 1 retry on failure
async function uploadOne(
  file: File,
  folder: string,
  onState: (s: Partial<FileUploadState>) => void
): Promise<UploadResult> {
  onState({ status: "compressing", progress: 0 });
  const compressed = await compress(file);

  onState({ status: "uploading", progress: 0 });

  try {
    const result = await uploadFile(compressed, folder, (pct) =>
      onState({ progress: pct })
    );
    onState({ status: "done", progress: 100 });
    return result;
  } catch {
    // retry once
    try {
      const result = await uploadFile(compressed, folder, (pct) =>
        onState({ progress: pct })
      );
      onState({ status: "done", progress: 100 });
      return result;
    } catch (err: any) {
      onState({ status: "error", error: err?.message ?? "Upload failed" });
      throw err;
    }
  }
}

// Run uploads with a max concurrency limit
async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// Public API — upload multiple files with compression, progress, concurrency, and retry
export async function uploadImages(
  files: File[],
  folder: string,
  onStatesChange: (states: FileUploadState[]) => void
): Promise<UploadResult[]> {
  const states: FileUploadState[] = files.map((file) => ({
    file,
    progress: 0,
    status: "pending",
  }));

  function update(index: number, patch: Partial<FileUploadState>) {
    states[index] = { ...states[index], ...patch };
    onStatesChange([...states]);
  }

  const tasks = files.map((file, i) => () =>
    uploadOne(file, folder, (patch) => update(i, patch))
  );

  return withConcurrency(tasks, 2); // max 2 uploads at a time
}
