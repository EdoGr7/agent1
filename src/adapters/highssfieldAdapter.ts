import { setTimeout as delay } from "node:timers/promises";
import { AgentError } from "../utils/errors.js";
import type { McpClient, McpToolCallResult } from "./mcpClient.js";
import { logger } from "../utils/logger.js";
import type { RawImageOutput } from "../services/imageNormalizer.js";

export interface HighssfieldAdapterOptions {
  toolPrefix?: string;
  pollIntervalMs?: number[];
  maxPollMs?: number;
  retries?: number;
}

export interface HighssfieldGenerateInput {
  prompt: string;
  aspectRatio?: string;
  model?: string;
  width?: number;
  height?: number;
}

export interface HighssfieldGenerateResult {
  raw: RawImageOutput;
  jobId?: string;
  seed?: string;
  modelUsed?: string;
  rawResponse: unknown;
}

const DEFAULT_INTERVALS = [2_000, 4_000, 8_000, 16_000, 16_000, 16_000, 16_000, 32_000];

export class HighssfieldAdapter {
  private readonly prefix: string;
  private readonly intervals: number[];
  private readonly maxPollMs: number;
  private readonly retries: number;

  constructor(private readonly mcp: McpClient, opts: HighssfieldAdapterOptions = {}) {
    this.prefix = opts.toolPrefix ?? process.env.HIGHSSFIELD_MCP_PREFIX ?? "mcp__highssfield";
    this.intervals = opts.pollIntervalMs ?? DEFAULT_INTERVALS;
    this.maxPollMs = opts.maxPollMs ?? 5 * 60 * 1000;
    this.retries = opts.retries ?? 2;
  }

  private toolName(short: string): string {
    return `${this.prefix}__${short}`;
  }

  async generateImage(input: HighssfieldGenerateInput): Promise<HighssfieldGenerateResult> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const result = await this.mcp.callTool(this.toolName("generate_image"), {
          prompt: input.prompt,
          aspect_ratio: input.aspectRatio ?? "4:5",
          ...(input.model ? { model: input.model } : {}),
          ...(input.width ? { width: input.width } : {}),
          ...(input.height ? { height: input.height } : {}),
        });
        if (result.isError) {
          const text = textOf(result);
          if (/too\s*long|exceeds|length/i.test(text)) {
            throw new AgentError(
              "HIGHSSFIELD_GENERATION_ERROR",
              `Prompt rejected as too long: ${text}`,
              { promptLength: input.prompt.length },
            );
          }
          throw new AgentError(
            "HIGHSSFIELD_GENERATION_ERROR",
            `generate_image returned error: ${text}`,
          );
        }
        const interpreted = await this.interpretResult(result, input);
        return interpreted;
      } catch (e) {
        lastErr = e;
        logger.warn(
          { attempt, err: (e as Error).message },
          "Higgsfield generation attempt failed",
        );
        if (attempt < this.retries) await delay(1500 * (attempt + 1));
      }
    }
    if (lastErr instanceof AgentError) throw lastErr;
    throw new AgentError(
      "HIGHSSFIELD_GENERATION_ERROR",
      `generate_image failed after ${this.retries + 1} attempts: ${(lastErr as Error)?.message ?? "unknown error"}`,
    );
  }

  private async interpretResult(
    result: McpToolCallResult,
    _input: HighssfieldGenerateInput,
  ): Promise<HighssfieldGenerateResult> {
    const structured = (result.structuredContent ?? {}) as Record<string, unknown>;

    const directUrl = pickUrl(structured) ?? pickUrlFromContent(result);
    if (directUrl) {
      return {
        raw: { kind: "url", url: directUrl },
        seed: pickString(structured, "seed"),
        modelUsed: pickString(structured, "model"),
        rawResponse: result,
      };
    }

    const directBase64 = pickBase64(structured) ?? pickBase64FromContent(result);
    if (directBase64) {
      return {
        raw: {
          kind: "base64",
          data: directBase64.data,
          mime: directBase64.mime,
        },
        seed: pickString(structured, "seed"),
        rawResponse: result,
      };
    }

    const jobId = pickString(structured, "job_id") ?? pickString(structured, "jobId");
    if (jobId) {
      const polled = await this.pollJob(jobId);
      return { ...polled, jobId, rawResponse: result };
    }

    const assetId =
      pickString(structured, "asset_id") ??
      pickString(structured, "media_id") ??
      pickString(structured, "id");
    if (assetId) {
      const resolved = await this.resolveMedia(assetId);
      return { ...resolved, rawResponse: result };
    }

    const resourceUri = pickResourceUri(result);
    if (resourceUri) {
      return {
        raw: { kind: "mcp_resource", uri: resourceUri },
        rawResponse: result,
      };
    }

    throw new AgentError(
      "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
      "generate_image returned no URL, no base64, no job_id, no asset_id, no resource URI.",
    );
  }

  private async pollJob(jobId: string): Promise<HighssfieldGenerateResult> {
    const start = Date.now();
    let i = 0;
    while (Date.now() - start < this.maxPollMs) {
      const interval = this.intervals[Math.min(i, this.intervals.length - 1)]!;
      await delay(interval);
      i++;
      const res = await this.mcp.callTool(this.toolName("job_display"), { job_id: jobId });
      const structured = (res.structuredContent ?? {}) as Record<string, unknown>;
      const status = (pickString(structured, "status") ?? "").toLowerCase();
      if (status === "completed" || status === "succeeded" || status === "success") {
        const url = pickUrl(structured) ?? pickUrlFromContent(res);
        if (url) return { raw: { kind: "url", url }, jobId, rawResponse: res };
        const base64 = pickBase64(structured) ?? pickBase64FromContent(res);
        if (base64) return { raw: { kind: "base64", data: base64.data, mime: base64.mime }, jobId, rawResponse: res };
        const assetId =
          pickString(structured, "asset_id") ??
          pickString(structured, "media_id") ??
          pickString(structured, "id");
        if (assetId) {
          const resolved = await this.resolveMedia(assetId);
          return { ...resolved, jobId, rawResponse: res };
        }
        throw new AgentError(
          "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
          `job ${jobId} completed but no asset URL/base64/asset_id present.`,
        );
      }
      if (status === "failed" || status === "error") {
        throw new AgentError(
          "HIGHSSFIELD_GENERATION_ERROR",
          `job ${jobId} terminal status=${status}: ${textOf(res)}`,
        );
      }
    }
    throw new AgentError(
      "HIGHSSFIELD_GENERATION_ERROR",
      `job ${jobId} polling timed out after ${this.maxPollMs}ms`,
    );
  }

  private async resolveMedia(assetId: string): Promise<HighssfieldGenerateResult> {
    const res = await this.mcp.callTool(this.toolName("show_medias"), { id: assetId });
    const structured = (res.structuredContent ?? {}) as Record<string, unknown>;
    const url = pickUrl(structured) ?? pickUrlFromContent(res);
    if (url) {
      return { raw: { kind: "asset_id", id: assetId, resolvedUrl: url }, rawResponse: res };
    }
    const base64 = pickBase64(structured) ?? pickBase64FromContent(res);
    if (base64) {
      return {
        raw: { kind: "base64", data: base64.data, mime: base64.mime },
        rawResponse: res,
      };
    }
    throw new AgentError(
      "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
      `show_medias did not resolve asset ${assetId} to URL or base64.`,
    );
  }
}

