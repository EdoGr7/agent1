import { AgentError } from "../utils/errors.js";
import type { McpClient, McpToolCallResult } from "./mcpClient.js";
import { logger } from "../utils/logger.js";

export interface CanvaAdapterOptions {
  toolPrefix?: string;
}

export interface CreateDesignArgs {
  title: string;
  width: number;
  height: number;
  unit?: "px";
}

export interface CreatedDesign {
  designId: string;
  editUrl?: string;
}

export interface UploadAssetResult {
  assetId: string;
}

export interface EditingTransaction {
  transactionId: string;
}

export interface EditingOperationRequest {
  type: string;
  args: Record<string, unknown>;
}

export class CanvaMcpAdapter {
  private readonly prefix: string;

  constructor(private readonly mcp: McpClient, opts: CanvaAdapterOptions = {}) {
    this.prefix = opts.toolPrefix ?? process.env.CANVA_MCP_PREFIX ?? "mcp__canva";
  }

  private toolName(short: string): string {
    return `${this.prefix}__${short}`;
  }

  async createDesign(args: CreateDesignArgs): Promise<CreatedDesign> {
    const result = await this.mcp.callTool(this.toolName("generate-design-structured"), {
      title: args.title,
      width: args.width,
      height: args.height,
      unit: args.unit ?? "px",
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_DESIGN_CREATION_ERROR",
        `generate-design-structured failed: ${textOf(result)}`,
      );
    }
    const designId = pickDesignId(result);
    if (!designId) {
      throw new AgentError(
        "CANVA_DESIGN_CREATION_ERROR",
        "Canva design creation returned no design id.",
      );
    }
    return { designId, editUrl: pickEditUrl(result) };
  }

  async uploadAssetFromUrl(url: string): Promise<UploadAssetResult> {
    const result = await this.mcp.callTool(this.toolName("upload-asset-from-url"), { url });
    if (result.isError) {
      throw new AgentError(
        "CANVA_ASSET_UPLOAD_ERROR",
        `upload-asset-from-url failed for ${url}: ${textOf(result)}`,
      );
    }
    const assetId = pickAssetId(result);
    if (!assetId) {
      throw new AgentError(
        "CANVA_ASSET_UPLOAD_ERROR",
        `upload-asset-from-url did not return an asset id for ${url}.`,
      );
    }
    return { assetId };
  }

  async startEditingTransaction(designId: string): Promise<EditingTransaction> {
    const result = await this.mcp.callTool(this.toolName("start-editing-transaction"), {
      design_id: designId,
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_EDITING_TRANSACTION_ERROR",
        `start-editing-transaction failed: ${textOf(result)}`,
      );
    }
    const transactionId = pickTransactionId(result);
    if (!transactionId) {
      throw new AgentError(
        "CANVA_EDITING_TRANSACTION_ERROR",
        "start-editing-transaction returned no transaction id.",
      );
    }
    return { transactionId };
  }

  async performEditingOperations(
    designId: string,
    transactionId: string,
    operations: EditingOperationRequest[],
  ): Promise<{ elementIds: string[] }> {
    const result = await this.mcp.callTool(this.toolName("perform-editing-operations"), {
      design_id: designId,
      transaction_id: transactionId,
      operations,
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_EDITING_TRANSACTION_ERROR",
        `perform-editing-operations failed: ${textOf(result)}`,
      );
    }
    const ids = pickElementIds(result);
    return { elementIds: ids };
  }

  async commitEditingTransaction(designId: string, transactionId: string): Promise<void> {
    const result = await this.mcp.callTool(this.toolName("commit-editing-transaction"), {
      design_id: designId,
      transaction_id: transactionId,
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_EDITING_TRANSACTION_ERROR",
        `commit-editing-transaction failed: ${textOf(result)}`,
      );
    }
  }

  async cancelEditingTransaction(
    designId: string,
    transactionId: string,
  ): Promise<void> {
    try {
      await this.mcp.callTool(this.toolName("cancel-editing-transaction"), {
        design_id: designId,
        transaction_id: transactionId,
      });
    } catch (e) {
      logger.warn({ err: (e as Error).message }, "cancel-editing-transaction failed");
    }
  }

  async getDesign(designId: string): Promise<{
    designId: string;
    editUrl: string | null;
    pageCount: number;
    width: number;
    height: number;
  }> {
    const result = await this.mcp.callTool(this.toolName("get-design"), {
      design_id: designId,
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_DESIGN_CREATION_ERROR",
        `get-design failed: ${textOf(result)}`,
      );
    }
    const editUrl = pickEditUrl(result);
    const structured = (result.structuredContent ?? {}) as Record<string, unknown>;
    const pageCount = pickInt(structured, ["page_count", "pages", "num_pages"]) ?? 0;
    const width = pickInt(structured, ["width"]) ?? 0;
    const height = pickInt(structured, ["height"]) ?? 0;
    return { designId, editUrl: editUrl ?? null, pageCount, width, height };
  }

  async getDesignContent(designId: string): Promise<unknown> {
    const result = await this.mcp.callTool(this.toolName("get-design-content"), {
      design_id: designId,
    });
    if (result.isError) {
      throw new AgentError(
        "CANVA_DESIGN_CREATION_ERROR",
        `get-design-content failed: ${textOf(result)}`,
      );
    }
    return result.structuredContent ?? result;
  }
}

function textOf(result: McpToolCallResult): string {
  return (result.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
}

function pickDesignId(result: McpToolCallResult): string | undefined {
  const s = (result.structuredContent ?? {}) as Record<string, unknown>;
  return pickString(s, ["design_id", "id", "designId"]);
}

function pickEditUrl(result: McpToolCallResult): string | undefined {
  const s = (result.structuredContent ?? {}) as Record<string, unknown>;
  const directs = pickString(s, ["edit_url", "editUrl"]);
  if (directs) return directs;
  const urlsObj = s.urls as Record<string, unknown> | undefined;
  if (urlsObj) {
    const inner = pickString(urlsObj, ["edit_url", "editUrl", "edit"]);
    if (inner) return inner;
  }
  const text = (result.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
  const m = text.match(/https?:\/\/(?:www\.)?canva\.com\/[^\s"']+/i);
  if (m) return m[0];
  return undefined;
}

function pickAssetId(result: McpToolCallResult): string | undefined {
  const s = (result.structuredContent ?? {}) as Record<string, unknown>;
  return pickString(s, ["asset_id", "id", "assetId"]);
}

function pickTransactionId(result: McpToolCallResult): string | undefined {
  const s = (result.structuredContent ?? {}) as Record<string, unknown>;
  return pickString(s, ["transaction_id", "id", "transactionId"]);
}

function pickElementIds(result: McpToolCallResult): string[] {
  const s = (result.structuredContent ?? {}) as Record<string, unknown>;
  const eids = s.element_ids ?? s.elementIds ?? s.ids ?? [];
  if (Array.isArray(eids)) {
    return eids.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function pickInt(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  }
  return undefined;
}
