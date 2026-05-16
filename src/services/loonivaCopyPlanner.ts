import type { GeneratedImage } from "../schemas/generatedImage.schema.js";
import type { SlideCopy, SlideCopyDoc, LayoutType, VisualBrainStage } from "../schemas/slideCopy.schema.js";
import { SlideCopyDocSchema } from "../schemas/slideCopy.schema.js";
import {
  findEmDashes,
  findForbiddenPatterns,
  findUncontextualizedNumbers,
  stripEmDashes,
  type CopyFragment,
  type FactCheckIssue,
} from "./factChecker.js";
import { AgentError } from "../utils/errors.js";

export interface CopyPlanResult {
  doc: SlideCopyDoc;
  issuesAutoFixed: FactCheckIssue[];
  issuesBlocking: FactCheckIssue[];
}

export function validateAndCleanCopy(rawDoc: unknown): CopyPlanResult {
  const parsed = SlideCopyDocSchema.safeParse(rawDoc);
  if (!parsed.success) {
    throw new AgentError(
      "NANOBANANA_SKILL_ERROR",
      `slide_copy.json did not match schema: ${parsed.error.issues
        .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
        .join("; ")}`,
    );
  }
  const doc = parsed.data;

  const fragments = extractFragments(doc);

  const emIssues = findEmDashes(fragments);
  const forbiddenIssues = findForbiddenPatterns(fragments);

  const contextualizedFields = new Set<string>();
  doc.slides.forEach((s, idx) => {
    if (s.layout_type === "DATA_DARK" && s.dato_numerico) {
      contextualizedFields.add(`slides[${idx}].dato_numerico.number`);
      contextualizedFields.add(`slides[${idx}].dato_numerico.unit`);
      contextualizedFields.add(`slides[${idx}].dato_numerico.context`);
    }
  });
  const numericIssues = findUncontextualizedNumbers(fragments, contextualizedFields);

  const autoFixed: FactCheckIssue[] = [];
  if (emIssues.length > 0) {
    doc.slides.forEach((slide) => {
      slide.headline = stripEmDashes(slide.headline);
      if (slide.subtitle) slide.subtitle = stripEmDashes(slide.subtitle);
      if (slide.items) {
        slide.items = slide.items.map((it) => ({
          label: stripEmDashes(it.label),
          body: stripEmDashes(it.body),
        }));
      }
      if (slide.payoff_claim) slide.payoff_claim = stripEmDashes(slide.payoff_claim);
      if (slide.bridge_sentence) slide.bridge_sentence = stripEmDashes(slide.bridge_sentence);
    });
    autoFixed.push(...emIssues);
  }

  const blocking = [...forbiddenIssues, ...numericIssues];

  if (blocking.length > 0) {
    throw new AgentError(
      "FACT_CHECK_BLOCKED_CLAIM",
      `Fact-check blocked ${blocking.length} claim(s): ${blocking
        .slice(0, 5)
        .map((i) => `${i.field}: "${i.matched}" (${i.reason})`)
        .join("; ")}`,
      { issues: blocking },
    );
  }

  if (doc.slides[0]?.visual_brain_stage !== "HOOK") {
    throw new AgentError(
      "NANOBANANA_SKILL_ERROR",
      "First slide must be HOOK.",
    );
  }
  const last = doc.slides[doc.slides.length - 1];
  if (last?.visual_brain_stage !== "CTA" || last?.layout_type !== "CTA") {
    throw new AgentError(
      "NANOBANANA_SKILL_ERROR",
      "Last slide must be CTA stage with CTA layout.",
    );
  }

  return { doc, issuesAutoFixed: autoFixed, issuesBlocking: [] };
}

export function extractFragments(doc: SlideCopyDoc): CopyFragment[] {
  const out: CopyFragment[] = [];
  doc.slides.forEach((s, idx) => {
    out.push({ field: `slides[${idx}].headline`, value: s.headline });
    if (s.subtitle) out.push({ field: `slides[${idx}].subtitle`, value: s.subtitle });
    s.items?.forEach((it, i) => {
      out.push({ field: `slides[${idx}].items[${i}].label`, value: it.label });
      out.push({ field: `slides[${idx}].items[${i}].body`, value: it.body });
    });
    if (s.bridge_sentence) {
      out.push({ field: `slides[${idx}].bridge_sentence`, value: s.bridge_sentence });
    }
    if (s.cta_label) out.push({ field: `slides[${idx}].cta_label`, value: s.cta_label });
    if (s.payoff_claim) out.push({ field: `slides[${idx}].payoff_claim`, value: s.payoff_claim });
  });
  return out;
}

export function assignImagesToPhotoSlides(
  doc: SlideCopyDoc,
  images: GeneratedImage[],
): void {
  const photoLayouts: LayoutType[] = ["HOOK_PHOTO", "TENSION_PHOTO"];
  const buildLayouts: LayoutType[] = ["BUILD_LIGHT", "BUILD_DARK", "PAYOFF_LIGHT"];

  const byRole = new Map<string, GeneratedImage[]>();
  images.forEach((img) => {
    const role = img.suggested_role ?? "BUILD";
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)!.push(img);
  });

  const fallbackPool = images.slice();

  doc.slides.forEach((slide) => {
    if (slide.assigned_canva_asset_id || slide.assigned_image) return;
    if (photoLayouts.includes(slide.layout_type)) {
      const pref =
        slide.layout_type === "HOOK_PHOTO" ? "HOOK_PHOTO" : "TENSION_PHOTO";
      const pick = pickFromRolePool(byRole, pref) ?? fallbackPool.shift();
      if (pick) {
        slide.assigned_image = pick.local_path ?? pick.path_or_url;
        if (pick.canva_asset_id) slide.assigned_canva_asset_id = pick.canva_asset_id;
      }
    } else if (buildLayouts.includes(slide.layout_type)) {
      const pick = pickFromRolePool(byRole, "TEXTURE") ?? pickFromRolePool(byRole, "BUILD");
      if (pick) {
        slide.assigned_image = pick.local_path ?? pick.path_or_url;
        if (pick.canva_asset_id) slide.assigned_canva_asset_id = pick.canva_asset_id;
      }
    }
  });
}

function pickFromRolePool(
  byRole: Map<string, GeneratedImage[]>,
  role: string,
): GeneratedImage | undefined {
  const arr = byRole.get(role);
  if (!arr || arr.length === 0) return undefined;
  return arr.shift();
}

export function defaultCtaForTopic(topic: string, brief: string): { bridge: string; headline: string; cta_label: string } {
  const t = (topic + " " + brief).toLowerCase();
  let cta = "Salva per il prossimo acquisto";
  if (/(prodotto|copripium|federe|lenzuol|scopri)/.test(t)) cta = "Scopri Looniva";
  else if (/(sostenibil|filiera|origin)/.test(t)) cta = "Scegli con consapevolezza";
  else if (/(certificaz|oeko|fsc)/.test(t)) cta = "Leggi le nostre certificazioni";
  else if (/(mit|smont|verit)/.test(t)) cta = "Rileggi prima di scegliere";
  return {
    bridge: "Il punto non è la promessa, ma la coerenza.",
    headline: "Looniva è un esercizio di cura.",
    cta_label: cta,
  };
}

export type { LayoutType, VisualBrainStage, SlideCopy };
