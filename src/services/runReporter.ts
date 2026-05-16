import path from "node:path";
import { writeText } from "../utils/fileStorage.js";
import type { ManifestData } from "./checkpointManager.js";
import type { NanobananaPrompt, GeneratedImage } from "../schemas/generatedImage.schema.js";
import type { SlideOutput, QualityReport } from "../schemas/loonivaAgentOutput.schema.js";

export interface ReportInputs {
  manifest: ManifestData;
  prompts: NanobananaPrompt[];
  generatedImages: GeneratedImage[];
  selectedImages: GeneratedImage[];
  slides: SlideOutput[];
  qualityReport: QualityReport;
  fontFallbacksUsed: string[];
  removedClaims: string[];
  warnings: string[];
}

export async function writeReportMarkdown(
  reportPath: string,
  inputs: ReportInputs,
): Promise<void> {
  const lines: string[] = [];
  lines.push(`# Looniva Canva Carousel — Run ${inputs.manifest.run_id}`);
  lines.push("");
  lines.push(`**Topic**: ${inputs.manifest.topic || "(none)"}`);
  lines.push(`**Brief**: ${inputs.manifest.brief || "(none)"}`);
  lines.push(`**Status**: ${inputs.manifest.status}`);
  lines.push(`**Created**: ${inputs.manifest.created_at}`);
  lines.push("");
  if (inputs.manifest.canva_edit_url) {
    lines.push("## Canva editable design");
    lines.push("");
    lines.push(`Open in Canva: ${inputs.manifest.canva_edit_url}`);
    lines.push("");
    lines.push(`Design ID: \`${inputs.manifest.canva_design_id ?? "n/a"}\``);
    lines.push("");
  }

  lines.push("## Workflow summary");
  lines.push("");
  for (const [k, v] of Object.entries(inputs.manifest.steps)) {
    lines.push(`- ${v ? "[x]" : "[ ]"} ${k}`);
  }
  lines.push("");

  lines.push("## Nanobanana prompts");
  lines.push("");
  for (const p of inputs.prompts) {
    lines.push(`### PROMPT ${p.prompt_number} — ${p.axis}`);
    lines.push("");
    lines.push("```");
    lines.push(p.prompt);
    lines.push("```");
    lines.push("");
  }

  lines.push("## Generated images");
  lines.push("");
  for (const img of inputs.generatedImages) {
    lines.push(
      `- \`${img.id}\` (prompt ${img.source_prompt_number} · ${img.axis}) → ${img.path_or_url}${
        img.canva_asset_id ? ` · canva:\`${img.canva_asset_id}\`` : ""
      }`,
    );
  }
  lines.push("");

  lines.push("## Selected images");
  lines.push("");
  for (const img of inputs.selectedImages) {
    lines.push(
      `- \`${img.id}\` · role **${img.suggested_role ?? "n/a"}** · score ${img.score.toFixed(2)} — ${img.selection_reason}`,
    );
  }
  lines.push("");

  lines.push("## Slides");
  lines.push("");
  for (const s of inputs.slides) {
    lines.push(
      `${s.slide_number}. **${s.layout_type}** — ${s.headline}${
        s.subtitle ? `  \n   _${s.subtitle}_` : ""
      }`,
    );
  }
  lines.push("");

  if (inputs.fontFallbacksUsed.length > 0) {
    lines.push("## Font fallbacks");
    lines.push("");
    for (const f of inputs.fontFallbacksUsed) lines.push(`- ${f}`);
    lines.push("");
  }

  if (inputs.removedClaims.length > 0) {
    lines.push("## Claim rimossi o riformulati");
    lines.push("");
    for (const c of inputs.removedClaims) lines.push(`- ${c}`);
    lines.push("");
  }

  lines.push("## Quality report");
  lines.push("");
  lines.push(`Passed: **${inputs.qualityReport.passed}**`);
  if (inputs.qualityReport.issues.length > 0) {
    lines.push("");
    lines.push("### Issues");
    for (const i of inputs.qualityReport.issues) lines.push(`- ${i}`);
  }
  if (inputs.qualityReport.warnings.length > 0) {
    lines.push("");
    lines.push("### Warnings");
    for (const w of inputs.qualityReport.warnings) lines.push(`- ${w}`);
  }
  lines.push("");

  if (inputs.warnings.length > 0) {
    lines.push("## Run warnings");
    lines.push("");
    for (const w of inputs.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push("## Limiti tecnici noti");
  lines.push("");
  lines.push(
    "- I PNG non sono generati: l'output finale è il design Canva editabile.",
  );
  lines.push(
    "- L'editabilità è garantita via editing transaction quando il Canva MCP la supporta.",
  );
  lines.push(
    "- Le foto sono asset Canva separati; lo sfondo è un colore separato; testi, numeri e box sono elementi distinti.",
  );
  lines.push("");

  await writeText(path.resolve(reportPath), lines.join("\n"));
}
