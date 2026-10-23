import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Computes SHA-256 hash of a file or its first 16MB for instant compatibility check
 */
export async function computeFileHash(file: File): Promise<string> {
  const chunkSize = Math.min(file.size, 16 * 1024 * 1024); // 16MB sample
  const slice = file.slice(0, chunkSize);
  let buffer: ArrayBuffer;
  if (typeof slice.arrayBuffer === 'function') {
    buffer = await slice.arrayBuffer();
  } else if (typeof (slice as any).text === 'function') {
    const text = await (slice as any).text();
    buffer = new TextEncoder().encode(text).buffer;
  } else {
    buffer = await new Response(slice).arrayBuffer();
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
