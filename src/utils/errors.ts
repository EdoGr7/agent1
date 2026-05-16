export const ERROR_CODES = [
  "INPUT_VALIDATION_ERROR",
  "SKILL_NOT_FOUND",
  "NANOBANANA_SKILL_ERROR",
  "PROMPT_PARSE_ERROR",
  "HIGHSSFIELD_MCP_UNAVAILABLE",
  "HIGHSSFIELD_GENERATION_ERROR",
  "HIGHSSFIELD_ASSET_HANDOFF_ERROR",
  "INSUFFICIENT_VALID_IMAGES",
  "CANVA_MCP_UNAVAILABLE",
  "CANVA_ASSET_UPLOAD_ERROR",
  "CANVA_DESIGN_CREATION_ERROR",
  "CANVA_EDITING_TRANSACTION_ERROR",
  "CANVA_QUALITY_CHECK_FAILED",
  "FACT_CHECK_BLOCKED_CLAIM",
  "OUTPUT_REPORT_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export class AgentError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.details = details;
  }
}

export function isAgentError(err: unknown): err is AgentError {
  return err instanceof AgentError;
}
