import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  let baseUrl = "https://www.lensbd.org";
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host === "lensbd.org" || host === "www.lensbd.org") {
        baseUrl = "https://www.lensbd.org";
      }
    } catch {
      // Keep canonical fallback.
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/", "/private/", "/og"],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
