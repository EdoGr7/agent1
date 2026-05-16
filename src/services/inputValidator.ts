import path from "node:path";
import { LoonivaAgentInputSchema, type LoonivaAgentInput } from "../schemas/loonivaAgentInput.schema.js";
import { AgentError } from "../utils/errors.js";
import { hasSupportedExtension } from "../utils/imageUtils.js";
import { pathExists, isWritable } from "../utils/fileStorage.js";

export interface ValidatedInput extends LoonivaAgentInput {
  resolvedOutputDir: string;
}

export async function validateInput(
  raw: unknown,
  defaultOutputDir: string,
): Promise<ValidatedInput> {
  const parsed = LoonivaAgentInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AgentError(
      "INPUT_VALIDATION_ERROR",
      parsed.error.issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`).join("; "),
      { issues: parsed.error.issues },
    );
  }
  const input = parsed.data;

  for (const p of input.product_image_paths) {
    if (!hasSupportedExtension(p)) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        `product image has unsupported extension: ${p}. Allowed: jpg, jpeg, png, webp.`,
      );
    }
    if (!(await pathExists(p))) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        `product image not found at path: ${p}`,
      );
    }
  }

  for (const optional of [input.reference_image_path, input.protagonist_image_path]) {
    if (!optional) continue;
    if (!hasSupportedExtension(optional)) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        `image has unsupported extension: ${optional}.`,
      );
    }
    if (!(await pathExists(optional))) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        `image not found: ${optional}.`,
      );
    }
  }

  const outputDir = input.output_dir ?? defaultOutputDir;
  if (!(await isWritable(outputDir))) {
    throw new AgentError(
      "INPUT_VALIDATION_ERROR",
      `output_dir is not writable: ${outputDir}`,
    );
  }

  const ENV_SECRET_KEYS = [
    "ANTHROPIC_API_KEY",
    "CANVA_ACCESS_TOKEN",
    "CANVA_CLIENT_SECRET",
    "HIGHSSFIELD_MCP_AUTH_TOKEN",
    "TEMP_ASSET_STAGING_TOKEN",
  ];
  for (const key of ENV_SECRET_KEYS) {
    const value = process.env[key];
    if (value && (input.brief?.includes(value) || input.cta?.includes(value))) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        `Input appears to contain the value of environment secret ${key}. Refuse.`,
      );
    }
  }

  return {
    ...input,
    resolvedOutputDir: path.resolve(outputDir),
  };
}
