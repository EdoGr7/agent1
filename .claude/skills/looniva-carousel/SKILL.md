---
name: looniva-carousel
description: Crea caroselli Instagram Looniva come design Canva editabili da zero, usando Visual Brain v2, brand guidelines Looniva, copy completo, layout nativi Canva e foto generate o fornite tramite Higgsfield/highssfield. Usa questa skill ogni volta che l'utente chiede di creare un carosello Looniva, sviluppare un'idea carosello, generare slide Instagram per Looniva, o menziona "carosello", "carousel", "slide Instagram", "post carousel" nel contesto Looniva.
allowed-tools: Read, Write, Edit, Bash, mcp__canva__*, mcp__highssfield__*
---

# Looniva Carousel - Canva Editable Builder

Genera caroselli Instagram per Looniva, biancheria in viscosa di bambu' organica, come design Canva editabili creati da zero.

L'output finale primario e':

- Canva design ID;
- Canva edit URL;
- manifest JSON;
- report sintetico;
- copy slide-by-slide;
- layout spec JSON.

Non esportare PNG, JPG o PDF salvo richiesta esplicita dell'utente.

## Regola fondamentale

Questa skill NON deve creare slide finali come immagini piatte.

Ogni slide deve essere costruita in Canva con elementi editabili:

- text box;
- image element o image frame;
- rettangoli;
- pill box;
- linee;
- numeri;
- overlay;
- CTA pill;
- logo testuale o asset logo.

E' vietato creare una slide completa con Pillow o altro renderer, caricarla su Canva come singola immagine e considerarla finita.

L'utente deve poter aprire il file Canva e modificare testi, immagini, box, numeri, linee e CTA.

## Quando usare questa skill

Usa questa skill quando l'utente chiede:

- creare un carosello Looniva;
- sviluppare un'idea carosello;
- generare slide Instagram per Looniva;
- fare un carousel;
- creare post carousel;
- trasformare un topic in carosello;
- usare immagini Higgsfield/highssfield per un carosello Looniva;
- creare un design Canva editabile per Looniva.

Anche se l'utente dice solo "sviluppa idea X" o "fammi il carosello dell'idea X", usa questa skill se il contesto e' Looniva.

## Ruolo nella pipeline agente

In modalita' agente, questa skill viene invocata DOPO:

1. `/pinterest-to-nanobanana`, che produce 5 prompt Nanobanana Pro;
2. highssfield/Higgsfield MCP, che genera 5 immagini;
3. image selection, che sceglie le immagini migliori.

Questa skill riceve quindi immagini gia' disponibili come:

- path locale;
- URL;
- Canva asset ID;
- resource link;
- metadata immagine.

Questa skill NON deve generare prompt Nanobanana.
Questa skill NON deve generare immagini con highssfield, salvo richiesta diretta dell'utente in uso standalone.

Il suo compito e':

```text
brief/topic + immagini selezionate + eventuale copy strategico
-> copy completo Visual Brain v2
-> layout spec Canva
-> design Canva editabile creato da zero
-> Canva edit URL
```

---

# Identita' brand

## Prodotto

Looniva produce:

- lenzuola;
- federe;
- copripiumini;
- biancheria letto in viscosa di bambu' organica.

## Certificazioni e posizionamento

Certificazioni dichiarate:

- OEKO-TEX Standard 100;
- FSC;
- filiera verificata.

Posizionamento:

- qualita' artigianale italiana;
- scienza del tessuto;
- trasparenza radicale;
- lusso adulto, invisibile, non performativo.

## Tono di voce

Il tono e':

- autorevole, mai arrogante;
- preciso, non decorativo;
- simile a un professore che rispetta l'intelligenza del lettore;
- calmo, adulto, editoriale;
- mai influencer;
- mai wellness generico;
- mai motivazionale.

Tre registri vocali:

1. **Esposizione**
   Spiega un meccanismo oggettivo.

2. **Spiegazione**
   Smonta un mito con dati, logica o osservazione verificabile.

3. **Affermazione**
   Dichiara una posizione di valore.

