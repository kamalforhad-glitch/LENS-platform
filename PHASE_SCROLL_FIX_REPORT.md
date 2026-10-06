# Phase Scroll Fix Report — Landing Page Scroll Behavior

> Performance + scroll-behavior fix only. No redesign, no sections removed,
> no architecture rewrite, Lenis/GSAP/Three.js retained. Browser scroll
> acceptance was NOT executable here (no headless browser in this
> environment) — honestly marked below.

## 1. Root Cause
Two code-verified defects, one architectural pressure point (all in
`src/components/`, landing page only):

1. **Permanent body scroll-lock edge (hard lock).** `Header.tsx` set
   `document.body.style.overflow = "hidden"` while the mobile menu was open,
   but only when the menu ref existed, with no viewport guard. Opening the
   menu on mobile then rotating/resizing to ≥1024px hides the menu
   (`lg:hidden`) while the lock persists — no visible UI can unlock it, so
   the page is permanently unscrollable. (Also: Lenis touch is native, so on
   mobile this lock is the primary stuck-scroll suspect.)
2. **Lenis single-point-of-failure + trigger drift.** `SmoothScrollProvider`
   owns 100% of desktop wheel input via Lenis `smoothWheel` RAF; every
   `ScrollTrigger` on the page depends on positions measured before the
   `ssr:false` sections mount, and no `ScrollTrigger.refresh()` ever ran
   after mount — scrubbed parallax tracks stale positions (jumpy/wrong-feel
   scroll). The provider also leaked its document click listener on every
   pathname re-init (removed only on unmount paths that never run it).
3. **Main-thread contention (jank read as "stuck").** Lenis scroll runs on
   the main-thread RAF loop alongside the three.js globe, map canvas, 10+
   scrub triggers, and `CustomCursor`, which allocated 2–3 gsap tweens per
   mousemove. Verified by reading `lenis@1.3.26` types: `syncTouch` defaults
   false, i.e. desktop wheel is fully RAF-driven while touch is native.

Ruled OUT by inspection (evidence in §2): no `pin`, no wheel/touch
`preventDefault` on landing, no body/html permanent lock, no nested
scrollers, no 100vh traps, canvases are `pointer-events-none`, no
`lenis.stop()` calls, no duplicate RAF loops (single gsap.ticker callback),
`MediaIntelligenceMap`/`ScrollProgress`/observers all clean up correctly.

## 2. Evidence
- `src/components/Header.tsx:68` — `document.body.style.overflow = "hidden"`
  guarded by `if (mobileMenuRef.current)`; menu root `lg:hidden`
  (`Header.tsx:146`); no resize handling (read, pre-fix).
- `src/components/SmoothScrollProvider.tsx` — `smoothWheel: true`,
  `document.addEventListener("click", …)` anonymous (never removed),
  zero `ScrollTrigger.refresh()` calls (read, pre-fix).
- `src/components/CustomCursor.tsx:35-42` — 3× `gsap.to` per mousemove
  (read, pre-fix).
- `node_modules/lenis/dist/lenis.d.ts:152-162` — `smoothWheel?`,
  `syncTouch?` (defaults native touch); no `smoothTouch` option exists
  (caught by `tsc`, fixed to `syncTouch: false`).
- `src/app/globals.css:111-113` — `.lenis.lenis-stopped { overflow: hidden }`
  exists but nothing calls `stop()` (verified by grep): latent, not active.
- Grep of `src/` for `pin:`, `wheel`/`touchmove` preventDefault,
  `document.*style.overflow`, `100dvh/svh`, nested scrollers: no landing
  hits besides the Header lock above.
- Runtime: dev server serves `/` HTTP 200 (35,024 bytes shell, browser UA;
  curl UA correctly gets middleware 403). No headless browser available
  (`playwright`/`chromium` absent), so scroll-motion acceptance NOT executed.

## 3. Files Changed
- `src/components/Header.tsx` — robust menu scroll-lock (unconditional
  set/restore, auto-close at `min-width: 1024px`, guaranteed cleanup).
