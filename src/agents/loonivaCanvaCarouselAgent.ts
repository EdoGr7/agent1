import path from "node:path";
import { promises as fs } from "node:fs";
import { logger } from "../utils/logger.js";
import { AgentError, isAgentError } from "../utils/errors.js";
import { validateInput, type ValidatedInput } from "../services/inputValidator.js";
import { parseNanobananaPrompts, formatPromptsMarkdown } from "../services/promptParser.js";
import { selectImages, type SelectionCandidate } from "../services/imageSelector.js";
import { normalizeImage, type NormalizedImage, type RawImageOutput } from "../services/imageNormalizer.js";
import { validateAndCleanCopy, assignImagesToPhotoSlides } from "../services/loonivaCopyPlanner.js";
import { buildCanvaLayoutSpec, assertSpecHasEditableElements } from "../services/canvaLayoutSpecBuilder.js";
import { CanvaCarouselBuilder } from "../services/canvaCarouselBuilder.js";
import { runQualityCheck } from "../services/qualityChecker.js";
import { writeReportMarkdown } from "../services/runReporter.js";
import { CheckpointManager, type ManifestData } from "../services/checkpointManager.js";
import { slugify, timestampSlug } from "../utils/slugify.js";
import { ensureDir, readJson, writeJson, writeText, pathExists } from "../utils/fileStorage.js";
import { PinterestToNanobananaAdapter } from "../adapters/pinterestToNanobananaAdapter.js";
import { LoonivaCarouselAdapter } from "../adapters/loonivaCarouselAdapter.js";
import { HighssfieldAdapter } from "../adapters/highssfieldAdapter.js";
import { CanvaMcpAdapter } from "../adapters/canvaMcpAdapter.js";
import { ImageStaging } from "../services/imageStaging.js";
import type { McpClient } from "../adapters/mcpClient.js";
import type { SkillRunner } from "../adapters/pinterestToNanobananaAdapter.js";
import type { GeneratedImage, NanobananaAxis, NanobananaPrompt } from "../schemas/generatedImage.schema.js";
import type { LoonivaAgentInput } from "../schemas/loonivaAgentInput.schema.js";
import type { LoonivaAgentOutput, SlideOutput } from "../schemas/loonivaAgentOutput.schema.js";

export interface AgentDeps {
  skillRunner: SkillRunner;
  highssfieldMcp: McpClient;
  canvaMcp: McpClient;
  staging?: ImageStaging;
}

export interface AgentOptions {
  defaultOutputDir: string;
  runId?: string;
}

export class LoonivaCanvaCarouselAgent {
  private readonly pinterest: PinterestToNanobananaAdapter;
  private readonly looniva: LoonivaCarouselAdapter;
  private readonly higgs: HighssfieldAdapter;
  private readonly canva: CanvaMcpAdapter;
  private readonly staging: ImageStaging;

  constructor(deps: AgentDeps, private readonly opts: AgentOptions) {
    this.pinterest = new PinterestToNanobananaAdapter(deps.skillRunner);
    this.looniva = new LoonivaCarouselAdapter(deps.skillRunner);
    this.higgs = new HighssfieldAdapter(deps.highssfieldMcp);
    this.canva = new CanvaMcpAdapter(deps.canvaMcp);
    this.staging = deps.staging ?? new ImageStaging();
  }

