import { AgentError } from "../utils/errors.js";
import type { SkillRunner } from "./pinterestToNanobananaAdapter.js";

interface RunSkillArgs {
  prompt: string;
  attachments: { type: string; path: string; description?: string }[];
}

export interface SdkSkillRunnerOptions {
  maxTurns?: number;
  modelOverride?: string;
}

export class SdkSkillRunner implements SkillRunner {
  private readonly maxTurns: number;
  private readonly modelOverride?: string;

  constructor(opts: SdkSkillRunnerOptions = {}) {
    this.maxTurns = opts.maxTurns ?? 8;
    this.modelOverride = opts.modelOverride;
  }

  async runSkill(skillName: string, args: RunSkillArgs): Promise<string> {
    let sdk: typeof import("@anthropic-ai/claude-agent-sdk");
    try {
      sdk = await import("@anthropic-ai/claude-agent-sdk");
    } catch (e) {
      throw new AgentError(
        "SKILL_NOT_FOUND",
        "@anthropic-ai/claude-agent-sdk is not installed. Install dependencies first or wire a custom SkillRunner.",
        { cause: (e as Error).message },
      );
    }

    const queryFn = (sdk as unknown as { query?: typeof import("@anthropic-ai/claude-agent-sdk").query }).query;
    if (!queryFn) {
      throw new AgentError(
        "SKILL_NOT_FOUND",
        "Claude Agent SDK present but `query` is not exported. SDK version mismatch.",
      );
    }

    const attachmentsBlob = args.attachments
      .map((a) => `[ATTACHMENT type=${a.type}${a.description ? ` description=${a.description}` : ""}] ${a.path}`)
      .join("\n");
    const composite = `${args.prompt}\n\n${attachmentsBlob}\n\nInvoke /${skillName} now.`;

    const collected: string[] = [];
    let turn = 0;
    const iter = queryFn({
      prompt: composite,
      options: {
        cwd: process.cwd(),
        ...(this.modelOverride ? { model: this.modelOverride } : {}),
      },
    });
    for await (const message of iter as AsyncIterable<unknown>) {
      turn++;
      if (turn > this.maxTurns) break;
      const m = message as { type: string; message?: { content?: Array<{ type: string; text?: string }> } };
      if (m.type === "assistant" && m.message?.content) {
        for (const block of m.message.content) {
          if (block.type === "text" && block.text) collected.push(block.text);
        }
      }
    }
    if (collected.length === 0) {
      throw new AgentError("SKILL_NOT_FOUND", `Skill /${skillName} produced no text output.`);
    }
    return collected.join("\n\n");
  }
}
