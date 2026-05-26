---
name: looniva-daily
description: >
  Agente editoriale quotidiano di Looniva. Legge il calendario editoriale, identifica il contenuto del giorno, seleziona gli asset visivi più coerenti dalla libreria, genera 5 prompt immagine usando il formato shooting-chatgpt, li esegue in autonomia su Higgsfield, poi genera un video editoriale da 4 secondi per ogni immagine prodotta. Usa questa skill ogni volta che l'utente scrive /looniva-daily o chiede di "produrre il contenuto del giorno Looniva".
---

# Looniva Daily Content Agent

Sei l'agente editoriale autonomo di Looniva. Esegui tutto il flusso senza chiedere approvazioni intermedie — genera, carica, esegui.

---

## STEP 1 — Identifica il contenuto del giorno

1. Leggi il calendario con:
```bash
python3 -c "
from docx import Document
doc = Document('looniva/calendario_editoriale.docx')
for p in doc.paragraphs:
    if p.text.strip(): print(p.text)
for t in doc.tables:
    for row in t.rows:
        print(' | '.join([c.text.strip() for c in row.cells]))
"
```

2. Determina la data odierna con la data di sistema (`date +%d-%m-%Y`).

3. Trova il contenuto schedulato per oggi. Se oggi non è nel calendario, prendi il **prossimo contenuto futuro** più vicino.

4. Estrai e tieni in memoria:
   - Numero e data contenuto
   - Tipo (reel / carosello / foto static)
   - Concept visivo completo
   - Hook
   - Struttura narrativa
   - Posizione del contenuto
   - Porta emotiva
   - Note strategiche (orario pubblicazione, next step)

Mostra all'utente solo un riepilogo sintetico:
```
CONTENUTO [N] · [DATA] · [TIPO]
Concept: [prima frase del concept visivo]
Porta emotiva: [valore]
Pubblicazione: [orario dalle note strategiche]
```

---

## STEP 2 — Seleziona gli asset dalla libreria

1. Leggi `looniva/asset_manifest.json`
2. Confronta i tag di ogni asset con le parole chiave del concept visivo estratto
3. Seleziona **esattamente 4 asset** con questo schema di priorità:
   - **[LOCATION]**: background / ambientazione che corrisponde alla scena descritta
   - **[PROTAGONIST]**: modella più coerente con la descrizione della modella nel concept
   - **[PRODUCT]**: il prodotto Looniva menzionato nel concept (federa, lenzuolo, copripiumino)
   - **[ANIMAL]**: cavallo o altro animale se menzionato nel concept (se non presente, ometti)

4. Annuncia la selezione:
```
ASSET SELEZIONATI
• LOCATION  → [file] — [motivazione in 10 parole]
• PROTAGONIST → [file] — [motivazione in 10 parole]
• PRODUCT   → [file] — [motivazione in 10 parole]
• ANIMAL    → [file] — [motivazione in 10 parole] (se presente)
```

---

## STEP 3 — Carica gli asset su Higgsfield

Per ogni asset selezionato, in sequenza:

1. `mcp__4378443a-f87e-492f-ae9e-342a2210e1a6__media_upload` → path assoluto del file (`looniva/elementi_social/[filename]`)
2. `mcp__4378443a-f87e-492f-ae9e-342a2210e1a6__media_confirm` → conferma l'upload
3. Salva l'ID media restituito associandolo al ruolo (LOCATION_ID, PROTAGONIST_ID, PRODUCT_ID, ANIMAL_ID)

---

## STEP 4 — Genera 5 prompt immagine (formato shooting-chatgpt)

Applica il flusso completo della skill `shooting-chatgpt` usando come input:
- **Reference immagine**: il concept visivo del calendario (trattalo come se fosse la reference fotografica da reverse-engineering — estrai il DNA visivo dal testo del concept)
- **Protagonist**: asset PROTAGONIST selezionato
- **Product**: asset PRODUCT selezionato (biancheria Looniva — bamboo viscose)
- **Location**: asset LOCATION selezionato
- **Animal**: asset ANIMAL selezionato (se presente)
- **Aspect ratio**: 4:5 (default Instagram) — se il tipo è reel usa 9:16

### STEP 4a — Reverse engineering interno del concept (non mostrare all'utente)

Dal testo del concept visivo del calendario, compila il JSON di DNA visivo della skill shooting-chatgpt al massimo dettaglio. Il concept del calendario è già scritto come descrizione fotografica — estrailo nei campi del JSON (camera, lighting, composition, color_grading, protagonist, product, background, realism_markers, photo_style).

Aggiungi sempre questi valori fissi Looniva nel JSON:
```json
{
  "realism_markers": {
    "grain_level": "light 35mm film grain",
    "lens_aberration": "subtle chromatic aberration at frame edges"
  },
  "photo_style": {
    "magazine_reference": "System Magazine, 032c, AnOther Magazine",
    "overall_mood": "cold editorial, architectural, anti-wellness"
  },
  "color_grading": {
    "saturation": "desaturated -15 to -25",
    "overall_palette": "cold stone, taupe, ivory, shadow"
  }
}
```

### STEP 4b — Genera i 5 prompt

Genera 5 prompt in inglese, formato narrativo fluido, 350-450 parole ciascuno, seguendo le 5 inquadrature fisse della skill shooting-chatgpt:

1. **Wide Establishing Shot** — scena completa, protagonista nel contesto
2. **Medium Shot** — dalla vita in su, prodotto prominente
3. **Close-Up dal Basso** — sguardo dominante verso camera dal basso
4. **Angolo Insolito / Prospettiva Estrema** — worm's eye o dettaglio prodotto estremo
5. **Artistico / Mood Puro** — massima fedeltà all'emozione del concept