  async run(rawInput: LoonivaAgentInput): Promise<LoonivaAgentOutput> {
    const input: ValidatedInput = await validateInput(rawInput, this.opts.defaultOutputDir);
    const topic = input.carousel_topic ?? input.brief ?? "looniva";
    const runId =
      this.opts.runId ?? `run_${timestampSlug()}_${slugify(topic).slice(0, 32)}`;
    const runDir = path.join(input.resolvedOutputDir, runId);
    await prepareRunDir(runDir);

    const checkpoint = new CheckpointManager(runDir);
    const manifest = await checkpoint.loadOrCreate({
      run_id: runId,
      topic,
      brief: input.brief ?? "",
    });

    const warnings: string[] = [];
    const removedClaims: string[] = [];

    try {
      await checkpoint.markStep("input_validated", true);

      const prompts = await this.stepPrompts(runDir, checkpoint, input, manifest);
      const generated = await this.stepGenerate(runDir, checkpoint, prompts, manifest);
      const selected = await this.stepSelectAndStage(runDir, checkpoint, generated, manifest, warnings);
      const assets = await this.stepUploadAssets(runDir, checkpoint, selected, manifest);
      const slideDoc = await this.stepPlanCopy(runDir, checkpoint, input, assets, manifest, removedClaims);
      const spec = await this.stepBuildLayoutSpec(runDir, checkpoint, slideDoc, topic);
      const buildResult = await this.stepCreateDesign(checkpoint, spec, manifest);
      const quality = await this.stepQualityCheck(
        checkpoint,
        spec,
        buildResult.designProbe,
        removedClaims,
        buildResult.fontFallbacksUsed,
        warnings,
      );

      const slideOutputs: SlideOutput[] = slideDoc.slides.map((s) => ({
        slide_number: s.slide_number,
        layout_type: s.layout_type,
        headline: s.headline,
        ...(s.subtitle ? { subtitle: s.subtitle } : {}),
        ...(s.items ? { items: s.items } : {}),
        ...(s.dato_numerico ? { dato_numerico: s.dato_numerico } : {}),
        ...(s.assigned_image ? { photo_used: s.assigned_image } : {}),
        ...(s.assigned_canva_asset_id ? { canva_asset_id: s.assigned_canva_asset_id } : {}),
      }));

      await checkpoint.update({
        slide_count: slideOutputs.length,
        canva_design_id: buildResult.designId,
        canva_edit_url: buildResult.editUrl ?? null,
        slides: slideOutputs,
        quality_report: quality,
        status: quality.passed ? (warnings.length > 0 ? "partial_success" : "success") : "failed",
      });

      const reportPath = path.join(runDir, "report.md");
      await writeReportMarkdown(reportPath, {
        manifest: checkpoint.data,
        prompts,
        generatedImages: generated,
        selectedImages: selected,
        slides: slideOutputs,
        qualityReport: quality,
        fontFallbacksUsed: buildResult.fontFallbacksUsed,
        removedClaims,
        warnings,
      });

      return {
        status: checkpoint.data.status as LoonivaAgentOutput["status"],
        run_id: runId,
        canva_design_id: buildResult.designId,
        canva_edit_url: buildResult.editUrl ?? undefined,
        slide_count: slideOutputs.length,
        slide_copy: slideOutputs,
        nanobanana_prompts: prompts,
        generated_images: generated,
        files: {
          manifest: checkpoint.path,
          report: reportPath,
          canva_layout_spec: path.join(runDir, "canva", "canva_layout_spec.json"),
          slide_copy: path.join(runDir, "canva", "slide_copy.json"),
          prompts: path.join(runDir, "prompts", "prompts.json"),
        },
        quality_report: quality,
      };
    } catch (e) {
      const err = isAgentError(e)
        ? e
        : new AgentError("OUTPUT_REPORT_ERROR", (e as Error).message);
      logger.error({ code: err.code, err: err.message }, "agent run failed");
      await checkpoint.update({
        status: "failed",
        error: { code: err.code, message: err.message },
      });
      try {
        await writeReportMarkdown(path.join(runDir, "report.md"), {
          manifest: checkpoint.data,
          prompts: (checkpoint.data.prompts as NanobananaPrompt[]) ?? [],
          generatedImages: (checkpoint.data.generated_images as GeneratedImage[]) ?? [],
          selectedImages: (checkpoint.data.selected_images as GeneratedImage[]) ?? [],
          slides: [],
          qualityReport: {
            passed: false,
            issues: [`${err.code}: ${err.message}`],
            warnings,
          },
          fontFallbacksUsed: [],
          removedClaims,
          warnings,
        });
      } catch (reportErr) {
        logger.warn({ err: (reportErr as Error).message }, "could not write failure report");
      }
      return {
        status: "failed",
        run_id: runId,
        slide_count: 0,
        slide_copy: [],
        nanobanana_prompts: [],
        generated_images: [],
        files: {
          manifest: checkpoint.path,
          report: path.join(runDir, "report.md"),
        },
        quality_report: { passed: false, issues: [`${err.code}: ${err.message}`], warnings: warnings },
        error_code: err.code,
        error_message: err.message,
      };
    }
  }

  private async stepPrompts(
    runDir: string,
    checkpoint: CheckpointManager,
    input: ValidatedInput,
    manifest: ManifestData,
  ): Promise<NanobananaPrompt[]> {
    const promptsJsonPath = path.join(runDir, "prompts", "prompts.json");
    if (checkpoint.isDone("nanobanana_prompts_generated")) {
      const existing = (manifest.prompts ?? []) as NanobananaPrompt[];
      if (existing.length === 5) return existing;
    }
    const rawOutput = await this.pinterest.invoke({
      brief: input.brief,
      carouselTopic: input.carousel_topic,
      referenceImagePath: input.reference_image_path,
      protagonistImagePath: input.protagonist_image_path,
      productImagePaths: input.product_image_paths,
    });
    await writeText(path.join(runDir, "prompts", "raw_nanobanana_output.txt"), rawOutput);
    const prompts = parseNanobananaPrompts(rawOutput);
    await writeJson(promptsJsonPath, prompts);
    await writeText(path.join(runDir, "prompts", "prompts.md"), formatPromptsMarkdown(prompts));
    await checkpoint.update({ prompts });
    await checkpoint.markStep("nanobanana_prompts_generated", true);
    return prompts;
  }

