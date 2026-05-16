import {
  CanvaLayoutSpecSchema,
  type CanvaElement,
  type CanvaLayoutSpec,
  type CanvaPageSpec,
} from "../schemas/canvaLayoutSpec.schema.js";
import type { SlideCopy, SlideCopyDoc } from "../schemas/slideCopy.schema.js";
import {
  FONT_FAMILY,
  FONT_SIZES,
  LAYOUTS,
  PALETTE,
  fitFontSize,
} from "./layouts.js";

const FONT_BUDGET = {
  HOOK_PHOTO: "HEADLINE_HOOK_PHOTO" as const,
  HOOK_DARK: "HEADLINE_HOOK_DARK" as const,
  BUILD_LIGHT: "HEADLINE_BUILD" as const,
  BUILD_DARK: "HEADLINE_BUILD" as const,
  DATA_DARK: "HEADLINE_DATA_BUILD" as const,
  COMPARISON: "HEADLINE_COMPARISON" as const,
  TENSION_PHOTO: "HEADLINE_TENSION" as const,
  TENSION_DARK: "HEADLINE_TENSION" as const,
  PAYOFF_LIGHT: "HEADLINE_PAYOFF" as const,
  CTA: "HEADLINE_CTA" as const,
};

interface BuilderOptions {
  designTitle: string;
}

export function buildCanvaLayoutSpec(
  doc: SlideCopyDoc,
  opts: BuilderOptions,
): CanvaLayoutSpec {
  const pages: CanvaPageSpec[] = doc.slides.map((slide) => buildPage(slide));
  const spec: CanvaLayoutSpec = {
    design: {
      title: opts.designTitle,
      width: 1080,
      height: 1350,
      unit: "px",
      pages,
    },
  };
  const parsed = CanvaLayoutSpecSchema.parse(spec);
  return parsed;
}

