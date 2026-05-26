---
name: shooting-chatgpt
description: >
  Reverse engineers any campaign photo reference and recreates it with user-supplied elements (protagonist, product, location, animal) generating 5 hyper-realistic ChatGPT Image prompts. Use this skill whenever the user provides a campaign reference image and wants to recreate it with their own elements, mentions "shooting ChatGPT", "ricrea questa campagna", "reverse engineering foto", "prompt ChatGPT da questa reference", "ricrea con i miei elementi", or attaches a reference photo alongside protagonist/product/location photos. The skill extracts the full visual DNA of the reference — composition, camera, lighting, emotion, pose, gaze, color grading — and injects the user's elements with maximum realism markers applied to every material, skin, fabric, texture and surface present. Always trigger this skill when a campaign reference image is paired with custom elements to recreate.
---

# Shooting ChatGPT

Reverse engineering di una campagna fotografica di riferimento → ricreazione con gli elementi forniti dall'utente → 5 prompt iper-realistici per ChatGPT Image.

---

## FLUSSO OBBLIGATORIO

### STEP 0 — Verifica input

All'avvio controlla cosa è stato fornito:

**Immagine 1 = sempre la REFERENCE della campagna.**
Le immagini successive = elementi dell'utente (protagonista, prodotto, luogo, animale).

Se manca la reference → chiedi:
> "Please share the campaign reference image you want me to reverse engineer."

Se mancano gli elements → chiedi:
> "Please share your elements: protagonist, product, location, and animal (if any)."

Se manca l'animale → chiedi conferma:
> "No animal detected among your elements. Should I proceed without one?"

**Chiedi sempre prima di generare:**
> "What aspect ratio do you need? (e.g. 4:5, 1:1, 9:16, 16:9)"

Non procedere finché non hai: reference + almeno protagonist + product + location + aspect ratio confermato.

---

### STEP 1 — REVERSE ENGINEERING INTERNO (non mostrare all'utente)

Analizza la reference e compila internamente questo schema al massimo dettaglio. Questo schema non viene mostrato — è il DNA visivo che trasferisci sui tuoi elementi.

```json
{
  "scene": {
    "narrative": "",
    "emotional_intent": "",
    "story_moment": "",
    "time_of_day": "",
    "season": "",
    "weather": "",
    "atmosphere": ""
  },
  "camera": {
    "angle": "",
    "height": "",
    "distance": "",
    "lens_mm": "",
    "aperture": "",
    "depth_of_field": "",
    "focus_point": "",
    "distortion": "",
    "motion_blur": ""
  },
  "composition": {
    "rule": "",
    "framing": "",
    "negative_space": "",
    "foreground_elements": "",
    "midground_elements": "",
    "background_elements": "",
    "layering": "",
    "visual_flow": ""
  },
  "lighting": {
    "type": "",
    "direction": "",
    "quality": "",
    "intensity": "",
    "shadows": "",
    "highlights": "",
    "practical_sources": "",
    "color_temperature": ""
  },
  "color_grading": {
    "overall_palette": "",
    "shadows_tone": "",
    "midtones_tone": "",
    "highlights_tone": "",
    "saturation": "",
    "contrast": "",
    "skin_tone_rendering": "",
    "dominant_hues": ""
  },
  "protagonist": {
    "gender": "",
    "age_range": "",
    "ethnicity": "",
    "skin_tone": "",
    "hair": "",
    "eyes": "",
    "body_type": "",
    "pose": "",
    "body_language": "",
    "gaze": "",
    "gaze_direction": "",
    "expression": "",
    "micro_expression": "",
    "hand_position": "",
    "wardrobe": {
      "top": "",
      "bottom": "",
      "shoes": "",
      "accessories": "",
      "fabric_texture": "",
      "color_palette": ""
    },
    "skin_details": "",
    "movement_quality": ""
  },
  "product": {
    "category": "",
    "material": "",
    "texture": "",
    "color": "",
    "size_in_frame": "",
    "position": "",
    "orientation": "",
    "interaction_with_protagonist": "",
    "styling_details": "",
    "editorial_treatment": ""
  },
  "animal": {
    "species": "",
    "breed": "",
    "color": "",
    "size": "",
    "position_in_frame": "",
    "behavior": "",
    "interaction_with_protagonist": ""
  },
  "background": {
    "type": "",
    "location": "",
    "surface_texture": "",
    "color": "",
    "detail_level": "",
    "blur_level": "",
    "architectural_elements": "",
    "natural_elements": "",
    "props": ""
  },
  "realism_markers": {
    "skin_pores": "",
    "fabric_wrinkles": "",
    "hair_flyaways": "",
    "micro_shadows": "",
    "lens_aberration": "",
    "grain_level": "",
    "sweat_or_moisture": "",
    "environmental_interaction": ""
  },
  "photo_style": {
    "genre": "",
    "era_reference": "",
    "photographer_reference": "",
    "magazine_reference": "",
    "overall_mood": ""
  }
}
```