function textOf(result: McpToolCallResult): string {
  return (result.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
}

function pickUrl(obj: Record<string, unknown>): string | undefined {
  const candidates = ["image_url", "url", "media_url", "asset_url", "signed_url", "public_url"];
  for (const k of candidates) {
    const v = obj[k];
    if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  }
  return undefined;
}

function pickUrlFromContent(result: McpToolCallResult): string | undefined {
  for (const c of result.content ?? []) {
    if (typeof c.text === "string") {
      const m = c.text.match(/https?:\/\/[^\s"']+\.(?:jpe?g|png|webp)(?:\?[^\s"']*)?/i);
      if (m) return m[0];
    }
    if (c.type === "image" && typeof (c as { source?: { url?: string } }).source?.url === "string") {
      return (c as { source?: { url?: string } }).source!.url!;
    }
  }
  return undefined;
}

function pickBase64(obj: Record<string, unknown>): { data: string; mime: string } | undefined {
  const candidates: Array<[string, string]> = [
    ["image_base64", "image/jpeg"],
    ["base64", "image/jpeg"],
    ["data", "image/jpeg"],
  ];
  for (const [k, mime] of candidates) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 100 && !v.startsWith("http")) {
      return { data: v, mime };
    }
  }
  return undefined;
}

function pickBase64FromContent(
  result: McpToolCallResult,
): { data: string; mime: string } | undefined {
  for (const c of result.content ?? []) {
    if (c.type === "image" && typeof (c as { data?: string }).data === "string") {
      return {
        data: (c as { data: string }).data,
        mime: c.mimeType ?? "image/jpeg",
      };
    }
  }
  return undefined;
}

function pickResourceUri(result: McpToolCallResult): string | undefined {
  for (const c of result.content ?? []) {
    if (c.type === "resource" && c.resource?.uri) {
      return c.resource.uri;
    }
  }
  return undefined;
}

function pickString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
