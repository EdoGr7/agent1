import type { CanvaLayoutSpec } from "../schemas/canvaLayoutSpec.schema.js";
import type { QualityReport } from "../schemas/loonivaAgentOutput.schema.js";
import type { FactCheckIssue } from "./factChecker.js";

export interface DesignProbe {
  designId: string | null;
  editUrl: string | null;
  pageCount: number;
  width: number;
  height: number;
  perPageElementTypeCounts: Record<number, Record<string, number>>;
}

export interface QualityInputs {
  spec: CanvaLayoutSpec;
  designProbe: DesignProbe;
  factCheckAutoFixed: FactCheckIssue[];
  fontFallbacksUsed: string[];
}

export function runQualityCheck(inputs: QualityInputs): QualityReport {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!inputs.designProbe.designId) issues.push("missing design_id");
  if (!inputs.designProbe.editUrl) issues.push("missing edit_url");

  if (inputs.designProbe.width !== 1080 || inputs.designProbe.height !== 1350) {
    issues.push(
      `design size ${inputs.designProbe.width}x${inputs.designProbe.height} != 1080x1350`,
    );
  }
  if (inputs.designProbe.pageCount < 5 || inputs.designProbe.pageCount > 12) {
    issues.push(`page count ${inputs.designProbe.pageCount} out of 5..12`);
  }

  const pages = inputs.spec.design.pages;
  const first = pages[0];
  const last = pages[pages.length - 1];
  if (!first || (first.layout_type !== "HOOK_PHOTO" && first.layout_type !== "HOOK_DARK")) {
    issues.push("first slide is not a HOOK layout");
  }
  if (!last || last.layout_type !== "CTA") {
    issues.push("last slide is not CTA");
  }

  const dataDarkPages = pages.filter((p) => p.layout_type === "DATA_DARK");
  for (const page of dataDarkPages) {
    const elementCount = inputs.designProbe.perPageElementTypeCounts[page.page_number] ?? {};
    if (!(elementCount.text && elementCount.text >= 3)) {
      issues.push(
        `DATA_DARK page ${page.page_number} appears to lack separate editable text elements (number/unit/title/body).`,
      );
    }
    const hasNumberElement = page.elements.some(
      (el) => el.type === "text" && el.role === "data_number",
    );
    if (!hasNumberElement) {
      issues.push(`DATA_DARK page ${page.page_number} has no data_number text element in spec.`);
    }
  }

  for (const page of pages) {
    const ec = inputs.designProbe.perPageElementTypeCounts[page.page_number] ?? {};
    const total = Object.values(ec).reduce((a, b) => a + b, 0);
    if (total < 2) {
      issues.push(`page ${page.page_number} appears flat (only ${total} elements detected).`);
    }
    const hasImage = (ec.image ?? 0) > 0;
    const nonImage = total - (ec.image ?? 0);
    if (hasImage && nonImage === 0) {
      issues.push(`page ${page.page_number} is image-only on Canva — likely flat slide.`);
    }
  }

  if (inputs.factCheckAutoFixed.length > 0) {
    warnings.push(
      `${inputs.factCheckAutoFixed.length} em-dash occurrence(s) auto-replaced in copy.`,
    );
  }

  if (inputs.fontFallbacksUsed.length > 0) {
    warnings.push(`font fallback in use: ${inputs.fontFallbacksUsed.join(", ")}`);
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}
