import { describe, it, expect } from "vitest";
import { CanvaMcpAdapter } from "../src/adapters/canvaMcpAdapter.js";
import { StaticMockMcpClient } from "../src/adapters/mcpClient.js";

const PREFIX = "mcp__canva";

describe("CanvaMcpAdapter", () => {
  it("createDesign returns design id and edit url", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__generate-design-structured`, async () => ({
      structuredContent: { design_id: "D_42", urls: { edit_url: "https://canva.com/design/D_42/edit" } },
    }));
    const out = await new CanvaMcpAdapter(mock, { toolPrefix: PREFIX }).createDesign({
      title: "x",
      width: 1080,
      height: 1350,
    });
    expect(out.designId).toBe("D_42");
    expect(out.editUrl).toContain("D_42");
  });

  it("uploadAssetFromUrl returns assetId", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__upload-asset-from-url`, async () => ({
      structuredContent: { asset_id: "A_1" },
    }));
    const out = await new CanvaMcpAdapter(mock, { toolPrefix: PREFIX }).uploadAssetFromUrl(
      "https://x/y.jpg",
    );
    expect(out.assetId).toBe("A_1");
  });

  it("editing transaction lifecycle", async () => {
    const calls: string[] = [];
    const mock = new StaticMockMcpClient()
      .on(`${PREFIX}__start-editing-transaction`, async () => {
        calls.push("start");
        return { structuredContent: { transaction_id: "TX" } };
      })
      .on(`${PREFIX}__perform-editing-operations`, async () => {
        calls.push("perform");
        return { structuredContent: { element_ids: ["e1", "e2"] } };
      })
      .on(`${PREFIX}__commit-editing-transaction`, async () => {
        calls.push("commit");
        return { structuredContent: { ok: true } };
      });
    const adapter = new CanvaMcpAdapter(mock, { toolPrefix: PREFIX });
    const tx = await adapter.startEditingTransaction("D");
    const ops = await adapter.performEditingOperations("D", tx.transactionId, [
      { type: "add_page", args: { page_number: 1 } },
    ]);
    await adapter.commitEditingTransaction("D", tx.transactionId);
    expect(tx.transactionId).toBe("TX");
    expect(ops.elementIds).toEqual(["e1", "e2"]);
    expect(calls).toEqual(["start", "perform", "commit"]);
  });

  it("getDesign extracts the edit URL from canva-style payloads", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__get-design`, async () => ({
      structuredContent: {
        design_id: "D",
        urls: { edit_url: "https://canva.com/design/D/edit" },
        page_count: 7,
        width: 1080,
        height: 1350,
      },
    }));
    const out = await new CanvaMcpAdapter(mock, { toolPrefix: PREFIX }).getDesign("D");
    expect(out.editUrl).toContain("canva.com/design/D/edit");
    expect(out.pageCount).toBe(7);
  });
});
