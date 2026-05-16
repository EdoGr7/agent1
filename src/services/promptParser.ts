import {
  NANOBANANA_AXES,
  type NanobananaAxis,
  type NanobananaPrompt,
} from "../schemas/generatedImage.schema.js";
import { AgentError } from "../utils/errors.js";

const HEADER_RE = /^[ \t]*PROMPT[ \t]+([1-5])[ \t]*[-—–][ \t]*([A-Z][A-Z ]+?)[ \t]*$/im;

function normalizeAxis(raw: string): NanobananaAxis | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, " ");
  for (const axis of NANOBANANA_AXES) {
    if (cleaned === axis) return axis;
  }
  return null;
}

export function parseNanobananaPrompts(rawOutput: string): NanobananaPrompt[] {
  const normalized = rawOutput
    .replace(/\r\n/g, "\n")
    .replace(/[–—]/g, "-");

  const headerGlobal = new RegExp(HEADER_RE.source, "gim");
  const matches: { index: number; number: number; axis: NanobananaAxis }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headerGlobal.exec(normalized)) !== null) {
    const num = Number(match[1]);
    const axis = normalizeAxis(match[2] ?? "");
    if (!axis) {
      throw new AgentError(
        "PROMPT_PARSE_ERROR",
        `Unknown axis label near "${match[0]}". Expected one of: ${NANOBANANA_AXES.join(", ")}.`,
      );
    }
    matches.push({ index: match.index + match[0].length, number: num, axis });
  }

  if (matches.length !== 5) {
    throw new AgentError(
      "PROMPT_PARSE_ERROR",
      `Expected exactly 5 prompts, found ${matches.length}. The skill output is malformed.`,
      { foundCount: matches.length },
    );
  }

  for (let i = 0; i < 5; i++) {
    if (matches[i]!.number !== i + 1) {
      throw new AgentError(
        "PROMPT_PARSE_ERROR",
        `Prompt order is wrong at position ${i + 1}: got prompt ${matches[i]!.number}.`,
      );
    }
    const expectedAxis = NANOBANANA_AXES[i]!;
    if (matches[i]!.axis !== expectedAxis) {
      throw new AgentError(
        "PROMPT_PARSE_ERROR",
        `Prompt ${i + 1} axis is "${matches[i]!.axis}", expected "${expectedAxis}".`,
      );
    }
  }

  const prompts: NanobananaPrompt[] = [];
  for (let i = 0; i < 5; i++) {
    const start = matches[i]!.index;
    const end = i + 1 < 5 ? matches[i + 1]!.index - findHeaderLength(normalized, matches[i + 1]!.index) : normalized.length;
    const body = stripSeparators(normalized.slice(start, end)).trim();
    if (body.length < 100) {
      throw new AgentError(
        "PROMPT_PARSE_ERROR",
        `Prompt ${i + 1} body is too short (${body.length} chars). Possible compression.`,
        { promptNumber: i + 1, length: body.length },
      );
    }
    prompts.push({
      prompt_number: matches[i]!.number as 1 | 2 | 3 | 4 | 5,
      axis: matches[i]!.axis,
      prompt: body,
    });
  }
  return prompts;
}

function findHeaderLength(text: string, indexAfterHeader: number): number {
  const upTo = text.lastIndexOf("\n", indexAfterHeader - 1);
  if (upTo < 0) return indexAfterHeader;
  return indexAfterHeader - upTo;
}

function stripSeparators(s: string): string {
  return s
    .split("\n")
    .filter((line) => line.trim() !== "---")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function formatPromptsMarkdown(prompts: NanobananaPrompt[]): string {
  return prompts
    .map(
      (p) =>
        `PROMPT ${p.prompt_number} — ${p.axis}\n\n${p.prompt.trim()}\n`,
    )
    .join("\n---\n\n");
}
