# PHASE 12 — FIX VERIFIED CRAWLER 403 / SEO ACCESS

**Date:** 2026-10-01
**Project:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Preceded by:** `PHASE_11_403_ROOT_CAUSE_AUDIT.md`
**Files changed in this phase:** `src/proxy.ts` only (`git diff --stat`: 1 file, 22 insertions, 3 deletions)
**Not changed:** `next.config.ts`, `vercel.json`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx`, matcher, CSP/security headers, admin auth, API auth, rate limiting, environment/domain settings.

---

## 1. Root Cause

`src/proxy.ts` (Next.js 16 proxy) blocked requests by User-Agent before any route rendered:

```ts
const BLOCKED_BOTS = [ /crawler/i, /bot(?!om)/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python-requests/i ];
```

Gate (before fix): `src/proxy.ts:71-77` → `return new NextResponse("Forbidden", { status: 403 })` for any non-`/api/`, non-`/_next/` path whose UA matched the list.

Two defects:
1. **`/bot(?!om)/i` is a generic "bot" matcher** — it matches `Googlebot`, `bingbot`, `YandexBot`, `Applebot`, `DuckDuckBot`, `GPTBot`, `AhrefsBot`, … It only excludes the literal sequence `botom`. Every legitimate search crawler was therefore 403'd on `/`, `/sitemap.xml`, `/robots.txt` and all public pages.
2. **The proxy matcher excluded only `_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-`**, so the UA gate also ran on `/sitemap.xml` and `/robots.txt` — crawlers were blocked *before* `src/app/sitemap.ts` / `src/app/robots.ts` could execute.

Additionally `/spider/i` would have kept blocking `Baiduspider` and `Sogou web spider` (legitimate search engines) even after removing the `bot` rule.

---

## 2. Exact Code Change

Single file: **`src/proxy.ts`** (2 hunks).

**(a) `src/proxy.ts:5-27` — removed `/bot(?!om)/i`, added a search-crawler exemption list:**

```ts
// Legitimate search-engine crawlers — must always reach public pages,
// /sitemap.xml and /robots.txt (matched before the block list).
const ALLOWED_CRAWLERS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex/i,
  /applebot/i,
  /petalbot/i,
  /sogou/i,
];