## Vietato nel copy finale

- em dash;
- tono superlativo senza dati;
- claim non verificabili;
- frasi da wellness brand;
- "migliore in assoluto";
- "rivoluzionario";
- "miracoloso";
- "cura la pelle";
- "100% sostenibile" se non dimostrato;
- claim scientifici non supportati;
- linguaggio da influencer;
- domande retoriche vuote;
- kicker categorici sull'hook;
- archi decorativi;
- placeholder visibili.

---

# Sistema colori

Usa solo questa palette.

| Variabile | Hex | Uso |
|---|---:|---|
| DARK | #3C342E | background principali, testo su light |
| VERY_DARK | #231E1A | background slide data/tensione |
| LIGHT | #F2EBDC | background slide light, testo su dark |
| GOLD | #C9A96E | accento oro, da usare a gocce |
| TAUPE | #A89A8B | testo secondario, note, sottotitoli |

## Regola oro

Il gold e' una goccia di colore prezioso.

Usare massimo 1-2 elementi gold per slide.

Usare il gold solo per:

- 1 parola chiave in italic nel titolo;
- oppure linea bordo-sinistra nei pill box;
- oppure numero grande nella DATA slide.

Mai tutti e tre nella stessa slide.

Mai colorare interi titoli in oro.

Nella slide DATA_DARK, l'oro appare solo nel numero grande.

---

# Sistema tipografico

## Font desiderati in Canva

Usa questi font Canva, se disponibili:

- headline principali: **Cormorant Garamond Bold**;
- enfasi: **Cormorant Garamond Bold Italic**;
- sottotitoli serif: **Cormorant Garamond SemiBold**;
- label nei pill box: **Source Serif Pro SemiBold**;
- body text nei pill box: **Sorts Mill Goudy Regular**;
- numeri grandi DATA slide: **Cormorant Garamond Bold**;
- note/testo secondario: **Sorts Mill Goudy Regular**, colore TAUPE.

Se un font non e' disponibile in Canva:

1. usa il fallback serif piu' vicino;
2. registra warning nel report;
3. non bloccare la run se il risultato resta coerente e leggibile.

Fallback suggeriti:

- Cormorant Garamond -> Cormorant, Garamond, Libre Baskerville, Georgia;
- Source Serif Pro -> Source Serif, Libre Baskerville, Georgia;
- Sorts Mill Goudy -> Goudy Bookletter 1911, Libre Baskerville, Georgia.

---

# Text-fitting obbligatorio

Ogni text box deve essere progettata per non uscire dai margini.

Per ogni blocco di testo:

1. calcola uno spazio massimo;
2. stima il wrapping;
3. se il testo supera lo spazio, riduci font size di 2 px;
4. ricalcola;
5. continua fino a minimo 16 px;
6. se ancora non entra, riscrivi il copy accorciandolo senza perdere informazione;
7. non ridurre mai sotto 16 px.

Il layout e' prioritario rispetto alla dimensione iniziale del font.

## Interlinea

Usa interlinea controllata.

Indicazioni:

- headline: 0.88-0.98;
- body: 1.12-1.22;
- label e body nello stesso item: gap 6-8 px;
- item successivi: gap 18-24 px.

Evita spaziature incoerenti tra righe con e senza discendenti.

---

# Formato Canva

Ogni carosello e' un design Canva multi-pagina.

Formato:

```json
{
  "width": 1080,
  "height": 1350,
  "unit": "px",
  "format": "instagram_portrait"
}
```

Una pagina Canva corrisponde a una slide Instagram.

Output finale:

```json
{
  "canva_design_id": "string",
  "canva_edit_url": "string"
}
```

Non esportare PNG.

---

# Input accettato

La skill puo' ricevere input in linguaggio naturale o payload strutturato.

## Input minimo