function buildPage(slide: SlideCopy): CanvaPageSpec {
  const geom = LAYOUTS[slide.layout_type];
  const elements: CanvaElement[] = [];

  if (geom.image && (slide.assigned_canva_asset_id || slide.assigned_image)) {
    elements.push({
      type: "image",
      role: "background_photo",
      x: geom.image.x,
      y: geom.image.y,
      w: geom.image.w,
      h: geom.image.h,
      asset_id: slide.assigned_canva_asset_id,
      source_path: slide.assigned_image,
      fit: geom.image.fit,
      opacity: geom.image.opacity,
      editable: true,
    });
  }

  if (geom.overlay) {
    elements.push({
      type: "shape",
      role: "bottom_overlay",
      shape: "rectangle",
      x: geom.overlay.x,
      y: geom.overlay.y,
      w: geom.overlay.w,
      h: geom.overlay.h,
      fill: geom.overlay.color,
      opacity: geom.overlay.opacity,
      editable: true,
    });
  }

  if (geom.headline && slide.headline) {
    const range = FONT_SIZES[FONT_BUDGET[slide.layout_type]];
    const size = fitFontSize(slide.headline, geom.headline, range, 1.0);
    elements.push({
      type: "text",
      role: "headline",
      x: geom.headline.x,
      y: geom.headline.y,
      w: geom.headline.w,
      h: geom.headline.h,
      text: slide.headline,
      style: {
        font_family: FONT_FAMILY.HEADLINE,
        font_weight: slide.layout_type === "TENSION_PHOTO" || slide.layout_type === "TENSION_DARK" ? "Bold" : "Bold",
        font_style: slide.layout_type === "TENSION_PHOTO" || slide.layout_type === "TENSION_DARK" ? "italic" : "normal",
        font_size: size,
        color: geom.headline.color,
        align: geom.headline.align,
        line_height: 0.95,
      },
      editable: true,
    });
  }

  if (geom.subtitle && slide.subtitle) {
    const range = FONT_SIZES.SUBTITLE;
    const size = fitFontSize(slide.subtitle, geom.subtitle, range, 1.15);
    elements.push({
      type: "text",
      role: "subtitle",
      x: geom.subtitle.x,
      y: geom.subtitle.y,
      w: geom.subtitle.w,
      h: geom.subtitle.h,
      text: slide.subtitle,
      style: {
        font_family: FONT_FAMILY.HEADLINE,
        font_weight: "SemiBold",
        font_size: size,
        color: geom.subtitle.color,
        align: geom.subtitle.align,
        line_height: 1.2,
      },
      editable: true,
    });
  }

  if (slide.layout_type === "DATA_DARK" && slide.dato_numerico && geom.number && geom.unit_label && geom.separator && geom.pill && geom.pill_title && geom.pill_body) {
    const numberRange = FONT_SIZES.NUMBER;
    const numberSize = fitFontSize(
      `${slide.dato_numerico.number}${slide.dato_numerico.unit ?? ""}`,
      geom.number,
      numberRange,
      1.0,
    );
    elements.push({
      type: "text",
      role: "data_number",
      x: geom.number.x,
      y: geom.number.y,
      w: geom.number.w,
      h: geom.number.h,
      text: slide.dato_numerico.number,
      style: {
        font_family: FONT_FAMILY.HEADLINE,
        font_weight: "Bold",
        font_size: numberSize,
        color: geom.number.color,
        align: geom.number.align,
        line_height: 0.95,
      },
      editable: true,
    });
    elements.push({
      type: "text",
      role: "data_unit_label",
      x: geom.unit_label.x,
      y: geom.unit_label.y,
      w: geom.unit_label.w,
      h: geom.unit_label.h,
      text: `${slide.dato_numerico.unit}`.trim(),
      style: {
        font_family: FONT_FAMILY.BODY,
        font_size: fitFontSize(slide.dato_numerico.unit, geom.unit_label, FONT_SIZES.UNIT_LABEL, 1.2),
        color: geom.unit_label.color,
        align: geom.unit_label.align,
        letter_spacing: 0.12,
      },
      editable: true,
    });
    elements.push({
      type: "line",
      role: "separator",
      x: geom.separator.x,
      y: geom.separator.y,
      w: geom.separator.w,
      h: geom.separator.h,
      stroke: geom.separator.color,
      stroke_width: 1,
      opacity: 1,
      editable: true,
    });
    elements.push({
      type: "shape",
      role: "data_pill",
      shape: "rounded_rectangle",
      x: geom.pill.x,
      y: geom.pill.y,
      w: geom.pill.w,
      h: geom.pill.h,
      fill: geom.pill.fill,
      border_radius: geom.pill.border_radius,
      opacity: 1,
      editable: true,
    });
    elements.push({
      type: "text",
      role: "data_pill_title",
      x: geom.pill_title.x,
      y: geom.pill_title.y,
      w: geom.pill_title.w,
      h: geom.pill_title.h,
      text: slide.dato_numerico.context,
      style: {
        font_family: FONT_FAMILY.LABEL,
        font_weight: "SemiBold",
        font_size: fitFontSize(slide.dato_numerico.context, geom.pill_title, FONT_SIZES.PILL_TITLE, 1.2),
        color: geom.pill_title.color,
        align: geom.pill_title.align,
      },
      editable: true,
    });
    if (slide.items && slide.items[0]) {
      elements.push({
        type: "text",
        role: "data_pill_body",
        x: geom.pill_body.x,
        y: geom.pill_body.y,
        w: geom.pill_body.w,
        h: geom.pill_body.h,
        text: slide.items.map((it) => `${it.label}. ${it.body}`).join("\n\n"),
        style: {
          font_family: FONT_FAMILY.BODY,
          font_size: fitFontSize(
            slide.items.map((it) => `${it.label}. ${it.body}`).join("\n\n"),
            geom.pill_body,
            FONT_SIZES.PILL_BODY,
            1.2,
          ),
          color: geom.pill_body.color,
          align: geom.pill_body.align,
          line_height: 1.2,
        },
        editable: true,
      });
    }
  }

  if (
    (slide.layout_type === "BUILD_LIGHT" ||
      slide.layout_type === "BUILD_DARK" ||
      slide.layout_type === "PAYOFF_LIGHT") &&
    geom.pill &&
    slide.items &&
    slide.items.length > 0
  ) {
    elements.push({
      type: "shape",
      role: "pill",
      shape: "rounded_rectangle",
      x: geom.pill.x,
      y: geom.pill.y,
      w: geom.pill.w,
      h: geom.pill.h,
      fill: geom.pill.fill,
      border_radius: geom.pill.border_radius,
      opacity: 1,
      editable: true,
    });
    const paddingX = 28;
    const innerX = geom.pill.x + paddingX;
    const innerW = geom.pill.w - paddingX * 2;
    const itemCount = slide.items.length;
    const totalGap = 20 * (itemCount - 1);
    const itemHeight = (geom.pill.h - 56 - totalGap) / itemCount;
    let cursorY = geom.pill.y + 28;
    slide.items.forEach((item, i) => {
      const labelColor =
        slide.layout_type === "BUILD_DARK" ? PALETTE.LIGHT : PALETTE.DARK;
      const bodyColor = PALETTE.TAUPE;
      elements.push({
        type: "line",
        role: `item_${i}_gold_bar`,
        x: innerX,
        y: cursorY + 6,
        w: 2,
        h: itemHeight - 12,
        stroke: PALETTE.GOLD,
        stroke_width: 2,
        opacity: 1,
        editable: true,
      });
      elements.push({
        type: "text",
        role: `item_${i}_label`,
        x: innerX + 16,
        y: cursorY,
        w: innerW - 16,
        h: 44,
        text: item.label,
        style: {
          font_family: FONT_FAMILY.LABEL,
          font_weight: "SemiBold",
          font_size: fitFontSize(item.label, { w: innerW - 16, h: 44 }, FONT_SIZES.ITEM_LABEL, 1.1),
          color: labelColor,
          align: "left",
        },
        editable: true,
      });
      elements.push({
        type: "text",
        role: `item_${i}_body`,
        x: innerX + 16,
        y: cursorY + 50,
        w: innerW - 16,
        h: itemHeight - 56,
        text: item.body,
        style: {
          font_family: FONT_FAMILY.BODY,
          font_size: fitFontSize(item.body, { w: innerW - 16, h: itemHeight - 56 }, FONT_SIZES.ITEM_BODY, 1.2),
          color: bodyColor,
          align: "left",
          line_height: 1.2,
        },
        editable: true,
      });
      cursorY += itemHeight + 20;
    });
  }

  if (slide.layout_type === "COMPARISON" && slide.comparison && geom.left_box && geom.right_box) {
    elements.push({
      type: "shape",
      role: "left_box",
      shape: "rounded_rectangle",
      x: geom.left_box.x,
      y: geom.left_box.y,
      w: geom.left_box.w,
      h: geom.left_box.h,
      fill: geom.left_box.fill,
      border_radius: geom.left_box.border_radius,
      opacity: 1,
      editable: true,
    });
    elements.push({
      type: "shape",
      role: "right_box",
      shape: "rounded_rectangle",
      x: geom.right_box.x,
      y: geom.right_box.y,
      w: geom.right_box.w,
      h: geom.right_box.h,
      fill: geom.right_box.fill,
      border_radius: geom.right_box.border_radius,
      border_color: geom.right_box.border_color,
      border_width: geom.right_box.border_width,
      opacity: 1,
      editable: true,
    });
    const padding = 24;
    elements.push({
      type: "text",
      role: "comparison_left_header",
      x: geom.left_box.x + padding,
      y: geom.left_box.y + padding,
      w: geom.left_box.w - padding * 2,
      h: 60,
      text: slide.comparison.left.header,
      style: {
        font_family: FONT_FAMILY.LABEL,
        font_weight: "SemiBold",
        font_size: FONT_SIZES.COMPARISON_HEADER.default,
        color: PALETTE.DARK,
        align: "left",
      },
      editable: true,
    });
    elements.push({
      type: "text",
      role: "comparison_right_header",
      x: geom.right_box.x + padding,
      y: geom.right_box.y + padding,
      w: geom.right_box.w - padding * 2,
      h: 60,
      text: slide.comparison.right.header,
      style: {
        font_family: FONT_FAMILY.LABEL,
        font_weight: "SemiBold",
        font_size: FONT_SIZES.COMPARISON_HEADER.default,
        color: PALETTE.DARK,
        align: "left",
      },
      editable: true,
    });
    const leftItemsText = slide.comparison.left.items.map((s) => `• ${s}`).join("\n\n");
    const rightItemsText = slide.comparison.right.items.map((s) => `• ${s}`).join("\n\n");
    elements.push({
      type: "text",
      role: "comparison_left_items",
      x: geom.left_box.x + padding,
      y: geom.left_box.y + padding + 80,
      w: geom.left_box.w - padding * 2,
      h: geom.left_box.h - padding * 2 - 80,
      text: leftItemsText,
      style: {
        font_family: FONT_FAMILY.BODY,
        font_size: fitFontSize(
          leftItemsText,
          { w: geom.left_box.w - padding * 2, h: geom.left_box.h - padding * 2 - 80 },
          FONT_SIZES.COMPARISON_ITEM,
          1.25,
        ),
        color: PALETTE.TAUPE,
        align: "left",
        line_height: 1.25,
      },
      editable: true,
    });
    elements.push({
      type: "text",
      role: "comparison_right_items",
      x: geom.right_box.x + padding,
      y: geom.right_box.y + padding + 80,
      w: geom.right_box.w - padding * 2,
      h: geom.right_box.h - padding * 2 - 80,
      text: rightItemsText,
      style: {
        font_family: FONT_FAMILY.BODY,
        font_size: fitFontSize(
          rightItemsText,
          { w: geom.right_box.w - padding * 2, h: geom.right_box.h - padding * 2 - 80 },
          FONT_SIZES.COMPARISON_ITEM,
          1.25,
        ),
        color: PALETTE.DARK,
        align: "left",
        line_height: 1.25,
      },
      editable: true,
    });
  }

  if (slide.layout_type === "PAYOFF_LIGHT" && slide.payoff_claim && geom.payoff_claim) {
    elements.push({
      type: "text",
      role: "payoff_claim",
      x: geom.payoff_claim.x,
      y: geom.payoff_claim.y,
      w: geom.payoff_claim.w,
      h: geom.payoff_claim.h,
      text: slide.payoff_claim,
      style: {
        font_family: FONT_FAMILY.BODY,
        font_size: fitFontSize(slide.payoff_claim, geom.payoff_claim, FONT_SIZES.PAYOFF_CLAIM, 1.3),
        color: geom.payoff_claim.color,
        align: geom.payoff_claim.align,
        line_height: 1.3,
      },
      editable: true,
    });
  }

  if (slide.layout_type === "CTA" && geom.bridge_sentence && geom.cta_pill) {
    if (slide.bridge_sentence) {
      elements.push({
        type: "text",
        role: "cta_bridge_sentence",
        x: geom.bridge_sentence.x,
        y: geom.bridge_sentence.y,
        w: geom.bridge_sentence.w,
        h: geom.bridge_sentence.h,
        text: slide.bridge_sentence,
        style: {
          font_family: FONT_FAMILY.BODY,
          font_size: FONT_SIZES.BRIDGE.default,
          color: geom.bridge_sentence.color,
          align: geom.bridge_sentence.align,
          line_height: 1.2,
        },
        editable: true,
      });
    }
    elements.push({
      type: "shape",
      role: "cta_pill",
      shape: "rounded_rectangle",
      x: geom.cta_pill.x,
      y: geom.cta_pill.y,
      w: geom.cta_pill.w,
      h: geom.cta_pill.h,
      fill: geom.cta_pill.fill,
      border_radius: geom.cta_pill.border_radius,
      opacity: 1,
      editable: true,
    });
    if (slide.cta_label) {
      elements.push({
        type: "text",
        role: "cta_label",
        x: geom.cta_pill.x,
        y: geom.cta_pill.y,
        w: geom.cta_pill.w,
        h: geom.cta_pill.h,
        text: slide.cta_label,
        style: {
          font_family: FONT_FAMILY.LABEL,
          font_weight: "SemiBold",
          font_size: FONT_SIZES.CTA_PILL_TEXT.default,
          color: geom.cta_pill.text_color,
          align: "center",
          line_height: 1,
        },
        editable: true,
      });
    }
  }

  elements.push({
    type: "text",
    role: "logo",
    x: geom.logo.x,
    y: geom.logo.y,
    w: geom.logo.w,
    h: geom.logo.h,
    text: "LOONIVA",
    style: {
      font_family: FONT_FAMILY.HEADLINE,
      font_weight: "Bold",
      font_size: FONT_SIZES.LOGO.default,
      color: geom.logo.color,
      align: geom.logo.align,
      opacity: geom.logo.opacity,
      letter_spacing: 0.18,
    },
    editable: true,
  });

  return {
    page_number: slide.slide_number,
    layout_type: slide.layout_type,
    background: geom.background,
    elements,
  };
}

export function assertSpecHasEditableElements(spec: CanvaLayoutSpec): void {
  spec.design.pages.forEach((page) => {
    if (page.elements.length < 2) {
      throw new Error(
        `Page ${page.page_number} has < 2 elements. Likely flat raster.`,
      );
    }
    const types = new Set(page.elements.map((e) => e.type));
    if (page.elements.length === 1 && types.has("image")) {
      throw new Error(
        `Page ${page.page_number} contains only a single image — would be a flat slide.`,
      );
    }
  });
}

export type { CanvaLayoutSpec, CanvaPageSpec, CanvaElement };
