import { describe, it, expect } from "vitest";
import { parseNanobananaPrompts } from "../src/services/promptParser.js";
import { AgentError } from "../src/utils/errors.js";

const BASE_PARA = "Lorem ipsum ".repeat(40);
const para = (axis: string) =>
  `A fully detailed prompt for ${axis} including face realism block, fabric realism block, environmental materials, light on skin and fabric, camera optics, and anti-AI cues. ${BASE_PARA}`;

function buildCanonical() {
  return [
    `PROMPT 1 — PHOTOREAL UPGRADE\n\n${para("photoreal upgrade")}`,
    `PROMPT 2 — LIGHT UPGRADE\n\n${para("light upgrade")}`,
    `PROMPT 3 — TEXTURE HERO\n\n${para("texture hero")}`,
    `PROMPT 4 — COMPOSITION ELEVATION\n\n${para("composition elevation")}`,
    `PROMPT 5 — WILD CARD IMPROVEMENT\n\n${para("wild card improvement")}`,
  ].join("\n\n---\n\n");
}

describe("parseNanobananaPrompts", () => {
  it("extracts the 5 canonical prompts in order", () => {
    const out = parseNanobananaPrompts(buildCanonical());
    expect(out).toHaveLength(5);
    expect(out[0].axis).toBe("PHOTOREAL UPGRADE");
    expect(out[4].axis).toBe("WILD CARD IMPROVEMENT");
    expect(out[2].prompt).toContain("texture hero");
  });

  it("handles em-dash and en-dash separators interchangeably", () => {
    const raw = buildCanonical()
      .replace("PROMPT 1 — PHOTOREAL UPGRADE", "PROMPT 1 - PHOTOREAL UPGRADE")
      .replace("PROMPT 3 — TEXTURE HERO", "PROMPT 3 – TEXTURE HERO");
    const out = parseNanobananaPrompts(raw);
    expect(out).toHaveLength(5);
  });

  it("tolerates extra blank lines and whitespace", () => {
    const raw = buildCanonical()
      .replace(/\n/g, "\n\n")
      .replace("PROMPT 1", "  PROMPT 1");
    const out = parseNanobananaPrompts(raw);
    expect(out).toHaveLength(5);
  });

  it("throws PROMPT_PARSE_ERROR when a prompt is missing", () => {
    const broken = buildCanonical().replace(
      /PROMPT 3 — TEXTURE HERO[\s\S]+?(?=\n---\n)/,
      "",
    );
    expect(() => parseNanobananaPrompts(broken)).toThrow(AgentError);
    try {
      parseNanobananaPrompts(broken);
    } catch (e) {
      expect((e as AgentError).code).toBe("PROMPT_PARSE_ERROR");
    }
  });

  it("throws PROMPT_PARSE_ERROR when axis is wrong", () => {
    const broken = buildCanonical().replace(
      "PROMPT 2 — LIGHT UPGRADE",
      "PROMPT 2 — LIGHT UP",
    );
    expect(() => parseNanobananaPrompts(broken)).toThrow(AgentError);
  });

  it("throws when prompt order is shuffled", () => {
    const segments = buildCanonical().split("\n---\n");
    const shuffled = [segments[1], segments[0], segments[2], segments[3], segments[4]].join(
      "\n---\n",
    );
    expect(() => parseNanobananaPrompts(shuffled)).toThrow(AgentError);
  });

  it("rejects prompts that are too short", () => {
    const truncated = [
      "PROMPT 1 — PHOTOREAL UPGRADE",
      "tiny",
      "---",
      "PROMPT 2 — LIGHT UPGRADE",
      para("light upgrade"),
      "---",
      "PROMPT 3 — TEXTURE HERO",
      para("texture hero"),
      "---",
      "PROMPT 4 — COMPOSITION ELEVATION",
      para("composition elevation"),
      "---",
      "PROMPT 5 — WILD CARD IMPROVEMENT",
      para("wild card improvement"),
    ].join("\n");
    expect(() => parseNanobananaPrompts(truncated)).toThrow(AgentError);
  });
});
