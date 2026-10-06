# Phase Residual Scroll Profile (diagnostic only — zero application changes)

> Real headed Chrome 153 on the host. Method correction applied mid-phase:
> this box's window occludes intermittently (user session), which throttles
> rAF and corrupts wall-clock metrics — every number below was taken with
> `visibilityState === "visible"` asserted immediately before measuring
> (runs abort otherwise). Earlier un-gated runs are superseded where they
> conflict. Nothing fabricated; no repo files modified (only this report
> is new).

## 1. Executive summary
CPU-profiler attribution found the residual scroll cost driver: **R3F
`<Canvas>` re-runs `configure() → store.setSize() →
`WebGLRenderer.setSize` (full renderer resize: backing-store realloc +
viewport/camera reset) at scroll frequency** — 2757 + 784 samples on the
identical stack across two runs, 0 during idle dwell. Mechanism (read in
`node_modules/@react-three/fiber` source): `<Canvas>` measures its
container with `useMeasure({ scroll: true, debounce: { scroll: 50 } })`
into a dep-less layout effect that calls `configure({ size:
containerRect })`, and the rect carries scroll-varying top/left — so every
scroll tick re-measures, re-renders, re-configures, and re-sizes the
renderer. Wall-clock longtask totals on this shared box are noisy
(occlusion/throttle variance), but the stack mechanism is deterministic
and environment-independent. Everything else (triggers, Lenis, cursor,
React, layers, video) is exonerated by measurement below.

## 2. Exact hardware/browser/environment
- Host Windows box (shared user session — window occludes intermittently;
  all runs below visibility-gated), headed Chromium 153
  (`chromium-1243`), real GPU compositing, dev server (`npm run dev`).
- Viewports 1440×900 (DSF 1) and 390×844 (DSF 2, touch, unthrottled + 4x
  `setCPUThrottlingRate`), CDP rAF + longtask + CPU-profiler harnesses in
  temp dir (outside repo).

## 3. Baseline measurements (visible-gated, real GPU)
- A idle-hero: 89fps, 0 longtasks. F globe-dwell: 257.7fps, 0lt.
  G map-dwell: 309.6fps, 0lt.
- B normal-scroll: 164.9fps, p95 17.0ms, **0 longtasks**, reach exact.
- C rapid-scroll: 199.5fps, p95 17.0ms, 1lt/91ms.
- D slow-scroll: 177.2fps, p95 16.8ms, 2lt/186ms.
- E trigger-heavy mid-page: 361.3fps, p95 16.7ms, 0lt.
- Mobile 390×844: normal 140fps p95 33.3ms 1lt/62ms; rapid 0lt; slow
  2lt/134ms; trigger-heavy 0lt. Mobile-4x: 1–2lt normal range; throttled
  extremes (21–54lt) correlate with occlusion/throttle stacking, not app
  state (see §10).
- DOM 935–945 nodes. No scroll locks/freezes in any run.

## 4. Desktop normal-scroll trace
**NOT MEASURED** — timeline tracing returned zero events on two attempts
(category set + stream handling verified working; this Chromium build
emits nothing for the requested categories). No GPU/scripting split
fabricated. CPU-profiler (§5 in prior phase + §11 here) substitutes for
the JS half; raster/composite half is inferred only from controlled A/B
(§8), stated as such.

## 5. Desktop rapid-scroll trace
Same tooling limitation as §4. Rapid-scroll wall metrics: 199.5fps,
p95 17ms, 1lt/91ms (visible-gated) — near-clean.

## 6. ScrollTrigger isolation
Runtime neutralization **UNAVAILABLE**: `window.gsap` and
`window.ScrollTrigger` are undefined (module scope, no global export) —
killing triggers at runtime would need code hooks, correctly refused.
Evidence instead: (a) E trigger-heavy mid-page scroll: 0 longtasks over
hundreds of frames; (b) CPU profiler top functions contain no GSAP/
ScrollTrigger/trigger callbacks (only Lenis-adjacent `scrollTo` 1.2%);
(c) all landing scrubs animate transform/opacity only (code-read).
Conclusion: triggers are NOT the residual driver — no trigger rewrite
indicated.

## 7. Lenis isolation
Destroy-based A/B **NOT performed**: `window.lenis` exists but
`destroy()` would leave the provider's gsap-ticker callback calling
`raf()` on a dead instance (ticker-death risk), and the question is
already answered — trigger-plus-Lenis mid-page scroll costs ~zero (§6)
and the profiler attributes the residual elsewhere (§11). Removing or
replacing Lenis is ruled out by evidence.

## 8. Canvas isolation
Prior controlled matrix (same box, same harness): full scroll with both
canvases `display:none` drops scroll longtasks 8→0 headless; globe-only
vs map-only splits show the 2D map raster outweighing the globe in
software rendering. On visible-gated real GPU this run, all scroll
conditions are near-clean — canvas cost expresses through the resize
storm (§11), not steady-state raster.

## 9. Raster/composite analysis
Layer audit (live DOM): 935 nodes, 5 fixed, 12 backdrop-filter, 0 blend,
1 will-change, 9 blur-3xl hosts, 16 filtered+positioned — modest, no
layer explosion. Hero/globe/map/canvases all `pointer-events:none`
except interactive UI. Compositing is NOT shown to be the driver; no
composited-layer surgery indicated. (Timeline-based paint/raster split:
NOT MEASURED per §4.)

## 10. Mobile 4x CPU analysis
Visible-gated mobile-4x: ~1–2 longtasks normal (vs 21–54 in occluded
runs — the extremes were occlusion artifacts). Controlled A/B under
throttle (visible 14lt/827ms vs hidden 15lt/933ms, same run): parity →
throttled bottleneck is canvas-INDEPENDENT (input handling/composite
under 4x slowdown). Categories: mixed (B OST-style under throttle +
tool variance D); primary attribution: **not canvas** — do not chase
canvas work for mobile-throttle.

## 11. Root-cause attribution
`WebGLRenderer.setSize` = ~2.6–4.3% of ALL profiler samples during
scroll (≈15–25% of non-idle CPU), 0 during dwell, via:
`commitHookEffectListMount → CanvasImpl.useIsomorphicLayoutEffect(run) →
configure → store.setSize → setState → WebGLRenderer.setSize`
(identical full stacks, two independent runs). R3F source (
`react-three-fiber.esm.js:42-49,62-116`): `useMeasure({ scroll: true,
debounce: { scroll: 50 } })` feeds a dep-less layout effect calling
`configure({ size: containerRect })`; the rect includes scroll-varying
top/left, so each scroll re-measure → re-render → re-configure → full
`gl.setSize` (backing-store realloc, viewport/camera reset). A full
renderer resize per scroll tick is the single largest measured JS-side
scroll cost; everything else profiled is ≤1.2%.

## 12. Evidence-backed optimization candidates (ranked)
1. **R3F `<Canvas resize={{ scroll: false }}>`** (GlobeNetwork:395).
   Measured cost: §11 storm. Why implicated: scroll-driven re-measure is
   the only per-tick path into `configure`. Expected: setSize samples →
   ~0 during scroll; scroll longtasks down. Visual/UX risk: ~zero
   (top/left feed event coords, not rendered output; resize observation
   retained). A/B: profiler setSize count + scroll longtasks before/after
   on visible-gated headed runs.
2. **Map canvas backing-store scale** (only if #1 insufficient):
   map strip is ~10% viewport width but full-height backing store;
   render at 0.5× with CSS upscale. Measured: map raster > globe
   (117.6 vs 82.2fps single-hides, software env). Risk: slight softening
   of a 20%-opacity decorative strip. A/B: same matrix, DSF held constant.
3. **Globe DPR adaptive cap** (only if needed after #1): DSF 1→2 slows
   everything ~1/3 page-wide (not canvas-isolated), so this is weak
   evidence alone — combine with #1's result first. Risk: sharpness on
   hidpi.
4. **Mobile backdrop-blur scoping** (only on real-device complaint):
   12 backdrop-filters, modest counts, no measurement implicating them.

## 13. Candidates explicitly ruled out
- ScrollTrigger rewrite/consolidation (E: 0lt; absent from profiler).
- Lenis removal/replacement (C: 0lt; 1.2% scrollTo; destroy risky).
- Globe/map removal or density cuts (dwell proves cheap steady-state;
  pause mechanism already bounds scroll cost).
- Forced DPR 1 / resolution cuts without A/B (page-wide DSF scaling is
  not canvas-attributable).
- Broad CSS purge, video work (no video on landing path), memo-blast,
  cursor changes (no mousemove in tests; already quickTo).

## 14. Recommended next A/B test
Single change: `resize={{ scroll: false }}` on the globe `<Canvas>`.
Same visible-gated headed protocol: profiler setSize-sample count during
40-wheel normal scroll (expect ~0 vs ~800–2700), scroll longtasks, fps,
plus dwell sanity (unchanged) and event-coordinate spot check (globe
mouse-parallax still tracks — R3F pointer events use separate compute).
No other change in the test window.

## 15. Git/code-change verification
Zero application modifications this phase (profile-only honored):
harness/scripts live in temp dir; the only repo addition will be this
report file. Pre-phase tree already carried uncommitted Phases 1–10 +
scroll/perf work (46 files, +1549/−427) — unchanged by this phase;
`git diff --stat` tail re-verified at report time (no new entries beyond
this report).

## 16. Final verdict
**ROOT CAUSE IDENTIFIED** — scroll-driven R3F renderer-resize storm
(`useMeasure scroll:true` → dep-less configure effect → full
`gl.setSize` per scroll tick), with trigger/Lenis/cursor/layers/react
exonerated by measurement and mobile-throttle attributed away from
canvas. No performance acceptance claimed (that remains a hardware
verdict for after the one-line A/B).