  private async stepGenerate(
    runDir: string,
    checkpoint: CheckpointManager,
    prompts: NanobananaPrompt[],
    manifest: ManifestData,
  ): Promise<GeneratedImage[]> {
    if (checkpoint.isDone("images_normalized") && (manifest.generated_images?.length ?? 0) >= 3) {
      return manifest.generated_images as GeneratedImage[];
    }
    const generatedDir = path.join(runDir, "generated_images");
    await ensureDir(generatedDir);

    const raws: Array<{ prompt: NanobananaPrompt; raw: RawImageOutput; seed?: string; jobId?: string }> = [];
    for (const p of prompts) {
      try {
        const result = await this.higgs.generateImage({ prompt: p.prompt, aspectRatio: "4:5", width: 1080, height: 1350 });
        raws.push({ prompt: p, raw: result.raw, seed: result.seed, jobId: result.jobId });
      } catch (e) {
        logger.warn(
          { axis: p.axis, err: (e as Error).message },
          "higgsfield generation failed for prompt",
        );
      }
    }

    const normalized: NormalizedImage[] = [];
    const generatedFinal: GeneratedImage[] = [];
    for (const r of raws) {
      try {
        const norm = await normalizeImage(
          r.raw,
          generatedDir,
          `${String(r.prompt.prompt_number).padStart(2, "0")}_${slugify(r.prompt.axis)}`,
        );
        normalized.push(norm);
        generatedFinal.push({
          id: `gen_${r.prompt.prompt_number}_${slugify(r.prompt.axis)}`,
          source_prompt_number: r.prompt.prompt_number,
          axis: r.prompt.axis as NanobananaAxis,
          path_or_url: r.raw.kind === "url" ? r.raw.url : norm.localPath,
          local_path: norm.localPath,
          selected: false,
          score: 0,
          selection_reason: "candidate",
          width: norm.probe.width,
          height: norm.probe.height,
          seed: r.seed,
          job_id: r.jobId,
        });
      } catch (e) {
        logger.warn({ err: (e as Error).message, prompt: r.prompt.prompt_number }, "normalize failed");
      }
    }

    if (generatedFinal.length < 3) {
      throw new AgentError(
        "INSUFFICIENT_VALID_IMAGES",
        `Only ${generatedFinal.length} valid images normalized; need at least 3.`,
      );
    }

    await writeJson(path.join(runDir, "generated_images.json"), generatedFinal);
    await checkpoint.update({ generated_images: generatedFinal });
    await checkpoint.markStep("images_generated", true);
    await checkpoint.markStep("images_normalized", true);
    return generatedFinal;
  }

  private async stepSelectAndStage(
    runDir: string,
    checkpoint: CheckpointManager,
    generated: GeneratedImage[],
    manifest: ManifestData,
    warnings: string[],
  ): Promise<GeneratedImage[]> {
    if (checkpoint.isDone("images_selected") && (manifest.selected_images?.length ?? 0) >= 3) {
      return manifest.selected_images as GeneratedImage[];
    }
    const { selected, rejected } = selectImages(
      generated.map((g) => ({
        prompt_number: g.source_prompt_number,
        axis: g.axis,
        local_path: g.local_path!,
        probe: {
          width: g.width ?? 0,
          height: g.height ?? 0,
          format: "jpeg",
          size: 0,
          brightness: 128,
          entropy: 5,
          aspectRatio: g.width && g.height ? g.width / g.height : 0.8,
        },
      })) as SelectionCandidate[],
    );
    if (selected.length < 3) {
      throw new AgentError(
        "INSUFFICIENT_VALID_IMAGES",
        `Selector produced only ${selected.length} images; min 3 required.`,
      );
    }
    if (rejected.length > 0) {
      warnings.push(`${rejected.length} candidate images rejected by selector`);
    }
    await writeJson(path.join(runDir, "selected_images.json"), selected);
    await checkpoint.update({ selected_images: selected });
    await checkpoint.markStep("images_selected", true);
    return selected;
  }

