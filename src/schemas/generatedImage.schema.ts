import { z } from "zod";

export const NANOBANANA_AXES = [
  "PHOTOREAL UPGRADE",
  "LIGHT UPGRADE",
  "TEXTURE HERO",
  "COMPOSITION ELEVATION",
  "WILD CARD IMPROVEMENT",
] as const;
export type NanobananaAxis = (typeof NANOBANANA_AXES)[number];

export const NanobananaPromptSchema = z.object({
  prompt_number: z.number().int().min(1).max(5),
  axis: z.enum(NANOBANANA_AXES),
  prompt: z.string().min(50),
});
export type NanobananaPrompt = z.infer<typeof NanobananaPromptSchema>;

export const SUGGESTED_ROLES = [
  "HOOK_PHOTO",
  "BUILD",
  "TENSION_PHOTO",
  "PAYOFF",
  "TEXTURE",
] as const;
export type SuggestedRole = (typeof SUGGESTED_ROLES)[number];

export const GeneratedImageSchema = z.object({
  id: z.string().min(1),
  source_prompt_number: z.number().int().min(1).max(5),
  axis: z.enum(NANOBANANA_AXES),
  path_or_url: z.string().min(1),
  local_path: z.string().min(1).optional(),
  staging_url: z.string().url().optional(),
  canva_asset_id: z.string().min(1).optional(),
  selected: z.boolean(),
  score: z.number().min(0).max(1),
  selection_reason: z.string(),
  suggested_role: z.enum(SUGGESTED_ROLES).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  seed: z.string().optional(),
  job_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;
