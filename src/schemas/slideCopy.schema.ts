import { z } from "zod";

export const VISUAL_BRAIN_STAGES = [
  "HOOK",
  "CONTEXT",
  "BUILD",
  "TENSION",
  "PAYOFF",
  "CTA",
] as const;
export type VisualBrainStage = (typeof VISUAL_BRAIN_STAGES)[number];

export const LAYOUT_TYPES = [
  "HOOK_PHOTO",
  "HOOK_DARK",
  "BUILD_LIGHT",
  "BUILD_DARK",
  "DATA_DARK",
  "COMPARISON",
  "TENSION_PHOTO",
  "TENSION_DARK",
  "PAYOFF_LIGHT",
  "CTA",
] as const;
export type LayoutType = (typeof LAYOUT_TYPES)[number];

export const SlideItemSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
});
export type SlideItem = z.infer<typeof SlideItemSchema>;

export const DatoNumericoSchema = z.object({
  number: z.string().min(1),
  unit: z.string().min(1),
  context: z.string().min(1),
});
export type DatoNumerico = z.infer<typeof DatoNumericoSchema>;

export const ComparisonColumnSchema = z.object({
  header: z.string().min(1),
  items: z.array(z.string().min(1)).min(1).max(6),
});
export type ComparisonColumn = z.infer<typeof ComparisonColumnSchema>;

export const SlideCopySchema = z.object({
  slide_number: z.number().int().min(1).max(12),
  visual_brain_stage: z.enum(VISUAL_BRAIN_STAGES),
  layout_type: z.enum(LAYOUT_TYPES),
  headline: z.string().min(1).max(120),
  subtitle: z.string().max(120).optional(),
  items: z.array(SlideItemSchema).optional(),
  dato_numerico: DatoNumericoSchema.optional(),
  comparison: z
    .object({ left: ComparisonColumnSchema, right: ComparisonColumnSchema })
    .optional(),
  cta_label: z.string().max(60).optional(),
  bridge_sentence: z.string().max(200).optional(),
  payoff_claim: z.string().max(280).optional(),
  assigned_image: z.string().optional(),
  assigned_canva_asset_id: z.string().optional(),
});
export type SlideCopy = z.infer<typeof SlideCopySchema>;

export const SlideCopyDocSchema = z.object({
  topic: z.string().min(1),
  brief: z.string().min(1),
  cta: z.string().min(1),
  slides: z.array(SlideCopySchema).min(5).max(12),
});
export type SlideCopyDoc = z.infer<typeof SlideCopyDocSchema>;
