# MOGI Drop 0 — Marketplace Design Document

---

## Concept

The marketplace draws from two visual references held in tension:

- **AWGE.com** — raw, maximalist, characters bleeding off the edges of the screen, no chrome, no nav, just the drop.
- **2010 Roblox Catalog** — system fonts, blue underlined item names, grey thumbnails, stamped status labels. The internet before it got polished.

The result is a brutalist claim registry dressed up as a collectible marketplace. Everything is designed to communicate scarcity and urgency without feeling like a countdown-timer dark pattern.

---

## Color Tokens

| Token      | Value       | Usage                                              |
|------------|-------------|-----------------------------------------------------|
| `--ink`    | `#111111`   | Body text, borders, title                          |
| `--link`   | `#1a6fc4`   | Item names (Roblox catalog blue — clickable feel)  |
| `--green`  | `#1d9e5e`   | LIVE state title glow                              |
| `--red`    | `#c0392b`   | Deny flash on ENTER button                         |
| `--gold`   | `#b8923a`   | Edition number, holder name in registry            |
| `--amber`  | `#d4831f`   | CLAIMING stamp                                     |
| `--heat`   | `#e8472b`   | Live dot, "N left of 20" counter, claiming bubble  |
| `--line`   | `#e2e2e2`   | Card borders, dividers                             |
| `--grey`   | `#8a8a8a`   | Subtitles, sold-out states, watchers count         |
| `--bg`     | `#ffffff`   | Page background (with subtle CSS scanline overlay) |

---

## Typography

| Role              | Font stack                              | Size / Weight          |
|-------------------|-----------------------------------------|------------------------|
| Display titles    | `'MS Sans Serif', 'Courier New', mono`  | `clamp(28px–60px)` / 900 |
| Item names        | `'MS Sans Serif', system`               | `11px` / bold, underlined |
| Prices & numbers  | `'Courier New', mono`                   | `12px` / bold          |
| Body / labels     | `'MS Sans Serif', system`               | `10–12px`              |
| Status / stamps   | `'Courier New', mono`                   | `9–11px` / 900, uppercase, tracked |

Scanlines run across the entire page via a CSS `repeating-linear-gradient` at 4px intervals — visible only as a faint texture, not a hard effect.

---

## Layout

### Structure

```
┌─────────────────────────────────────────────────────┐
│  [MASCOT COL LEFT — fixed]   [MASCOT COL RIGHT — fixed] │
│                                                       │
│              ┌────────────────────┐                  │
│              │   MOGI drop header │  ← scrolls away  │
│              │   (not sticky)     │                  │
│              ├────────────────────┤                  │
│              │  4-col item grid   │  ← scrolls       │
│              │  (20 cards)        │                  │
│              └────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### Mascot Columns

- `position: fixed` — pinned to the full viewport height, never scroll
- Width: `clamp(220px, 30vw, 440px)` per side
- Each column holds all 3 mascot images (`pic1.png`, `pic2.png`, `pic3.png`), distributed evenly top-to-bottom (`justify-content: space-around`)
- `mix-blend-mode: multiply` dissolves the white background of each PNG into the page
- Hidden below `820px` viewport width — mobile gets full-width grid

### Center Content

- Offset from both sides by the mascot column width (matching `margin-left / margin-right`)
- Contains: drop header + product grid
- Max grid width: `680px`, auto-centred

### Drop Header

- Scrolls with the page (not sticky)
- No bottom border — the grid begins immediately below
- Structure: `MOGI` (large mono title) → `Drop 0 · heavyweight · limited to 20` (small caps subtitle) → live status indicator

---

## Status Indicator

```
● 18 left of 20
```

- Red dot (`--heat`) with CSS `box-shadow` glow, blinks at 1.1s interval
- Flips to grey static dot + `SOLD OUT · 0 of 20` when all 20 are gone
- Inline, centered below the header subtitle

---

## Product Grid

**Breakpoints:**

| Viewport    | Columns | Gap  |
|-------------|---------|------|
| < 480px     | 2       | 6px  |
| 480–699px   | 3       | 8px  |
| ≥ 700px     | 4       | 10px |

---

## Item Card

### Anatomy

```
┌──────────────────┐
│                  │  ← thumbnail (1:1 aspect ratio)
│   shirt image    │     — shirtfront.jfif fills the box
│                  │     — 3D spin animation on hover
│  [HEAT BUBBLE]   │     — claiming bubble overlaid top-right
│       ✕          │     — sold-out X overlay
├──────────────────┤
│ MOGI #01/20      │  ← --link blue, underlined
│ Drop 0 · heavy   │  ← --grey subtitle
│ HKD 380          │  ← --ink, mono
│ [CLAIMING] stamp │  ← rotated 2°, amber border
│ holder_name      │  ← --gold
│ 👁 3 watching    │  ← --grey, 9px
└──────────────────┘
```

### Thumbnail 3D Hover

The thumbnail is a CSS `preserve-3d` container with two faces:

- **Front**: `shirtfront.jfif`
- **Back**: `shirtback.jfif` (rotated `rotateY(180deg)`)

On hover, `card-tee-spin` keyframe runs `rotateY(-38deg → 218deg)` with `alternate` — this sweeps past 180° revealing the back face, then rocks back. Duration: 3s, `ease-in-out`.

Parent has `perspective: 700px` set on the `.card-thumb` element.

### Card States

| State            | Visual treatment                                                   |
|------------------|--------------------------------------------------------------------|
| **Available**    | Normal, hover triggers 3D spin + blue border highlight            |
| **Claiming**     | Heat bubble (`someone is claiming…`) in `--heat` red, pulsing    |
| **Claimed/Unpaid** | `CLAIMING` stamp (amber, rotated), holder name in gold, watcher count |
| **Sold/Paid**    | Grey `✕` overlay, desaturated thumbnail, `OUT OF STOCK` stamp, name in grey |

Sold cards do not respond to clicks. Claimed-but-unpaid cards remain fully visible — the holder name and watcher count are intentional social proof / demand signal.

---

## Claim Modal

Triggered by tapping any available card.

### Window Chrome

Win98-style titlebar: `MOGI #XX/20 — Claim Window` with a gradient `#000080 → #1084d0` and a close button.

