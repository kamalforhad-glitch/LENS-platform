# PHASE 11 — PRODUCTION 403 ROOT-CAUSE AUDIT (AUDIT ONLY)

**Date:** 2026-10-01
**Project:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Scope:** Identify the exact layer generating HTTP 403 on `https://www.lensbd.org/` for `/`, `/sitemap.xml`, `/robots.txt`.
**Constraint honored:** No files were modified, nothing was deployed, no domain/auth/security settings were changed, no secrets were printed. The only file created is this report.

---

## 1. Executive Summary

**Verdict: A — Application proxy/middleware returns the 403 (repository-controlled).**

The 403 is produced by the User-Agent bot-blocking block in **`src/proxy.ts:71-77`**, specifically the early return at **`src/proxy.ts:75`**:

```ts
return new NextResponse("Forbidden", { status: 403 });
```

Triggered by the `BLOCKED_BOTS` regex list at **`src/proxy.ts:6-14`**, which contains `/curl/i`, `/bot(?!om)/i`, `/spider/i`, `/scraper/i`, `/wget/i`, `/python-requests/i`.

Critical finding that reframes the incident: **the 403 is User-Agent dependent, not a site-wide outage.**

| Request | User-Agent | Result |
|---|---|---|
| `/` | Chrome 126 browser UA | **200 OK** |
| `/sitemap.xml` | Chrome 126 browser UA | **200 OK** |
| `/robots.txt` | Chrome 126 browser UA | **200 OK** |
| `/` | `curl/8.x` (default `curl.exe -I`) | **403** (body `Forbidden`) |
| `/` | Googlebot / bingbot | **403** (body `Forbidden`) |
| `/sitemap.xml` | Googlebot | **403** (body `Forbidden`) |
| `/robots.txt` | Googlebot | **403** (body `Forbidden`) |
| `/` | *(User-Agent header removed)* | **200 OK** |
| `/favicon.ico` | curl UA | **200 OK** (matcher excludes `favicon.ico`) |
| `/api/doesnotexist` | curl UA | **404** (API paths exempt from bot check) |

All three originally reported failures were observed with `curl.exe -I`, whose default User-Agent is `curl/...`, which matches `/curl/i` at `src/proxy.ts:11`. Every curl-based probe of this domain will therefore return 403 regardless of path (except matcher-excluded paths), which is exactly what was observed.

**Collateral impact (more severe than the reported symptom):** because `/bot(?!om)/i` matches `Googlebot`, `bingbot`, `Slupbot`, `AhrefsBot`, `SemrushBot`, etc., **every major search-engine crawler receives 403 on every HTML page, on `/sitemap.xml` and on `/robots.txt`**. This is a site-wide SEO/crawl blocker even though real browsers see 200.

Vercel-level causes (deployment protection, domain configuration, WAF) are **ruled out as the source of this 403** by header fingerprints (Section 2.3). Vercel *does* control the apex→www 308 (Section 7).

---

## 2. Evidence

### 2.1 Repository code responsible

`src/proxy.ts:5-14` — block list:

```ts
// Bot user agents to block
const BLOCKED_BOTS = [
  /crawler/i,
  /bot(?!om)/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
];
```

`src/proxy.ts:71-77` — the only 403 in the request path for HTML/metadata routes:

```ts
// Bot detection for non-API routes
if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
  const userAgent = request.headers.get("user-agent") || "";
  if (BLOCKED_BOTS.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse("Forbidden", { status: 403 });   // line 75
  }
}
```

`src/proxy.ts:169-173` — matcher does **not** exclude `/`, `/sitemap.xml` or `/robots.txt`:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-).*)",
  ],
};
```

The official Next.js 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:636-651`) explicitly show the recommended negative matcher excluding `sitemap.xml|robots.txt`; this repo's matcher omits them, so the bot check runs on metadata routes.

`src/proxy.ts` is a committed, unmodified file: `git log --oneline -- src/proxy.ts` → `650c006 Initial LENS platform commit`; `git diff HEAD -- src/proxy.ts` → empty.

### 2.2 Live production probes (read-only, 2026-10-01)

