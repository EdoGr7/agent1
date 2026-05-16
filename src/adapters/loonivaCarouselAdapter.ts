import { AgentError } from "../utils/errors.js";
import type { GeneratedImage } from "../schemas/generatedImage.schema.js";
import type { SlideCopyDoc } from "../schemas/slideCopy.schema.js";
import type { SkillRunner } from "./pinterestToNanobananaAdapter.js";

export interface LoonivaCarouselInput {
  brief: string;
  carouselTopic?: string;
  selectedImages: GeneratedImage[];
  productImagePaths: string[];
  slideCount?: number;
  cta?: string;
  outputDir?: string;
  targetAudience?: string;
  toneOfVoice?: string;
}

export interface LoonivaCarouselSkillOutput {
  slideCopyDoc: SlideCopyDoc;
  rawText: string;
}

export class LoonivaCarouselAdapter {
  constructor(private readonly runner: SkillRunner) {}

  async planCopy(input: LoonivaCarouselInput): Promise<LoonivaCarouselSkillOutput> {
    const promptLines: string[] = [];
    promptLines.push("Esegui la skill /looniva-carousel in agent_mode=true.");
    promptLines.push("Compito: SOLO PIANIFICAZIONE COPY + ASSEGNAZIONE LAYOUT.");
    promptLines.push("");
    promptLines.push("NON creare ora il design Canva.");
    promptLines.push("NON chiamare Canva MCP.");
    promptLines.push("");
    promptLines.push("Restituisci SOLO un JSON valido aderente a questo schema:");
    promptLines.push("");
    promptLines.push("```json");
    promptLines.push(JSON.stringify({
      topic: "string",
      brief: "string",
      cta: "string",
      slides: [
        {
          slide_number: 1,
          visual_brain_stage: "HOOK | CONTEXT | BUILD | TENSION | PAYOFF | CTA",
          layout_type: "HOOK_PHOTO | HOOK_DARK | BUILD_LIGHT | BUILD_DARK | DATA_DARK | COMPARISON | TENSION_PHOTO | TENSION_DARK | PAYOFF_LIGHT | CTA",
          headline: "string (max 7 parole)",
          subtitle: "string opzionale",
          items: [{ label: "string", body: "string" }],
          dato_numerico: { number: "string", unit: "string", context: "string" },
          comparison: { left: { header: "string", items: ["string"] }, right: { header: "string", items: ["string"] } },
          bridge_sentence: "string solo per CTA",
          cta_label: "string solo per CTA",
          payoff_claim: "string solo per PAYOFF_LIGHT",
          assigned_image: "path o url, solo se selezionata per quella slide",
          assigned_canva_asset_id: "string opzionale",
        },
      ],
    }, null, 2));
    promptLines.push("```");
    promptLines.push("");
    promptLines.push("Vincoli rigorosi:");
    promptLines.push("- min 5, max 12 slide");
    promptLines.push("- slide 1 sempre HOOK (stage=HOOK, layout HOOK_PHOTO o HOOK_DARK)");
    promptLines.push("- ultima slide sempre CTA (stage=CTA, layout CTA)");
    promptLines.push("- niente em dash nel copy finale");
    promptLines.push("- niente claim non verificabili");
    promptLines.push("- ogni headline max 7 parole");
    promptLines.push("- dato_numerico solo nelle slide DATA_DARK");
    promptLines.push("- comparison solo nelle slide COMPARISON");
    promptLines.push("");
    promptLines.push("Input:");
    promptLines.push(`- BRIEF: ${input.brief}`);
    if (input.carouselTopic) promptLines.push(`- TOPIC: ${input.carouselTopic}`);
    if (input.slideCount) promptLines.push(`- SLIDE_COUNT: ${input.slideCount}`);
    if (input.cta) promptLines.push(`- CTA HINT: ${input.cta}`);
    if (input.targetAudience) promptLines.push(`- TARGET AUDIENCE: ${input.targetAudience}`);
    if (input.toneOfVoice) promptLines.push(`- TONE OF VOICE: ${input.toneOfVoice}`);
    promptLines.push("- SELECTED IMAGES:");
    for (const img of input.selectedImages) {
      promptLines.push(
        `  - id=${img.id} role=${img.suggested_role ?? "n/a"} prompt=${img.source_prompt_number} path=${img.path_or_url}${
          img.canva_asset_id ? ` canva_asset_id=${img.canva_asset_id}` : ""
        }`,
      );
    }

    const attachments = input.selectedImages
      .filter((i) => i.local_path)
      .map((i) => ({ type: "selected_image", path: i.local_path!, description: i.suggested_role }));

    let raw: string;
    try {
      raw = await this.runner.runSkill("looniva-carousel", {
        prompt: promptLines.join("\n"),
        attachments,
      });
    } catch (e) {
      throw new AgentError(
        "NANOBANANA_SKILL_ERROR",
        `/looniva-carousel skill failed: ${(e as Error).message}`,
      );
    }

    const jsonText = extractJson(raw);
    let parsed: SlideCopyDoc;
    try {
      parsed = JSON.parse(jsonText) as SlideCopyDoc;
    } catch (e) {
      throw new AgentError(
        "NANOBANANA_SKILL_ERROR",
        `/looniva-carousel did not return valid JSON: ${(e as Error).message}`,
        { sample: raw.slice(0, 500) },
      );
    }
    return { slideCopyDoc: parsed, rawText: raw };
  }
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```json\s*\n([\s\S]+?)\n```/);
  if (fenced && fenced[1]) return fenced[1].trim();
  const open = raw.indexOf("{");
  const close = raw.lastIndexOf("}");
  if (open >= 0 && close > open) return raw.slice(open, close + 1);
  return raw.trim();
}
