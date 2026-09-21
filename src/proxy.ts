import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

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

// Simple in-memory rate limiter with periodic cleanup
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000;

function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

function getRateLimit(ip: string, limit: number = 100, windowMs: number = 60000) {
  cleanupRateLimits();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimit = getRateLimit(`api:${ip}`, 30, 60000);
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Bot detection for non-API routes
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    const userAgent = request.headers.get("user-agent") || "";
    if (BLOCKED_BOTS.some((pattern) => pattern.test(userAgent))) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ============================================================
  // Admin Auth Protection
  // ============================================================
  if (pathname.startsWith("/admin")) {
    const ADMIN_PUBLIC = ["/admin/login"];
    if (!ADMIN_PUBLIC.some((route) => pathname.startsWith(route))) {
      const token = request.cookies.get("lens-session")?.value;
      if (!token) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      const payload = verifyToken(token);
      if (!payload) {
        const resp = NextResponse.redirect(new URL("/admin/login", request.url));
        resp.cookies.delete("lens-session");
        return resp;
      }
    }
  }

  const response = NextResponse.next();

  // ============================================================
  // Security Headers
  // ============================================================

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // DNS Prefetch
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Cross-domain policies
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // HSTS (production only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), join-ad-interest-group=(), run-ad-auction=()"
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://graph.facebook.com https://*.ingest.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Remove server information
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  // Cache control for static assets
  if (pathname.startsWith("/_next/static/") || pathname.endsWith(".ico") || pathname.endsWith(".png")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  // No cache for HTML pages (allow revalidation)
  if (!pathname.startsWith("/_next/") && !pathname.includes(".")) {
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.png|logo.png|icon-).*)",
  ],
};