```
curl.exe -s -I -A "Mozilla/5.0 ... Chrome/126.0.0.0 Safari/537.36" https://www.lensbd.org/
  => HTTP/1.1 200 OK   (Content-Length: 16060, X-Nextjs-Prerender: 1, X-Vercel-Cache: HIT)

curl.exe -s -I -A "<Chrome UA>" https://www.lensbd.org/sitemap.xml
  => HTTP/1.1 200 OK   (Content-Type: application/xml, X-Matched-Path: /sitemap.xml)

curl.exe -s -I -A "<Chrome UA>" https://www.lensbd.org/robots.txt
  => HTTP/1.1 200 OK   (Content-Type: text/plain; charset=utf-8, X-Matched-Path: /robots.txt)

curl.exe -s -I https://www.lensbd.org/robots.txt          (default curl UA)
  => HTTP/1.1 403 Forbidden
     Content-Type: text/plain;charset=UTF-8
     Body: "Forbidden"

curl.exe -s -I -A "<Googlebot UA>" https://www.lensbd.org/robots.txt
  => HTTP/1.1 403 Forbidden   (identical fingerprint)

UA matrix on "/":
  Googlebot      -> 403
  bingbot        -> 403
  curl           -> 403
  python-requests-> 403
  (no UA header) -> 200
  Chrome UA      -> 200
```

Apex behavior (unchanged, platform-level):

```
curl.exe -s -I -A "<Chrome UA>" https://lensbd.org/
  => HTTP/1.1 308 Permanent Redirect
     Location: https://www.lensbd.org/
```

### 2.3 Header fingerprint that proves the 403 is `src/proxy.ts` (not Vercel)

Compare a **200** response vs the **403** response on the same deployment:

| Header | 200 (`/`) | 403 (`/` with curl UA) | Meaning |
|---|---|---|---|
| `X-Dns-Prefetch-Control` | `on` | **absent** | Set only at `src/proxy.ts:117`, i.e. *after* the early return |
| `X-Permitted-Cross-Domain-Policies` | `none` | **absent** | Set only at `src/proxy.ts:120`, after the early return |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=()` (7 directives) | `camera=(), microphone=(), geolocation=(), interest-cohort=()` (4 directives) | 200 = proxy value (`src/proxy.ts:131-134`) overwrote next.config value (`next.config.ts:28-31`); 403 = proxy never reached its header block, so only the `next.config.ts` value survives |
| `Content-Security-Policy` | proxy CSP (has `upgrade-insecure-requests`, no `frame-src`/`object-src`) | next.config CSP (has `frame-src`, `object-src`, no `upgrade-insecure-requests`) | Same proof: `next.config.ts:4-33` vs `src/proxy.ts:137-150` |
| Body | HTML | literal `Forbidden` | Exact match to `new NextResponse("Forbidden", { status: 403 })` at `src/proxy.ts:75` |
| `Content-Type` | `text/html; charset=utf-8` | `text/plain;charset=UTF-8` | Undici default for a string-bodied Response |

This is conclusive: **the response is generated inside `src/proxy.ts` after `next.config` headers are applied but before the proxy's own header block.** A Vercel Deployment-Protection / Firewall 403 returns an HTML/JSON Vercel error page (with `x-vercel-*` action headers and none of this app's CSP), and a Vercel Firewall block would not selectively depend on the User-Agent in this exact way while returning the app's own `next.config` CSP.

### 2.4 Full sweep of `src` for 403/401/blocked responses

`src/proxy.ts:75` is the **only** 403 reachable for `/`, `/sitemap.xml`, `/robots.txt`.

All other `403`/`401` matches are inside `/api/*` route handlers and are auth-scoped, e.g.:
- `src/app/api/upload/route.ts:16,22,23`
- `src/app/api/admin/*/route.ts:7,8` (repeated across admin routes)
- `src/app/api/ai/chat/route.ts:51,125`
- `src/app/api/admin/backup/route.ts:19,22,39,42`
- `src/app/api/cron/backup/route.ts:18`

None of these are reachable from `/`, `/sitemap.xml`, `/robots.txt`.

Search terms swept across `src/`: `403`, `401`, `forbidden`, `unauthorized`, `block`, `hostname`, `user-agent`, `bot`, `crawler`, `origin`, `referer`, `x-forwarded`, `x-vercel`. Result: the only User-Agent-based gate is `src/proxy.ts:73-74`; the only hostname/domain logic found is metadata `BASE_URL` fallbacks (`src/app/robots.ts:4`, `src/app/sitemap.ts:1`, `src/app/layout.tsx:24`) and `images.remotePatterns` hostnames (`next.config.ts:41-62`) — none can produce a 403. No `X-Robots-Tag` is emitted anywhere.

### 2.5 Config files inspected

| File | Result |
|---|---|
| `next.config.ts:65-92` | `headers()` = security headers only; `redirects()` = only `/home` → `/`. **No rewrites, no 403, no hostname rules.** |
| `vercel.json` (4 lines) | Only `$schema` + `"crons": []`. **No rewrites/redirects/headers/functions.** |
| `src/app/robots.ts` | Standard metadata route, `allow: "/"` — cannot 403. |
| `src/app/sitemap.ts` | Standard metadata route with DB try/catch fallback (lines 39-49) — cannot 403; verified 200 live. |
| `src/app/layout.tsx:51-52` | Emits `index, follow` robots/googlebot meta — contradicts (and is defeated by) the proxy 403. |
| `.github/workflows/ci.yml` | CI only (`lint`, `tsc`, `test`, `build`); no deploy/edge config. |
| `.vercel/` | Not present (no linked local Vercel project config in repo). |
| Middleware/proxy files in `src/` | Only `src/proxy.ts` — **no second middleware**, no duplicate auth layer. |

### 2.6 Is authentication applied globally?

**No.** Auth in the proxy is strictly scoped: `src/proxy.ts:82-96` only runs when `pathname.startsWith("/admin")`. Missing/invalid session → **307 redirect to `/admin/login`**, never a 403. There is no global auth gate.

### 2.7 Other response codes in the proxy

- **429** rate limit: `src/proxy.ts:53-69`, gated by `pathname.startsWith("/api/")` — cannot fire on `/`, `/sitemap.xml`, `/robots.txt`.
- Security headers / cache headers: `src/proxy.ts:100-164` — set only on the pass-through path.

### 2.8 Environment variables (names only — no values printed)

`.env`: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`
`.env.example`: the above plus `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION`, `CRON_SECRET`, `ADMIN_SEED_PASSWORD`

