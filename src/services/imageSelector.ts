import type { GeneratedImage, NanobananaAxis, SuggestedRole } from "../schemas/generatedImage.schema.js";
import type { ImageProbe } from "../utils/imageUtils.js";

export interface SelectionCandidate {
  prompt_number: number;
  axis: NanobananaAxis;
  local_path: string;
  probe: ImageProbe;
  staging_url?: string;
  canva_asset_id?: string;
}

interface TechnicalScore {
  passed: boolean;
  score: number;
  reasons: string[];
}

function scoreTechnical(probe: ImageProbe): TechnicalScore {
  const reasons: string[] = [];
  let score = 0;
  let passed = true;

  if (probe.width < 800 || probe.height < 1000) {
    passed = false;
    reasons.push(`dim ${probe.width}x${probe.height} below 800x1000`);
  } else {
    score += 0.25;
    reasons.push(`dim ok ${probe.width}x${probe.height}`);
  }

  const ar = probe.aspectRatio;
  if (ar < 0.6 || ar > 0.9) {
    passed = false;
    reasons.push(`aspect ratio ${ar.toFixed(2)} out of 0.6..0.9`);
  } else {
    const arDistance = Math.abs(ar - 0.8) / 0.2;
    score += 0.25 * (1 - arDistance);
    reasons.push(`ar ${ar.toFixed(2)} close to 4:5`);
  }

  if (probe.brightness < 30 || probe.brightness > 220) {
    passed = false;
    reasons.push(`brightness ${probe.brightness.toFixed(0)} out of range`);
  } else {
    score += 0.2;
    reasons.push(`brightness ok ${probe.brightness.toFixed(0)}`);
  }

  if (probe.entropy < 4.0) {
    passed = false;
    reasons.push(`entropy ${probe.entropy.toFixed(2)} too low`);
  } else {
    score += 0.3 * Math.min(1, probe.entropy / 7.5);
    reasons.push(`entropy ok ${probe.entropy.toFixed(2)}`);
  }

  return { passed, score: Math.min(1, score), reasons };
}

const AXIS_ROLE_PREF: Record<NanobananaAxis, SuggestedRole> = {
  "PHOTOREAL UPGRADE": "HOOK_PHOTO",
  "LIGHT UPGRADE": "HOOK_PHOTO",
  "TEXTURE HERO": "TEXTURE",
  "COMPOSITION ELEVATION": "TENSION_PHOTO",
  "WILD CARD IMPROVEMENT": "PAYOFF",
};

export interface SelectionResult {
  selected: GeneratedImage[];
  rejected: GeneratedImage[];
}

export function selectImages(
  candidates: SelectionCandidate[],
  options: { min?: number; max?: number } = {},
): SelectionResult {
  const min = options.min ?? 3;
  const max = options.max ?? 5;

  const scored = candidates.map((c) => {
    const tech = scoreTechnical(c.probe);
    const role = AXIS_ROLE_PREF[c.axis];
    const finalScore = tech.passed ? tech.score * 0.7 + 0.3 : tech.score * 0.4;
    return {
      candidate: c,
      tech,
      role,
      finalScore,
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const selected: GeneratedImage[] = [];
  const rejected: GeneratedImage[] = [];
  const usedRoles = new Set<SuggestedRole>();

  for (const entry of scored) {
    const passedTech = entry.tech.passed;
    const wantsSelect = passedTech && selected.length < max;
    const id = `img_${entry.candidate.prompt_number}_${entry.candidate.axis.toLowerCase().replace(/\s+/g, "_")}`;

    const base: GeneratedImage = {
      id,
      source_prompt_number: entry.candidate.prompt_number,
      axis: entry.candidate.axis,
      path_or_url: entry.candidate.local_path,
      local_path: entry.candidate.local_path,
      staging_url: entry.candidate.staging_url,
      canva_asset_id: entry.candidate.canva_asset_id,
      selected: false,
      score: Number(entry.finalScore.toFixed(3)),
      selection_reason: entry.tech.reasons.join("; "),
      suggested_role: entry.role,
      width: entry.candidate.probe.width,
      height: entry.candidate.probe.height,
    };

    if (wantsSelect) {
      const roleAlreadyUsed = usedRoles.has(entry.role);
      const haveMinimum = selected.length >= min;
      if (roleAlreadyUsed && haveMinimum) {
        rejected.push({ ...base, selected: false, selection_reason: `${base.selection_reason}; role ${entry.role} already filled` });
        continue;
      }
      usedRoles.add(entry.role);
      selected.push({ ...base, selected: true });
    } else {
      rejected.push({ ...base, selected: false });
    }
  }

  if (selected.length < min) {
    const fillNeeded = min - selected.length;
    const promoteSorted = [...rejected]
      .filter((r) => r.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, fillNeeded);
    for (const promote of promoteSorted) {
      promote.selected = true;
      promote.selection_reason += "; promoted to meet minimum";
      selected.push(promote);
    }
  }

  return { selected, rejected: rejected.filter((r) => !r.selected) };
}
