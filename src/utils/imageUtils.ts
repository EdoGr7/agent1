import sharp from "sharp";
import { promises as fs } from "node:fs";
import { request } from "undici";

export interface ImageProbe {
  width: number;
  height: number;
  format: string;
  size: number;
  brightness: number;
  entropy: number;
  aspectRatio: number;
}

export async function probeImage(filePath: string): Promise<ImageProbe> {
  const stat = await fs.stat(filePath);
  const meta = await sharp(filePath).metadata();
  const stats = await sharp(filePath).stats();
  const brightness =
    stats.channels.length > 0
      ? stats.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) /
        Math.min(stats.channels.length, 3)
      : 128;
  const entropy = stats.entropy ?? 0;
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  return {
    width,
    height,
    format: meta.format ?? "unknown",
    size: stat.size,
    brightness,
    entropy,
    aspectRatio: height > 0 ? width / height : 0,
  };
}

export async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await request(url, { method: "GET" });
  if (res.statusCode < 200 || res.statusCode >= 400) {
    throw new Error(`HTTP ${res.statusCode} when downloading ${url}`);
  }
  const buf = await res.body.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buf));
}

export async function decodeBase64ToFile(
  base64: string,
  destPath: string,
): Promise<void> {
  const stripped = base64.replace(/^data:[^;]+;base64,/, "");
  const buf = Buffer.from(stripped, "base64");
  await fs.writeFile(destPath, buf);
}

const ALLOWED = new Set(["jpg", "jpeg", "png", "webp"]);

export function hasSupportedExtension(p: string): boolean {
  const ext = p.toLowerCase().split(".").pop();
  return Boolean(ext && ALLOWED.has(ext));
}
