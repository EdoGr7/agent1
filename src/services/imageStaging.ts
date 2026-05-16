import { promises as fs } from "node:fs";
import path from "node:path";
import { request } from "undici";
import { AgentError } from "../utils/errors.js";

export interface StagingOptions {
  baseUrl?: string;
  token?: string;
}

function ensureTrailingSlash(u: string): string {
  return u.endsWith("/") ? u : `${u}/`;
}

export class ImageStaging {
  private readonly baseUrl: string | null;
  private readonly token: string | null;

  constructor(opts: StagingOptions = {}) {
    const url = opts.baseUrl ?? process.env.TEMP_ASSET_STAGING_URL ?? null;
    const tok = opts.token ?? process.env.TEMP_ASSET_STAGING_TOKEN ?? null;
    this.baseUrl = url && url.length > 0 ? ensureTrailingSlash(url) : null;
    this.token = tok;
  }

  isConfigured(): boolean {
    return this.baseUrl !== null;
  }

  async upload(filePath: string, runId: string): Promise<string> {
    if (!this.baseUrl) {
      throw new AgentError(
        "CANVA_ASSET_UPLOAD_ERROR",
        "TEMP_ASSET_STAGING_URL is not configured; cannot host the file for Canva upload-asset-from-url.",
      );
    }
    const data = await fs.readFile(filePath);
    const fileName = `${runId}/${path.basename(filePath)}`;
    const target = `${this.baseUrl}${encodeURI(fileName)}`;
    const headers: Record<string, string> = {
      "content-type": "application/octet-stream",
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const res = await request(target, { method: "PUT", body: data, headers });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new AgentError(
        "CANVA_ASSET_UPLOAD_ERROR",
        `Image staging PUT failed for ${filePath}: HTTP ${res.statusCode}`,
      );
    }
    return target.replace(/[?#].*$/, "");
  }
}
