import { describe, it, expect } from "vitest";
import { HighssfieldAdapter } from "../src/adapters/highssfieldAdapter.js";
import { StaticMockMcpClient } from "../src/adapters/mcpClient.js";
import { AgentError } from "../src/utils/errors.js";

const PREFIX = "mcp__highssfield";

describe("HighssfieldAdapter", () => {
  it("returns kind=url when generate_image responds with image_url", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__generate_image`, async () => ({
      structuredContent: { image_url: "https://cdn.example.com/img1.jpg", seed: "42", model: "soulid" },
    }));
    const out = await new HighssfieldAdapter(mock, { toolPrefix: PREFIX, retries: 0 }).generateImage({ prompt: "p" });
    expect(out.raw).toEqual({ kind: "url", url: "https://cdn.example.com/img1.jpg" });
    expect(out.seed).toBe("42");
  });

  it("returns kind=base64 when generate_image responds with image content", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__generate_image`, async () => ({
      content: [{ type: "image", data: "iVBORw0KGgo".repeat(20), mimeType: "image/png" }],
    }));
    const out = await new HighssfieldAdapter(mock, { toolPrefix: PREFIX, retries: 0 }).generateImage({ prompt: "p" });
    if (out.raw.kind !== "base64") throw new Error("expected base64");
    expect(out.raw.mime).toContain("png");
  });

  it("polls a job_id until completion", async () => {
    let calls = 0;
    const mock = new StaticMockMcpClient()
      .on(`${PREFIX}__generate_image`, async () => ({ structuredContent: { job_id: "job_1" } }))
      .on(`${PREFIX}__job_display`, async () => {
        calls += 1;
        if (calls < 2) return { structuredContent: { status: "running" } };
        return { structuredContent: { status: "completed", image_url: "https://cdn.example.com/jobimg.jpg" } };
      });
    const out = await new HighssfieldAdapter(mock, {
      toolPrefix: PREFIX,
      retries: 0,
      pollIntervalMs: [1, 1, 1, 1],
      maxPollMs: 5_000,
    }).generateImage({ prompt: "p" });
    expect(out.raw.kind).toBe("url");
    expect(out.jobId).toBe("job_1");
  });

  it("resolves an asset_id via show_medias", async () => {
    const mock = new StaticMockMcpClient()
      .on(`${PREFIX}__generate_image`, async () => ({ structuredContent: { asset_id: "asset_42" } }))
      .on(`${PREFIX}__show_medias`, async () => ({ structuredContent: { url: "https://cdn.example.com/asset_42.jpg" } }));
    const out = await new HighssfieldAdapter(mock, { toolPrefix: PREFIX, retries: 0 }).generateImage({ prompt: "p" });
    if (out.raw.kind !== "asset_id") throw new Error("expected asset_id");
    expect(out.raw.resolvedUrl).toContain("asset_42");
  });

  it("throws HIGHSSFIELD_GENERATION_ERROR when generate_image errors", async () => {
    const mock = new StaticMockMcpClient().on(`${PREFIX}__generate_image`, async () => ({
      isError: true,
      content: [{ type: "text", text: "rate limit" }],
    }));
    await expect(
      new HighssfieldAdapter(mock, { toolPrefix: PREFIX, retries: 0 }).generateImage({ prompt: "p" }),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("retries on transient failure", async () => {
    let attempts = 0;
    const mock = new StaticMockMcpClient().on(`${PREFIX}__generate_image`, async () => {
      attempts += 1;
      if (attempts === 1) return { isError: true, content: [{ type: "text", text: "transient" }] };
      return { structuredContent: { image_url: "https://cdn.example.com/ok.jpg" } };
    });
    const out = await new HighssfieldAdapter(mock, { toolPrefix: PREFIX, retries: 2 }).generateImage({ prompt: "p" });
    expect(out.raw.kind).toBe("url");
    expect(attempts).toBe(2);
  });
});
