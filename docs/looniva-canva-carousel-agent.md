# Looniva Canva Carousel Agent

Cloud agent end-to-end che trasforma un brief Looniva (più foto prodotto, opzionali reference Pinterest e protagonist) in un **design Canva multi-pagina editabile**, costruito da zero, senza template, senza export PNG.

## Obiettivo

A partire da:

- brief, reference Pinterest, foto protagonista (almeno uno);
- foto prodotto Looniva (obbligatorie);

l'agente produce:

- 5 prompt Nanobanana Pro via `/pinterest-to-nanobanana`;
- 5 immagini iper-realistiche via Higgsfield MCP;
- selezione automatica delle 3-5 immagini migliori;
- copy slide-by-slide via `/looniva-carousel` (agent mode, JSON);
- `canva_layout_spec.json` deterministico;
- design Canva 1080×1350 con N pagine (5-12), elementi tutti editabili (testi, immagini, shape, line, pill);
- `manifest.json`, `report.md`, file di prompts/selezione/quality;
- link Canva editabile (`canva_edit_url`).

## Workflow end-to-end

```
Input → Validate
      ↓
/pinterest-to-nanobanana  ───► 5 prompt
      ↓
Higgsfield MCP generate_image  ───► 5 candidate images
      ↓
Normalize (URL / path / base64 / resource / asset_id / job_id)
      ↓
Select 3-5 best (technical + semantic)
      ↓
Image staging (HTTPS) + Canva upload-asset-from-url ──► canva_asset_id
      ↓
/looniva-carousel (agent_mode, JSON)  ───► slide_copy.json
      ↓
Fact-check (em dash, claim assoluti, claim medici, numeri non contestualizzati)
      ↓
canva_layout_spec.json (deterministico, Visual Brain v2)
      ↓
Canva: generate-design-structured (1080×1350)
       start-editing-transaction
       perform-editing-operations (add_page, add_image, add_text, add_shape, add_line)
       commit-editing-transaction
       get-design  ───► design_id + edit_url
      ↓
Quality check (editabilità, DATA_DARK con numero separato, primo HOOK, ultimo CTA, ecc.)
      ↓
report.md + manifest.json
```

## Skill richieste

| Skill | Ruolo | File |
|---|---|---|
| `/pinterest-to-nanobanana` | Prompt engine fotografico, restituisce 5 prompt | `.claude/skills/pinterest-to-nanobanana/SKILL.md` + `references/realism_blocks.md` + `references/prompt_schema.json` |
| `/looniva-carousel` | Brand custodian. In `agent_mode: true` restituisce solo JSON con `slide_copy` | `.claude/skills/looniva-carousel/SKILL.md` |

L'orchestratore le invoca tramite il Claude Agent SDK (`SdkSkillRunner`) o, nei test, tramite un mock runner che soddisfa l'interfaccia `SkillRunner`.

## Tool MCP richiesti

### Canva MCP

Tool usati (tutti gli altri sono evitati):

- `generate-design-structured` — crea il design vuoto 1080×1350.
- `upload-asset-from-url` — carica gli asset immagine.
- `start-editing-transaction` / `perform-editing-operations` / `commit-editing-transaction` / `cancel-editing-transaction`.
- `get-design`, `get-design-content`, `get-design-pages`, `get-design-thumbnail`.

**Vietati** dall'agente:

- `export-design` (niente PNG/JPG/PDF).
- `create-design-from-brand-template` (niente template).
- `copy-design` (niente duplicazione).

### Higgsfield MCP

Tool usati:

- `generate_image` (preferito), con aspect 4:5, width 1080, height 1350 quando supportato.
- `job_display` per polling.
- `show_medias` per risolvere asset id in URL.

### Naming dei tool

Lo specifico prefisso del nome tool MCP varia per harness/setup. L'agente legge `CANVA_MCP_PREFIX` e `HIGHSSFIELD_MCP_PREFIX` da `.env`. I valori predefiniti sono `mcp__canva` e `mcp__highssfield`, ma puoi sovrascriverli con i prefissi reali della tua harness (es. `mcp__078073c8-5f90-4af2-837b-55b616263f49`).

## Configurazione (.env)

Vedi `.env.example`. Variabili chiave:

- `CANVA_MCP_PREFIX`, `HIGHSSFIELD_MCP_PREFIX` (default `mcp__canva`, `mcp__highssfield`)
- `CANVA_MCP_URL`, `CANVA_ACCESS_TOKEN`, `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`
- `HIGHSSFIELD_MCP_URL`, `HIGHSSFIELD_MCP_AUTH_TOKEN`
- `ANTHROPIC_API_KEY` (per il Claude Agent SDK)
- `TEMP_ASSET_STAGING_URL`, `TEMP_ASSET_STAGING_TOKEN` (richiesti per il handoff Higgsfield → Canva tramite `upload-asset-from-url`)
- `LOONIVA_OUTPUT_DIR`, `LOG_LEVEL`

