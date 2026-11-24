import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { researcherCreateSchema } from "@/lib/schemas";
import { isRateLimited } from "@/lib/validation";
import { isSchemaColumnMissingError, isDatabaseConnectionError } from "@/lib/researchers-validation";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          const rawProfiles = await db.$queryRaw<Record<string, unknown>[]>`
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

    const urlLimit = request.nextUrl.searchParams.get("limit");
    const urlPage = request.nextUrl.searchParams.get("page");
    const parsedLimit = urlLimit ? Math.min(Math.max(parseInt(urlLimit, 10) || 50, 1), 100) : undefined;
    const parsedPage = urlPage ? Math.max(parseInt(urlPage, 10) || 1, 1) : 1;
    const skip = parsedLimit && urlPage ? (parsedPage - 1) * parsedLimit : undefined;

    try {
      const researchers = await db.researcherProfile.findMany({
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
        ...(parsedLimit ? { take: parsedLimit } : {}),
        ...(skip ? { skip } : {}),
      });
      return NextResponse.json({ researchers });
    } catch (queryError) {
      if (isSchemaColumnMissingError(queryError)) {
        console.warn("[Researchers List Query Warning - falling back to base columns]", queryError);
        const limitClause = parsedLimit ? Prisma.sql`LIMIT ${parsedLimit}` : Prisma.empty;
        const offsetClause = skip ? Prisma.sql`OFFSET ${skip}` : Prisma.empty;
        const rawResearchers = await db.$queryRaw<Record<string, unknown>[]>`
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
          ${limitClause}
          ${offsetClause}
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
