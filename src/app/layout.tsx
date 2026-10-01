import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Analytics from "@/components/Analytics";
import CookieConsent from "@/components/CookieConsent";
import I18nProvider from "@/components/I18nProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeCanonical from "@/components/HomeCanonical";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Canonical production host for every absolute URL this app emits
// (metadataBase, canonical, Open Graph, Twitter).
const CANONICAL_HOST = "www.lensbd.org";

const SITE_NAME = "LENS — Lighthouse for Evolving Narrative Systems";
const DEFAULT_TITLE = "LENS — Lighthouse for Evolving Narrative Systems";
const DEFAULT_DESCRIPTION =
  "LENS — Lighthouse for Evolving Narrative Systems — evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.";
const OG_IMAGE_PATH =
  "/og?title=LENS&subtitle=Lighthouse+for+Evolving+Narrative+Systems";

// Resolve the base URL from the existing NEXT_PUBLIC_SITE_URL convention only
// when it already points at this site's own domain (apex or www); normalize to
// the canonical www host so apex and www never compete. Any other/unset/malformed
// value falls back to the canonical host — never to the legacy lens.org.bd host.
function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host === "lensbd.org" || host === CANONICAL_HOST) {
        return `https://${CANONICAL_HOST}`;
      }
    } catch {
      // Unusable value — fall through to the canonical host.
    }
  }
  return `https://${CANONICAL_HOST}`;
}

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | LENS",
  },
  description: DEFAULT_DESCRIPTION,
  // NOTE: `alternates.canonical` is intentionally NOT set here. A root-layout
  // canonical is inherited by every child route (verified: /blog and
  // /admin/login would both declare canonical = homepage), which would tell
  // search engines to de-index all child pages. The homepage-only canonical is
  // emitted by <HomeCanonical /> below; per-page canonicals belong to the
  // metadata phase that owns each route.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "LENS — Lighthouse for Evolving Narrative Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@lensorgbd",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} h-full antialiased`}>
      <head>
        <HomeCanonical />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="author" content="LENS" />
        <meta name="publisher" content="LENS" />
        <meta name="keywords" content="LENS, Lighthouse for Evolving Narrative Systems, Bangladesh think tank, media literacy, press freedom, narrative research, policy advocacy, digital rights, journalist safety, cybersecurity, media indexing, strategic communication, Bangladesh media, information ecosystem, civic engagement" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="bn_BD" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "LENS",
                  alternateName: "Lighthouse for Evolving Narrative Systems",
                  url: `https://${CANONICAL_HOST}/`,
                  description: DEFAULT_DESCRIPTION,
                  logo: {
                    "@type": "ImageObject",
                    url: `https://${CANONICAL_HOST}/favicon.svg`,
                  },
                  sameAs: [
                    "https://www.facebook.com/lensorgbd",
                    "https://twitter.com/lensorgbd",
                    "https://www.linkedin.com/company/lensorgbd",
                    "https://www.youtube.com/@lensorgbd",
                  ],
                },
                {
                  "@type": "WebSite",
                  name: "LENS — Lighthouse for Evolving Narrative Systems",
                  alternateName: "LENS",
                  url: `https://${CANONICAL_HOST}/`,
                  description: DEFAULT_DESCRIPTION,
                  publisher: {
                    "@type": "Organization",
                    name: "LENS",
                  },
                  inLanguage: ["en", "bn"],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-white focus:rounded-full focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <Analytics />
        <CookieConsent />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