```json
{
  "brief": "string",
  "carousel_topic": "string optional",
  "selected_images": [
    {
      "path_or_url": "string optional",
      "canva_asset_id": "string optional",
      "suggested_role": "HOOK_PHOTO | BUILD | TENSION_PHOTO | PAYOFF optional",
      "source_prompt_number": "number optional",
      "selection_reason": "string optional"
    }
  ],
  "product_image_paths": ["string optional"],
  "slide_count": "number optional",
  "cta": "string optional",
  "output_dir": "string optional",
  "agent_mode": "boolean optional"
}
```

## Input diretto da utente

Esempio:

```text
Crea un carosello Looniva sul perche' la viscosa di bambu' e' diversa dal cotone di notte.

Usa queste foto:
- Hook: ./outputs/run_001/selected_images/hook.png
- Tension: ./outputs/run_001/selected_images/tension.png
- Texture: ./outputs/run_001/selected_images/texture.png
```

## Input da agente

Esempio:

```json
{
  "agent_mode": true,
  "brief": "Perche' la viscosa di bambu' e' diversa dal cotone di notte",
  "selected_images": [
    {
      "path_or_url": "./outputs/run_001/generated_images/01_photoreal_upgrade.png",
      "suggested_role": "HOOK_PHOTO"
    },
    {
      "path_or_url": "./outputs/run_001/generated_images/03_texture_hero.png",
      "suggested_role": "BUILD"
    },
    {
      "path_or_url": "./outputs/run_001/generated_images/05_wild_card_improvement.png",
      "suggested_role": "TENSION_PHOTO"
    }
  ],
  "output_dir": "./outputs/run_001/canva_carousel"
}
```

---

# Gestione immagini

Le immagini possono arrivare da:

- highssfield/Higgsfield MCP;
- path locali;
- URL;
- Canva asset ID gia' esistenti;
- immagini prodotto fornite dall'utente.

## Regole

Ogni immagine usata in Canva deve diventare un asset Canva utilizzabile.

Casi:

1. Se e' gia' presente `canva_asset_id`, usalo direttamente.
2. Se e' presente un URL HTTPS, caricalo in Canva con il tool MCP di upload asset da URL, se disponibile.
3. Se e' presente un path locale, usa upload locale se il Canva MCP lo supporta.
4. Se il Canva MCP non supporta upload locale, usa uno staging HTTPS temporaneo o segnala errore.
5. Se non puoi caricare l'immagine in Canva, non procedere alla slide fotografica.

Non basta che l'immagine sia visibile in chat.
Serve un asset Canva o un riferimento caricabile.

## Uso foto nei layout

Ogni slide `_PHOTO` deve ricevere una foto diversa, se disponibile.

Regole foto:

- opacity sempre circa 20%;
- la foto e' un elemento Canva editabile;
- il soggetto non deve essere coperto da pill box opachi;
- il testo vive nello spazio negativo;
- crop center-cover;
- se il soggetto e' centrato, usa overlay o velature laterali per proteggere il testo;
- nessuna foto deve essere fusa con il testo in un'immagine piatta.

---

# Framework narrativo Visual Brain v2

Ogni carosello segue questa struttura:

```text
HOOK        -> cattura attenzione in 0.5 secondi, 1 slide sempre
CONTEXT     -> inquadra il problema con precisione, 1-2 slide
BUILD       -> spiega il meccanismo, dato per dato, 2-5 slide
TENSION     -> il momento "aspetta, cosa?", 1 slide
PAYOFF      -> soluzione o punto di arrivo, 1-2 slide
CTA         -> azione concreta richiesta al lettore, 1 slide sempre
```

La skill decide il numero di slide in base alla profondita' del topic.

Limiti:

- minimo 5 slide;
- massimo 12 slide;
- se `slide_count` e' fornito, rispettalo se narrativamente sensato;
- ultima slide sempre CTA;
- prima slide sempre HOOK.

---

# Flusso di lavoro obbligatorio

## Fase 1: Identificazione topic

Se l'utente ha usato `/looniva-social-strategist`, importa:

- pillar;
- hook leva;
- registro vocale;
- bozza copy;
- eventuale CTA;
- eventuale struttura narrativa.

Se non e' disponibile, costruisci autonomamente:

- topic;
- promessa del carosello;
- angolo editoriale;
- registro vocale;
- sequenza Visual Brain v2;
- CTA coerente.

## Fase 2: Verifica fattuale

Non saltare questa fase.

Per ogni fatto o dato:

1. e' misurabile?
2. e' verificabile?
3. e' supportato da una fonte interna o da conoscenza affidabile?
4. e' un claim assoluto?
5. puo' essere frainteso come promessa medica, scientifica o ambientale?

Regole:

- non inventare dati numerici;
- usa solo cifre che puoi motivare;
- se non sei sicuro, riformula come osservazione qualitativa;
- se e' potenzialmente falso o esagerato, elimina;
- se e' un dato non confermato, non usare DATA_DARK;
- non usare superlativi senza dati;
- non usare claim medici;
- non scrivere che il prodotto cura, guarisce, ringiovanisce o migliora condizioni cliniche.

Esempi di formulazioni caute:

- "puo' contribuire a";
- "e' progettata per";
- "la scelta del materiale incide su";
- "la certificazione verifica l'assenza di determinate sostanze secondo lo standard applicato";
- "il punto non e' la promessa, ma la tracciabilita'".

## Fase 3: Scrittura copy completo

Scrivi l'intero testo del carosello prima di progettare il layout.

Regole:

- spiega ogni concetto come se il lettore non ne sapesse niente;
- non dare mai per scontata una conoscenza precedente;
- ogni frase deve aggiungere informazione;
- evita frasi decorative;
- headline massimo 7 parole;
- ogni slide deve avere un concetto principale;
- ogni slide deve avere spiegazione completa;
- il copy deve poter stare nel layout;
- non usare em dash nel copy finale.

Formato interno per ogni slide:

```text
SLIDE N - [tipo]
HEADLINE: [max 7 parole]
SUBTITLE: [opzionale, 1 riga breve]
FOTO: [si/no + ruolo immagine]
ITEMS:
  - LABEL: [parola chiave]
    BODY: [spiegazione completa]
DATO_NUMERICO: [numero] [unita'] [contesto]
CTA: [solo ultima slide]
```

## Fase 4: Assegnazione layout

Usa questi layout type.

| Layout | Quando usarlo |
|---|---|
| HOOK_PHOTO | Slide 1 quando c'e' una foto adatta |
| HOOK_DARK | Slide 1 senza foto |
| BUILD_LIGHT | Spiegazione meccanismo su sfondo chiaro |
| BUILD_DARK | Spiegazione su sfondo scuro |
| DATA_DARK | Numero grande protagonista |
| COMPARISON | Due colonne: marketing vs realta' |
| TENSION_PHOTO | Svolta narrativa con foto |
| TENSION_DARK | Svolta narrativa senza foto |
| PAYOFF_LIGHT | Soluzione su sfondo chiaro |
| CTA | Ultima slide sempre |

## Fase 5: Canva layout spec

Prima di creare il design Canva, genera un file o oggetto `canva_layout_spec`.

Questo spec e' il contratto tra copy, layout e Canva MCP.

Formato:

```json
{
  "design": {
    "title": "Looniva Carousel - {topic}",
    "width": 1080,
    "height": 1350,
    "unit": "px",
    "pages": []
  }
}
```

Ogni pagina deve avere:

```json
{
  "page_number": 1,
  "layout_type": "HOOK_PHOTO",
  "background": {
    "type": "color",
    "color": "#3C342E"
  },
  "elements": [
    {
      "type": "image",
      "role": "background_photo",
      "asset_id": "canva_asset_id",
      "x": 0,
      "y": 0,
      "w": 1080,
      "h": 1350,
      "fit": "cover",
      "opacity": 0.20
    },
    {
      "type": "shape",
      "role": "bottom_overlay",
      "x": 0,
      "y": 620,
      "w": 1080,
      "h": 730,
      "fill": "#231E1A",
      "opacity": 0.75
    },
    {
      "type": "text",
      "role": "headline",
      "text": "...",
      "font_family": "Cormorant Garamond",
      "font_weight": "Bold",
      "font_size": 76,
      "color": "#F2EBDC",
      "align": "center",
      "x": 100,
      "y": 820,
      "w": 880,
      "h": 220
    }
  ]
}
```