// Bot user agents to block
const BLOCKED_BOTS = [
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
];
```

**(b) `src/proxy.ts:84-96` — exemption evaluated before the block list:**

```ts
// Bot detection for non-API routes (search-engine crawlers are exempt)
if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
  const userAgent = request.headers.get("user-agent") || "";
  const isAllowedCrawler = ALLOWED_CRAWLERS.some((pattern) =>
    pattern.test(userAgent)
  );
  if (
    !isAllowedCrawler &&
    BLOCKED_BOTS.some((pattern) => pattern.test(userAgent))
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }
}
```

**Unchanged:** matcher (`src/proxy.ts:188-192`), rate limiting (`:65-82`), admin auth/redirect (`:98-115`), security headers (`:119-183`), `next.config.ts`, `vercel.json`, `robots.ts`, `sitemap.ts`.

Diff stat: `src/proxy.ts | 25 ++++++++++++++++++++++--- (22 insertions, 3 deletions)`.

---

## 3. Why Googlebot Was Blocked

Production UA: `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`
- `/bot(?!om)/i` matched the `bot` in `Googlebot` (not followed by `om`) → **403 at old `src/proxy.ts:75`** before routing.
- `bingbot/2.0` matched identically.

After the fix Googlebot matches `/googlebot/i` in `ALLOWED_CRAWLERS` → `isAllowedCrawler = true` → the `BLOCKED_BOTS` test is skipped entirely → request proceeds to `NextResponse.next()` and the route renders. The removed generic rule is gone, so no UA-dependent block can re-trigger on `bot` alone, and the allowlist additionally shields the exempt crawlers from the retained `/spider/i` and `/crawler/i` rules (e.g. `Baiduspider`, `Sogou web spider`).

No replacement rule matching `*bot*` was introduced.

---

## 4. Security Preserved

| Control | Status | Evidence |
|---|---|---|
| Admin auth (`/admin` without session) | **Unchanged — 307 → `/admin/login`** | Dev + prod-mode: `Chrome /admin -> 307`, `Googlebot /admin -> 307 loc=/admin/login`; `/admin/login` public → 200. Auth runs *after* the bot gate (`src/proxy.ts:101`) and is UA-independent. |
| API authorization (401/403 JSON in route handlers) | **Untouched** | No `src/app/api/**` file modified. |
| API rate limiting (429) | **Unchanged** | Local burst test: 35 requests → 27×`404` + 8×`429` (limit 30/60s per `src/proxy.ts:65-82`). |
| Bot-gate scope | **Unchanged** | Still only non-`/api/`, non-`/_next/` paths (`src/proxy.ts:85`). API responses never depended on UA. |
| Matcher | **Unchanged** | `git diff` shows no change to `config.matcher`. |
| CSP / HSTS / Permissions-Policy / X-Frame-Options / Referrer-Policy | **Unchanged** | Response headers on 200 identical to pre-fix set (proxy CSP incl. `upgrade-insecure-requests`, 7-directive Permissions-Policy, `x-dns-prefetch-control: on`, HSTS). |
| Abusive-tool filtering | **Retained** | `curl`, `wget`, `python-requests`, `*scraper*`, generic `*crawler*`/`*spider*` (non-exempt) still → 403. |
| No spoofed-UA trust | **Honor preserved** | The allowlist only skips a soft block; it grants **no identity, session, admin, or API privilege**. Admin/API authorization still derives exclusively from `lens-session` JWT + route handlers, verified by the 307/404 checks above. No Google IP allowlist added; no verification of crawler identity attempted (explicitly out of scope). |
| No redesign | Single gate condition + one constant array; architecture, ordering, and all other logic byte-identical. |

---

## 5. Local Verification

### A. Static checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **exit 0** (clean) |
| `npx eslint src/proxy.ts` | **exit 0** (changed file lint-clean) |
| `npm run lint` (full) | exit 1 — **75 problems (33 errors, 42 warnings)**, byte-identical to the pre-fix baseline in PHASE_11; **zero findings in `src/proxy.ts`** (all pre-existing: `src/app/admin/*` react-hooks/unused-vars, `prisma/seed.js`, etc.) |
| `npm test` (vitest) | **7 files / 31 tests passed**, exit 0 |
| `npm run build` | **exit 0**; route output includes `ƒ Proxy (Middleware)`, `○ /sitemap.xml`, `○ /robots.txt`, `○ /robots.txt` routes as expected |

### B. Local HTTP verification

**B1 — `next dev` (port 3000):**

| UA | `/` | `/sitemap.xml` | `/robots.txt` |
|---|---|---|---|
| Chrome 126 | 200 | 200 | 200 |
| Googlebot | **200** | **200** | **200** |
| bingbot | **200** | **200** | **200** |
| curl | 403 (retained) | 403 (retained) | 403 (retained) |
| python-requests | 403 (retained) | 403 (retained) | 403 (retained) |

**B2 — `next start` production build (port 3001):** identical matrix, plus content types:
- Googlebot `/sitemap.xml` → `200 application/xml`
- Googlebot `/robots.txt` → `200 text/plain`
- Googlebot `/` → `200 text/html; charset=utf-8` (real rendered HTML, not an error page)
- bingbot `/`, `/sitemap.xml`, `/robots.txt` → 200 / 200 / 200
- Chrome `/`, `/sitemap.xml`, `/robots.txt` → 200 / 200 / 200
- curl `/`, `/sitemap.xml`, `/robots.txt` → 403 (retained filtering)

**B3 — Additional crawler sweep on `/` (prod build):** `Baiduspider` → 200, `Sogou web spider` → 200, `YandexBot` → 200, `Applebot` → 200, `DuckDuckBot` → 200 (these prove the allowlist neutralizes the retained `/spider/i` rule).

**B4 — Admin/API protection (prod build):**
- `Googlebot /admin` → **307** `Location: /admin/login` (not bypassed, not 200)
- `Chrome /admin` → 307 (identical behavior)
- `Googlebot /api/doesnotexist` → **404** (unchanged; bot gate never applied to `/api/`)
- `Chrome /api/doesnotexist` → 404
- Rate-limit burst → 8×`429` observed (see §4)
- Security headers on `Googlebot /` 200: CSP, `strict-transport-security`, 7-directive `permissions-policy`, `x-dns-prefetch-control: on` — all present.

---

## 6. Production Verification

**Status: NOT YET DEPLOYED — production still runs the pre-fix code.**

The fix exists only in the local working tree. Nothing was committed, pushed, or deployed by this phase (no `.vercel` link, and `.github/workflows/ci.yml` contains no deploy job).

Baseline captured from `https://www.lensbd.org/` **after** the fix was written locally (i.e. measuring the currently deployed build):

| UA | `/` | `/sitemap.xml` | `/robots.txt` |
|---|---|---|---|
| Chrome | 200 `text/html` | 200 `application/xml` | 200 `text/plain` |
| Googlebot | **403** | **403** | **403** |
| bingbot | **403** | **403** | **403** |

This confirms production is unchanged and that the 403s are still the Phase-11 root cause awaiting deployment.

**Post-deployment verification commands (run after the fix is committed/deployed):**

```powershell
$gb = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
$bb = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"
$ch = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# Expect 200 for all three UAs; sitemap must be application/xml
curl.exe -s -o NUL -w "%{http_code} %{content_type}`n" -A $gb https://www.lensbd.org/
curl.exe -s -o NUL -w "%{http_code} %{content_type}`n" -A $gb https://www.lensbd.org/sitemap.xml
curl.exe -s -o NUL -w "%{http_code} %{content_type}`n" -A $gb https://www.lensbd.org/robots.txt
curl.exe -s -o NUL -w "%{http_code}`n" -A $bb https://www.lensbd.org/
curl.exe -s -o NUL -w "%{http_code}`n" -A $bb https://www.lensbd.org/sitemap.xml
curl.exe -s -o NUL -w "%{http_code}`n" -A $bb https://www.lensbd.org/robots.txt
curl.exe -s -o NUL -w "%{http_code}`n" -A $ch https://www.lensbd.org/

# Security must remain: 307 redirect (not 200 content), API untouched
curl.exe -s -o NUL -w "%{http_code} %{redirect_url}`n" -A $gb https://www.lensbd.org/admin
curl.exe -s -o NUL -w "%{http_code}`n" -A $gb https://www.lensbd.org/api/doesnotexist

# Retained abusive-tool filtering: expect 403 (by design)
curl.exe -s -o NUL -w "%{http_code}`n" https://www.lensbd.org/
```

**Deployment blocker to be aware of:** the working tree contains ~50 unrelated pre-existing modifications (`package.json`, `prisma/*`, `src/app/**`, `vercel.json`, `src/app/sitemap.ts`, etc.) that predate this phase and were **not** touched by it. Deploying will ship those as well — that is a release-scope decision outside this fix.

---

## 7. Search Console Status

**NOT VERIFIED — cannot be claimed fixed.**

- No production deployment of this fix has occurred (§6), and this audit has no Google Search Console access.
- Correct sequence after deployment:
  1. Confirm `https://www.lensbd.org/sitemap.xml` returns **200** with `Content-Type: application/xml` from the production URL (§6 commands).
  2. Open Google Search Console → *Sitemaps* → submit/fetch `https://www.lensbd.org/sitemap.xml`.
  3. Use *URL Inspection* on `https://www.lensbd.org/` and run *Request Indexing*; check *Crawl stats* for the previous 403s clearing.
  4. Only after GSC reports the sitemap as successfully read may Search Console be declared fixed.
- Known GSC caveat: Google treats a **403 on `robots.txt`** as blocking the whole site, so expect a crawl-report lag of days-to-weeks after deployment even once 200s are confirmed.

---

## 8. Remaining Issues

1. **Not deployed.** The fix is local-only (`src/proxy.ts`, uncommitted). Production 403s for Googlebot/bingbot persist until deployment + the §6 command matrix passes.
2. **Search Console re-verification pending** (§7) — explicitly not claimed.
3. **curl/wget/python-requests still receive 403 on `/`, `/sitemap.xml`, `/robots.txt` — by design** (retained abusive-tool filtering per requirements). Consequence: operators checking with `curl -I` and any uptime monitor using a curl-style UA will still see 403 on this site. If that becomes a problem, prefer Vercel Firewall rules over code (platform-layer, per-path) rather than weakening this gate.
4. **SEO/AI scrapers now receive 200** (`AhrefsBot`, `SemrushBot`, `GPTBot`, `ClaudeBot`, …) — unavoidable consequence of removing the generic `bot` rule. Crawl policy now rests on `robots.txt`, which already disallows `GPTBot`, `ChatGPT-User`, `CCBot` (`src/app/robots.ts:13-24`) and is now actually reachable by those crawlers. Optional follow-up (requires a separate `robots.ts` change, deliberately **not** made here): add `Disallow` groups for commercial scrapers if desired.
5. **Pre-existing lint failures:** `npm run lint` → 75 problems (33 errors) in `src/app/admin/*`, `prisma/seed.js`, etc. Unchanged by this fix, but `.github/workflows/ci.yml` runs `npm run lint`, so CI will fail until they are addressed separately.
6. **Working-tree noise:** ~50 unrelated modified/untracked files exist from earlier phases; only `src/proxy.ts` belongs to this fix.
7. **UA allowlist is not (and cannot be) identity verification** — spoofable by design; acceptable only because it conveys no privilege (§4). Do not later build authorization on `ALLOWED_CRAWLERS`.

---

### Compliance statement
- Only `src/proxy.ts` was edited; diff = 22 insertions / 3 deletions, confined to `BLOCKED_BOTS`/`ALLOWED_CRAWLERS` and the bot-gate condition.
- Authentication/session logic, admin authorization, API authorization, CSP/security headers, matcher, `robots.ts`, `sitemap.ts`, `next.config.ts`, `vercel.json`, domains, and environment variables were **not** modified.
- No commit, push, deploy, domain, or platform setting was performed.
- No Google IP allowlist added; no spoofed UA treated as authenticated identity.
- Verification performed: `tsc` (clean), `eslint src/proxy.ts` (clean), full `lint` (baseline-identical pre-existing failures), `vitest` (31/31), `next build` (success), `next dev` and `next start` HTTP matrices (§5), live production baseline (§6).
