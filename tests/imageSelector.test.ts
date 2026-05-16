import { describe, it, expect } from "vitest";
import { selectImages, type SelectionCandidate } from "../src/services/imageSelector.js";

function probe(width: number, height: number, brightness = 128, entropy = 6) {
  return {
    width,
    height,
    format: "jpeg",
    size: 100_000,
    brightness,
    entropy,
    aspectRatio: width / height,
  };
}

describe("selectImages", () => {
  it("selects at least 3 images with role assignment", () => {
    const candidates: SelectionCandidate[] = [
      { prompt_number: 1, axis: "PHOTOREAL UPGRADE", local_path: "/a.jpg", probe: probe(1080, 1350) },
      { prompt_number: 2, axis: "LIGHT UPGRADE", local_path: "/b.jpg", probe: probe(1080, 1350) },
      { prompt_number: 3, axis: "TEXTURE HERO", local_path: "/c.jpg", probe: probe(1080, 1350) },
      { prompt_number: 4, axis: "COMPOSITION ELEVATION", local_path: "/d.jpg", probe: probe(1080, 1350) },
      { prompt_number: 5, axis: "WILD CARD IMPROVEMENT", local_path: "/e.jpg", probe: probe(1080, 1350) },
    ];
    const { selected } = selectImages(candidates);
    expect(selected.length).toBeGreaterThanOrEqual(3);
    expect(selected.every((s) => s.suggested_role)).toBe(true);
    expect(selected.every((s) => typeof s.score === "number")).toBe(true);
    expect(selected.every((s) => typeof s.selection_reason === "string")).toBe(true);
  });

  it("discards images that fail technical thresholds, but still meets the minimum via promotion", () => {
    const candidates: SelectionCandidate[] = [
      { prompt_number: 1, axis: "PHOTOREAL UPGRADE", local_path: "/a.jpg", probe: probe(1080, 1350) },
      { prompt_number: 2, axis: "LIGHT UPGRADE", local_path: "/b.jpg", probe: probe(1080, 1350) },
      { prompt_number: 3, axis: "TEXTURE HERO", local_path: "/c.jpg", probe: probe(200, 250) },
      { prompt_number: 4, axis: "COMPOSITION ELEVATION", local_path: "/d.jpg", probe: probe(1080, 1350) },
      { prompt_number: 5, axis: "WILD CARD IMPROVEMENT", local_path: "/e.jpg", probe: probe(1080, 1350) },
    ];
    const { selected } = selectImages(candidates);
    expect(selected.length).toBeGreaterThanOrEqual(3);
    expect(selected.find((s) => s.path_or_url === "/c.jpg")?.selected).not.toBe(true);
  });
});
