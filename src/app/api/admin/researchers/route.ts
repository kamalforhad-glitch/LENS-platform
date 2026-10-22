import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { researcherCreateSchema } from "@/lib/schemas";
import { isRateLimited } from "@/lib/validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      requireEditor(user);
    } catch (error) {
      return authErrorResponse(error);
    }

    const researchers = await db.researcherProfile.findMany({
      orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
    });

    return NextResponse.json({ researchers });
  } catch (error) {
    console.error("[Admin Researchers List Error]", error);
    return NextResponse.json({ error: "Failed to fetch researchers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (process.env.NODE_ENV === "production" && isRateLimited(`admin:researchers:${ip}`, 50, 60000)) {
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

  const rawBody = (typeof body === "object" && body !== null ? { ...(body as Record<string, unknown>) } : {}) as Record<string, unknown>;
  if ("id" in rawBody && !rawBody.id) delete rawBody.id;
  for (const k of ["social", "researchAreas", "researchAreasBn", "expertise", "expertiseBn", "education", "educationBn", "languages", "languagesBn"]) {
    if (typeof rawBody[k] === "string") {
      try { rawBody[k] = JSON.parse(rawBody[k] as string); } catch {}
    }
  }

  const parsed = researcherCreateSchema.safeParse(rawBody);
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
        nameBn: data.nameBn || "",
        email: data.email ?? null,
        affiliation: data.affiliation,
        affiliationBn: data.affiliationBn || "",
        position: data.position,
        positionBn: data.positionBn || "",
        bio: data.bio,
        bioBn: data.bioBn || "",
        image: data.image ?? null,
        orcid: data.orcid ?? null,
        website: data.website ?? null,
        social: data.social ? JSON.stringify(data.social) : "{}",
        researchAreas: JSON.stringify(data.researchAreas),
        researchAreasBn: JSON.stringify(data.researchAreasBn || []),
        expertise: JSON.stringify(data.expertise),
        expertiseBn: JSON.stringify(data.expertiseBn || []),
        education: JSON.stringify(data.education),
        educationBn: JSON.stringify(data.educationBn || []),
        languages: JSON.stringify(data.languages),
        languagesBn: JSON.stringify(data.languagesBn || []),
        featured: data.featured,
      },
    });

    await logAudit({
      action: AUDIT_ACTIONS.CONTENT_CREATED,
      actor: user,
      targetType: "content",
      targetId: researcher.id,
      meta: { type: "researcher", slug: researcher.slug, name: researcher.name },
    });

    return NextResponse.json({ researcher });
  } catch (error) {
    console.error("[Admin Researcher Create Error]", error);
    return NextResponse.json({ error: "Failed to create researcher" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

  const { id, ...data } = body as Record<string, unknown>;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Researcher ID required" }, { status: 400 });
  }

  try {
    const existing = await db.researcherProfile.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Researcher not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    const fields = [
      "name", "nameBn", "email", "affiliation", "affiliationBn",
      "position", "positionBn", "bio", "bioBn", "image", "orcid",
      "website", "social", "researchAreas", "researchAreasBn",
      "expertise", "expertiseBn", "education", "educationBn",
      "languages", "languagesBn", "featured", "status"
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        if (["social", "researchAreas", "researchAreasBn", "expertise", "expertiseBn", "education", "educationBn", "languages", "languagesBn"].includes(field)) {
          updateData[field] = typeof data[field] === "string" ? data[field] : JSON.stringify(data[field]);
        } else if (field === "featured") {
          updateData[field] = Boolean(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    const researcher = await db.researcherProfile.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      action: AUDIT_ACTIONS.CONTENT_UPDATED,
      actor: user,
      targetType: "content",
      targetId: researcher.id,
      meta: { type: "researcher", slug: researcher.slug, name: researcher.name },
    });

    return NextResponse.json({ researcher });
  } catch (error) {
    console.error("[Admin Researcher Update Error]", error);
    return NextResponse.json({ error: "Failed to update researcher" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "Researcher ID required" }, { status: 400 });

  try {
    const researcher = await db.researcherProfile.delete({ where: { id } });

    await logAudit({
      action: AUDIT_ACTIONS.CONTENT_DELETED,
      actor: user,
      targetType: "content",
      targetId: id,
      meta: { type: "researcher", slug: researcher.slug, name: researcher.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Researcher Delete Error]", error);
    return NextResponse.json({ error: "Failed to delete researcher" }, { status: 500 });
  }
}