**No environment variable influences request blocking.** `src/proxy.ts` reads no env vars; `src/lib/env.ts` only gates JWT/CRON/DATABASE secrets (throws → 500, not 403). ⇒ Category **E is ruled out**.

### 2.9 Safe local static tests

- `npx tsc --noEmit` → **exit 0** (clean).
- `npm run lint` → exit 1, **75 problems (33 errors, 42 warnings)** — all pre-existing style/rule issues (e.g. `react-hooks/set-state-in-effect` in search components, unused vars in `src/lib/actions/*.ts`, `src/lib/backup/index.ts`, `src/lib/storage/index.ts`). **Unrelated to the 403**; noted because `.github/workflows/ci.yml` runs `npm run lint` and would fail.
- `npm test` / `npm run build` were not run (build can require DB/network; not needed for this determination).
- Local `.next/server/middleware-manifest.json` shows `"middleware": {}` and `.next/server/middleware.js` is a 221-byte stub — the local `.next` directory is a **stale/dev artifact that predates the current proxy**; it was not used as evidence. Production behavior was verified live instead.

---

## 3. Request Flow

### 3.1 `GET /`

1. Client → Vercel edge. If UA is a bot/crawler/curl, nothing has blocked yet.
2. `next.config.ts` `headers()` applied (`next.config.ts:65-82`) → CSP with `frame-src`/`object-src`, `Permissions-Policy` (4 directives), X-Frame-Options, HSTS, etc.
3. `next.config.ts` `redirects()` — `/` does not match `/home` → no-op.
4. **Proxy runs** — matcher `/((?!_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-).*)` **matches `/`** (`src/proxy.ts:169-173`).
5. `src/proxy.ts:53` — not `/api/` → no rate limit.
6. `src/proxy.ts:72` — not `/api/`, not `/_next/` → **bot check executes**.
   - UA matches `BLOCKED_BOTS` → **`return new NextResponse("Forbidden", { status: 403 })` (`src/proxy.ts:75`). Request never reaches Next.js routing. Proxy's own header block (`:100-164`) is skipped → proxy-only headers absent.**
   - UA does not match → continue.
7. `src/proxy.ts:82` — not `/admin` → no auth.
8. `src/proxy.ts:98-166` — `NextResponse.next()` + security headers (incl. proxy CSP and 7-directive Permissions-Policy) → `src/app/page.tsx` renders → **200**.

### 3.2 `GET /sitemap.xml`

1. Vercel edge → `next.config` headers → no redirect match.
2. Proxy matcher **matches `/sitemap.xml`** (not in the exclusion list).
3. Not `/api/` → rate limit skipped.
4. Not `/api/`, not `/_next/` → **bot check executes** → `Googlebot`/`bingbot` matches `/bot(?!om)/i` (line 8), `curl` matches line 11 → **403 at `src/proxy.ts:75`**. `src/app/sitemap.ts` never runs.
5. If UA passes → proxy passes through → Next.js metadata route `src/app/sitemap.ts` → 200 `application/xml` (verified live).

