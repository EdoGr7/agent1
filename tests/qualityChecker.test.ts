import { describe, it, expect } from "vitest";
import { runQualityCheck } from "../src/services/qualityChecker.js";
import type { CanvaLayoutSpec } from "../src/schemas/canvaLayoutSpec.schema.js";

function spec(opts: { lastIsCta?: boolean } = {}): CanvaLayoutSpec {
  const lastLayout: "CTA" | "HOOK_PHOTO" = opts.lastIsCta === false ? "HOOK_PHOTO" : "CTA";
  return {
    design: {
      title: "x",
      width: 1080,
      height: 1350,
      unit: "px",
      pages: [
        {
          page_number: 1,
          layout_type: "HOOK_PHOTO",
          background: { type: "color", color: "#3C342E" },
          elements: [
            { type: "image", role: "background_photo", x: 0, y: 0, w: 1080, h: 1350, fit: "cover", opacity: 0.2, editable: true },
            { type: "text", role: "headline", x: 100, y: 780, w: 880, h: 240, text: "x", style: { font_family: "Cormorant Garamond", font_size: 70, color: "#F2EBDC", align: "center" }, editable: true },
          ],
        },
        {
          page_number: 2,
          layout_type: "DATA_DARK",
          background: { type: "color", color: "#231E1A" },
          elements: [
            { type: "text", role: "data_number", x: 70, y: 120, w: 940, h: 190, text: "27%", style: { font_family: "Cormorant Garamond", font_size: 140, color: "#C9A96E", align: "left" }, editable: true },
            { type: "text", role: "data_unit_label", x: 78, y: 310, w: 900, h: 50, text: "umidità", style: { font_family: "Sorts Mill Goudy", font_size: 28, color: "#A89A8B", align: "left" }, editable: true },
            { type: "text", role: "data_pill_title", x: 105, y: 610, w: 870, h: 70, text: "Differenza", style: { font_family: "Source Serif Pro", font_size: 30, color: "#F2EBDC", align: "left" }, editable: true },
            { type: "shape", role: "data_pill", shape: "rounded_rectangle", x: 70, y: 570, w: 940, h: 620, fill: "rgba(0,0,0,.1)", border_radius: 20, opacity: 1, editable: true },
          ],
        },
        {
          page_number: 3,
          layout_type: "BUILD_LIGHT",
          background: { type: "color", color: "#F2EBDC" },
          elements: [
            { type: "text", role: "headline", x: 70, y: 70, w: 940, h: 150, text: "x", style: { font_family: "Cormorant Garamond", font_size: 64, color: "#3C342E", align: "left" }, editable: true },
            { type: "shape", role: "pill", shape: "rounded_rectangle", x: 70, y: 280, w: 940, h: 950, fill: "rgba(0,0,0,.1)", border_radius: 20, opacity: 1, editable: true },
          ],
        },
        {
          page_number: 4,
          layout_type: "TENSION_DARK",
          background: { type: "color", color: "#231E1A" },
          elements: [
            { type: "text", role: "headline", x: 100, y: 420, w: 880, h: 380, text: "x", style: { font_family: "Cormorant Garamond", font_size: 48, color: "#F2EBDC", align: "center" }, editable: true },
            { type: "text", role: "logo", x: 880, y: 1260, w: 140, h: 36, text: "LOONIVA", style: { font_family: "Cormorant Garamond", font_size: 22, color: "#F2EBDC", align: "right" }, editable: true },
          ],
        },
        {
          page_number: 5,
          layout_type: lastLayout,
          background: { type: "color", color: "#F2EBDC" },
          elements: [
            { type: "text", role: "headline", x: 100, y: 320, w: 880, h: 460, text: "x", style: { font_family: "Cormorant Garamond", font_size: 72, color: "#3C342E", align: "center" }, editable: true },
            { type: "shape", role: lastLayout === "CTA" ? "cta_pill" : "filler", shape: "rounded_rectangle", x: 290, y: 880, w: 500, h: 110, fill: "#3C342E", border_radius: 55, opacity: 1, editable: true },
          ],
        },
      ],
    },
  };
}

describe("runQualityCheck", () => {
  it("passes on a well-formed spec and probe", () => {
    const s = spec({ lastIsCta: true });
    const probe = {
      designId: "D1",
      editUrl: "https://canva.com/design/D1/edit",
      pageCount: s.design.pages.length,
      width: 1080,
      height: 1350,
      perPageElementTypeCounts: Object.fromEntries(
        s.design.pages.map((p) => [
          p.page_number,
          p.elements.reduce<Record<string, number>>((acc, el) => {
            acc[el.type] = (acc[el.type] ?? 0) + 1;
            return acc;
          }, {}),
        ]),
      ),
    };
    const out = runQualityCheck({ spec: s, designProbe: probe, factCheckAutoFixed: [], fontFallbacksUsed: [] });
    expect(out.passed).toBe(true);
  });

  it("flags missing designId, editUrl, wrong size, wrong page count, wrong first/last", () => {
    const s = spec({ lastIsCta: false });
    const probe = {
      designId: "",
      editUrl: "",
      pageCount: 3,
      width: 800,
      height: 1000,
      perPageElementTypeCounts: {},
    };
    const out = runQualityCheck({ spec: s, designProbe: probe, factCheckAutoFixed: [], fontFallbacksUsed: [] });
    expect(out.passed).toBe(false);
    expect(out.issues.some((i) => i.includes("design_id"))).toBe(true);
    expect(out.issues.some((i) => i.includes("edit_url"))).toBe(true);
    expect(out.issues.some((i) => i.includes("1080x1350"))).toBe(true);
    expect(out.issues.some((i) => i.includes("last slide is not CTA"))).toBe(true);
  });

  it("flags pages where Canva returned only an image element (flat slide)", () => {
    const s = spec({ lastIsCta: true });
    const probe = {
      designId: "D1",
      editUrl: "https://canva.com/design/D1/edit",
      pageCount: s.design.pages.length,
      width: 1080,
      height: 1350,
      perPageElementTypeCounts: { 1: { image: 1 }, 2: { text: 4, shape: 1 }, 3: { text: 2 }, 4: { text: 2, shape: 1 }, 5: { text: 1, shape: 1 } },
    };
    const out = runQualityCheck({ spec: s, designProbe: probe, factCheckAutoFixed: [], fontFallbacksUsed: [] });
    expect(out.passed).toBe(false);
    expect(out.issues.some((i) => i.includes("flat"))).toBe(true);
  });
});
