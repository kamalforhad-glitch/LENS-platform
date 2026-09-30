# PHASE: OUR FOCUS / FocusAreas — Compact Landscape Cards (horizontal)

Status: **COMPLETE** — verified at 1440 / 768 / 390, no horizontal overflow, no clipped text.

## 1. Scope

Single file touched: `src/components/FocusAreas.tsx` (`FocusCard` body only).

No other component, section, style token, string, icon, or color was modified.
All 8 cards kept, grid column definition untouched (`grid sm:grid-cols-2 gap-5`).

## 2. What changed (card body only, portrait → landscape)

| Area | Before | After |
|---|---|---|
| Content wrapper | `p-6` (stacked) | `p-5 flex gap-4` (horizontal row) |
| Icon tile | `w-14 h-14 mb-4` above text | `w-12 h-12 shrink-0` left of text |
| Text block | loose children of card | wrapped in `min-w-0 flex-1` (prevents text overflow) |
| Title / desc rhythm | `mb-2` / `mb-3` | `mb-1` / `mb-2` (compact) |
| Row height consistency | cards sized independently | card root `min-h-full` so every card in a row matches |

Preserved verbatim: all 8 `focusAreaKeys`, lucide icons, `accentColor` / `glowColor`,
top accent bar, radial glow, GSAP tilt + hover scale, GSAP hover-expand detail panel,
`Learn More →` link, section heading/copy, 2-column grid, entrance animations.

`min-h-full` (not `h-full`) was chosen deliberately: it equalises row heights while
still allowing the card to **grow** when the GSAP detail panel expands on hover.

## 3. Static checks (final tree)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **exit 0**, 0 errors |
| Unit tests | `npx vitest run` | **exit 0** — 7 files, **31/31 passed** |
| Production build | `npx next build` | **exit 0**, full route table compiled/prerendered |
| Targeted lint | `npx eslint src/components/FocusAreas.tsx` | **exit 0**, 0 warnings/errors |

## 4. Screenshot + geometry verification (headless Chrome 153 via CDP)

Measurements are taken **after** the section is scrolled into view and the GSAP
entrance animation settles (cards animate from `scale: 0.92`; measuring earlier
reports pre-animation sizes).

### 1440×900 desktop — `focus-after-1440.png`
- **8 cards, 2 columns × 4 rows** (required layout) ✅
- Every card **396 × 148 px** → landscape, ratio **2.68 : 1** (wider than tall) ✅
- Rows uniform: y = 198 / 366 / 533 / 699 (equal 20px gutters)
- Horizontal overflow: `scrollWidth 1434 == clientWidth 1434` → **none** ✅
- Clipped text nodes (h3/p/span with scroll > client): **0** ✅

### 768×1024 tablet — `focus-after-768.png`
- **8 cards, 2 columns × 4 rows** ✅
- Cards **347 × 148 px** (last row 347 × 172 — 3-line description, still landscape) ✅
- Horizontal overflow: `762 == 762` → **none** ✅
- Clipped text nodes: **0** ✅

### 390×844 mobile — `focus-after-390.png`
- **8 cards, 1 column × 8 rows** (stacks below `sm`) ✅
- Cards **358 × 148 px** (last 358 × 172) — still landscape ✅
- Horizontal overflow: `390 == 390` → **none** ✅
- Clipped text nodes: **0** ✅

### Hover / expand regression — `focus-hover-1440.png`
- Card 0 on mouse hover: detail panel height `40px`, opacity `1`, `scrollHeight ==
  clientHeight` → **not clipped** ✅
- Card grows 148 → 191px; its row sibling stretches to the same 191px (min-h-full) ✅
- Collapsed siblings stay `height 0 / opacity 0` ✅
- Document width still `1434 == 1434` during hover ✅

## 5. Before / after

- Before: `focus-before-1440.png` — tall portrait cards (icon stacked above text,
  ~234px tall, only 3.5 cards per viewport).
- After: `focus-after-1440.png` — compact landscape cards, all 8 visible in a
  2 × 4 block, section height 906px.

Artifacts: `C:\Users\Mypc\AppData\Local\Temp\opencode\scroll-verify\focus-*.png`
(`focus-shot.mjs`, `focus-verify.mjs`, `focus-hover.mjs`).

## 6. Notes on pre-existing (untouched) findings

An element-scan flags a few nodes extending past the viewport in **other**
sections — `globe-container` (GlobeNetwork), `.pub-card-wrap` (publications),
and decorative `*-bg-orb` gradients. They are all clipped by their own
`overflow-hidden` ancestors, produce **no document-level horizontal scroll**
(`scrollWidth == clientWidth` at every breakpoint), and are unrelated to this
task, so they were left unchanged.

## 7. Acceptance

| Requirement | Result |
|---|---|
| Keep all 8 cards | ✅ 8/8 |
| Desktop 2 columns × 4 rows | ✅ measured 2 cols × 4 rows |
| Compact landscape / wider than tall | ✅ 396×148 desktop, 347×148 tablet, 358×148 mobile |
| Preserve text, icons, colors, visual language | ✅ none altered |
| No unrelated section modified | ✅ `git diff` scoped to `FocusAreas.tsx` card body |
| tsc / tests / build / lint | ✅ all exit 0 |
| No horizontal overflow | ✅ all 3 breakpoints |
| No clipped text | ✅ 0 clipped nodes, hover-expand verified |
