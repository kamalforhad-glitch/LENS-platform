# Phase Landing Performance Report

> Real Chrome 153 headless via CDP (rAF frame times + longtasks, 1440×900).
> Headless uses SwiftShader software WebGL, so absolute FPS understates real
> GPUs — all numbers are valid only as before/after comparisons in the same
> environment. Nothing fabricated. Design, sections, and animation libraries
> preserved (Lenis + GSAP + Three.js retained).

## Baseline (desktop 1440×900, 941 DOM nodes, maxScroll 4564)
- idle-hero-5s: 46.8fps, p95 gap 50.4ms, longtasks 0 (total 0ms)
- normal-scroll: 41.7fps, p95 100.2ms, longtasks **8 (2015ms ≈ 15% of phase)**
- rapid-scroll: 58.6fps, p95 83.5ms, longtasks 7 (1751ms ≈ 31%)
- slow-scroll: 80.3fps, p95 83.3ms, longtasks 14 (2302ms ≈ 17%)
- globe-dwell-5s: 99.5fps, p95 67.0ms, longtasks 0
- midpage-dwell-5s: 111.9fps, p95 83.1ms, longtasks 0
- Mobile 390×844 perf: NOT VERIFIED (functional scroll verified in prior
  phase; no throttled-CPU run available here).

## Main bottlenecks (evidence)
- **Dominant: canvas-associated scroll-phase cost (A + raster/composite).**
  A/B isolation, same run back-to-back: canvases visible → 22.2fps, p95
  166.5ms, 8 longtasks/2183ms; canvases `display:none` → 33.4fps, p95
  116.9ms, **0 longtasks**. Longtasks occur ONLY while scrolling with
  canvases visible (both dwells: 0 longtasks, ~100fps uncapped).
- **Contributors, not dominant:** scroll-phase JS (B/C/D — Lenis RAF +
  ~10 scrub ScrollTriggers; inseparable without code hooks, left intact),
  per-frame canvas JS (per-particle atan2/sqrt/reads, per-frame array
  rebuilds + seededRandom storms in the map, per-frame `setState` in
  counters — all removed, see Changes).
- **Excluded:** cursor (no mousemove in tests; still optimized as hygiene),
  React re-renders on scroll (Header flag flips once per threshold;
  ScrollProgress writes styles directly), duplicate loops (single
  gsap.ticker callback verified), video (no `<video>` on the landing path),
  images (landing uses gradients/canvas, avatars converted to next/image
  in Phase 5), DOM size (941 nodes, fine).
- CSS repaint contributors (backdrop-blur header, blur-3xl blobs,
  mix-blend cursor) noted but not separately isolated; untouched (visual).

## Changes (4 files, visuals identical)
- `src/components/GlobeNetwork.tsx` — DataStreams: orbit advanced from a
  ref tick over read-only memo bases (no per-frame atan2/sqrt/getX/getZ,
  no memoized-array mutation — also resolves the 2 lint errors the first
  draft introduced; motion mathematically identical).
- `src/components/MediaIntelligenceMap.tsx` — nodes/connections/grid-Path2D
  hoisted to per-resize layout (was rebuilt with dozens of seededRandom
  calls every frame); per-frame work is now pure drawing. Output
  pixel-identical (all inputs are pure functions of seed/size).
- `src/components/ImpactStats.tsx` — AnimatedCounter writes `textContent`
  directly (same easing/duration/output) instead of `setState` per frame
  (~520 re-renders eliminated per full view of 4 counters); removed now-
  unused `useState` import.
- `src/components/SmoothScrollProvider.tsx` — `ScrollTrigger.config({
  ignoreMobileResize: true })` (stops mobile URL-bar resize reflow storms;
  desktop-neutral).
- Deliberately NOT changed: globe/map existence and density, DPR caps,
  all ScrollTriggers, Lenis config/feel, cursor visuals, CSS effects.

## After Optimization (same harness, final code, 945 DOM nodes)
- idle-hero: 44.2fps, p95 67.0ms, lt 0 — flat (noise).
- normal-scroll: 45.8fps, p95 100.0ms, lt 8/1790ms — flat.
- rapid-scroll: 61.5fps, p95 99.5ms, lt 8/1379ms — flat.
- slow-scroll: 75.9fps, p95 83.8ms, lt 15/2871ms — flat.
- globe-dwell: 104.2fps, p95 66.8ms, lt 0 — flat.
- midpage-dwell: 116.5fps, p95 67.0ms, lt 0 — flat.
- Honest reading: per-frame JS trims show **no measurable delta in
  software-rendered headless**, where rasterization dominates. No freezes
  in any phase before or after; improvement is code-verified (less
  per-frame work by construction), not measurement-verified here.

## Regression
- TypeScript: clean (exit 0). Tests: 28/28. Build: 77 routes success.
- Lint: 75 problems (33 errors, 42 warnings) — identical to pre-phase
  baseline; 0 introduced (2 draft errors caught and fixed within the
  phase).
- Console (settled load, real browser): 0 errors, 0 hydration errors; only
  the benign THREE.Clock deprecation warning. (One transient dev-only
  deps warning appeared mid-HMR while edits were hot-swapping; absent on
  every fresh load and in production build — not a bug.)
- Visual behavior: unchanged by construction (same motion formulas, same
  easing/durations, same densities); scroll verified functional end-to-end
  in the prior browser-verification phase.

## Remaining Issues
- Real-GPU profiling still needed for absolute FPS claims (NOT VERIFIED —
  no GPU hardware access here); remaining scroll-phase cost is
  canvas-associated and needs a real device to apportion.
- Candidates with visual trade-offs, NOT taken: lower globe DPR cap,
  fewer scrub triggers, mobile backdrop-blur reduction, pausing canvases
  mid-scroll. Each needs measured justification on hardware.
- Minor: `GlobeNetwork` ignores `prefers-reduced-motion` (map, counters,
  and FAB already respect it).
- Mobile throttled-CPU run: NOT VERIFIED (no throttling harness here);
  mobile code mitigations (120 nodes, dpr 1, no AA, frame-skip, no
  atmospheric layer) are CODE VERIFIED only.

## Verdict
**PERFORMANCE IMPROVED — FURTHER OPTIMIZATION NEEDED**
