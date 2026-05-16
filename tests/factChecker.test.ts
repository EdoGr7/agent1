import { describe, it, expect } from "vitest";
import {
  findEmDashes,
  findForbiddenPatterns,
  findUncontextualizedNumbers,
  stripEmDashes,
} from "../src/services/factChecker.js";

describe("factChecker", () => {
  it("finds em dashes in fragments", () => {
    const out = findEmDashes([{ field: "h.0", value: "La notte — un tempo adulto." }]);
    expect(out).toHaveLength(1);
    expect(stripEmDashes("La notte — un tempo adulto.")).not.toMatch(/—/);
  });

  it("flags forbidden marketing patterns", () => {
    const out = findForbiddenPatterns([
      { field: "h.0", value: "Il miglior cotone è rivoluzionario." },
      { field: "h.1", value: "100% sostenibile." },
      { field: "h.2", value: "Una scelta editoriale e adulta." },
    ]);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out.some((i) => /rivoluzionar/.test(i.matched))).toBe(true);
  });

  it("flags uncontextualized numbers outside of DATA_DARK fields", () => {
    const out = findUncontextualizedNumbers(
      [{ field: "slides[0].headline", value: "Una differenza del 27%." }],
      new Set([]),
    );
    expect(out.length).toBe(1);
  });

  it("does not flag bare numbers that are part of names or standards", () => {
    const out = findUncontextualizedNumbers(
      [{ field: "slides[3].items[1].body", value: "Conforme a OEKO-TEX Standard 100." }],
      new Set([]),
    );
    expect(out.length).toBe(0);
  });

  it("does not flag numbers inside DATA_DARK dato_numerico fields", () => {
    const out = findUncontextualizedNumbers(
      [{ field: "slides[2].dato_numerico.number", value: "27%" }],
      new Set(["slides[2].dato_numerico.number"]),
    );
    expect(out.length).toBe(0);
  });
});
