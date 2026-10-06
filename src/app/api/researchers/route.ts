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

export async function GET() {
  try {
    const researchers = await db.researcherProfile.findMany({
      where: { status: "active" },
      orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
    });

    return NextResponse.json({ researchers });
  } catch (error) {
    console.error("[Researchers List Error]", error);
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
