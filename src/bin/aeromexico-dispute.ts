#!/usr/bin/env node
import { Command } from "commander";
import { runInteractiveCli, runDisputeTask, DISPUTE_TASKS } from "../agents/aeromexicoDisputeAgent.js";
import type { DisputeTaskName } from "../agents/aeromexicoDisputeAgent.js";

interface CliOpts {
  task?: string;
  model?: string;
  maxTurns?: string;
}

async function main() {
  const program = new Command();
  program
    .name("aeromexico-dispute")
    .description(
      "Agente autonomo per la disputa Aeroméxico (WPRZZP). Connesso a Gmail via MCP.\n" +
      "Task predefiniti: monitor | status | escalate | profeco | ecc-net",
    )
    .option(
      "-t, --task <name>",
      "Esegui un task predefinito e termina (monitor|status|escalate|profeco|ecc-net)",
    )
    .option("-m, --model <model>", "Modello Claude da usare")
    .option("--max-turns <n>", "Numero massimo di turni agentici", "20");

  program.parse();
  const opts = program.opts<CliOpts>();
  const agentOpts = {
    model: opts.model,
    maxTurns: opts.maxTurns ? parseInt(opts.maxTurns, 10) : 20,
  };

  if (opts.task) {
    const key = opts.task as DisputeTaskName;
    const prompt = DISPUTE_TASKS[key];
    if (!prompt) {
      console.error(`Task sconosciuto: "${opts.task}". Valori validi: ${Object.keys(DISPUTE_TASKS).join(", ")}`);
      process.exit(1);
    }
    await runDisputeTask(prompt, agentOpts);
    console.log("\n");
    return;
  }

  await runInteractiveCli(agentOpts);
}

main().catch((err) => {
  console.error("Errore fatale:", err);
  process.exit(1);
});
