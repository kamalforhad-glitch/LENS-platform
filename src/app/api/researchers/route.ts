import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { researcherCreateSchema } from "@/lib/schemas";
import { isRateLimited } from "@/lib/validation";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function isSchemaColumnMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "P2022" || err.code === "42703") return true;
  const message = String(err.message || "");
  return (
    (message.includes("column") && message.includes("does not exist")) ||
    message.includes("UndefinedColumn") ||
    message.includes("P2022")
  );
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  const name = String(err.name || "");
  const code = String(err.code || "");
  const message = String(err.message || "");

  if (name === "PrismaClientInitializationError") return true;
  if (["P1000", "P1001", "P1002", "P1008", "P1017"].includes(code)) return true;
  return (
    message.includes("Can't reach database server") ||
    message.includes("connection closed") ||
    message.includes("Connection terminated")
  );
}

export async function GET(request: NextRequest) {
  try {
    // Single-profile lookup used by /researchers/[slug]. Without ?slug= the
    // caller gets the full active list (existing behavior, unchanged shape).
    const slug = request.nextUrl.searchParams.get("slug");
    if (slug) {
      try {
        const researcher = await db.researcherProfile.findFirst({
          where: { slug, status: "active" },
          include: {
            articleLinks: {
              where: { article: { status: "published" } },
              orderBy: { authorOrder: "asc" },
              include: {
                article: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    category: true,
                    downloads: true,
                    datePublished: true,
                  },
                },
              },
            },
          },
        });
        if (!researcher) return NextResponse.json({ researcher: null });

        // The profile UI expects a numeric articleCount; derive it from the
        // included published-article links instead of adding a schema field.
        const { articleLinks, ...profile } = researcher;
        return NextResponse.json({
          researcher: { ...profile, articleCount: articleLinks.length, articleLinks },
        });
      } catch (slugError) {
        if (isSchemaColumnMissingError(slugError)) {
          console.warn("[Researcher Profile Lookup Warning - falling back to base columns]", slugError);
          const rawProfiles = await db.$queryRaw<any[]>`
            SELECT id, slug, name, COALESCE(name, '') as "nameBn", email, affiliation,
                   COALESCE(affiliation, '') as "affiliationBn", position,
                   COALESCE(position, '') as "positionBn", bio, COALESCE(bio, '') as "bioBn",
                   image, orcid, website, social, research_areas as "researchAreas",
                   '[]' as "researchAreasBn", expertise, '[]' as "expertiseBn",
                   education, '[]' as "educationBn", languages, '[]' as "languagesBn",
                   total_downloads as "totalDownloads", total_citations as "totalCitations",
                   featured, status, created_at as "createdAt", updated_at as "updatedAt"
            FROM researcher_profiles
            WHERE slug = ${slug} AND status = 'active'
            LIMIT 1
          `;
          if (!rawProfiles || rawProfiles.length === 0) {
            return NextResponse.json({ researcher: null });
          }
          const profile = rawProfiles[0];
          return NextResponse.json({
            researcher: { ...profile, articleCount: 0, articleLinks: [] },
          });
        }
        if (isDatabaseConnectionError(slugError)) {
          console.error("[Researcher Profile Database Connection Error]", slugError);
          return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
        }
        console.error("[Researcher Profile Unexpected Error]", slugError);
        return NextResponse.json({ error: "Failed to fetch researcher" }, { status: 500 });
      }
    }

    try {
      const researchers = await db.researcherProfile.findMany({
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
      });
      return NextResponse.json({ researchers });
    } catch (queryError) {
      if (isSchemaColumnMissingError(queryError)) {
        console.warn("[Researchers List Query Warning - falling back to base columns]", queryError);
        const rawResearchers = await db.$queryRaw<any[]>`
          SELECT id, slug, name, COALESCE(name, '') as "nameBn", email, affiliation,
                 COALESCE(affiliation, '') as "affiliationBn", position,
                 COALESCE(position, '') as "positionBn", bio, COALESCE(bio, '') as "bioBn",
                 image, orcid, website, social, research_areas as "researchAreas",
                 '[]' as "researchAreasBn", expertise, '[]' as "expertiseBn",
                 education, '[]' as "educationBn", languages, '[]' as "languagesBn",
                 total_downloads as "totalDownloads", total_citations as "totalCitations",
                 featured, status, created_at as "createdAt", updated_at as "updatedAt"
          FROM researcher_profiles
          WHERE status = 'active'
          ORDER BY featured DESC, total_downloads DESC
        `;
        return NextResponse.json({ researchers: rawResearchers || [] });
      }
      if (isDatabaseConnectionError(queryError)) {
        console.error("[Researchers List Database Connection Error]", queryError);
        return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
      }
      console.error("[Researchers List Unexpected Error]", queryError);
      return NextResponse.json({ error: "Failed to fetch researchers" }, { status: 500 });
    }
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }
    console.error("[Researchers Global Handler Error]", error);
    return NextResponse.json({ error: "Failed to fetch researchers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Defence in depth — the global /api/* limiter in proxy.ts is per-IP too,
  // but this endpoint writes to the public researcher directory.
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(`researchers:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = researcherCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid researcher data",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    const researcher = await db.researcherProfile.create({
      data: {
        slug,
        name: data.name,
        email: data.email ?? null,
        affiliation: data.affiliation,
        position: data.position,
        bio: data.bio,
        image: data.image ?? null,
        orcid: data.orcid ?? null,
        website: data.website ?? null,
        social: data.social ? JSON.stringify(data.social) : "{}",
        researchAreas: JSON.stringify(data.researchAreas),
        expertise: JSON.stringify(data.expertise),
        education: JSON.stringify(data.education),
        languages: JSON.stringify(data.languages),
        featured: data.featured,
      },
    });

    return NextResponse.json({ researcher });
  } catch (error) {
    console.error("[Researcher Create Error]", error);
    return NextResponse.json({ error: "Failed to create researcher" }, { status: 500 });
  }
}
