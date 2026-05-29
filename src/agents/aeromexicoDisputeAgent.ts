import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ─── Case Context ──────────────────────────────────────────────────────────────

export const CASE_CONTEXT = `
## CASO: Disputa rimborso con Aeroméxico — Edoardo Guarise

### Dati identificativi
- Passeggero: Edoardo Guarise | Email: gedoardo02@gmail.com | Nazionalità: Italiana
- Codice prenotazione: WPRZZP
- Numero biglietto: 1392164552191
- Riferimento transazione AMEX: AT26110042000010032070
- Importo addebitato: 3.114,00 MXN il 20 aprile 2026
- Numeri caso Aeroméxico: 06660417 e 06661450
- Email assistenza Aeroméxico: amcustomersupport@aeromexico.com
- Tipo tariffa: Tarifa Básica / Light (non rimborsabile secondo Aeroméxico)

### Cronologia
- 20/04/2026: Acquisto su aeromexico.com, addebito AMEX processato, prenotazione attiva in app
- 24/04/2026: Mancato imbarco volo MEX→LAP per infortunio fisico; preso volo alternativo
- 27/04/2026: Check-in volo ritorno AM367 (LAP→MEX) impossibile sia online che in aeroporto
- 27/04/2026: Agente WhatsApp Aeroméxico scrive: "tu reserva se encuentra en un estatus en el que
  el pago no ha sido confirmado adecuadamente, por lo que el total de la compra se te reembolsará
  de manera automática en un periodo de 7 a 15 días después de tu último vuelo no volado."
- 18/05/2026: Risposta formale Edgar E. (caso 06660417): nega rimborso per tariffa non rimborsabile
- 22/05/2026: Seconda risposta Edgar E. (caso 06661450): conferma diniego rimborso
- 29/05/2026: Agente ha creato 4 bozze Gmail e inviato notifica formale azioni legali

### Punto di forza principale
CONTRADDIZIONE DOCUMENTATA: agente WhatsApp (27/4) ha ammesso "pago no confirmado adecuadamente"
e promesso rimborso automatico. Le risposte formali successive dicono invece che il boleto era
"validamente emesso". Queste versioni sono incompatibili — in entrambi i casi Aeroméxico è in torto.

### Canali di escalation (in ordine di priorità)
1. Chargeback American Express (scadenza ~18 agosto 2026) — richiede azione manuale utente nell'app
2. PROFECO — denuncia presso procura messicana consumatori
3. ECC-Net Italia — centro europeo consumatori (info@ecc-net.it)
4. SECTUR — segreteria turismo messico
5. Social media — @aeromexico su X/Twitter e Instagram
`;

// ─── Gmail MCP tool IDs available in this Claude Code session ────────────────

const GMAIL_MCP = "mcp__0879d95b-25ed-46af-9c58-5535a1907006";

// ─── Dispute Agent using claude-agent-sdk query() ────────────────────────────

export interface DisputeAgentOptions {
  maxTurns?: number;
  model?: string;
}

/**
 * Runs a single autonomous task using the claude-agent-sdk query() loop,
 * which has full access to Gmail MCP tools and any other MCP servers
 * connected to the Claude Code session.
 */
export async function runDisputeTask(
  taskPrompt: string,
  opts: DisputeAgentOptions = {},
): Promise<string> {
  const systemContext = `Sei un agente esperto nella gestione di dispute con compagnie aeree.
Hai accesso agli strumenti Gmail MCP (prefisso ${GMAIL_MCP}__) per leggere email, creare bozze
e cercare thread. Usali attivamente per svolgere i compiti assegnati.

${CASE_CONTEXT}

REGOLE OPERATIVE:
- Usa SEMPRE gmail search per verificare lo stato attuale prima di agire
- Crea bozze (create_draft) per tutte le email — NON inviare direttamente
- Quando crei una bozza, conferma sempre il draft ID restituito
- Rispondi in italiano con un riepilogo conciso di cosa hai fatto e cosa resta da fare
- Segnala se trovi nuove risposte di Aeroméxico nel Gmail che richiedono attenzione
`;

  const fullPrompt = `${systemContext}\n\n## TASK\n${taskPrompt}`;

  const collected: string[] = [];

  const iter = query({
    prompt: fullPrompt,
    options: {
      cwd: process.cwd(),
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.maxTurns ? { maxTurns: opts.maxTurns } : { maxTurns: 20 }),
    },
  });

  for await (const message of iter as AsyncIterable<unknown>) {
    const m = message as {
      type: string;
      message?: { content?: Array<{ type: string; text?: string }> };
    };
    if (m.type === "assistant" && m.message?.content) {
      for (const block of m.message.content) {
        if (block.type === "text" && block.text) {
          process.stdout.write(block.text);
          collected.push(block.text);
        }
      }
    }
  }

  return collected.join("\n\n");
}

// ─── Preset autonomous tasks ──────────────────────────────────────────────────

