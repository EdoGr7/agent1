import path from "node:path";
import { promises as fs } from "node:fs";
import { copyFile, ensureDir } from "../utils/fileStorage.js";
import {
  decodeBase64ToFile,
  downloadToFile,
  probeImage,
  type ImageProbe,
} from "../utils/imageUtils.js";
import { AgentError } from "../utils/errors.js";

export type RawImageOutput =
  | { kind: "url"; url: string }
  | { kind: "path"; path: string }
  | { kind: "base64"; data: string; mime: string }
  | { kind: "mcp_resource"; uri: string; resolvedUrl?: string; resolvedBase64?: string; mime?: string }
  | { kind: "asset_id"; id: string; resolvedUrl?: string }
  | { kind: "job"; jobId: string };

export interface NormalizedImage {
  localPath: string;
  probe: ImageProbe;
  originalRef: RawImageOutput;
}

function extensionFromMime(mime: string): string {
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  return ".jpg";
}

export async function normalizeImage(
  raw: RawImageOutput,
  destDir: string,
  baseName: string,
): Promise<NormalizedImage> {
  await ensureDir(destDir);
  let localPath: string;
  switch (raw.kind) {
    case "url": {
      localPath = path.join(destDir, `${baseName}.jpg`);
      await downloadToFile(raw.url, localPath);
      break;
    }
    case "path": {
      const ext = path.extname(raw.path) || ".jpg";
      localPath = path.join(destDir, `${baseName}${ext}`);
      await copyFile(raw.path, localPath);
      break;
    }
    case "base64": {
      const ext = extensionFromMime(raw.mime);
      localPath = path.join(destDir, `${baseName}${ext}`);
      await decodeBase64ToFile(raw.data, localPath);
      break;
    }
    case "mcp_resource": {
      if (raw.resolvedUrl) {
        localPath = path.join(destDir, `${baseName}.jpg`);
        await downloadToFile(raw.resolvedUrl, localPath);
      } else if (raw.resolvedBase64) {
        const ext = extensionFromMime(raw.mime ?? "image/jpeg");
        localPath = path.join(destDir, `${baseName}${ext}`);
        await decodeBase64ToFile(raw.resolvedBase64, localPath);
      } else {
        throw new AgentError(
          "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
          `MCP resource ${raw.uri} not resolved to URL or base64.`,
        );
      }
      break;
    }
    case "asset_id": {
      if (!raw.resolvedUrl) {
        throw new AgentError(
          "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
          `Asset id ${raw.id} must be resolved to a URL before normalization.`,
        );
      }
      localPath = path.join(destDir, `${baseName}.jpg`);
      await downloadToFile(raw.resolvedUrl, localPath);
      break;
    }
    case "job":
      throw new AgentError(
        "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
        `Job ${raw.jobId} must be polled to terminal state before normalization.`,
      );
    default: {
      const _exhaustive: never = raw;
      throw new Error(`Unhandled raw image kind: ${JSON.stringify(_exhaustive)}`);
    }
  }

  let probe: ImageProbe;
  try {
    probe = await probeImage(localPath);
  } catch (e) {
    await fs.rm(localPath, { force: true });
    throw new AgentError(
      "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
      `Image probe failed for ${localPath}: ${(e as Error).message}`,
    );
  }
  if (probe.size < 1024) {
    throw new AgentError(
      "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
      `Image at ${localPath} is too small (${probe.size}B). Likely corrupted.`,
    );
  }
  return { localPath, probe, originalRef: raw };
}
