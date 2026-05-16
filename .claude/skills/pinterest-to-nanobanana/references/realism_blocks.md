# Realism Blocks — reusable, mandatory in every prompt

These blocks are the anti-AI engine of the skill. They are inserted verbatim into the JSON (`realism_blocks.*` fields) and then expanded into the natural-language prompt in fluent English. Never truncate them. Without these blocks the images look synthetic.

---

## 1. Human Face Realism Block

Use whenever a face is visible in the frame.

> **Mouth**: visible lip lines with fine vertical striations across both upper and lower lips, subtle color variation spreading from the center outward, natural asymmetry where the lip corners meet, soft realistic shadowing at the corners and in the philtrum groove, slight moisture catching light on the lower lip, small imperfections and tiny dry patches at the lip edge, the vermilion border soft rather than sharply drawn.
>
> **Eyes**: fine visible pores and hairline skin-lines around the eye sockets and in the tear trough, iris rendered with a natural color gradient radiating from the pupil outward with fine radial fibers and a slightly darker limbal ring, individual eyelashes with natural curl and irregular length at both upper and lower lash lines, eyebrows with varying hair density and some stray hairs breaking the outer contour, soft directional shadowing in the eye socket, catchlight small and slightly irregular rather than a perfect dot, tiny red vessels faintly visible in the sclera, subtle moisture on the lower waterline.
>
> **Hair**: individual strands distinguishable at the hairline and along the parting, subtle light reflection where strands catch the key light with varying intensity, slight flyaway hairs and a few frizz filaments breaking the silhouette, highlights soft and organic rather than blown, density variation along the length, a few shorter baby hairs visible at the temples and nape.
>
> **Skin**: pores visible and distinctly distributed with subtle size variation, fine vellus hairs (peach fuzz) visible along the jawline, upper lip and cheekbones catching rim light, tiny bumps and micro-texture variation from follicles and sebaceous activity, natural oils producing a soft directional sheen only in the T-zone and on the high planes of the cheekbones, fine skin grain apparent at close range, no plasticine smoothing, subtle blood-circulation color warmth under the cheeks and at the nose tip, natural unevenness in tone warmer near the cheeks and nose and cooler near the temples and jaw underside.

---

## 2. Bamboo Viscose Fabric Realism Block

Use always. The product is present in every shot.

> Bamboo viscose sateen textile with individual satin-weave fibers catching light at slightly different angles, visible warp-and-weft direction where the weave pulls tight and a subtle thread grain running diagonally across the surface, soft directional lustre that shifts as the fold orientation changes rather than a uniform synthetic shine, rounded organic folds with light pooling in the valleys and warm shadow cores that retain color rather than collapsing to black, micro-wrinkles following gravity and body contour with no crisp geometric creases, slight translucence where the fabric thins or is backlit so that the form beneath is faintly visible, clean stitching at the edges with thread slightly recessed into the weave and minute irregularities in stitch tension, subtle yarn density variations visible at close range, faint surface fuzz catching rim light along fold ridges, natural absence of static-charge cling and synthetic bounce, edges draping under their own weight.

---

## 3. Environmental Material Realism Blocks

Pick the ones relevant to the scene. Use the full block for any material that occupies meaningful frame area.