## Comando

```bash
npm run looniva:canva-carousel -- \
  --brief "Perché la viscosa di bambù è diversa dal cotone di notte" \
  --reference ./inputs/pinterest_ref.jpg \
  --products ./inputs/prodotto_1.jpg ./inputs/prodotto_2.jpg \
  --output ./outputs/looniva_canva_carousels/bamboo_vs_cotton
```

Tutti gli argomenti riconosciuti: `--brief`, `--reference`, `--protagonist`, `--products` (variadic, obbligatorio), `--topic`, `--audience`, `--tone`, `--slides`, `--cta`, `--output`, `--run-id` (per riprendere una run).

## Output

L'agente restituisce un JSON aderente a `LoonivaAgentOutput` (vedi `src/schemas/loonivaAgentOutput.schema.ts`). I file salvati nella `run_dir`:

```
outputs/looniva_canva_carousels/run_<ts>_<topic>/
  manifest.json
  report.md
  prompts/
    raw_nanobanana_output.txt
    prompts.json
    prompts.md
  generated_images/
    01_photoreal_upgrade.jpg
    02_light_upgrade.jpg
    ...
  selected_images.json
  generated_images.json
  canva/
    canva_layout_spec.json
    slide_copy.json
    canva_assets.json
    looniva_carousel_raw.txt
```

### `manifest.json`

Contiene `run_id`, `created_at`, `topic`, `brief`, `canva_design_id`, `canva_edit_url`, `slide_count`, `prompts`, `generated_images`, `selected_images`, `canva_assets`, `slides`, `quality_report`, `status`, **`steps`** (checkpoint), e in caso di errore `error: { code, message }`.

### `canva_layout_spec.json`

Contratto tra copy Visual Brain v2 e Canva MCP. Geometria deterministica (vedi `src/services/layouts.ts`), ogni elemento marcato `editable: true`. Ogni `DATA_DARK` ha **numero, unit_label, separator, pill, pill_title, pill_body, logo** come elementi distinti.

### `slide_copy.json`

Output strutturato di `/looniva-carousel`. Schema in `src/schemas/slideCopy.schema.ts`.

## Perché Canva è l'output finale

L'utente deve aprire Canva e rifinire ogni elemento manualmente:

- spostare un titolo,
- cambiare una parola in italic gold,
- sostituire una foto,
- rifinire il pill body.

Esportare PNG congelerebbe il design e renderebbe questa operazione impossibile. Per questo:

- nessun renderer Pillow,
- nessun export-design,
- nessuna slide piatta come fallback,
- `quality_check` blocca la run se una pagina risulta essere una singola immagine raster a tutto schermo.

## Come aprire e modificare il design

1. Apri `canva_edit_url` da `manifest.json` o `report.md`.
2. Canva apre il design 1080×1350 con tutte le pagine.
3. Ogni testo, numero, pill, shape, line e immagine è un elemento editabile.
4. Le foto sono asset Canva caricati dal tuo workspace.

## Error handling

Codici errore (vedi `src/utils/errors.ts`):

- `INPUT_VALIDATION_ERROR`
- `SKILL_NOT_FOUND`, `NANOBANANA_SKILL_ERROR`, `PROMPT_PARSE_ERROR`
- `HIGHSSFIELD_MCP_UNAVAILABLE`, `HIGHSSFIELD_GENERATION_ERROR`, `HIGHSSFIELD_ASSET_HANDOFF_ERROR`
- `INSUFFICIENT_VALID_IMAGES`
- `CANVA_MCP_UNAVAILABLE`, `CANVA_ASSET_UPLOAD_ERROR`, `CANVA_DESIGN_CREATION_ERROR`, `CANVA_EDITING_TRANSACTION_ERROR`, `CANVA_QUALITY_CHECK_FAILED`
- `FACT_CHECK_BLOCKED_CLAIM`, `OUTPUT_REPORT_ERROR`

L'agente non ripiega mai su uno static export come fallback.

## Checkpoint e ripartenza

`manifest.json` ha un blocco `steps`:

```json
{
  "steps": {
    "input_validated": true,
    "nanobanana_prompts_generated": true,
    "images_generated": true,
    "images_normalized": true,
    "images_selected": true,
    "canva_assets_uploaded": false,
    "copy_planned": false,
    "layout_spec_created": false,
    "canva_design_created": false,
    "quality_checked": false
  }
}
```