export const DISPUTE_TASKS = {
  /** Controlla il Gmail per nuove risposte e crea bozza di replica se necessario */
  monitor: `
    1. Cerca nel Gmail tutti i thread con Aeroméxico usando query: "from:aeromexico.com OR to:aeromexico.com OR subject:WPRZZP"
    2. Identifica messaggi ricevuti negli ultimi 7 giorni che non abbiano ancora una risposta
    3. Se trovi nuove risposte di Aeroméxico al caso, crea una bozza di replica professionale
       citando sempre la contraddizione documentata (agente WhatsApp vs risposte formali)
    4. Riporta un riepilogo: cosa hai trovato, cosa hai creato, cosa richiede attenzione umana
  `,

  /** Crea bozza escalation finale ad Aeroméxico */
  escalateAeromexico: `
    1. Cerca nel Gmail l'ultimo thread con amcustomersupport@aeromexico.com
    2. Crea una bozza di risposta formale come reply all'ultimo messaggio ricevuto
    3. La lettera deve: citare la contraddizione documentata, notificare PROFECO+AMEX+ECC-Net,
       fissare ultimatum di 5 giorni lavorativi, essere in spagnolo formale
    4. Conferma draft ID e oggetto della bozza creata
  `,

  /** Crea bozza denuncia PROFECO */
  profecoComplaint: `
    1. Crea una bozza Gmail indirizzata a consumerinfo@profeco.gob.mx con cc gedoardo02@gmail.com
    2. Oggetto: "QUEJA FORMAL – Aeroméxico – Prácticas engañosas – Reserva WPRZZP"
    3. Il corpo deve contenere: dati passeggero, cronologia completa, citazione verbatim della
       promessa WhatsApp del 27 aprile, contraddizione documentata, base legale (LFPC art. 7, 10, 39),
       e lista documenti allegati
    4. Conferma draft ID
  `,

  /** Crea bozza reclamo ECC-Net Italia */
  eccNetComplaint: `
    1. Crea una bozza Gmail indirizzata a info@ecc-net.it con cc gedoardo02@gmail.com
    2. Oggetto: "Reclamo formale contro Aeroméxico – Servizio non reso – Prenotazione WPRZZP"
    3. Il corpo in italiano deve descrivere il caso completo, i passi già intrapresi,
       e chiedere assistenza nella trattativa come consumatore europeo
    4. Conferma draft ID
  `,

  /** Stato completo della disputa */
  status: `
    1. Cerca nel Gmail tutti i thread relativi al caso (query: "aeromexico OR WPRZZP OR AT26110042000010032070")
    2. Elenca: ultimi messaggi ricevuti e loro date, bozze presenti relative al caso, azioni completate
    3. Valuta se ci sono nuove risposte che richiedono azione immediata
    4. Fornisci una raccomandazione chiara sul prossimo passo più urgente
  `,
} as const;

export type DisputeTaskName = keyof typeof DISPUTE_TASKS;

// ─── Interactive CLI ──────────────────────────────────────────────────────────

export async function runInteractiveCli(opts: DisputeAgentOptions = {}): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log("\n" + "═".repeat(70));
  console.log("  AGENTE DISPUTA AEROMÉXICO — Edoardo Guarise  [Gmail connesso]");
  console.log("  Caso: WPRZZP | 3.114,00 MXN | Rif: AT26110042000010032070");
  console.log("═".repeat(70));
  console.log("\nComandi autonomi (l'agente agisce direttamente sul tuo Gmail):");
  console.log("  monitor          → Controlla nuove risposte e crea bozze di replica");
  console.log("  status           → Stato completo della disputa nel Gmail");
  console.log("  escalate         → Crea bozza escalation finale ad Aeroméxico");
  console.log("  profeco          → Crea bozza denuncia PROFECO");
  console.log("  ecc-net          → Crea bozza reclamo ECC-Net Italia");
  console.log("  <testo libero>   → Esegui task personalizzato con accesso Gmail");
  console.log("  exit             → Esci\n");

  while (true) {
    const userInput = await rl.question("Tu: ");
    const trimmed = userInput.trim().toLowerCase();

    if (!trimmed || trimmed === "exit" || trimmed === "esci") {
      console.log("\nSessione terminata.\n");
      rl.close();
      break;
    }

    let taskPrompt: string;
    switch (trimmed) {
      case "monitor":
        taskPrompt = DISPUTE_TASKS.monitor;
        break;
      case "status":
        taskPrompt = DISPUTE_TASKS.status;
        break;
      case "escalate":
        taskPrompt = DISPUTE_TASKS.escalateAeromexico;
        break;
      case "profeco":
        taskPrompt = DISPUTE_TASKS.profecoComplaint;
        break;
      case "ecc-net":
      case "eccnet":
        taskPrompt = DISPUTE_TASKS.eccNetComplaint;
        break;
      default:
        taskPrompt = userInput.trim();
    }

    console.log("\nAgente: ");
    await runDisputeTask(taskPrompt, opts);
    console.log("\n");
  }
}
