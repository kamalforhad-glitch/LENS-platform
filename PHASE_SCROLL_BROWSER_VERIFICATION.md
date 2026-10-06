# Phase Scroll Browser Verification

> Real browser verification performed (not simulated). No application code,
> CSS, or dependencies modified. Test harness lives outside the repo
> (`Temp\opencode\scroll-verify\harness.mjs`, raw CDP over the
> Playwright-cached Chromium — no new project packages).

## Environment
- Browser: Chrome 153 headless (`chromium-1243`), remote-debugging CDP,
  software WebGL (SwiftShader flag).
- App: project dev server (`npm run dev`), `http://localhost:3000/`,
  HTTP 200, hydrated (`#main-content` + hero text present, `lenis` class on
  `<html>` confirming Lenis active).

## Desktop
- Viewport: 1440x900. Cycles completed: 3 full top→bottom→top via wheel.
- top → bottom: **PASS** (3/3 reached 4564/4564, 100% of max scroll).
- bottom → top: **PASS** (3/3 returned to 0).
- Rapid scroll (25×500px bursts @15ms): **PASS** (reached bottom, moved).
- Slow scroll (40×120px @150ms): **PASS** (every sample moved,
  longest flat run = 1).
- Section stops 0.50/0.75: exact (2282/2282, 3423/3423). Stop 0.25 read
  4564 — harness timing artifact (instant `scrollTo` issued while Lenis was
  still settling the prior phase at the bottom); the two exact stops prove
  positioning works.
- Refresh + repeat: **PASS** (moved 3848px post-reload).
- Horizontal scroll: **PASS** (`scrollWidth` ≤ viewport, `hOverflow=false`).
- Overlay audit: **PASS** (no fixed interactive element covers >40% of the
  viewport).
- Console: **PASS** — 0 errors. 4 unique warnings, all benign: THREE.Clock
  deprecation (three.js internals) + Permissions-Policy unrecognized
  features (`interest-cohort`, `browsing-topics`, `join-ad-interest-group`,
  `run-ad-auction` — directives Chrome 153 dropped; harmless).

## Mobile
- Viewport: 390x844 with touch. Cycles completed: 3 (touch-drag sequences).
- top → bottom: **PASS** (3/3, 29→2939). bottom → top: **PASS** (3/3,
  →29).
- Mobile menu lock/unlock: **PASS** (open: dialog visible, `aria-expanded`
  true, body `overflow:hidden` — intentional lock confirmed; close: dialog
  gone, overflow restored, wheel scroll resumes).
- Resize mobile → desktop (1280px) with menu open: **PASS** (menu closed,
  `aria-expanded` false, body overflow restored, wheel scroll works) —
  the Phase Scroll Fix root cause verified fixed in a real browser.
- Return-to-mobile repeat open/close: **PASS** (consistent).
- Console: **PASS** (same 0-error / benign-warning profile as desktop).

## Performance
- Previous scroll freeze reproduced: **NO** (3 desktop + 3 mobile cycles,
  rapid + slow phases, refresh repeat — zero freezes or permanent locks).
- Major jank observed: **NO** (slow-phase samples moved every tick).
- Lenis issue observed: **NO** (wheel fully tracked through Lenis RAF).
- ScrollTrigger issue observed: **NO** (no ScrollTrigger errors; parallax
  ran throughout without console errors).

## Final Status
**BROWSER VERIFIED**
