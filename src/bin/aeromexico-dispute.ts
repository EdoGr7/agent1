#!/usr/bin/env node
import { Command } from "commander";
import { AeromexicoDisputeAgent } from "../agents/aeromexicoDisputeAgent.js";

interface CliOpts {
  prompt?: string;
  model?: string;
  apiKey?: string;
}

async function main() {
  const program = new Command();
  program
    .name("aeromexico-dispute")
    .description(
      "Agente interattivo per la gestione della disputa rimborso con Aeroméxico (caso WPRZZP, Edoardo Guarise).",
    )
    .option("-p, --prompt <text>", "Esegui un singolo prompt e stampa la risposta (modalità non interattiva)")
    .option("-m, --model <model>", "Modello Claude da usare", "claude-opus-4-8")
    .option("-k, --api-key <key>", "Anthropic API key (default: ANTHROPIC_API_KEY env var)");

  program.parse();
  const opts = program.opts<CliOpts>();

  const agent = new AeromexicoDisputeAgent({
    model: opts.model,
    apiKey: opts.apiKey,
  });

  if (opts.prompt) {
    const reply = await agent.runSingle(opts.prompt);
    console.log(reply);
  } else {
    await agent.runInteractive();
  }
}

main().catch((err) => {
  console.error("Errore fatale:", err);
  process.exit(1);
});