> **WOOD**: visible grain direction with long fibrous lines, open pores in harder cuts catching micro-shadow, small unique scratches and dents from use, matte finish catching light at low angles with a soft directional sheen, warmer amber undertones pulled by indirect light, subtle dust on horizontal surfaces.
>
> **MARBLE**: fine veining with color gradient transitions flowing asymmetrically across the surface, subtle surface reflections that change direction with angle, micro-scratches across the polished face, cool undertones deepening in the shadowed zones, faint rim of moisture or oil residue at edges.
>
> **PLASTER / INTONACO**: irregular surface with visible trowel-mark micro-shadows, tiny pigment variations in tint, occasional hairline crack or chip, soft bounce light filling close-range shadows, absorbent matte finish that does not specular-reflect.
>
> **CERAMIC**: subtle glaze imperfections and small pinholes, tiny air bubbles beneath the surface catching light, soft specular highlights rather than sharp, fine crazing lines in older pieces, slight color pooling near the foot ring.
>
> **AGED METAL**: patina variation across the surface with regions of darkening and brightening, small oxidation pits and micro-scratches, mirror zones alternating with diffuse zones, slight warmth in the indirect reflections.
>
> **LEAVES / PLANTS**: individual vein structure visible on the leaf surface, thin waxy cuticle catching light as a soft directional gloss, edge translucence where light passes through thin tissue, slight droop from weight, occasional small insect damage or irregular edge detail, dust settled on upper surfaces.
>
> **HUMAN HANDS (if visible)**: knuckle wrinkles and fine creases at the joints, subtle veins visible through the skin on the back of the hand, nail ridges running vertically, cuticle detail, slight warmth in the palm reflecting onto the fingers, occasional small callus or freckle, hair follicles faintly visible on the knuckle area.
>
> **CONCRETE**: aggregate variation visible in the surface, tiny pores and air pockets, directional form marks from casting, dust and water staining in fine patterns, cool grey base with warm micro-tones in the aggregate.
>
> **LINEN OR COTTON (non-product fabric in scene)**: visible weave structure with slightly uneven thread thickness, micro-wrinkles that hold their shape, matte finish absorbing light, soft edges fraying slightly at cut points.

---

## 4. Light on Skin and Fabric Block

Use whenever both skin and fabric are in the frame together.

> Specular highlights on the skin are soft rather than sharp, falling primarily on the bridge of the nose, the tops of the cheekbones, and the upper lip border, with a faint satin quality rather than a glossy pop. Bounce light from surrounding surfaces fills the shadow side of the face with a subtle color borrow, warm floor or fabric bouncing into the jaw line, cool wall or ambient surface bouncing into the temple. Subsurface scattering on the skin produces a slight warm glow in the thinnest areas, the edges of the ears, the tip and bridge of the nose, the rims of the fingers when held near the face. On the fabric, highlights follow the fiber and fold direction rather than appearing as a flat gloss patch, backlit folds reveal a soft translucent glow at the thinnest regions where light passes through, and shadow cores inside the folds retain warm color instead of collapsing to black. Where skin and fabric meet, the edge transition is soft with a thin rim of warm scatter rather than a hard line.

---

## 5. Anti-AI Cues Block

Append at the end of every natural-language prompt in fluent English.

> no plastic or waxy skin, no perfect facial symmetry, no glossy airbrushed finish, no synthetic sheen on the fabric, no cartoonish catchlights in the eyes, no uniform pore distribution across the face, no over-sharpened edges, no AI-telltale smoothing, no unnaturally clean or empty environment, no painted-on eyelashes, no glass-like eyes, no perfectly symmetric nostrils, no uniform background gradient, no doll-like proportions, no identical twin catchlights in both eyes, no floating hair without follicle attachment, no synthetic crisp creases in the fabric, no posed mannequin quality.

---

## How to use these blocks

1. **In the JSON**: paste the block text verbatim into the matching field (`realism_blocks.face`, `realism_blocks.fabric`, `realism_blocks.materials`, `realism_blocks.light_on_surfaces`, `anti_ai_cues`). Do not trim.
2. **In the natural-language prompt**: expand the block into the flow of the sentence, preserving every detail. You may rephrase the lead-in ("The skin shows …" instead of "Skin: …") but you cannot drop content items.
3. **For `materials`**: include only the blocks for materials actually present in this specific scene. If the scene has marble and wood, include both. If it has only plaster, include just plaster.
4. **Length budget**: with all blocks deployed, expect 180–260 words per natural-language prompt. Shorter prompts = truncated blocks = synthetic output.

---

## Important: word-safety reminder (route "c" rules)

These blocks use the word `skin` repeatedly. That is intentional and approved for technical photographic context. The backend rejects `skin` only when paired with intimacy cues (`naked`, `bare`, `bed`, `sensual`, `sleeping`). Keep all `skin` references in a strictly photographic-realism register and they pass through.
