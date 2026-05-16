import type { LayoutType } from "../schemas/slideCopy.schema.js";

export const PALETTE = {
  DARK: "#3C342E",
  VERY_DARK: "#231E1A",
  LIGHT: "#F2EBDC",
  GOLD: "#C9A96E",
  TAUPE: "#A89A8B",
} as const;

export const CANVAS = {
  width: 1080 as const,
  height: 1350 as const,
  margin_x: 70,
  margin_top: 70,
  margin_bottom: 60,
  safe_width: 940,
} as const;

export const FONT_FAMILY = {
  HEADLINE: "Cormorant Garamond",
  HEADLINE_FALLBACKS: ["Cormorant", "Garamond", "Libre Baskerville", "Georgia"],
  LABEL: "Source Serif Pro",
  LABEL_FALLBACKS: ["Source Serif", "Libre Baskerville", "Georgia"],
  BODY: "Sorts Mill Goudy",
  BODY_FALLBACKS: ["Goudy Bookletter 1911", "Libre Baskerville", "Georgia"],
} as const;

export interface ElementBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutGeometry {
  background: { type: "color"; color: string };
  image?: ElementBox & { opacity: number; fit: "cover" };
  overlay?: ElementBox & { color: string; opacity: number };
  headline?: ElementBox & { color: string; align: "left" | "center" | "right" };
  subtitle?: ElementBox & { color: string; align: "left" | "center" | "right" };
  number?: ElementBox & { color: string; align: "left" | "center" | "right" };
  unit_label?: ElementBox & { color: string; align: "left" | "center" | "right" };
  separator?: ElementBox & { color: string };
  pill?: ElementBox & { fill: string; border_radius: number };
  pill_title?: ElementBox & { color: string; align: "left" | "center" | "right" };
  pill_body?: ElementBox & { color: string; align: "left" | "center" | "right" };
  left_box?: ElementBox & { fill: string; border_radius: number };
  right_box?: ElementBox & { fill: string; border_radius: number; border_color: string; border_width: number };
  bridge_sentence?: ElementBox & { color: string; align: "left" | "center" | "right" };
  cta_pill?: ElementBox & { fill: string; text_color: string; border_radius: number };
  payoff_claim?: ElementBox & { color: string; align: "left" | "center" | "right" };
  logo: ElementBox & { color: string; opacity: number; align: "left" | "center" | "right" };
}