---

### STEP 2 — APPLICAZIONE SUI TUOI ELEMENTI

Prendi ogni elemento fornito dall'utente e sostituiscilo nella struttura estratta dalla reference:

- **Protagonista dell'utente** → stessa posa, stesso sguardo, stessa direzione del corpo, stessa emozione estratta dalla reference. Descrivi le sue caratteristiche fisiche reali visibili nella foto con realism markers specifici: texture della pelle, pori visibili, capelli con flyaway naturali, micro-espressione, eventuali imperfezioni naturali, lucentezza della pelle sotto quella luce specifica.

- **Prodotto dell'utente** (federe / lenzuolo sotto / lenzuolo sopra / copripiumino / altro) → stessa posizione nel frame, stessa relazione spaziale con il protagonista. Se nella reference non c'è un prodotto equivalente, inseriscilo in modo editoriale e luxury coerente con la scena. Descrivi sempre: caduta naturale del tessuto, grinze e pieghe realistiche, lucentezza superficiale del materiale, ombre nelle pieghe, bordi e cuciture, colore esatto sotto quella temperatura di luce.

- **Luogo dell'utente** → stessa profondità di campo, stessa quantità di dettaglio nel background, stessa interazione con la luce. Realism markers: texture delle superfici (pietra, legno, erba, cemento), umidità o secchezza dell'ambiente, riflessi di luce ambientale, dettagli architettonici o naturali visibili nella zona a fuoco.

- **Animale dell'utente** (se presente) → stessa posizione nel frame rispetto alla reference, stesso comportamento coerente con il mood. Realism markers: direzione e texture del pelo/piume, riflesso della luce sul manto, espressione dell'animale, postura naturale.

**Regola prodotto:** Se nella reference è presente un oggetto/prodotto, sostituiscilo con il prodotto dell'utente mantenendo posizione e orientamento. Se non è presente, inserire il prodotto in modo editoriale luxury — appoggiato, sorretto, drappeggiato o posizionato nel frame in modo che aggiunga valore visivo senza risultare forzato.

---

### STEP 3 — GENERAZIONE DEI 5 PROMPT

Genera 5 prompt in inglese, formato narrativo fluido (nessuna sezione con label), lunghezza **350-450 parole ciascuno**. Ogni prompt è una scena completa e autonoma — non fa riferimento agli altri.

**REGOLA FONDAMENTALE — FEDELTÀ AGLI INPUT:**
Ogni prompt deve dichiarare esplicitamente che gli elementi presenti sono esattamente quelli forniti dall'utente come input. L'utente fornisce sempre in questo ordine: protagonista → luogo → prodotto → animale (opzionale). Usa frasi come "use the exact protagonist from the reference image provided", "render the exact location from the image provided", "the exact bedding product shown in the input image" per ancorare ChatGPT agli input allegati.

**REGOLA JSON → PROMPT:**
Il prompt narrativo deve tradurre OGNI campo del JSON compilato nello STEP 1 in linguaggio descrittivo. Nessun campo può essere omesso. I realism markers devono essere applicati specificamente a ogni elemento dell'utente — mai generici. Ogni materiale, superficie, tessuto, pelle, pelo presente nella scena deve avere i propri realism markers esplicitati nel prompt.

