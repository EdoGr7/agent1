import { z } from "zod";
import { LAYOUT_TYPES } from "./slideCopy.schema.js";

export const CanvaTextStyleSchema = z.object({
  font_family: z.string(),
  font_weight: z.string().optional(),
  font_style: z.enum(["normal", "italic"]).optional(),
  font_size: z.number().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  align: z.enum(["left", "center", "right"]).default("left"),
  line_height: z.number().positive().optional(),
  letter_spacing: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  fallback_used: z.boolean().optional(),
});
export type CanvaTextStyle = z.infer<typeof CanvaTextStyleSchema>;

const BaseElement = z.object({
  role: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  editable: z.literal(true),
});

export const CanvaImageElementSchema = BaseElement.extend({
  type: z.literal("image"),
  asset_id: z.string().min(1).optional(),
  source_path: z.string().min(1).optional(),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  opacity: z.number().min(0).max(1).default(1),
});

export const CanvaTextElementSchema = BaseElement.extend({
  type: z.literal("text"),
  text: z.string(),
  style: CanvaTextStyleSchema,
});

export const CanvaShapeElementSchema = BaseElement.extend({
  type: z.literal("shape"),
  shape: z.enum(["rectangle", "rounded_rectangle", "circle"]).default("rectangle"),
  fill: z.string(),
  border_color: z.string().optional(),
  border_width: z.number().min(0).optional(),
  border_radius: z.number().min(0).optional(),
  opacity: z.number().min(0).max(1).default(1),
});

export const CanvaLineElementSchema = BaseElement.extend({
  type: z.literal("line"),
  stroke: z.string(),
  stroke_width: z.number().positive().default(1),
  opacity: z.number().min(0).max(1).default(1),
});

export const CanvaElementSchema = z.discriminatedUnion("type", [
  CanvaImageElementSchema,
  CanvaTextElementSchema,
  CanvaShapeElementSchema,
  CanvaLineElementSchema,
]);
export type CanvaElement = z.infer<typeof CanvaElementSchema>;

export const CanvaBackgroundSchema = z.object({
  type: z.enum(["color"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const CanvaPageSpecSchema = z.object({
  page_number: z.number().int().min(1).max(12),
  layout_type: z.enum(LAYOUT_TYPES),
  background: CanvaBackgroundSchema,
  elements: z.array(CanvaElementSchema).min(2),
});
export type CanvaPageSpec = z.infer<typeof CanvaPageSpecSchema>;

export const CanvaLayoutSpecSchema = z.object({
  design: z.object({
    title: z.string().min(1),
    width: z.literal(1080),
    height: z.literal(1350),
    unit: z.literal("px"),
    pages: z.array(CanvaPageSpecSchema).min(5).max(12),
  }),
});
export type CanvaLayoutSpec = z.infer<typeof CanvaLayoutSpecSchema>;
