# MOGI — main site

Static site. No build step, no dependencies. Open `index.html` or serve the folder.

```bash
python -m http.server 4173
```

## Files

| File | What it is |
|---|---|
| `index.html` | Every page. Views are `<section class="view">`, switched by the URL hash. |
| `style.css` | All styling. Brand tokens are at the top in `:root` — see **Visual system** below. |
| `app.js` | Router, About chapters, crewmate cards, holder list, scroll reveals. |
| `assets/` | Images. |
| `_optimize_images.py` | Optional. Shrinks everything in `assets/`. Re-run after adding big photos. |

## Routes

`#/` menu · `#/about` · `#/stock` · `#/owner` · `#/drop0`

## What to fill in before the expo

Everything still needing real content is marked `[EDIT]` in the page (shows in red) or
`<!-- TODO -->` in the source.

**In `app.js` (top of the file):**
- `HOLDERS` — the 20 Drop 0 buyers. Replace `'Anonymous'` with real names.
- `CREW` — the four people in the boat: role, name, one-line bio.

**In `index.html`:**
- Social + shop links — search for `TODO: real links` (footer) and `Shop ↗` (menu).
- Email — search for `hello@mogi.example` and replace everywhere.
- Drop 0 release date — `[EDIT — date]` in the Drop 0 section.
- Core beliefs, "how we get there" steps, founder story — all marked `[EDIT]`.
- Owner Info page is a deliberate placeholder, per the blueprint.

## Adding a product

Copy one `<article class="item">` block in the "In development" grid, swap the image
and text. Drop the image in `assets/` first (PNG with transparent background, ~850px).

## Notes

- Sold-out styling is the `item--gone` class — grey plate, drained image, `SOLD OUT` stamp.
  Add it to any item that runs out; nothing else needs to change.
- The boat scene is inline SVG in `index.html`. Crewmate positions are the `<use href="#crew">`
  x/y values; `data-crew` maps each one to the `CREW` array in `app.js`.
- Animations are disabled automatically for visitors with reduced-motion turned on.

## Deploying

Drag the whole folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — it is a
plain static site, so any host works. No server needed.

## Visual system — "pinned wall"

Drawn from the studio artwork: the spray mural, the Goyard chibi triptychs, the expo
photos with line art drawn over them, and the handwritten notes.

**Ground.** Warm plaster (`--wall`), not white. Uneven light plus a film-grain overlay,
both in `.paper-grid` — no image file needed.

**Colour.** Near-monochrome ink on paper with **one pop per section**, never several at
once. Each view sets its own `--accent`, so buttons, kickers, rules and stamps all follow:

| Section | Accent | From |
|---|---|---|
| Menu, Drop 0 | `--pop-gold` | the LV box |
| About ch.1 | `--pop-blue` | blue Goyard tote |
| About ch.2 | `--pop-gold` | yellow tote |
| About ch.3 | `--lamp` | the sewing-room lamp |
| Stock | `--pop-red` | red tote, the red underline |
| Owner | `--pop-navy` | the durag |

To re-skin a section, change one line — e.g. `#v-stock{--accent:var(--pop-blue)}`.

**Type.** Permanent Marker for headers and product names, Caveat for anything diaristic
(asides, the manifesto, button notes), Courier Prime for specs and labels, Archivo for
body and the big display numbers.

**Drawn boxes.** `--sketch-a` / `--sketch-b` are asymmetric border-radii — a box drawn by
hand never closes square. Buttons also carry a `::before` ghost outline, offset a few pixels:
the marker going round twice.

**About page (v3).** Deliberately not a slide deck. No three-up feature cards, no numbered
step list — those read as generic. Instead: hand-lettered headings (`.display--hand`), a
speech bubble off the mascot (`.say` / `.bubble`), margin notes taped up crooked at four
different widths and rotations (`.notes__n`), a run-on written straight on the wall
(`.scrawl`), a hard-divider photo triptych (`.trip--photo`, which wears the line art like `.worn` does),
and a caption burned into the photograph (`.burn`). Copy is lowercase and blunt, in the founder's own voice.

**Motifs.**
- `.pin` — a white pushpin. Drop one inside any `position:relative` block.
- `.section-h` — marker-stroke underline; it is an SVG mask (`--stroke`), so it takes the
  section's accent automatically.
- `.trip` — triptych with hairline rules between panes, like the pinned mural sheets.
- `.menu__sheet` — pinned sheet with a strip of masking tape across the top.
- The crewmates scene is white marker line art on navy: stroked hulls and wave crests,
  spray drips off the hull, crew as white cut-outs with an ink outline.
- Photography is desaturated and wears `assets/lineart-white.png` — the mascot as glowing
  white line art. Hover fades the drawing out and the colour photo back in.

**Regenerating the line art.** `assets/lineart-white.png` is derived from `assets/mark-x.png`
by turning ink darkness into alpha and painting it white. If the mark ever changes, rebuild
it rather than inverting the PNG in CSS — inverting a filled drawing gives a solid blob.

### Art still to drop in

These were shown as references but are not in the repo. Each has a slot ready:

- the spray mural sheets → would replace the `.trip` block or head the About chapter
- the Goyard chibi triptych → ideal for `.belief-grid`
- the sewing-room illustration → belongs beside the manifesto quote
- expo / group photos → drop into `.worn`, they already get the line-art treatment

Put them in `assets/`, run `python _optimize_images.py`, then swap the `src` attributes.