  private async stepUploadAssets(
    runDir: string,
    checkpoint: CheckpointManager,
    selected: GeneratedImage[],
    manifest: ManifestData,
  ): Promise<GeneratedImage[]> {
    if (checkpoint.isDone("canva_assets_uploaded")) {
      const cached = (manifest.selected_images as GeneratedImage[]) ?? selected;
      if (cached.filter((s) => s.canva_asset_id).length >= 3) return cached;
    }
    const stagingConfigured = this.staging.isConfigured();
    const updated: GeneratedImage[] = [];
    for (const img of selected) {
      if (img.canva_asset_id) {
        updated.push(img);
        continue;
      }
      let url = img.staging_url;
      if (!url) {
        if (!stagingConfigured) {
          throw new AgentError(
            "CANVA_ASSET_UPLOAD_ERROR",
            "TEMP_ASSET_STAGING_URL not configured and image has no public URL. Cannot upload to Canva.",
          );
        }
        url = await this.staging.upload(img.local_path!, checkpoint.data.run_id);
      }
      const { assetId } = await this.canva.uploadAssetFromUrl(url);
      updated.push({ ...img, staging_url: url, canva_asset_id: assetId });
    }
    if (updated.filter((s) => s.canva_asset_id).length < 3) {
      throw new AgentError(
        "CANVA_ASSET_UPLOAD_ERROR",
        "Fewer than 3 images successfully uploaded to Canva.",
      );
    }
    await writeJson(path.join(runDir, "canva", "canva_assets.json"), updated);
    await checkpoint.update({ selected_images: updated, canva_assets: updated.map((s) => ({ id: s.canva_asset_id, source_id: s.id })) });
    await checkpoint.markStep("canva_assets_uploaded", true);
    return updated;
  }

  private async stepPlanCopy(
    runDir: string,
    checkpoint: CheckpointManager,
    input: ValidatedInput,
    assets: GeneratedImage[],
    _manifest: ManifestData,
    removedClaims: string[],
  ) {
    const slideCopyJsonPath = path.join(runDir, "canva", "slide_copy.json");
    if (checkpoint.isDone("copy_planned") && (await pathExists(slideCopyJsonPath))) {
      const cached = await readJson(slideCopyJsonPath);
      const planResult = validateAndCleanCopy(cached);
      return planResult.doc;
    }
    const raw = await this.looniva.planCopy({
      brief: input.brief ?? "",
      carouselTopic: input.carousel_topic,
      productImagePaths: input.product_image_paths,
      slideCount: input.slide_count,
      cta: input.cta,
      outputDir: input.resolvedOutputDir,
      targetAudience: input.target_audience,
      toneOfVoice: input.tone_of_voice,
      selectedImages: assets,
    });
    const planResult = validateAndCleanCopy(raw.slideCopyDoc);
    removedClaims.push(...planResult.issuesAutoFixed.map((i) => `${i.field}: ${i.matched} (${i.reason})`));
    assignImagesToPhotoSlides(planResult.doc, assets);
    await writeJson(path.join(runDir, "canva", "slide_copy.json"), planResult.doc);
    await writeText(path.join(runDir, "canva", "looniva_carousel_raw.txt"), raw.rawText);
    await checkpoint.markStep("copy_planned", true);
    return planResult.doc;
  }

  private async stepBuildLayoutSpec(
    runDir: string,
    checkpoint: CheckpointManager,
    doc: import("../schemas/slideCopy.schema.js").SlideCopyDoc,
    topic: string,
  ) {
    const spec = buildCanvaLayoutSpec(doc, {
      designTitle: `Looniva Carousel - ${topic}`.slice(0, 80),
    });
    assertSpecHasEditableElements(spec);
    await writeJson(path.join(runDir, "canva", "canva_layout_spec.json"), spec);
    await checkpoint.markStep("layout_spec_created", true);
    return spec;
  }

  private async stepCreateDesign(
    checkpoint: CheckpointManager,
    spec: import("../schemas/canvaLayoutSpec.schema.js").CanvaLayoutSpec,
    _manifest: ManifestData,
  ) {
    const builder = new CanvaCarouselBuilder(this.canva);
    const result = await builder.build(spec);
    await checkpoint.update({
      canva_design_id: result.designId,
      canva_edit_url: result.editUrl,
    });
    await checkpoint.markStep("canva_design_created", true);
    return result;
  }

  private async stepQualityCheck(
    checkpoint: CheckpointManager,
    spec: import("../schemas/canvaLayoutSpec.schema.js").CanvaLayoutSpec,
    probe: import("../services/qualityChecker.js").DesignProbe,
    _removedClaims: string[],
    fontFallbacksUsed: string[],
    _warnings: string[],
  ) {
    const report = runQualityCheck({
      spec,
      designProbe: probe,
      factCheckAutoFixed: [],
      fontFallbacksUsed,
    });
    if (!report.passed) {
      throw new AgentError(
        "CANVA_QUALITY_CHECK_FAILED",
        `Quality check failed: ${report.issues.join("; ")}`,
      );
    }
    await checkpoint.update({ quality_report: report });
    await checkpoint.markStep("quality_checked", true);
    return report;
  }
}

async function prepareRunDir(runDir: string): Promise<void> {
  for (const sub of ["input", "prompts", "generated_images", "selected_images", "canva"]) {
    await fs.mkdir(path.join(runDir, sub), { recursive: true });
  }
}