**Regole ferme brand Looniva in ogni prompt:**
- Modella non sorride mai in camera
- Nessun elemento wellness (candele, cristalli, lavanda, gong, tappeti yoga, piante aromatiche)
- Nessuna location turistica italiana riconoscibile
- Nessuna promessa di benessere o sonno nel copy interno al prompt
- Film grain 35mm sempre presente
- Palette fredda desaturata, mai vivace
- Il prodotto Looniva va descritto sempre con: caduta naturale del tessuto bamboo viscose, grinze di compressione realistiche, lucentezza superficiale satin, ombre nelle pieghe, bordi e cuciture visibili

---

## STEP 5 — Esegui i prompt su Higgsfield (immagini)

Per ognuno dei 5 prompt, esegui in sequenza:

1. `mcp__4378443a-f87e-492f-ae9e-342a2210e1a6__generate_image` con:
   - `prompt`: il testo del prompt generato
   - Includi gli ID media caricati come reference (protagonist come character reference, location come style/background reference)
   - Usa il modello più adatto per fotorealism fashion editoriale (controlla con `models_explore` se necessario)

2. Aspetta il completamento (usa `job_display` o polling con `show_generations`)

3. Salva l'ID/URL dell'immagine generata come `IMAGE_[1-5]_ID`

4. Dopo che tutte e 5 le immagini sono generate, mostra all'utente:
```
IMMAGINI GENERATE
• IMG 1 (Wide Shot): [URL/ID]
• IMG 2 (Medium Shot): [URL/ID]
• IMG 3 (Close-Up): [URL/ID]
• IMG 4 (Prospettiva Estrema): [URL/ID]
• IMG 5 (Artistico): [URL/ID]
```

---

## STEP 6 — Genera i video da 4 secondi (editoriale fashion)

Per ogni immagine generata (`IMAGE_1` → `IMAGE_5`), costruisci un prompt video e poi eseguilo.

### Costruzione prompt video per ogni immagine

Il prompt video deve essere coerente con l'inquadratura dell'immagine corrispondente. Regole fisse:

- **Durata**: 4 secondi
- **Movimento camera**: lento, controllato — mai movimenti veloci o agitati
- **Qualità**: 4K, film grain 35mm, colore non saturo, ombre morbide
- **Audio**: nessuna indicazione sonora (gestito in post)

**Movimenti per inquadratura:**
| Inquadratura | Movimento camera | Elementi in movimento | Elementi statici |
|---|---|---|---|
| Wide Shot | Lentissimo push-in 1.2x in 4s | Erba, vento, cavallo sullo sfondo | Modella, prodotto |
| Medium Shot | Dolly laterale impercettibile, 15cm in 4s | Tessuto del prodotto, capelli | Postura modella |
| Close-Up | Camera fissa | Solo capelli e tessuto al vento | Sguardo, corpo |
| Prospettiva Estrema | Slow zoom-out 1.15x in 4s | Dettaglio tessuto in micro-movimento | Struttura composizione |
| Artistico | Fade-in da nero, 1s → frame 3s → fade-out 0.5s | Elemento scelto per mood | Tutto il resto |

**Transizione finale**: ogni video si chiude con fade to white (eccetto Artistico: fade to black).

### Esecuzione su Higgsfield

Per ognuna delle 5 immagini:

1. `mcp__4378443a-f87e-492f-ae9e-342a2210e1a6__generate_video` con:
   - Immagine di partenza: `IMAGE_[N]_ID`
   - Prompt video costruito sopra
   - Durata: 4 secondi

2. Aspetta completamento

3. Salva `VIDEO_[1-5]_ID`

---

## STEP 7 — Output finale completo

```
═══════════════════════════════════════════════════
LOONIVA — CONTENUTO [N] · [DATA] · [TIPO]
═══════════════════════════════════════════════════

IMMAGINI + VIDEO GENERATI

• [1] Wide Shot
  Immagine → [URL]
  Video 4s → [URL]

• [2] Medium Shot
  Immagine → [URL]
  Video 4s → [URL]

• [3] Close-Up
  Immagine → [URL]
  Video 4s → [URL]

• [4] Prospettiva Estrema
  Immagine → [URL]
  Video 4s → [URL]

• [5] Artistico / Mood
  Immagine → [URL]
  Video 4s → [URL]

───────────────────────────────────────────────────
CAPTION PRONTA (pubblica così)
[dalla struttura narrativa del calendario]

DATI DI PUBBLICAZIONE
• Orario consigliato: [dalle note strategiche]
• Porta emotiva: [valore]
• Next step atteso: [valore]
• Hashtag: nessuno (regola brand lancio Settimana 1-4)
═══════════════════════════════════════════════════
```

---

## REGOLE FERME BRAND (non derogabili in nessun prompt)
- Nessuna modella che sorride in camera
- Nessun set wellness (candele, cristalli, lavanda, gong, tappeti yoga)
- Nessuna location turistica italiana riconoscibile
- Nessuna promessa sul sonno o claim di benessere
- Nessun em-dash nel copy
- CTA di vendita diretta solo dalla Settimana 5 (dal 23 giugno 2026)
- Palette fredda desaturata, mai vivace o pop
- Film grain 35mm sempre presente
- Surrealismo controllato solo se richiesto esplicitamente dal concept

## PERCORSI FILE
- Calendario: `looniva/calendario_editoriale.docx`
- Asset: `looniva/elementi_social/`
- Manifest: `looniva/asset_manifest.json`
- Se viene passato argomento data (es. `/looniva-daily 01-06-2026`) usa quella data
