import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";
import { normalizeImage } from "../src/services/imageNormalizer.js";
import { AgentError } from "../src/utils/errors.js";

let tmpDir: string;
let realJpegPath: string;
let base64: string;

async function makeJpeg(p: string): Promise<void> {
  const img = await sharp({
    create: { width: 1080, height: 1350, channels: 3, background: { r: 60, g: 52, b: 46 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
  await fs.writeFile(p, img);
}

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "looniva-norm-"));
  realJpegPath = path.join(tmpDir, "source.jpg");
  await makeJpeg(realJpegPath);
  base64 = (await fs.readFile(realJpegPath)).toString("base64");
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("normalizeImage", () => {
  it("normalizes a local path source", async () => {
    const out = await normalizeImage({ kind: "path", path: realJpegPath }, tmpDir, "norm_path");
    expect(out.localPath).toContain("norm_path");
    expect(out.probe.width).toBe(1080);
    expect(out.probe.height).toBe(1350);
  });

  it("normalizes a base64 source", async () => {
    const out = await normalizeImage(
      { kind: "base64", data: base64, mime: "image/jpeg" },
      tmpDir,
      "norm_b64",
    );
    expect(out.probe.size).toBeGreaterThan(1024);
  });

  it("rejects corrupted output", async () => {
    const tiny = Buffer.from("tiny garbage");
    const corrupt64 = tiny.toString("base64");
    await expect(
      normalizeImage(
        { kind: "base64", data: corrupt64, mime: "image/jpeg" },
        tmpDir,
        "norm_bad",
      ),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("refuses to normalize a job-shaped raw input", async () => {
    await expect(
      normalizeImage({ kind: "job", jobId: "j-1" }, tmpDir, "norm_job"),
    ).rejects.toBeInstanceOf(AgentError);
  });
});
