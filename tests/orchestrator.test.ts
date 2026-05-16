import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { LoonivaCanvaCarouselAgent } from "../src/agents/loonivaCanvaCarouselAgent.js";
import type { McpClient } from "../src/adapters/mcpClient.js";
import { StaticMockMcpClient } from "../src/adapters/mcpClient.js";
import { ImageStaging } from "../src/services/imageStaging.js";

let tmpDir: string;
let productPath: string;
let stagingDir: string;

async function makeJpeg(p: string): Promise<void> {
  const img = await sharp({
    create: { width: 1080, height: 1350, channels: 3, background: { r: 60, g: 52, b: 46 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
  await fs.writeFile(p, img);
}

const FIVE_PROMPTS = [
  "PROMPT 1 — PHOTOREAL UPGRADE",
  "An extensively detailed photoreal upgrade prompt with face realism, fabric realism, environmental materials, light on skin and fabric, camera and optics, anti-AI cues. ".repeat(8),
  "---",
  "PROMPT 2 — LIGHT UPGRADE",
  "An extensively detailed light upgrade prompt with face realism, fabric realism, environmental materials, light on skin and fabric, camera and optics, anti-AI cues. ".repeat(8),
  "---",
  "PROMPT 3 — TEXTURE HERO",
  "An extensively detailed texture hero prompt with face realism, fabric realism, environmental materials, light on skin and fabric, camera and optics, anti-AI cues. ".repeat(8),
  "---",
  "PROMPT 4 — COMPOSITION ELEVATION",
  "An extensively detailed composition elevation prompt with face realism, fabric realism, environmental materials, light on skin and fabric, camera and optics, anti-AI cues. ".repeat(8),
  "---",
  "PROMPT 5 — WILD CARD IMPROVEMENT",
  "An extensively detailed wild card improvement prompt with face realism, fabric realism, environmental materials, light on skin and fabric, camera and optics, anti-AI cues. ".repeat(8),
].join("\n\n");

const FAKE_SLIDE_COPY = {
  topic: "Test topic",
  brief: "Brief",
  cta: "Scopri Looniva",
  slides: [
    {
      slide_number: 1,
      visual_brain_stage: "HOOK",
      layout_type: "HOOK_PHOTO",
      headline: "La notte è uno spazio adulto",
      subtitle: "Cosa cambia con il bambù.",
    },
    {
      slide_number: 2,
      visual_brain_stage: "BUILD",
      layout_type: "BUILD_LIGHT",
      headline: "Tre fattori che cambiano la notte",
      items: [
        { label: "Termoregolazione", body: "Il bambù dissipa il calore in modo continuo." },
        { label: "Mano", body: "Lo sateen di bambù ha una lucentezza direzionale." },
        { label: "Filiera", body: "Tracciamento dalla coltivazione alla cucitura." },
      ],
    },
    {
      slide_number: 3,
      visual_brain_stage: "TENSION",
      layout_type: "TENSION_DARK",
      headline: "Cosa non viene detto",
      subtitle: "Molti claim ambientali restano non dimostrati.",
    },
    {
      slide_number: 4,
      visual_brain_stage: "PAYOFF",
      layout_type: "PAYOFF_LIGHT",
      headline: "Coerenza, non promesse",
      items: [
        { label: "Origine", body: "Coltivazione tracciabile e certificata." },
        { label: "Standard", body: "Conforme a OEKO-TEX Standard 100." },
      ],
      payoff_claim: "Per questo Looniva lavora sulla scelta del materiale e sulle certificazioni.",
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

class MockSkillRunner {
  async runSkill(name: string): Promise<string> {
    if (name === "pinterest-to-nanobanana") return FIVE_PROMPTS;
    if (name === "looniva-carousel") return "```json\n" + JSON.stringify(FAKE_SLIDE_COPY, null, 2) + "\n```";
    throw new Error(`unexpected skill: ${name}`);
  }
}

async function buildHigssBase64Mock(): Promise<McpClient> {
  const validJpegBuf = await fs.readFile(productPath);
  const validBase64 = validJpegBuf.toString("base64");
  let count = 0;
  return new StaticMockMcpClient().on("mcp__highssfield__generate_image", async () => {
    count += 1;
    return {
      content: [{ type: "image", data: validBase64, mimeType: "image/jpeg" }],
      structuredContent: { seed: String(count) },
    };
  });
}

function buildCanvaMock(): McpClient {
  let txCounter = 0;
  let assetCounter = 0;
  return new StaticMockMcpClient()
    .on("mcp__canva__generate-design-structured", async () => ({
      structuredContent: { design_id: "DESIGN_MOCK" },
    }))
    .on("mcp__canva__upload-asset-from-url", async () => {
      assetCounter += 1;
      return { structuredContent: { asset_id: `ASSET_${assetCounter}` } };
    })
    .on("mcp__canva__start-editing-transaction", async () => {
      txCounter += 1;
      return { structuredContent: { transaction_id: `TX_${txCounter}` } };
    })
    .on("mcp__canva__perform-editing-operations", async () => ({
      structuredContent: { element_ids: ["e1", "e2", "e3"] },
    }))
    .on("mcp__canva__commit-editing-transaction", async () => ({ structuredContent: { ok: true } }))
    .on("mcp__canva__get-design", async () => ({
      structuredContent: {
        design_id: "DESIGN_MOCK",
        urls: { edit_url: "https://canva.com/design/DESIGN_MOCK/edit" },
        page_count: 5,
        width: 1080,
        height: 1350,
      },
    }));
}

class FakeStaging extends ImageStaging {
  constructor(private readonly base: string) {
    super({ baseUrl: base });
  }
  override isConfigured(): boolean {
    return true;
  }
  override async upload(filePath: string, runId: string): Promise<string> {
    return `${this.base}${runId}/${path.basename(filePath)}`;
  }
}

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "looniva-orch-"));
  productPath = path.join(tmpDir, "prod.jpg");
  stagingDir = path.join(tmpDir, "staging");
  await fs.mkdir(stagingDir, { recursive: true });
  await makeJpeg(productPath);
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LoonivaCanvaCarouselAgent (with mocks)", () => {
  it("happy path with all mocks succeeds and returns canva_edit_url", async () => {
    const agent = new LoonivaCanvaCarouselAgent(
      {
        skillRunner: new MockSkillRunner(),
        highssfieldMcp: await buildHigssBase64Mock(),
        canvaMcp: buildCanvaMock(),
        staging: new FakeStaging("https://staging.example.com/"),
      },
      { defaultOutputDir: tmpDir },
    );
    const result = await agent.run({
      brief: "Perché il bambù è diverso dal cotone",
      product_image_paths: [productPath],
    });
    if (result.status === "failed") {
      console.error("Failure details:", result.error_code, result.error_message);
    }
    expect(["success", "partial_success"]).toContain(result.status);
    expect(result.canva_design_id).toBe("DESIGN_MOCK");
    expect(result.canva_edit_url).toContain("canva.com/design/DESIGN_MOCK/edit");
    expect(result.slide_count).toBe(5);
    expect(result.nanobanana_prompts).toHaveLength(5);
    expect(result.generated_images.length).toBeGreaterThanOrEqual(3);
    expect(result.quality_report.passed).toBe(true);
  });

  it("fails fast when /pinterest-to-nanobanana returns malformed output", async () => {
    class BrokenRunner {
      async runSkill(): Promise<string> {
        return "garbage no markers";
      }
    }
    const agent = new LoonivaCanvaCarouselAgent(
      {
        skillRunner: new BrokenRunner(),
        highssfieldMcp: await buildHigssBase64Mock(),
        canvaMcp: buildCanvaMock(),
        staging: new FakeStaging("https://staging.example.com/"),
      },
      { defaultOutputDir: tmpDir },
    );
    const result = await agent.run({
      brief: "x",
      product_image_paths: [productPath],
    });
    expect(result.status).toBe("failed");
    expect(result.error_code).toBe("PROMPT_PARSE_ERROR");
  });

  it("fails with INSUFFICIENT_VALID_IMAGES when Higgsfield returns no usable refs", async () => {
    const higgsMock = new StaticMockMcpClient().on(
      "mcp__highssfield__generate_image",
      async () => ({ structuredContent: { unknown_field: "x" } }),
    );
    const agent = new LoonivaCanvaCarouselAgent(
      {
        skillRunner: new MockSkillRunner(),
        highssfieldMcp: higgsMock,
        canvaMcp: buildCanvaMock(),
        staging: new FakeStaging("https://staging.example.com/"),
      },
      { defaultOutputDir: tmpDir },
    );
    const result = await agent.run({
      brief: "x",
      product_image_paths: [productPath],
    });
    expect(result.status).toBe("failed");
    expect(result.error_code).toBe("INSUFFICIENT_VALID_IMAGES");
  }, 30000);
});