Tutti gli elementi dello spec devono essere editabili in Canva.

## Fase 6: Creazione design Canva

Usa Canva MCP.

Obiettivo:

- creare design Canva da zero;
- formato 1080x1350;
- una pagina per ogni slide;
- elementi nativi ed editabili;
- nessun template obbligatorio;
- nessun export statico.

Strategia:

1. Verifica disponibilita' Canva MCP.
2. Crea nuovo design Canva in formato custom 1080x1350.
3. Carica asset immagine necessari.
4. Crea le pagine.
5. Per ogni pagina, applica gli elementi del `canva_layout_spec`.
6. Usa editing transaction se disponibile.
7. Salva design.
8. Recupera design ID e edit URL.
9. Crea manifest e report.
10. Restituisci edit URL.

Se Canva MCP non consente sufficiente controllo sugli elementi, segnala warning o errore.
Non ripiegare su slide piatte senza dichiararlo.
Non esportare PNG come fallback.

---

# Specifiche layout Canva

## Coordinate generali

Canvas:

```text
W = 1080
H = 1350
```

Margini:

```text
margin_x = 70
margin_top = 70
margin_bottom = 60
safe_width = 940
```

Logo:

- se non esiste asset logo, usa testo "LOONIVA";
- logo sempre editabile;
- non dominante;
- opacity bassa nelle slide fotografiche;
- opacity piena nella CTA.

---

## HOOK_PHOTO

La foto e' il protagonista. Il testo vive solo nello spazio negativo.

Elementi:

1. background color DARK `#3C342E`;
2. foto full-bleed come elemento immagine editabile;
3. opacity foto 20%;
4. overlay scuro nella zona testo;
5. headline;
6. subtitle;
7. logo basso a destra.

Regole:

- foto full-bleed;
- crop cover;
- se Canva supporta gradient, usa gradient da trasparente in alto a scuro in basso;
- se Canva non supporta gradient, usa rettangolo semi-trasparente nella meta' inferiore;
- testo nella zona meno dettagliata;
- default testo centro-basso;
- headline Cormorant Garamond Bold, 68-80 px, LIGHT;
- una parola puo' essere Bold Italic GOLD solo se rich text parziale e' supportato;
- subtitle max 10 parole, 28 px, TAUPE;
- nessun kicker;
- nessuna label categoria;
- nessun arco decorativo;
- logo basso a destra, 22 px, LIGHT, opacity 0.4.

Coordinate indicative:

```text
image: x 0, y 0, w 1080, h 1350
overlay: x 0, y 600, w 1080, h 750, opacity 0.75
headline: x 100, y 780, w 880, h 240
subtitle: x 150, y headline_bottom + 20, w 780, h 60
logo: x 880, y 1260, w 140, h 36
```

---

## HOOK_DARK

Usa quando non c'e' una foto adatta.

Elementi:

- background DARK o VERY_DARK;
- headline centrale;
- subtitle breve;
- logo discreto.

Regole:

- headline Cormorant Garamond Bold, 72-84 px;
- testo centrato;
- composizione sobria;
- no kicker;
- no archi decorativi.

---

## BUILD_LIGHT

Sfondo chiaro, spiegazione ordinata.

Elementi:

1. background LIGHT;
2. headline in alto;
3. subtitle opzionale;
4. pill box grande;
5. item separati con linea gold;
6. logo discreto.

Regole:

- headline Cormorant Garamond Bold, 62-72 px, DARK;
- subtitle 28 px, TAUPE;
- pill box occupa tutto lo spazio rimanente fino a 60 px dal fondo;
- pill box con background `rgba(60,52,46,0.10)`;
- border radius 20 px;
- padding interno 28 px;
- ogni item ha linea verticale gold 2 px;
- label Source Serif Pro SemiBold, 32 px, DARK;
- body Sorts Mill Goudy Regular, 26 px, TAUPE;
- gap label/body 6 px;
- gap item 20 px;
- se il testo non entra, riduci font;
- se e' assegnata una foto, usala dentro o dietro il pill box a 15% opacity come elemento separato.

