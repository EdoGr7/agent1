import { AgentError } from "../utils/errors.js";

export interface PinterestInvokeInput {
  brief?: string;
  referenceImagePath?: string;
  protagonistImagePath?: string;
  productImagePaths: string[];
  carouselTopic?: string;
}

export interface SkillRunner {
  runSkill(skillName: string, input: { prompt: string; attachments: { type: string; path: string; description?: string }[] }): Promise<string>;
}

export class PinterestToNanobananaAdapter {
  constructor(private readonly runner: SkillRunner) {}

  async invoke(input: PinterestInvokeInput): Promise<string> {
    if (input.productImagePaths.length === 0) {
      throw new AgentError(
        "INPUT_VALIDATION_ERROR",
        "/pinterest-to-nanobanana requires at least one product image.",
      );
    }
    const promptLines: string[] = [];
    promptLines.push("Esegui la skill /pinterest-to-nanobanana.");
    promptLines.push("");
    promptLines.push("Restituisci esattamente nel formato canonico:");
    promptLines.push("");
    promptLines.push("PROMPT 1 — PHOTOREAL UPGRADE");
    promptLines.push("[paragrafo]");
    promptLines.push("---");
    promptLines.push("PROMPT 2 — LIGHT UPGRADE");
    promptLines.push("[paragrafo]");
    promptLines.push("---");
    promptLines.push("PROMPT 3 — TEXTURE HERO");
    promptLines.push("[paragrafo]");
    promptLines.push("---");
    promptLines.push("PROMPT 4 — COMPOSITION ELEVATION");
    promptLines.push("[paragrafo]");
    promptLines.push("---");
    promptLines.push("PROMPT 5 — WILD CARD IMPROVEMENT");
    promptLines.push("[paragrafo]");
    promptLines.push("");
    promptLines.push("Input:");
    if (input.brief) promptLines.push(`- BRIEF: ${input.brief}`);
    if (input.carouselTopic) promptLines.push(`- TOPIC: ${input.carouselTopic}`);
    if (input.referenceImagePath) promptLines.push(`- REFERENCE IMAGE: ${input.referenceImagePath}`);
    if (input.protagonistImagePath) promptLines.push(`- PROTAGONIST PHOTO: ${input.protagonistImagePath}`);
    promptLines.push(`- PRODUCT PHOTOS: ${input.productImagePaths.join(", ")}`);

    const attachments: { type: string; path: string; description?: string }[] = [];
    if (input.referenceImagePath) {
      attachments.push({ type: "reference", path: input.referenceImagePath });
    }
    if (input.protagonistImagePath) {
      attachments.push({ type: "protagonist", path: input.protagonistImagePath });
    }
    for (const p of input.productImagePaths) {
      attachments.push({ type: "product", path: p });
    }

    try {
      return await this.runner.runSkill("pinterest-to-nanobanana", {
        prompt: promptLines.join("\n"),
        attachments,
      });
    } catch (e) {
      throw new AgentError(
        "NANOBANANA_SKILL_ERROR",
        `/pinterest-to-nanobanana failed: ${(e as Error).message}`,
        { cause: (e as Error).message },
      );
    }
  }
}
