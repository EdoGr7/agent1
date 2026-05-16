#!/usr/bin/env node
// Use `node --env-file=.env dist/bin/looniva-canva.js` to inject .env (Node >=20).
import path from "node:path";
import { Command } from "commander";
import { logger } from "../utils/logger.js";
import { LoonivaCanvaCarouselAgent } from "../agents/loonivaCanvaCarouselAgent.js";
import { SdkSkillRunner } from "../adapters/sdkSkillRunner.js";
import type { McpClient } from "../adapters/mcpClient.js";

interface CliOpts {
  brief?: string;
  reference?: string;
  protagonist?: string;
  products: string[];
  topic?: string;
  audience?: string;
  tone?: string;
  slides?: string;
  cta?: string;
  output?: string;
  runId?: string;
}

async function main() {
  const program = new Command();
  program
    .name("looniva-canva-carousel")
    .description(
      "End-to-end agent for creating editable Looniva Instagram carousels on Canva.",
    )
    .option("-b, --brief <string>", "Editorial brief (or topic statement)")
    .option("-r, --reference <path>", "Pinterest / reference image path")
    .option("-P, --protagonist <path>", "Protagonist photo path")
    .requiredOption("-p, --products <paths...>", "Looniva product photo paths")
    .option("-t, --topic <string>", "Carousel topic (slug source)")
    .option("--audience <string>", "Target audience")
    .option("--tone <string>", "Tone of voice override")
    .option("-n, --slides <count>", "Slide count (5-12)")
    .option("--cta <string>", "CTA hint")
    .option("-o, --output <dir>", "Output directory")
    .option("--run-id <id>", "Resume an existing run by ID");
  program.parse();
  const opts = program.opts<CliOpts>();

  if (!opts.brief && !opts.reference && !opts.protagonist) {
    console.error("Error: provide at least one of --brief, --reference, --protagonist.");
    process.exit(2);
  }

  const mcpClients = await loadMcpClients();
  if (!mcpClients) process.exit(3);

  const defaultOutputDir =
    opts.output ?? process.env.LOONIVA_OUTPUT_DIR ?? path.resolve("./outputs/looniva_canva_carousels");

  const agent = new LoonivaCanvaCarouselAgent(
    {
      skillRunner: new SdkSkillRunner(),
      canvaMcp: mcpClients.canva,
      highssfieldMcp: mcpClients.highssfield,
    },
    {
      defaultOutputDir,
      runId: opts.runId,
    },
  );

  const result = await agent.run({
    brief: opts.brief,
    reference_image_path: opts.reference,
    protagonist_image_path: opts.protagonist,
    product_image_paths: opts.products,
    carousel_topic: opts.topic,
    target_audience: opts.audience,
    tone_of_voice: opts.tone,
    slide_count: opts.slides ? Number(opts.slides) : undefined,
    cta: opts.cta,
    output_dir: opts.output,
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "failed" ? 1 : 0);
}

async function loadMcpClients(): Promise<
  | {
      canva: McpClient;
      highssfield: McpClient;
    }
  | null
> {
  const wireUrl = (label: string, env: string): string | null => {
    const v = process.env[env];
    if (!v) {
      logger.error({ env }, `${label} MCP not configured`);
      return null;
    }
    return v;
  };
  const canvaUrl = wireUrl("Canva", "CANVA_MCP_URL");
  const higgsUrl = wireUrl("Higgsfield", "HIGHSSFIELD_MCP_URL");
  if (!canvaUrl || !higgsUrl) {
    logger.error(
      "CLI cannot start without CANVA_MCP_URL and HIGHSSFIELD_MCP_URL. Use the in-session driver instead, or wire the SDK MCP options.",
    );
    return null;
  }
  let sdkModule: typeof import("@anthropic-ai/claude-agent-sdk");
  try {
    sdkModule = await import("@anthropic-ai/claude-agent-sdk");
  } catch (e) {
    logger.error({ err: (e as Error).message }, "Claude Agent SDK is required for CLI runs");
    return null;
  }
  const ConnectorCtor = (sdkModule as unknown as { McpHttpClient?: new (opts: { url: string; headers?: Record<string, string> }) => McpClient }).McpHttpClient;
  if (!ConnectorCtor) {
    logger.error(
      "Claude Agent SDK build does not export McpHttpClient. Provide a custom McpClient implementation or upgrade the SDK.",
    );
    return null;
  }
  const canva = new ConnectorCtor({
    url: canvaUrl,
    headers: process.env.CANVA_ACCESS_TOKEN
      ? { authorization: `Bearer ${process.env.CANVA_ACCESS_TOKEN}` }
      : undefined,
  });
  const highssfield = new ConnectorCtor({
    url: higgsUrl,
    headers: process.env.HIGHSSFIELD_MCP_AUTH_TOKEN
      ? { authorization: `Bearer ${process.env.HIGHSSFIELD_MCP_AUTH_TOKEN}` }
      : undefined,
  });
  return { canva, highssfield };
}

main().catch((e) => {
  logger.error({ err: e instanceof Error ? e.message : String(e) }, "Fatal error");
  process.exit(1);
});
