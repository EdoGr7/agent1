import { z } from "zod";
import { NanobananaPromptSchema, GeneratedImageSchema } from "./generatedImage.schema.js";
import { LAYOUT_TYPES } from "./slideCopy.schema.js";

export const QualityReportSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type QualityReport = z.infer<typeof QualityReportSchema>;

export const SlideOutputSchema = z.object({
  slide_number: z.number().int().min(1).max(12),
  layout_type: z.enum(LAYOUT_TYPES),
  headline: z.string(),
  subtitle: z.string().optional(),
  items: z.array(z.object({ label: z.string(), body: z.string() })).optional(),
  dato_numerico: z
    .object({ number: z.string(), unit: z.string(), context: z.string() })
    .optional(),
  photo_used: z.string().optional(),
  canva_asset_id: z.string().optional(),
});
export type SlideOutput = z.infer<typeof SlideOutputSchema>;

export const LoonivaAgentOutputSchema = z.object({
  status: z.enum(["success", "partial_success", "failed"]),
  run_id: z.string().min(1),
  canva_design_id: z.string().optional(),
  canva_edit_url: z.string().optional(),
  slide_count: z.number().int().min(0).max(12),
  slide_copy: z.array(SlideOutputSchema),
  nanobanana_prompts: z.array(NanobananaPromptSchema),
  generated_images: z.array(GeneratedImageSchema),
  files: z.object({
    manifest: z.string(),
    report: z.string(),
    canva_layout_spec: z.string().optional(),
    slide_copy: z.string().optional(),
    prompts: z.string().optional(),
  }),
  quality_report: QualityReportSchema,
  error_code: z.string().optional(),
  error_message: z.string().optional(),
});
export type LoonivaAgentOutput = z.infer<typeof LoonivaAgentOutputSchema>;