### 3.3 `GET /robots.txt`

Identical flow to 3.2; `/robots.txt` is also matched by the proxy and blocked by the bot check before `src/app/robots.ts` runs. Verified live: 200 with browser UA (body serves `Allow: /`, `Sitemap: https://lensbd.org/sitemap.xml`), 403 with curl/Googlebot UA.

### 3.4 `GET https://lensbd.org/` (apex)

Vercel platform 308 → `https://www.lensbd.org/` (no such redirect exists in the repo; `next.config.ts:84-92` only has `/home` → `/`) → then flow 3.1. The 308 is normal and not part of the 403 problem.

---

## 4. Exact 403 Source / Most Likely Source

**Exact source (repository-controlled): `src/proxy.ts:75`, reached via `src/proxy.ts:6-14` (block list) + `src/proxy.ts:71-77` (gate) + `src/proxy.ts:169-173` (over-broad matcher).**

Classification: **A. Application proxy/middleware returns 403.**

Ruled out:
- **B (Next.js route handler 403)** — no route handler returns 403 for `/`, `/sitemap.xml`, `/robots.txt`; and the 403 has no `X-Nextjs-*`/`X-Matched-Path` header, while 200s do.
- **C (Vercel deployment protection)** — would return a Vercel-branded HTML/JSON body and would not depend on User-Agent; response carries this app's own `next.config` CSP.
- **D (Domain/host config)** — apex→www 308 works as intended; www serves 200 to browsers.
- **E (Env/security config)** — no env var participates in blocking (`src/proxy.ts` reads none).
- **F (Other)** — none found.

---

## 5. Why `sitemap.xml` and `robots.txt` Fail

1. `src/proxy.ts:171` matcher excludes only `_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-` — **`sitemap.xml` and `robots.txt` are not excluded**, so the proxy runs on them (contrast with the Next.js documented example at `node_modules/next/dist/docs/.../proxy.md:636-651`).
2. The gate at `src/proxy.ts:72` exempts only `/api/` and `/_next/` — metadata files fall into the bot check.
3. Any crawler/testing UA matching `BLOCKED_BOTS` (curl, wget, python-requests, `*bot*`, `*crawler*`, `*spider*`, `*scraper*`) → 403 at line 75, before `src/app/robots.ts` / `src/app/sitemap.ts` execute.

Net effect: **robots.txt and sitemap.xml are unreachable to exactly the clients that need them (search engines), while being fine for browsers.**

---

## 6. Why the Homepage Fails

Same mechanism, same line: `/` is matched by the proxy and passes through the bot gate at `src/proxy.ts:72-77`.

- It does **not** fail for real browsers (verified 200).
- It fails for `curl`, `wget`, `python-requests`, and any UA containing `bot` (Googlebot, bingbot, etc.) — which is why every automated/observability check reports "production returns 403".
- The `/bot(?!om)/i` negative lookahead only spares words like `bottom`; it does **not** spare `Googlebot`/`bingbot`.

---

## 7. Repository-Controlled vs Vercel-Controlled Factors

**Repository-controlled (root cause):**
- `src/proxy.ts:6-14` block list — blocks crawlers and CLI tools.
- `src/proxy.ts:71-77` gate + `src/proxy.ts:75` 403 return.
- `src/proxy.ts:169-173` matcher — runs the gate on `/`, `/sitemap.xml`, `/robots.txt`.
- `next.config.ts:4-33` — supplies the CSP/Permissions-Policy seen on the 403 (fingerprint only; not the cause).

**Vercel-controlled (not the 403 cause):**
- apex `lensbd.org` → www 308 redirect (Vercel domain settings; not in repo).
- CDN caching (`X-Vercel-Cache: HIT`, `Age`, `Etag`, `Accept-Ranges`) — note the cached 200 for `/` with a browser UA.
- `Server: Vercel`, `X-Vercel-Id`.
- Whether Vercel Firewall/Bot-ID/Deployment-Protection are additionally enabled — **cannot be verified from the repository** (dashboard-only), but is **not** what produced the observed 403 (Section 2.3).

**Cannot be proven from code alone:**
1. Which commit is actually deployed on Vercel (the live header fingerprint strongly implies the committed `src/proxy.ts` is deployed, but the deployment SHA is dashboard/CLI-only).
2. Vercel project settings: Firewall rules, Bot-ID, Deployment Protection, Protection Bypass, domain list/redirects.
3. Whether the observed `Age: 31138` cached entry will be revalidated after any fix.
4. CI status of the current branch (lint currently fails locally — Section 2.9).

