# Phase R3F Resize Fix Report (single change)

## 1. Root cause recap
R3F `<Canvas>` measures its container with `useMeasure({ scroll: true,
debounce: { scroll: 50 } })` into a dependency-less layout effect that
calls `configure({ size: containerRect })`; the rect carries
scroll-varying top/left, so every scroll tick re-rendered, re-configured,
and fully re-sized the renderer (`gl.setSize`: backing-store realloc +
viewport/camera reset). Profiler: 784–2757 `WebGLRenderer.setSize`
samples per scroll run, 0 during dwell.

## 2. Exact file changed
`src/components/GlobeNetwork.tsx` (globe `<Canvas>` only; map untouched —
profiling never proved the same path there, and it has no R3F Canvas).

## 3. Exact minimal change
`resize={{ scroll: false }}` prop added to the globe `<Canvas>` (plus a
3-line comment), merged by R3F over its defaults — scroll observation
off, resize observation retained. Camera, DPR, frameloop, gl, scene,
CSS, layout, animations, and scroll pause/resume untouched. Full diff is
4 added lines; `git diff` recorded pre/post with no other source edits.

## 4. Before metrics (visible-gated headed Chrome 153, 1440×900)
- setSize samples during 40-wheel scroll: **784 and 2757** (two runs).
- Desktop normal scroll: 77–165fps, p95 17–34ms, 0–10 longtasks
  (run variance on shared box; occlusion-gated runs trend clean).

## 5. After metrics (same protocol, same box)
- setSize samples during 40-wheel scroll (8834 total samples):
  **0**. Storm eliminated.
- idle hero / normal / rapid / slow / globe-dwell / bottom→top / refresh:
  normal **120.2fps, p95 16.9ms, 0 longtasks**; rapid 177fps 0lt; slow
  183.6fps 2lt/109ms; globe-dwell 249.8fps 0lt; bottom→top exact (y=0,
  0lt); refresh repeat 91.5fps 0lt.
- Mobile 390×844 touch: 119.2fps, 0lt; menu open locks / close restores;
  resize-to-desktop unlocks (repeat of prior verified behavior).

## 6. WebGLRenderer.setSize call-count comparison
Before: 784–2757 scroll-time samples (two runs). After: **0 of 8834**
samples. Dwell remains 0 both ways. Hypothesis validated.

## 7. CPU profiler comparison
Same 100µs sampling, same scroll pattern: setSize vanishes from the
profile; no new hotspot takes its place (top functions revert to idle/
program baseline). Scroll longtasks: 0 in the after-runs' normal/rapid
phases.

## 8. Desktop scroll comparison
Reach exact (4558–4598/4558) in all runs; p95 gaps at/near single-frame
(16.9ms); no freezes, locks, or position resets; settled rendering
resumes (dwell 249.8fps full scene).

## 9. Mobile functional verification
Touch scroll full-page exact (y=2910); menu open/close lock semantics
correct (`hidden`/`""`); mobile→desktop resize unlocks; globe hidden
below lg by design (0×0, no crash); no 4x-CPU claim (proven
canvas-independent previously; supplemental only, unchanged).

## 10. Resize regression verification (fresh browser, real OS window resizes)
- Load 1440: container 850×850, backing 1062² (= 850 × display DPR,
  correct R3F behavior).
- Narrow 887px: container 0×0 (hidden lg:block by design), no crash.
- Wide 1487px: container back to 850×850, backing 1062² — resize
  observation intact, no stuck/stretched state.
- Globe animating after resizes (2.05MB frames differ): no blank canvas,
  no flash/reset/jump. (One earlier 1913px CSS reading under CDP
  *emulation* metrics-switching was proven an emulation artifact —
  real resizes behave correctly.)
- Camera framing: unchanged code path; container geometry identical
  pre/post.

## 11. Console/hydration verification
Fresh clean-profile load, final code: 0 errors, 0 hydration errors;
only benign THREE.Clock deprecation warning. Body/html attributes clean.

## 12. tsc/tests/build/lint
- `tsc --noEmit`: clean. `npm test`: 31/31. `npm run build`: 77 routes.
- Targeted lint on changed file: 4 errors, all pre-existing
  (refs/immutability/set-state patterns documented since Phase 7);
  0 introduced.

## 13. Visual/regression observations
No visual change possible from this prop (render output identical;
only redundant resize calls removed). Verified: sizing, framing,
animation, pause/resume, menu, touch, refresh — all nominal.

## 14. Final verdict
**FIX VERIFIED**
