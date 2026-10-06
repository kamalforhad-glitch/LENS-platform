# Phase Hydration Warning Audit — `<body>` Mismatch

> AUDIT ONLY. No application code, CSS, or dependencies modified.

## Exact warning
Next.js hydration mismatch on `<body>`, overlay pointing at
`src/app/layout.tsx` → `RootLayout`.

## Exact mismatched attributes
- `data-new-gr-c-s-check-loaded="14.1333.0"`
- `data-gr-ext-installed=""`

## Whether those attributes exist in repository source
**No.** Repo-wide grep for both attribute names: zero matches in `src/`.
Grep for `suppressHydrationWarning`: zero matches. Grep for `setAttribute`
/ `removeAttribute`: only THREE.BufferAttribute geometry calls in
`GlobeNetwork.tsx` (WebGL buffers, not DOM). `layout.tsx` renders a plain
`<body className="…">` — no `data-*` attributes, no `Date.now()` /
`Math.random()`, no browser branches during render. All
`document.body` / `document.documentElement` writes are styles or
read-only measurements inside effects/event handlers (Header menu lock,
Lenis `scrollBehavior`, cursor/scroll listeners, `lang` sync) — none set
`data-*` attributes; none run during render. `localStorage` reads are
window-guarded (`i18n/index.ts`, CookieConsent, Analytics) and the landing
page is fully client-rendered, so they cannot produce SSR/client markup
divergence on `/`.

## Whether they are externally injected
**Yes.** Both names are Grammarly extension DOM markers:
`data-gr-ext-installed` (extension-presence flag) and
`data-new-gr-c-s-check-loaded` (content-script check, value = Grammarly
version). Grammarly injects them into every page's `<body>` after load,
which React hydration then flags as extra attributes.

## Clean-browser result (fresh Chromium profile, zero extensions, real browser)
- `document.body` attributes: `["class"]` only.
- `document.documentElement` attributes: `["lang","class","style"]`
  (`style` = Lenis scroll-behavior management, expected).
- Hydration errors: **0**. Total console errors: **0**.
- Rendering/scrolling: `#main-content` present, maxScroll 4564, wheel
  scroll functional. (Note: one cold-load probe needed a reload before
  content appeared — Turbopack cold-compile timing in headless, no errors;
  subsequent loads render fully.)
- SSR HTML via curl: attributes absent; `<body>` tag clean.

## Normal-browser result
NOT VERIFIED in the user's own browser (no access to it), but the reported
attributes match Grammarly's signature exactly, and the clean-browser run
proves the application renders them in neither SSR HTML nor hydrated DOM.

## Genuine application hydration issues, if any
**None found.** No app-generated server/client markup divergence detected
in code or in the clean-browser run.

## Files changed
**None** (audit only). Per the task rules, `suppressHydrationWarning` was
NOT added, `layout.tsx` untouched, no SSR/component changes.

## FINAL VERDICT
**EXTERNAL_BROWSER_EXTENSION — NOT AN APPLICATION HYDRATION BUG**
