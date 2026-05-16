# Looniva Canva Carousel Agent

Cloud agent end-to-end che genera caroselli Instagram Looniva come **design Canva editabili** creati da zero, orchestrando le skill `/pinterest-to-nanobanana` e `/looniva-carousel` con i tool MCP **Higgsfield** (immagini) e **Canva** (design).

## Quick start

```bash
# 1. Installa dipendenze
npm install

# 2. Configura .env (vedi .env.example)
cp .env.example .env
$EDITOR .env

# 3. Esegui
npm run looniva:canva-carousel -- \
  --brief "Perché la viscosa di bambù è diversa dal cotone di notte" \
  --products ./inputs/prodotto_1.jpg ./inputs/prodotto_2.jpg \
  --output ./outputs/looniva_canva_carousels/bamboo_vs_cotton
```

L'output finale è un **link Canva editabile** in cui ogni testo, numero, immagine, shape e linea è un elemento separato e modificabile.

## Documentazione completa

Vedi [`docs/looniva-canva-carousel-agent.md`](docs/looniva-canva-carousel-agent.md).

## Test

```bash
npm run typecheck
npm test
```

## Non-goal

Questo agente **non**:

- esporta PNG / JPG / PDF;
- duplica template Canva o brand template;
- crea slide piatte rasterizzate;
- inventa claim ambientali o medici (fact-check obbligatorio);
- usa em dash nel copy finale.