export const LAYOUTS: Record<LayoutType, LayoutGeometry> = {
  HOOK_PHOTO: {
    background: { type: "color", color: PALETTE.DARK },
    image: { x: 0, y: 0, w: 1080, h: 1350, opacity: 0.2, fit: "cover" },
    overlay: { x: 0, y: 600, w: 1080, h: 750, color: PALETTE.VERY_DARK, opacity: 0.75 },
    headline: { x: 100, y: 780, w: 880, h: 240, color: PALETTE.LIGHT, align: "center" },
    subtitle: { x: 150, y: 1030, w: 780, h: 60, color: PALETTE.TAUPE, align: "center" },
    logo: { x: 880, y: 1260, w: 140, h: 36, color: PALETTE.LIGHT, opacity: 0.4, align: "right" },
  },
  HOOK_DARK: {
    background: { type: "color", color: PALETTE.DARK },
    headline: { x: 70, y: 480, w: 940, h: 320, color: PALETTE.LIGHT, align: "center" },
    subtitle: { x: 150, y: 820, w: 780, h: 80, color: PALETTE.TAUPE, align: "center" },
    logo: { x: 880, y: 1260, w: 140, h: 36, color: PALETTE.LIGHT, opacity: 0.5, align: "right" },
  },
  BUILD_LIGHT: {
    background: { type: "color", color: PALETTE.LIGHT },
    headline: { x: 70, y: 70, w: 940, h: 150, color: PALETTE.DARK, align: "left" },
    subtitle: { x: 70, y: 220, w: 940, h: 50, color: PALETTE.TAUPE, align: "left" },
    pill: {
      x: 70,
      y: 280,
      w: 940,
      h: 950,
      fill: "rgba(60,52,46,0.10)",
      border_radius: 20,
    },
    logo: { x: 70, y: 1265, w: 140, h: 30, color: PALETTE.DARK, opacity: 0.5, align: "left" },
  },
  BUILD_DARK: {
    background: { type: "color", color: PALETTE.DARK },
    headline: { x: 70, y: 70, w: 940, h: 150, color: PALETTE.LIGHT, align: "left" },
    subtitle: { x: 70, y: 220, w: 940, h: 50, color: PALETTE.TAUPE, align: "left" },
    pill: {
      x: 70,
      y: 280,
      w: 940,
      h: 950,
      fill: "rgba(242,235,220,0.12)",
      border_radius: 20,
    },
    logo: { x: 70, y: 1265, w: 140, h: 30, color: PALETTE.LIGHT, opacity: 0.5, align: "left" },
  },
  DATA_DARK: {
    background: { type: "color", color: PALETTE.VERY_DARK },
    number: { x: 70, y: 120, w: 940, h: 190, color: PALETTE.GOLD, align: "left" },
    unit_label: { x: 78, y: 310, w: 900, h: 50, color: PALETTE.TAUPE, align: "left" },
    separator: { x: 60, y: 500, w: 960, h: 1, color: "rgba(201,169,110,0.35)" },
    pill: {
      x: 70,
      y: 570,
      w: 940,
      h: 620,
      fill: "rgba(242,235,220,0.10)",
      border_radius: 20,
    },
    pill_title: { x: 105, y: 610, w: 870, h: 70, color: PALETTE.LIGHT, align: "left" },
    pill_body: { x: 105, y: 700, w: 870, h: 390, color: PALETTE.TAUPE, align: "left" },
    logo: { x: 70, y: 1265, w: 140, h: 30, color: PALETTE.LIGHT, opacity: 0.5, align: "left" },
  },
  COMPARISON: {
    background: { type: "color", color: PALETTE.LIGHT },
    headline: { x: 70, y: 70, w: 940, h: 150, color: PALETTE.DARK, align: "left" },
    left_box: {
      x: 70,
      y: 260,
      w: 462,
      h: 930,
      fill: "rgba(60,52,46,0.08)",
      border_radius: 20,
    },
    right_box: {
      x: 548,
      y: 260,
      w: 462,
      h: 930,
      fill: "rgba(201,169,110,0.12)",
      border_radius: 20,
      border_color: PALETTE.GOLD,
      border_width: 1,
    },
    logo: { x: 70, y: 1265, w: 140, h: 30, color: PALETTE.DARK, opacity: 0.5, align: "left" },
  },
  TENSION_PHOTO: {
    background: { type: "color", color: PALETTE.VERY_DARK },
    image: { x: 0, y: 0, w: 1080, h: 1350, opacity: 0.2, fit: "cover" },
    overlay: { x: 0, y: 500, w: 1080, h: 850, color: PALETTE.VERY_DARK, opacity: 0.8 },
    headline: { x: 100, y: 700, w: 880, h: 280, color: PALETTE.LIGHT, align: "center" },
    subtitle: { x: 100, y: 1000, w: 880, h: 200, color: PALETTE.TAUPE, align: "center" },
    logo: { x: 880, y: 1260, w: 140, h: 36, color: PALETTE.LIGHT, opacity: 0.4, align: "right" },
  },
  TENSION_DARK: {
    background: { type: "color", color: PALETTE.VERY_DARK },
    headline: { x: 100, y: 420, w: 880, h: 380, color: PALETTE.LIGHT, align: "center" },
    subtitle: { x: 100, y: 820, w: 880, h: 200, color: PALETTE.TAUPE, align: "center" },
    logo: { x: 880, y: 1260, w: 140, h: 36, color: PALETTE.LIGHT, opacity: 0.5, align: "right" },
  },
  PAYOFF_LIGHT: {
    background: { type: "color", color: PALETTE.LIGHT },
    headline: { x: 70, y: 80, w: 940, h: 220, color: PALETTE.DARK, align: "left" },
    pill: {
      x: 70,
      y: 320,
      w: 940,
      h: 770,
      fill: "rgba(60,52,46,0.10)",
      border_radius: 20,
    },
    payoff_claim: { x: 70, y: 1120, w: 940, h: 130, color: PALETTE.TAUPE, align: "left" },
    logo: { x: 70, y: 1265, w: 140, h: 30, color: PALETTE.DARK, opacity: 0.5, align: "left" },
  },
  CTA: {
    background: { type: "color", color: PALETTE.LIGHT },
    bridge_sentence: { x: 100, y: 200, w: 880, h: 80, color: PALETTE.TAUPE, align: "center" },
    headline: { x: 100, y: 320, w: 880, h: 460, color: PALETTE.DARK, align: "center" },
    cta_pill: {
      x: 290,
      y: 880,
      w: 500,
      h: 110,
      fill: PALETTE.DARK,
      text_color: PALETTE.LIGHT,
      border_radius: 55,
    },
    logo: { x: 480, y: 1240, w: 120, h: 30, color: PALETTE.DARK, opacity: 1, align: "center" },
  },
};