### 3D Shirt Viewer

- `perspective: 700px`, `transform-style: preserve-3d`
- Auto-spins continuously: `rotateY(-40deg → 220deg)`, `4s ease-in-out infinite alternate`
- Front face: `shirtfront.jfif` / Back face: `shirtback.jfif`
- Both faces use `backface-visibility: hidden`

### Step Flow

**Step 1 — Confirm**
> "Claim #XX/20?" · [Not yet] [Yes, claim it]

**Step 2 — Details**
- Display name (required, shown on the public registry)
- Size dropdown: S / M / L / XL
- IG handle (optional)
- Toggle: "Show my IG so people can find me"

**Step 3 — Success**
- Large gold edition number (`#XX/20`)
- Green-on-black countdown display: `MM:SS` (30:00 → 0:00)
- CTA: `DM @mogi.exists to pay now ↗`
- If timer expires: slot is auto-released, error state shown with retry option

---

## Sound Design (Web Audio API)

| Event              | Sound                                                 |
|--------------------|-------------------------------------------------------|
| ENTER (locked)     | Square wave descending `180Hz → 80Hz`, 0.35s         |
| Button click       | White noise burst, 50ms fade                         |
| Claim confirmed    | 4-note ascending triangle wave `C5 E5 G5 C6`, 120ms apart |
| Modal open         | Sine sweep `440Hz → 880Hz`, 150ms                    |

All sounds use a freshly instantiated `AudioContext` per event — no persistent context required.

---

## Interaction States Summary

| Element               | Default         | Hover                        | Active/Pressed          |
|-----------------------|-----------------|------------------------------|-------------------------|
| Available card        | Static          | 3D spin + blue border        | Opens modal             |
| ENTER button (closed) | Win98 grey      | —                            | Shakes + red flash + deny sound |
| Modal buttons         | Win98 grey      | —                            | Border inverts (inset)  |
| Claim CTA (step 3)    | Black pill       | —                            | Opens Instagram DM      |

---

## File Map

```
app/
  globals.css          — all tokens, layout, animations
  layout.js            — root HTML shell
  page.js              — state machine entry point

components/
  SiteClosedView.jsx   — State 1: floating tees, shatter animation
  LiveView.jsx         — State 2: pulsing LIVE title
  MarketplaceView.jsx  — State 3+4: fixed mascots, grid, header
  ItemCard.jsx         — single product card with 3D thumb
  ClaimModal.jsx       — 3-step claim flow with 3D tee + countdown
  FloatingTees.jsx     — 20 drifting tee placeholders (background)

lib/
  audio.js             — Web Audio API sound helpers
  useStore.js          — Context + useReducer state machine

public/pics/
  pic1.png             — mascot 1
  pic2.png             — mascot 2
  pic3.png             — mascot 3
  shirtfront.jfif      — product front image
  shirtback.jfif       — product back image
```
