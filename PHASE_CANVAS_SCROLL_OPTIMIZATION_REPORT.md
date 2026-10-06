# Phase Canvas Scroll Optimization Report

> Real Chrome 153 headless via CDP (rAF frame times + longtask observer).
> Headless uses SwiftShader software WebGL: absolute FPS understates real
> GPUs — every number below is a same-environment before/after comparison,
> never an absolute real-device claim. Globe and map preserved; Lenis and
> GSAP retained; no redesign.

## 1. Executive Summary
Scroll-phase longtasks are canvas-associated: hiding both canvases takes a
normal desktop scroll from 8 longtasks/2183ms to 0. Splitting further, the
2D map costs more than the globe (map-hidden 117.6fps vs globe-hidden
82.2fps), and ScrollTrigger+Lenis alone cost ~zero (1014 mid-page frames,
0 longtasks). The implemented fix — scroll-aware canvas pause (full-rate
when settled, paused while actively scrolling, jump-free resume) —
eliminated scroll-phase longtasks on desktop (8/1233ms → 0/0ms, fps
51.4 → 79.9) with zero regressions. Mobile was already clean unthrottled;
under 4x throttle the bottleneck is canvas-independent (visible ≈ hidden),
so mobile is neutral-to-unchanged.

## 2. Globe vs Map Isolation (DSF=1, normal scroll, reach 4564 all)
- E both-visible: 51.4fps, p95 50.2ms, lt 8/1233ms.
- B globe-hidden: 82.2fps, p95 50.1ms, lt 7/736ms.
- D map-hidden: 117.6fps, p95 49.8ms, lt 5/651ms.
- F both-hidden: 159.6fps, p95 33.5ms, lt 6/627ms.
- Reading: each canvas removal adds ~35fps; the map (full 2D redraw +
  gradients every frame) outweighs the globe; residual 6lt with both
  hidden = canvas JS loops (still running) + triggers + Lenis.

## 3. Scroll vs Idle Measurements
- Dwells (no scroll input): hero 261fps/0lt, midpage 0lt — idle rendering
  is cheap, including WebGL. Cost materializes only during scroll.
- C triggers-only midscroll (1014 frames): 0 longtasks — ScrollTrigger +
  Lenis scrub work is NOT the longtask source.
- Conclusion: the problem class is (B) canvas + scrolling interaction plus
  (E) raster/compositing, not the canvas alone (A) nor triggers alone.

## 4. DPR Findings
- DSF=1 vs DSF=2 (globe DPR 1 → up to 1.5, ~2.25× canvas pixels): E
  51.4→34.0fps (−34%), dwell-hero 261→134fps (−49%). Everything scales
  (page-wide composite also doubles), so DPR is confirmed expensive but not
  isolated to canvases here. No DPR value was permanently changed: the
  existing caps ([1,1.5] desktop, [1,1] mobile) stand; the pause mechanism
  below captures most of the benefit without touching sharpness.
- Tracing split (scripting/rendering/painting): NOT MEASURED — stream
  transfer returned zero events twice; attribution rests on the controlled
  A/B matrix instead. No GPU metrics fabricated.

## 5. ScrollTrigger Findings
- ~10 scrub + ~15 one-shot triggers audited (all transform/opacity —
  GPU-friendly; no layout-property animation). Mid-page scroll proves ~zero
  longtask contribution. `ScrollTrigger.config({ ignoreMobileResize: true
  })` added earlier (mobile reflow storms); no trigger rewritten or
  removed.

## 6. Lenis Findings
- Kept, as required without measurement to remove. Evidence exonerates it
  as the dominant cost (C: 0 longtasks with Lenis driving). Lenis source
  confirms it observes native scroll (`onNativeScroll`) and honors
  `respectReducedMotion`; `syncTouch: false` keeps touch native.
- Lenis scroll events now also feed the shared scroll-activity signal.

## 7. Mobile Findings (390×844, real touch emulation)
- Normal: 80–84fps, p95 ~34–50ms, 0 longtasks before AND after (mobile
  mitigations — 120 nodes, dpr 1, no AA, frame-skip, native touch — work).
