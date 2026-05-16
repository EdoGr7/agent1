import { describe, it, expect } from "vitest";
import { CanvaCarouselBuilder, buildPageOperations, buildElementTypeCounts } from "../src/services/canvaCarouselBuilder.js";
import { CanvaMcpAdapter } from "../src/adapters/canvaMcpAdapter.js";
import { StaticMockMcpClient } from "../src/adapters/mcpClient.js";
import type { CanvaLayoutSpec } from "../src/schemas/canvaLayoutSpec.schema.js";

function makeSpec(): CanvaLayoutSpec {
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
            { type: "image", role: "background_photo", x: 0, y: 0, w: 1080, h: 1350, asset_id: "a1", fit: "cover", opacity: 0.2, editable: true },
            { type: "shape", role: "bottom_overlay", shape: "rectangle", x: 0, y: 600, w: 1080, h: 750, fill: "#231E1A", opacity: 0.75, editable: true },
            { type: "text", role: "headline", x: 100, y: 780, w: 880, h: 240, text: "x", style: { font_family: "Cormorant Garamond", font_size: 76, color: "#F2EBDC", align: "center" }, editable: true },
            { type: "text", role: "logo", x: 880, y: 1260, w: 140, h: 36, text: "LOONIVA", style: { font_family: "Cormorant Garamond", font_size: 22, color: "#F2EBDC", align: "right" }, editable: true },
          ],
        },
        {
          page_number: 2,
          layout_type: "CTA",
          background: { type: "color", color: "#F2EBDC" },
          elements: [
            { type: "text", role: "headline", x: 100, y: 320, w: 880, h: 460, text: "cta", style: { font_family: "Cormorant Garamond", font_size: 72, color: "#3C342E", align: "center" }, editable: true },
            { type: "shape", role: "cta_pill", shape: "rounded_rectangle", x: 290, y: 880, w: 500, h: 110, fill: "#3C342E", border_radius: 55, opacity: 1, editable: true },
            { type: "text", role: "cta_label", x: 290, y: 880, w: 500, h: 110, text: "Scopri Looniva", style: { font_family: "Source Serif Pro", font_size: 28, color: "#F2EBDC", align: "center" }, editable: true },
            { type: "text", role: "logo", x: 480, y: 1240, w: 120, h: 30, text: "LOONIVA", style: { font_family: "Cormorant Garamond", font_size: 22, color: "#3C342E", align: "center" }, editable: true },
          ],
        },
      ],
    },
  };
}

describe("CanvaCarouselBuilder", () => {
  it("invokes editing-transaction flow and never calls export-design", async () => {
    const calls: string[] = [];
    const mock = new StaticMockMcpClient()
      .on("mcp__canva__generate-design-structured", async () => {
        calls.push("create");
        return { structuredContent: { design_id: "DESIGN_1" } };
      })
      .on("mcp__canva__start-editing-transaction", async () => {
        calls.push("start");
        return { structuredContent: { transaction_id: "TX_1" } };
      })
      .on("mcp__canva__perform-editing-operations", async () => {
        calls.push("perform");
        return { structuredContent: { element_ids: ["el_a", "el_b", "el_c"] } };
      })
      .on("mcp__canva__commit-editing-transaction", async () => {
        calls.push("commit");
        return { structuredContent: { ok: true } };
      })
      .on("mcp__canva__get-design", async () => {
        calls.push("get");
        return {
          structuredContent: {
            design_id: "DESIGN_1",
            urls: { edit_url: "https://canva.com/design/DESIGN_1/edit" },
            page_count: 2,
            width: 1080,
            height: 1350,
          },
        };
      });

    const adapter = new CanvaMcpAdapter(mock);
    const builder = new CanvaCarouselBuilder(adapter);
    const out = await builder.build(makeSpec());

    expect(out.designId).toBe("DESIGN_1");
    expect(out.editUrl).toBe("https://canva.com/design/DESIGN_1/edit");
    expect(calls).toEqual(["create", "start", "perform", "perform", "commit", "get"]);
    expect(calls).not.toContain("export");
  });

  it("buildPageOperations adds add_page first, then one op per element", () => {
    const ops = buildPageOperations(makeSpec().design.pages[0]!);
    expect(ops[0]!.type).toBe("add_page");
    expect(ops.slice(1).map((o) => o.type)).toEqual(["add_image", "add_shape", "add_text", "add_text"]);
  });

  it("buildElementTypeCounts reports element counts per page", () => {
    const counts = buildElementTypeCounts(makeSpec());
    expect(counts[1]).toMatchObject({ image: 1, shape: 1, text: 2 });
    expect(counts[2]).toMatchObject({ shape: 1, text: 3 });
  });
});