Per riprendere una run fallita:

```bash
npm run looniva:canva-carousel -- --run-id run_20260515_xxx --brief ... --products ...
```

L'agente legge il manifest, salta gli step già `true`, riparte da quello fermo.

## Troubleshooting

- **"PROMPT_PARSE_ERROR: Expected exactly 5 prompts"** → la skill `/pinterest-to-nanobanana` non ha emesso il formato canonico. Controlla `prompts/raw_nanobanana_output.txt`.
- **"CANVA_ASSET_UPLOAD_ERROR: TEMP_ASSET_STAGING_URL is not configured"** → imposta lo staging in `.env`.
- **"CANVA_QUALITY_CHECK_FAILED: ... is flat"** → controlla che Canva MCP supporti tutte le ops di editing. Verifica con `mcp__canva__help`.
- **Font fallback warnings** → Cormorant Garamond, Source Serif Pro, Sorts Mill Goudy possono non essere nella tua font library Canva. I fallback sono Libre Baskerville e Georgia. Cambiali manualmente nel design dopo l'apertura.

## Limiti noti

- L'editabilità di rich text parziale (es. una sola parola in italic GOLD nel titolo) dipende dalla build del Canva MCP. L'agente costruisce ogni testo come singolo elemento; per evidenze parziali, applicale manualmente in Canva.
- Higgsfield può rifiutare prompt molto lunghi: il fallback è registrare warning e ridurre i tentativi a 2, **senza** accorciare silenziosamente il prompt.
- L'agente non genera PNG. Se ne hai bisogno, esportali tu da Canva dopo l'editing manuale.

## Architettura

```
src/
  agents/loonivaCanvaCarouselAgent.ts     ← orchestratore
  adapters/
    mcpClient.ts                          ← interfaccia MCP + StaticMockMcpClient
    pinterestToNanobananaAdapter.ts       ← invoca /pinterest-to-nanobanana
    loonivaCarouselAdapter.ts             ← invoca /looniva-carousel agent_mode
    highssfieldAdapter.ts                 ← Higgsfield MCP
    canvaMcpAdapter.ts                    ← Canva MCP
    sdkSkillRunner.ts                     ← runner via Claude Agent SDK
  services/
    inputValidator.ts
    promptParser.ts
    imageGenerator.ts (logica spalmata in adapter + orchestratore)
    imageNormalizer.ts                    ← URL / path / base64 / resource / asset_id / job
    imageSelector.ts                      ← tecnico + semantico
    imageStaging.ts                       ← PUT HTTPS per upload-asset-from-url
    loonivaCopyPlanner.ts                 ← invoca skill + fact-check + image assignment
    factChecker.ts
    canvaLayoutSpecBuilder.ts             ← copy → layout spec deterministico
    canvaCarouselBuilder.ts               ← layout spec → Canva MCP ops
    qualityChecker.ts
    runReporter.ts                        ← report.md
    checkpointManager.ts                  ← manifest steps
    layouts.ts                            ← geometria + font budget Visual Brain v2
  schemas/
    loonivaAgentInput.schema.ts
    loonivaAgentOutput.schema.ts
    canvaLayoutSpec.schema.ts
    slideCopy.schema.ts
    generatedImage.schema.ts
  utils/
    fileStorage.ts, imageUtils.ts, logger.ts, slugify.ts, errors.ts
  bin/looniva-canva.ts                    ← CLI commander
```

## Test

```bash
npm test
```

10 file di test con vitest:

- `promptParser.test.ts` — 5 prompt canonici, em-dash/en-dash, parsing tollerante, errori.
- `inputValidator.test.ts` — schema, path esistenti, slide_count.
- `imageNormalizer.test.ts` — path, base64, errore su job/corrupted.
- `imageSelector.test.ts` — min 3, ruoli, scarto tecnico.
- `canvaLayoutSpecBuilder.test.ts` — 1080×1350, DATA_DARK con numero separato, no flat slides.
- `canvaCarouselBuilder.test.ts` — editing transaction lifecycle, no export.
- `qualityChecker.test.ts` — pass/fail per design id, edit url, page count, flat detection.
- `highssfieldAdapter.test.ts` — URL, base64, polling, asset_id, retry.
- `canvaMcpAdapter.test.ts` — design creation, asset upload, transaction lifecycle.
- `factChecker.test.ts` — em-dash, claim assoluti, numeri.
- `orchestrator.test.ts` — happy path con mock + fallimenti targati.