- `src/components/SmoothScrollProvider.tsx` — `syncTouch: false` explicit;
  click/load listeners stored in refs and removed on cleanup;
  `ScrollTrigger.refresh()` post-init + on window load.
- `src/components/CustomCursor.tsx` — mousemove animation via
  `gsap.quickTo` (identical visuals, no per-event tween allocation).
- `PHASE_SCROLL_FIX_REPORT.md` (this file).

## 4. Exact Fix
1. Header lock can no longer leak: overflow set/restored purely on
   `mobileOpen` state (not on ref existence), `matchMedia("(min-width:
   1024px)")` change listener forces `setMobileOpen(false)` on desktop,
   effect cleanup always restores `""`.
2. Lenis provider: single document-click listener with ref-tracked removal;
   load listener likewise; `ScrollTrigger.refresh()` after async Lenis init
   (post dynamic-section mount) and on `window load`; touch explicitly
   native via `syncTouch: false`.
3. Cursor: 6 persistent `quickTo` functions replace per-mousemove
   `gsap.to` calls (same targets/durations/eases).
4. No changes to sections, content, styling, routes, deps, or animation
   libraries.

## 5. Desktop Verification
**NOT VERIFIED** (no headless browser in this environment; see §7).
Code-verified: wheel path unchanged in shape (Lenis smoothWheel retained),
no new listeners on wheel, trigger positions refreshed after mount.

## 6. Mobile Verification
**NOT VERIFIED** (same reason). Code-verified: touch was and stays native
(`syncTouch: false`, Lenis v1 default confirmed in types); the permanent
mobile lock edge (menu → rotate/resize → stuck) is removed by construction
(auto-close + unconditional restore).

## 7. Console Errors Before/After
**NOT VERIFIED** in a browser console (no browser tooling). Indirect
evidence: dev-server `/` served HTTP 200 with no server-side errors during
the smoke request; `tsc`+build clean (see §§9–10).

## 8. Performance Findings
- Eliminated per-mousemove tween allocation across the whole page
  (CustomCursor `quickTo`; identical motion curves).
- Eliminated duplicate document-click handlers accumulating per navigation
  (SmoothScrollProvider cleanup).
- Eliminated stale ScrollTrigger measurements after dynamic mounts
  (refresh post-init + on load) — removes parallax jumps mistaken for
  scroll sticking.
- Deliberately NOT touched: globe/map render loops (already
  IntersectionObserver-gated + mobile-reduced + reduced-motion respected),
  scrub trigger set (design), Lenis itself (architecture).

## 9. TypeScript Result
**VERIFIED.** `npx tsc --noEmit`: clean (exit 0). One intermediate error
(`smoothTouch` not in `LenisOptions`) caught and corrected to `syncTouch`.

## 10. Build Result
**VERIFIED.** `npm run build`: success, 77 routes (unchanged), `/` static,
middleware present.

## 11. Test Result
**VERIFIED.** `npm test`: 6 files / 28 pass (unchanged). Scoped lint on the
3 changed files: 0 new issues (single `Header.tsx` `<a href="/">` notice is
the pre-existing `no-html-link-for-pages` pattern, line-shifted only).

## 12. Remaining Issues
1. Browser scroll acceptance (top→bottom→top ×3, rapid/pause/refresh,
   1440×900, 1280×800, 390×844, 375×812, console check): **BLOCKED — no
   headless browser in this environment.** Must be run by a human or CI
   with Playwright before calling this fixed.
2. Latent `.lenis.lenis-stopped → overflow:hidden` (`globals.css:111-113`):
   harmless today (nothing calls `stop()`), but any future `stop()` without
   `start()` hard-locks the page — noted for future work.
3. Main-thread headroom is improved, not infinite: the globe + map +
   scrub set remain heavy on low-end devices by design (gated + reduced
   where already implemented). Further relief would need visual trade-offs,
   explicitly out of scope.