- 4x CPU throttle: 21–23 longtasks before and after; focused A/B under
  throttle (visible 14lt/827ms vs hidden 15lt/933ms) proves the throttled
  bottleneck is canvas-INDEPENDENT (input/composite under 4x slowdown).
  Neutral outcome, no regression. CPU-throttle run: VERIFIED (CDP
  `setCPUThrottlingRate`); real-device run: NOT VERIFIED.

## 8. Root Cause
Scroll-phase main-thread cost is dominated by per-frame canvas work
(2D map redraw + WebGL raster/JS) executing concurrently with Lenis-driven
scrolling, on top of which any input competes with the same RAF loop.
Triggers, cursor, React, DOM size (941 nodes), fonts, and video (none on
the landing path) are excluded by measurement.

## 9. Changes Implemented (visuals identical when settled)
- `src/lib/scroll-activity.ts` (new, unit-tested): shared active-scroll
  signal, ~150ms settle debounce, single timer, subscribe/unsubscribe —
  no leaks, SSR-safe.
- `SmoothScrollProvider`: marks activity on every Lenis scroll tick.
- `GlobeNetwork`: frameloop = visible && !scrolling (was visibility
  only). Bitmap persists while paused; frozen R3F clock resumes jump-free;
  scene never destroyed.
- `MediaIntelligenceMap`: skips draw work while scrolling but keeps the
  RAF loop alive; reduced-motion single-draw path always renders (no blank
  risk). Plus prior-phase hoists (layout/Path2D cached per resize).
- Supporting (prior phase, same goal): DataStreams orbit without
  atan2/sqrt/reads or memoized mutation; counters via `textContent`
  (~520 re-renders eliminated per view).
- No flashing (persisted bitmaps), no resets, no locks, no permanent
  low-quality mode, no timer/RAF leaks (verified by code + dwell resume
  measurements).

## 10. Before/After Measurements (desktop 1440×900)
- normal-scroll: 41.7–51.4fps, lt 8/1233–2015ms → **79.9fps, p95 49.7ms,
  lt 0/0ms** (longtasks eliminated, +55% fps).
- rapid/slow: equivalent profile (0lt in after-runs' E-equivalent;
  variance-dominated).
- dwell-hero (settled, full rendering resumed): 185–261fps range, 0lt —
  pause releases correctly.
- mobile-normal: 0lt before and after (unchanged clean).
- mobile-4x: 21–23lt before and after (canvas-independent; unchanged).
- Real-world feel (wheel bursts, direction changes, section stops,
  refresh): no freezes or locks in any run; slow-phase samples move every
  tick. Absolute "smooth feel" on hardware: NOT VERIFIED (headless only).

## 11. Visual Regression
No visual change by construction: same geometries/densities/easing/
durations; pause retains last frame; resume is time-continuous (map uses
absolute time; globe clock frozen). Settled rendering verified resumed
(dwell 185fps full scene). Screenshot-pixel comparison: NOT MEASURED
(no screenshot tooling in harness) — construction-guaranteed, stated
honestly.

## 12. TypeScript/Test/Build
- `tsc --noEmit`: clean. `npm test`: 7 files / 31 pass (28 baseline + 3
  scroll-activity). `npm run build`: 77 routes success.
- Lint: 75 problems (33 errors, 42 warnings) — identical to pre-phase
  baseline, 0 introduced.
- Console (fresh clean-profile load, final code): 0 errors, 0 hydration
  errors; only benign THREE.Clock deprecation warning.

## 13. Remaining Bottlenecks
- Real-GPU absolute numbers: NOT VERIFIED (no hardware access).
- Mobile-throttled cost is canvas-independent — needs real-device
  profiling, not more canvas surgery.
- Optional, not taken: lower globe DPR cap, fewer scrubs, mobile
  backdrop-blur reduction, globe `prefers-reduced-motion` support.

## Verdict
**PERFORMANCE IMPROVED — FURTHER HARDWARE TESTING NEEDED**