---

## 8. Smallest Safe Fix Recommendation (NOT IMPLEMENTED — approval required)

All changes confined to **`src/proxy.ts`**; no auth, rate-limit, header, domain, or env changes.

**Step 1 (minimum, fixes the reported sitemap/robots 403):**
Add `sitemap.xml|robots.txt` to the matcher exclusion at `src/proxy.ts:171`, mirroring the official Next.js example:
`"/((?!_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-|sitemap.xml|robots.txt).*)"`

**Step 2 (fixes the real damage — crawlers blocked site-wide):** choose one, in order of preference:
- **2a (recommended):** delete the UA-blocking block at `src/proxy.ts:71-77` entirely and, if bot filtering is still required, move it to Vercel Firewall/Bot-ID (platform layer, per-path and per-UA policy, no code). Rationale: UA strings are trivially spoofable, so this block provides negligible security while guaranteeing SEO loss.
- **2b:** restrict the block to a narrow allowlist of *non-search* automation (e.g. only `/curl/i`, `/wget/i`, `/python-requests/i`) and explicitly allow known search crawlers (`Googlebot`, `bingbot`, `Applebot`, `DuckDuckBot`, `Slurp`, `YandexBot`) **and** monitoring UAs — while noting `Googlebot-Image`/`AdsBot` variants must be covered too.
- **2c (if the intent was only to block scrapers on HTML pages):** keep the block but never on `/`, `/sitemap.xml`, `/robots.txt`, and return `403` only after confirming intent; at minimum stop blocking search-engine crawlers.

Do **not** change: admin auth (`:82-96`), rate limiting (`:53-69`), security headers (`:100-164`), matcher exclusions for `_next/static`, `next.config.ts`, `vercel.json`, domain settings, or env values.

Optional non-blocking follow-ups (separate decision, not part of the 403 fix):
- `src/app/robots.ts:4` / `src/app/sitemap.ts:1` fall back to `https://lens.org.bd`; the deployed robots serves `Sitemap: https://lensbd.org/sitemap.xml` (apex), which 308-redirects to `www` — consider aligning `NEXT_PUBLIC_SITE_URL` (name confirmed present in `.env`) to `https://www.lensbd.org` to avoid redirect hops.
- Pre-existing lint failures (33 errors) will fail `.github/workflows/ci.yml`.

---

## 9. Verification Commands to Run AFTER Approval

```powershell
# 1. UA matrix — expect 200 for ALL of these after the fix
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/sitemap.xml
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/robots.txt
curl.exe -s -o NUL -w "%{http_code}`n" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.lensbd.org/
curl.exe -s -o NUL -w "%{http_code}`n" -A "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" https://www.lensbd.org/sitemap.xml
curl.exe -s -o NUL -w "%{http_code}`n" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.lensbd.org/robots.txt

# 2. Security regressions must still hold
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/admin          # expect 307 -> /admin/login (or 200 on login)
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/api/doesnotexist  # expect 404
curl.exe -s -I -A "<Chrome UA>" https://www.lensbd.org/ | Select-String "Permissions-Policy|Content-Security-Policy|Strict-Transport-Security"

# 3. Static checks (local)
npx tsc --noEmit
npm run lint
npm test
npm run build

# 4. Header fingerprint check after deploy: 200 responses must still carry
#    X-Dns-Prefetch-Control and X-Permitted-Cross-Domain-Policies (proxy ran),
#    and proxy-specific Permissions-Policy (7 directives).

# 5. External: Google Search Console URL Inspection on https://www.lensbd.org/
#    + re-submit sitemap https://www.lensbd.org/sitemap.xml (previous crawls were 403).
```

---

## 10. Files That Would Need Modification

| File | Change | Required? |
|---|---|---|
| `src/proxy.ts` | (1) line 171 matcher: add `sitemap.xml\|robots.txt` exclusions; (2) lines 71-77: remove or narrow the UA bot block (recommended: remove; move filtering to Vercel Firewall if still desired) | **Yes — only file** |
| `next.config.ts` | none | No |
| `vercel.json` | none | No |
| `src/app/robots.ts` / `src/app/sitemap.ts` | optional `BASE_URL`/www alignment | Optional, separate concern |
| `.env` / Vercel env / domain settings | none | No |

---

### Statement of compliance
- No source file was edited; no build artifact was regenerated; nothing was deployed; no domain, auth, or security setting was changed; no secret values were read or printed (environment variable names only).
- This document is the only file created by this audit.
- The fix must not be implemented until explicitly approved.
