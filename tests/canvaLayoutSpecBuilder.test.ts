import { describe, it, expect } from "vitest";
import { buildCanvaLayoutSpec, assertSpecHasEditableElements } from "../src/services/canvaLayoutSpecBuilder.js";
import type { SlideCopyDoc } from "../src/schemas/slideCopy.schema.js";

function makeDoc(): SlideCopyDoc {
  return {
    topic: "Test",
    brief: "Brief",
    cta: "Scopri Looniva",
    slides: [
      {
        slide_number: 1,
        visual_brain_stage: "HOOK",
        layout_type: "HOOK_PHOTO",
        headline: "La notte è uno spazio adulto",
        subtitle: "Cosa cambia con la viscosa di bambù",
        assigned_image: "/img/hook.jpg",
        assigned_canva_asset_id: "asset_hook",
      },
      {
        slide_number: 2,
        visual_brain_stage: "BUILD",
        layout_type: "BUILD_LIGHT",
        headline: "Tre fattori che cambiano la notte",
        items: [
          { label: "Termoregolazione", body: "Il bambù dissipa il calore in modo continuo." },
          { label: "Mano", body: "Lo sateen di bambù ha una lucentezza direzionale, non sintetica." },
          { label: "Filiera", body: "Tracciamento dalla coltivazione alla cucitura." },
        ],
      },
      {
        slide_number: 3,
        visual_brain_stage: "BUILD",
        layout_type: "DATA_DARK",
        headline: "Un dato concreto",
        dato_numerico: { number: "27%", unit: "umidità", context: "Differenza media tra bambù e cotone in test ASTM." },
        items: [
          { label: "Metodo", body: "Misurazione su 12 cicli notturni." },
          { label: "Limite", body: "Il dato dipende dall'umidità ambientale." },
        ],
      },
      {
        slide_number: 4,
        visual_brain_stage: "TENSION",
        layout_type: "TENSION_PHOTO",
        headline: "Cosa non viene detto",
        subtitle: "I claim ambientali sono spesso non dimostrati.",
        assigned_canva_asset_id: "asset_tension",
      },
      {
        slide_number: 5,
        visual_brain_stage: "CTA",
        layout_type: "CTA",
        headline: "Scegli con consapevolezza",
        bridge_sentence: "Il punto è la coerenza, non la promessa.",
        cta_label: "Scopri Looniva",
      },
    ],
  };
}

describe("buildCanvaLayoutSpec", () => {
  it("produces a 1080x1350 multi-page spec", () => {
    const spec = buildCanvaLayoutSpec(makeDoc(), { designTitle: "Looniva Test" });
    expect(spec.design.width).toBe(1080);
    expect(spec.design.height).toBe(1350);
    expect(spec.design.pages.length).toBe(5);
    expect(spec.design.pages[0]!.layout_type).toBe("HOOK_PHOTO");
    expect(spec.design.pages.at(-1)!.layout_type).toBe("CTA");
  });

  it("includes a separate editable text element for the DATA_DARK number", () => {
    const spec = buildCanvaLayoutSpec(makeDoc(), { designTitle: "Looniva Test" });
    const dataPage = spec.design.pages.find((p) => p.layout_type === "DATA_DARK")!;
    const numberEl = dataPage.elements.find((e) => e.type === "text" && e.role === "data_number");
    expect(numberEl).toBeDefined();
    expect(numberEl?.editable).toBe(true);
  });

  it("never produces a page with only an image element (no flat slides)", () => {
    const spec = buildCanvaLayoutSpec(makeDoc(), { designTitle: "Looniva Test" });
    for (const page of spec.design.pages) {
      const total = page.elements.length;
      const imageOnly =
        page.elements.filter((e) => e.type === "image").length === total && total > 0;
      expect(imageOnly).toBe(false);
    }
    expect(() => assertSpecHasEditableElements(spec)).not.toThrow();
  });

  it("creates a CTA pill with text on the last slide", () => {
    const spec = buildCanvaLayoutSpec(makeDoc(), { designTitle: "Looniva Test" });
    const cta = spec.design.pages.at(-1)!;
    expect(cta.elements.find((e) => e.role === "cta_pill" && e.type === "shape")).toBeDefined();
    expect(cta.elements.find((e) => e.role === "cta_label" && e.type === "text")).toBeDefined();
    expect(cta.elements.find((e) => e.role === "logo" && e.type === "text")).toBeDefined();
  });
});
