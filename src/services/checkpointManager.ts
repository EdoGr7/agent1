import path from "node:path";
import { readJson, writeJson, pathExists } from "../utils/fileStorage.js";

export const STEP_KEYS = [
  "input_validated",
  "nanobanana_prompts_generated",
  "images_generated",
  "images_normalized",
  "images_selected",
  "canva_assets_uploaded",
  "copy_planned",
  "layout_spec_created",
  "canva_design_created",
  "quality_checked",
] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface ManifestData {
  run_id: string;
  created_at: string;
  topic: string;
  brief: string;
  canva_design_id: string | null;
  canva_edit_url: string | null;
  slide_count: number;
  prompts: unknown[];
  generated_images: unknown[];
  selected_images: unknown[];
  canva_assets: unknown[];
  slides: unknown[];
  quality_report: unknown;
  status: "pending" | "success" | "partial_success" | "failed";
  steps: Record<StepKey, boolean>;
  error?: { code: string; message: string };
}

export class CheckpointManager {
  private readonly manifestPath: string;
  data!: ManifestData;

  constructor(runDir: string) {
    this.manifestPath = path.join(runDir, "manifest.json");
  }

  async loadOrCreate(initial: Partial<ManifestData>): Promise<ManifestData> {
    if (await pathExists(this.manifestPath)) {
      this.data = await readJson<ManifestData>(this.manifestPath);
      return this.data;
    }
    const empty: ManifestData = {
      run_id: initial.run_id ?? "unknown",
      created_at: new Date().toISOString(),
      topic: initial.topic ?? "",
      brief: initial.brief ?? "",
      canva_design_id: null,
      canva_edit_url: null,
      slide_count: 0,
      prompts: [],
      generated_images: [],
      selected_images: [],
      canva_assets: [],
      slides: [],
      quality_report: { passed: false, issues: [], warnings: [] },
      status: "pending",
      steps: STEP_KEYS.reduce((acc, k) => ({ ...acc, [k]: false }), {}) as Record<StepKey, boolean>,
    };
    this.data = { ...empty, ...initial, steps: empty.steps };
    await this.save();
    return this.data;
  }

  isDone(step: StepKey): boolean {
    return this.data.steps[step] === true;
  }

  async markStep(step: StepKey, done: boolean): Promise<void> {
    this.data.steps[step] = done;
    await this.save();
  }

  async update(patch: Partial<ManifestData>): Promise<void> {
    this.data = { ...this.data, ...patch };
    await this.save();
  }

  async save(): Promise<void> {
    await writeJson(this.manifestPath, this.data);
  }

  get path(): string {
    return this.manifestPath;
  }
}