export const FONT_SIZES = {
  HEADLINE_HOOK_PHOTO: { min: 56, default: 76, max: 80 },
  HEADLINE_HOOK_DARK: { min: 60, default: 78, max: 84 },
  HEADLINE_BUILD: { min: 52, default: 66, max: 72 },
  HEADLINE_DATA_BUILD: { min: 52, default: 66, max: 72 },
  HEADLINE_COMPARISON: { min: 48, default: 60, max: 66 },
  HEADLINE_TENSION: { min: 40, default: 48, max: 56 },
  HEADLINE_PAYOFF: { min: 48, default: 60, max: 70 },
  HEADLINE_CTA: { min: 58, default: 72, max: 80 },
  SUBTITLE: { min: 22, default: 28, max: 32 },
  PILL_TITLE: { min: 24, default: 30, max: 34 },
  PILL_BODY: { min: 22, default: 26, max: 28 },
  ITEM_LABEL: { min: 26, default: 32, max: 36 },
  ITEM_BODY: { min: 22, default: 26, max: 28 },
  NUMBER: { min: 100, default: 140, max: 160 },
  UNIT_LABEL: { min: 22, default: 28, max: 32 },
  COMPARISON_HEADER: { min: 22, default: 26, max: 30 },
  COMPARISON_ITEM: { min: 20, default: 24, max: 26 },
  BRIDGE: { min: 22, default: 26, max: 28 },
  CTA_PILL_TEXT: { min: 24, default: 28, max: 32 },
  PAYOFF_CLAIM: { min: 20, default: 22, max: 24 },
  LOGO: { min: 16, default: 22, max: 30 },
};

export function approximateLinesNeeded(
  text: string,
  fontSize: number,
  boxWidthPx: number,
): number {
  const avgCharPx = fontSize * 0.46;
  const charsPerLine = Math.max(1, Math.floor(boxWidthPx / avgCharPx));
  const totalChars = text.length;
  return Math.max(1, Math.ceil(totalChars / charsPerLine));
}

export function fitFontSize(
  text: string,
  box: { w: number; h: number },
  range: { min: number; default: number; max: number },
  lineHeightFactor = 1.05,
): number {
  let size = range.default;
  while (size >= range.min) {
    const lines = approximateLinesNeeded(text, size, box.w);
    const usedHeight = lines * size * lineHeightFactor;
    if (usedHeight <= box.h) return size;
    size -= 2;
  }
  return range.min;
}
