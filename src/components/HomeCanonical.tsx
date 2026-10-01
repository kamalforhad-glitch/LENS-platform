"use client";

import { usePathname } from "next/navigation";

const CANONICAL_ORIGIN = "https://www.lensbd.org";

// Homepage-only self-referencing canonical.
//
// The Next.js metadata API cannot express "canonical for the homepage but not
// for children" from the root layout: `alternates.canonical` set on the root
// layout is inherited by every route (verified in this repo — /blog and
// /admin/login both emitted canonical = https://www.lensbd.org), which would
// instruct search engines to de-index every child page in favour of the
// homepage. Per-route canonicals therefore belong to each route's own metadata
// export; until those exist, only the homepage declares one.
export default function HomeCanonical() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return <link rel="canonical" href={`${CANONICAL_ORIGIN}/`} />;
}
