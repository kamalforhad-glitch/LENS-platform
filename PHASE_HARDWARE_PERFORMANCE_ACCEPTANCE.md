# Phase Hardware Performance Acceptance (real machine, headed Chrome 153)

> No application code modified. Real headed Chromium (Playwright-cached
> build) with true GPU compositing on the host — not headless SwiftShader.
> Harness outside the repo (raw CDP, no new project packages).

## Desktop (1440×900, real GPU)
- Cycles: full top→bottom→top via wheel + rapid bursts + section stops +
  refresh repeat (prior verified run) + bottom→top return here.
- top → bottom: **PASS** (reach 4558/4558 max).
- bottom → top: **PASS** (y=0, 2 longtasks in return phase).
- Rapid scroll (25×500px @15ms): 543 frames, **1 longtask/133ms PASS**.
- Normal scroll: 77.2fps avg, p95 frame gap 33.6ms, **7 longtasks/1371ms**.
- Slow/section/refresh behavior: no freezes or locks in any run.
- Console: **PASS** — 0 errors across all runs (only benign THREE.Clock
  deprecation warning).

## Mobile (390×844, touch emulation)
- Cycles completed: 3+ full top→bottom→top (prior run) + normal + 4x-throttle
  runs here.
- top → bottom / bottom → top: **PASS** (reach 2910, full return).
- Normal: 812 frames, **0 longtasks PASS**.
- 4x CPU throttle: 825 frames, **54 longtasks/3448ms** (throttle-run
  variance is high: 21–54 across runs; canvas-visible ≈ canvas-hidden, so
  the throttled bottleneck is canvas-independent).
- Menu lock/unlock + resize-to-desktop: **PASS** (prior verified run).
- Console: **PASS** (0 errors).

## Performance (measured, not felt — no human-feel proxy available here)
- Previous scroll freeze reproduced: **NO** (no locks, no dead scroll, all
  reaches exact, resume verified).
- Major jank: **MILD, PERSISTENT** — desktop normal scroll still carries
  7 longtasks/1371ms with p95 gap 33.6ms (≈2 missed vsyncs on the worst
  5% of frames); mobile-4x carries 21–54 longtasks. Rapid scroll is near
  clean (1 longtask).
- Lenis issue observed: **NO** (all motion tracked; triggers-only
  mid-page scroll measured 0 longtasks headless).
- ScrollTrigger issue observed: **NO** (no errors; mid-page trigger-only
  cost ~zero).

## Globe / Map visual behavior (clipped screenshots, real GPU)
- Settled globe clip (850×850 in-view): ~1.9MB rich frames, **DIFFERENT
  1500ms apart = animating** — resume-after-settle VERIFIED, no stuck
  frameloop, no blank canvas.
- Mid-scroll screenshot pairs: **INCONCLUSIVE** (clip coordinates were
  offscreen after the wheel burst moved the page — empty captures, not
  pause evidence). Pause engagement itself was proven headless (scroll
  longtasks 8→0 with identical harness); on this hardware the normal-
  scroll residual (7lt) shows pause helps but does not zero out real-GPU
  scroll cost (raster/composite + trigger recalc remain).
- No visual flash/reset/jump observed in any capture; bitmap persistence
  holds by construction (no clears/resizes on the pause path).

## Final Status
**HARDWARE PERFORMANCE NOT ACCEPTED**
- Reason: the page is fully functional (exact reaches, no locks/freezes,
  resume verified, zero console errors) but real-hardware measurement
  still shows scroll-phase longtasks (7/1371ms desktop normal, up to
  54/3448ms mobile-4x) — visibly-janky frames remain, so "smooth and
  responsive" cannot be claimed.
- Next: profile the residual on-device (raster/composite vs trigger
  recalc split); candidates from prior report (DPR cap, trigger
  reduction, mobile blur reduction) each need hardware-measured
  justification — no further blind changes recommended.