Coordinate indicative:

```text
headline: x 70, y 70, w 940, h 150
subtitle: x 70, y headline_bottom + 14, w 940, h 50
pill: x 70, y 280, w 940, h 950
logo: x 70, y 1265, w 140, h 30
```

---

## BUILD_DARK

Versione scura della spiegazione.

Elementi:

- background DARK;
- headline LIGHT;
- subtitle TAUPE;
- pill box semi-trasparente LIGHT;
- item con linea gold;
- logo discreto.

Regole:

- pill background `rgba(242,235,220,0.12)`;
- headline LIGHT;
- body TAUPE o LIGHT con opacity, in base al contrasto;
- stessi spazi di BUILD_LIGHT.

---

## DATA_DARK

Mantieni questa slide come impianto dati principale.

Tutti gli elementi devono essere editabili in Canva.

Elementi:

1. background VERY_DARK `#231E1A`;
2. numero enorme;
3. unita'/label;
4. linea separatrice;
5. pill box inferiore;
6. titolo pill;
7. corpo spiegazione;
8. logo discreto.

Specifiche:

- sfondo VERY_DARK;
- zona superiore 38%;
- numero enorme Cormorant Garamond Bold, 120-160 px, GOLD;
- unita'/label Sorts Mill Goudy, 28 px, TAUPE, letter spacing 0.12 em se supportato;
- linea separatrice 1 px, colore `rgba(201,169,110,0.35)`, larghezza W-120;
- zona inferiore 55%;
- pill box inferiore CREAM_PILL o LIGHT semi-trasparente;
- titolo pill Source Serif Pro SemiBold, 30 px, LIGHT;
- corpo Sorts Mill Goudy, 26 px, TAUPE;
- spiegazione completa del dato;
- l'oro appare solo nel numero;
- nessun altro elemento gold;
- non rasterizzare il numero;
- non rasterizzare il dato.

Coordinate indicative:

```text
number: x 70, y 120, w 940, h 190
unit_label: x 78, y 310, w 900, h 50
separator: x 60, y 500, w 960, h 1
pill: x 70, y 570, w 940, h 620
pill_title: x 105, y 610, w 870, h 70
pill_body: x 105, y 700, w 870, h 390
logo: x 70, y 1265, w 140, h 30
```

Usa DATA_DARK solo se il dato e' verificabile o chiaramente contestualizzato.

---

## COMPARISON

Due colonne: marketing vs realta'.

Elementi:

1. background LIGHT;
2. headline in alto;
3. due pill box affiancati;
4. header colonna sinistra;
5. header colonna destra;
6. item testuali;
7. bordo gold sulla colonna destra;
8. logo discreto.

Regole:

- headline Cormorant Garamond Bold, 60 px, DARK;
- box sinistro `rgba(60,52,46,0.08)`;
- box destro `rgba(201,169,110,0.12)`;
- box destro con bordo GOLD 1 px;
- header Source Serif Pro, 26 px, DARK;
- item Sorts Mill Goudy, 24 px, TAUPE;
- colonne stessa altezza;
- gap colonne 16 px;
- oro solo nel bordo destro.

Coordinate indicative:

```text
headline: x 70, y 70, w 940, h 150
left_box: x 70, y 260, w 462, h 930
right_box: x 548, y 260, w 462, h 930
logo: x 70, y 1265, w 140, h 30
```

---

## TENSION_PHOTO

Svolta narrativa con foto.

Elementi:

1. background VERY_DARK;
2. foto full-bleed editabile;
3. opacity foto 20%;
4. overlay scuro nella zona testo;
5. frase/citazione;
6. spiegazione;
7. logo discreto.

Regole:

- foto full-bleed;
- gradient o overlay pesante nella meta' inferiore;
- testo nella zona coperta dall'overlay;
- headline o citazione Cormorant Garamond Bold Italic, 46-52 px, LIGHT;
- una parola chiave in GOLD italic solo se supportato;
- spiegazione Sorts Mill Goudy, 26 px, TAUPE;
- niente kicker;
- niente label sezione;
- nessun arco decorativo.

---

## TENSION_DARK

Svolta narrativa senza foto.

Elementi:

- background VERY_DARK;
- frase centrale forte;
- spiegazione sotto;
- logo discreto.

Regole:

- composizione piu' vuota, ma non con vuoti non intenzionali;
- usa una frase precisa, non teatrale;
- no decorazioni.

---

## PAYOFF_LIGHT

Soluzione o punto di arrivo.

Elementi:

1. background LIGHT;
2. headline;
3. pill box con 2-3 punti;
4. claim Looniva in basso;
5. logo discreto.

Regole:

- headline Cormorant Garamond Bold, 64 px, DARK;
- 1 parola gold italic solo se serve;
- pill box stile BUILD;
- claim Looniva in basso, 22 px, TAUPE;
- claim verificabile e non esagerato.

Esempio claim cauto:

```text
Per questo Looniva lavora sulla scelta del materiale, sulla tracciabilita' e sulle certificazioni.
```

Non usare claim non verificati come:

```text
La migliore biancheria per dormire.
```

---

## CTA

Ultima slide sempre.

Elementi:

1. background LIGHT o DARK;
2. frase bridge;
3. headline principale;
4. CTA pill;
5. logo centrato in basso.

Regole:

- bridge sentence Sorts Mill Goudy, 26 px, TAUPE, centrata in alto;
- headline Cormorant Garamond Bold, 72 px, centrata, max 4 righe;
- CTA pill con border radius 30 px;
- se sfondo LIGHT, CTA pill DARK con testo LIGHT;
- se sfondo DARK, CTA pill LIGHT con testo DARK;
- logo centrato in basso, 30 px, opacita' piena;
- nessun arco decorativo.

CTA keyword per topic:

- scientifico/educativo: "Salva per il prossimo acquisto";
- prodotto: "Scopri Looniva";
- sostenibilita': "Scegli con consapevolezza";
- certificazioni: "Leggi le nostre certificazioni";
- mito da smontare: "Rileggi prima di scegliere".

---

# Checklist designer

Prima di creare o confermare il design Canva, verifica ogni slide.

Checklist:

- un designer esperto posizionerebbe ogni elemento cosi'?
- ci sono testi sovrapposti?
- c'e' uno spazio vuoto oltre 100 px non intenzionale?
- l'oro e' usato a gocce?
- il testo sta nello spazio assegnato?
- la slide HOOK ha la foto come protagonista?
- il testo e' nello spazio negativo?
- non ci sono kicker sull'hook?
- non ci sono archi decorativi?
- il logo e' presente e discreto?
- la CTA e' concreta?
- il DATA_DARK ha numero editabile?
- nessuna slide e' un'immagine piatta unica?
- tutti i claim numerici sono verificati o rimossi?

Regola spazi vuoti:

Se c'e' spazio tra titolo e testo, quello spazio deve essere riempito da:

- foto;
- dato numerico grande;
- pill box;
- item aggiuntivo utile;
- tensione compositiva intenzionale.

Mai lasciare vuoti casuali.

---

# Qualita' Canva

Dopo la creazione del design, esegui un controllo qualita'.

Verifica:

- design Canva creato;
- design ID presente;
- edit URL presente;
- formato 1080x1350;
- numero pagine tra 5 e 12;
- prima slide HOOK;
- ultima slide CTA;
- tutti i testi principali presenti;
- immagini fotografiche caricate come asset;
- elementi editabili;
- DATA_DARK non rasterizzata;
- nessun placeholder;
- nessun export statico usato come slide finale.

Se il design e' stato creato ma ci sono warning minori, restituisci successo con warning.

Se il design non e' editabile, fallisci.

---

# Output

## Output in modalita' normale

Rispondi con:

```text
Carosello Canva creato.

Design editabile:
[Canva edit URL]

Slide create:
1. [tipo] - [headline]
2. [tipo] - [headline]
...

Note:
- [eventuali warning]
```

Non allegare PNG.

## Output in agent_mode

Se `agent_mode: true`, restituisci SOLO JSON valido.

Schema:

```json
{
  "status": "success",
  "canva_design_id": "string",
  "canva_edit_url": "string",
  "slide_count": 7,
  "slides": [
    {
      "slide_number": 1,
      "layout_type": "HOOK_PHOTO",
      "headline": "string",
      "subtitle": "string",
      "photo_used": "string optional",
      "canva_asset_id": "string optional"
    }
  ],
  "assets": [
    {
      "source": "string",
      "canva_asset_id": "string",
      "used_in_slide": 1
    }
  ],
  "files": {
    "manifest": "string",
    "report": "string",
    "canva_layout_spec": "string"
  },
  "quality_report": {
    "passed": true,
    "issues": [],
    "warnings": []
  }
}
```

Se fallisce:

```json
{
  "status": "failed",
  "error_code": "CANVA_DESIGN_CREATION_ERROR",
  "message": "string",
  "partial_outputs": {},
  "quality_report": {
    "passed": false,
    "issues": [],
    "warnings": []
  }
}
```

---

# File locali da generare

Se `output_dir` e' disponibile, salva:

```text
/output_dir/canva_carousel_{topic}/
  canva_layout_spec.json
  slide_copy.json
  manifest.json
  report.md
```

Non salvare PNG esportati.

## manifest.json

Deve contenere:

```json
{
  "topic": "string",
  "brief": "string",
  "canva_design_id": "string",
  "canva_edit_url": "string",
  "slide_count": 7,
  "slides": [],
  "assets": [],
  "quality_report": {},
  "created_at": "ISO timestamp"
}
```

## report.md

Deve contenere:

- topic;
- link Canva editabile;
- elenco slide;
- immagini usate;
- eventuali warning;
- note su font fallback;
- note su claim verificati o rimossi.

---

# Error handling

Usa questi codici errore:

- INPUT_VALIDATION_ERROR
- CANVA_MCP_UNAVAILABLE
- CANVA_ASSET_UPLOAD_ERROR
- CANVA_DESIGN_CREATION_ERROR
- CANVA_EDITING_TRANSACTION_ERROR
- CANVA_FONT_FALLBACK_WARNING
- CANVA_QUALITY_CHECK_FAILED
- FACT_CHECK_BLOCKED_CLAIM
- INSUFFICIENT_IMAGES_FOR_PHOTO_LAYOUT
- OUTPUT_REPORT_ERROR

Comportamento:

- se manca Canva MCP, fallisci;
- se mancano immagini ma puoi usare layout non fotografici, continua;
- se una slide richiede foto ma l'asset non e' caricabile, passa a layout non fotografico o segnala errore;
- se il copy contiene claim non verificabili, riscrivi;
- se non riesci a creare design editabile, fallisci;
- non restituire PNG come fallback.

---

# Integrazione con /looniva-social-strategist

Se l'utente ha gia' usato `/looniva-social-strategist`, importa:

- pillar;
- hook leva;
- registro vocale;
- bozza copy;
- CTA;
- eventuale struttura narrativa.

Se non e' disponibile, costruisci tutto autonomamente.

---

# Regola finale

L'obiettivo della skill non e' produrre un'immagine bella.

L'obiettivo e' produrre un carosello Canva editabile, coerente con Looniva, pronto per essere rifinito manualmente dall'utente dentro Canva.

Il risultato e' valido solo se:

1. il design Canva esiste;
2. l'edit URL funziona;
3. le slide sono pagine Canva;
4. testi, numeri, immagini e box sono elementi editabili;
5. nessuna slide e' una rasterizzazione unica;
6. Visual Brain v2 e' rispettato;
7. la slide DATA_DARK mantiene numero e spiegazione editabili;
8. non vengono esportati PNG.