Ogni prompt deve contenere nell'ordine naturale della narrazione:
1. Tipo di scatto, inquadratura, distanza camera, altezza camera, lunghezza focale, apertura
2. Protagonista esatto da input: aspetto fisico completo, abbigliamento con texture e colori, posa estratta dalla reference, sguardo, emozione, micro-espressione, posizione mani — realism markers: pori visibili, texture pelle, capelli con flyaway, micro-ombre sotto mento e nelle pieghe del vestito
3. Prodotto esatto da input: posizione nel frame identica alla reference, materiale, texture, colore, caduta del tessuto bamboo viscose, grinze naturali di compressione, lucentezza superficiale, ombre nelle pieghe, bordi e cuciture visibili, relazione spaziale con protagonista — realism markers specifici al tessuto
4. Animale esatto da input (se presente): posizione, comportamento, texture pelo con direzione del manto, riflesso luce sul pelo, texture naso e zampe
5. Location esatta da input: sfondo, profondità di campo, elementi visibili, texture superfici — realism markers: secchezza/umidità, dettagli architetturali o naturali, interazione con la luce
6. Luce: tipo, direzione, qualità, intensità, temperatura colore su ogni superficie, ombre lunghe, highlights speculari, aberrazione cromatica ai bordi
7. Color grading: palette dominante, toni nelle ombre/mezzitoni/luci, saturazione globale, contrasto, grana pellicola
8. Stile fotografico, riferimento fotografo/rivista, mood narrativo
9. Aspect ratio finale

---

## LE 5 INQUADRATURE FISSE

**PROMPT 1 — Wide Establishing Shot**
Camera lontana, tutta la scena visibile. Protagonista nel contesto completo del luogo. Prodotto visibile e leggibile. Animale presente se previsto. Composizione che replica esattamente la struttura spaziale della reference. Luce e color grading completi.

**PROMPT 2 — Medium Shot**
Protagonista dalla vita in su. Prodotto in posizione editoriale prominente, in primo piano o sorretto/interagito. Sfondo presente ma con bokeh crescente. Stessa emozione e posa del protagonista. Luce laterale o frontale che valorizza materiali.

**PROMPT 3 — Close-Up Protagonista dal Basso**
Camera posizionata all'altezza del petto/mento del protagonista, molto ravvicinata, grandangolo lieve. Il protagonista guarda verso il basso in camera — sguardo dominante, intenso, diretto verso l'obiettivo. Prospettiva leggermente dal basso verso l'alto che amplifica la presenza. Prodotto visibile ma non dominante. Realism markers massimi su pelle, occhi, capelli.

**PROMPT 4 — Angolo Insolito / Prospettiva Estrema**
Worm's eye view estremo OPPURE grandangolo distorto con gerarchia visiva ribaltata: il prodotto o un elemento secondario occupa una porzione inaspettata e grande del frame (es. primo piano estremo su un dettaglio del prodotto — texture del tessuto, piega del lenzuolo, zampa dell'animale) mentre il protagonista è visibile ma deformato dalla prospettiva o ridotto nel frame. Alternativa: overhead diagonale estremo. La scelta dell'angolo deve essere coerente con il mood della reference e massimizzare l'impatto visivo. Prospettiva che rompe la lettura convenzionale.

**PROMPT 5 — Artistico / Mood Puro**
L'inquadratura più creativa e fedele al mood emotivo della reference. Può essere: silhouette controluce, riflesso, movimento mosso, profondità di campo estrema con soggetto quasi dissolto nella luce, dettaglio astratto. L'emozione e l'atmosfera estratte dalla reference vengono portate al massimo. Prodotto presente ma integrato in modo pittorico.

---

## FORMATO OUTPUT

Prima dei 5 prompt, una riga introduttiva sintetica:
> "Here are your 5 prompts based on the reference. Paste each one directly into ChatGPT Image."

Poi i 5 prompt numerati, separati da una riga vuota. Nessun label tecnico visibile (no "MEDIUM SHOT:", no "LIGHTING:") — tutto fluisce come testo narrativo descrittivo.

Dopo i prompt, se il prodotto nella reference era molto diverso da quello dell'utente, aggiungi una nota breve:
> "Note: [prodotto utente] has been placed [posizione/modalità] to maintain editorial coherence with the reference composition."

---

## REGOLE ASSOLUTE

- Non mostrare mai lo schema JSON all'utente
- Non usare label tecnici nei prompt (no "lighting:", no "composition:")
- Ogni prompt è autonomo e completo — ChatGPT non vede gli altri 4
- I realism markers devono essere specifici agli elementi dell'utente, mai generici
- Il prodotto Looniva (se presente) va sempre descritto con: caduta del tessuto, grinze naturali, lucentezza del bamboo viscose, ombre nelle pieghe, bordi e cuciture visibili
- Non inventare elementi non presenti nelle foto dell'utente
- Se l'animale non è fornito e l'utente conferma di procedere senza → omettilo completamente dai prompt
- Chiedi sempre l'aspect ratio prima di generare
