import { z } from "zod";

export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const LoonivaAgentInputSchema = z
  .object({
    brief: z.string().min(1).optional(),
    reference_image_path: z.string().min(1).optional(),
    protagonist_image_path: z.string().min(1).optional(),
    product_image_paths: z
      .array(z.string().min(1))
      .min(1, "product_image_paths must contain at least one path"),
    carousel_topic: z.string().min(1).optional(),
    target_audience: z.string().min(1).optional(),
    tone_of_voice: z.string().min(1).optional(),
    slide_count: z.number().int().min(5).max(12).optional(),
    cta: z.string().min(1).optional(),
    output_dir: z.string().min(1).optional(),
  })
  .refine(
    (input) =>
      Boolean(input.brief) ||
      Boolean(input.reference_image_path) ||
      Boolean(input.protagonist_image_path),
    {
      message:
        "At least one of `brief`, `reference_image_path`, `protagonist_image_path` must be provided.",
      path: ["brief"],
    },
  );

export type LoonivaAgentInput = z.infer<typeof LoonivaAgentInputSchema>;
