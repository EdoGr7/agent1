import { describe, it, expect, beforeAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateInput } from "../src/services/inputValidator.js";
import { AgentError } from "../src/utils/errors.js";

let tmpDir: string;
let p1: string;
let p2: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "looniva-validator-"));
  p1 = path.join(tmpDir, "prod_1.jpg");
  p2 = path.join(tmpDir, "prod_2.png");
  await fs.writeFile(p1, "x");
  await fs.writeFile(p2, "x");
});

describe("validateInput", () => {
  it("accepts a valid input with brief + product photos", async () => {
    const out = await validateInput(
      {
        brief: "Perché la viscosa di bambù è diversa dal cotone",
        product_image_paths: [p1, p2],
      },
      tmpDir,
    );
    expect(out.brief).toBeDefined();
    expect(out.product_image_paths).toHaveLength(2);
    expect(out.resolvedOutputDir).toBe(tmpDir);
  });

  it("fails without product_image_paths", async () => {
    await expect(
      validateInput({ brief: "x", product_image_paths: [] }, tmpDir),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("fails when none of brief/reference/protagonist provided", async () => {
    await expect(
      validateInput({ product_image_paths: [p1] }, tmpDir),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("fails when slide_count is out of range", async () => {
    await expect(
      validateInput(
        { brief: "x", product_image_paths: [p1], slide_count: 3 },
        tmpDir,
      ),
    ).rejects.toBeInstanceOf(AgentError);
    await expect(
      validateInput(
        { brief: "x", product_image_paths: [p1], slide_count: 15 },
        tmpDir,
      ),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("rejects unsupported extensions", async () => {
    const bad = path.join(tmpDir, "prod_3.gif");
    await fs.writeFile(bad, "x");
    await expect(
      validateInput({ brief: "x", product_image_paths: [bad] }, tmpDir),
    ).rejects.toBeInstanceOf(AgentError);
  });

  it("rejects nonexistent image paths", async () => {
    await expect(
      validateInput({ brief: "x", product_image_paths: ["/nope.jpg"] }, tmpDir),
    ).rejects.toBeInstanceOf(AgentError);
  });
});
