import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const researchers = await db.researcherProfile.findMany({
      where: { status: "active" },
      orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
    });

    return NextResponse.json({ researchers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch researchers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, affiliation, position, bio, image, orcid, website, social, researchAreas, expertise, education, languages, featured } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const researcher = await db.researcherProfile.create({
      data: {
        slug,
        name,
        email: email || null,
        affiliation: affiliation || "",
        position: position || "",
        bio: bio || "",
        image: image || null,
        orcid: orcid || null,
        website: website || null,
        social: social ? JSON.stringify(social) : "{}",
        researchAreas: researchAreas ? JSON.stringify(researchAreas) : "[]",
        expertise: expertise ? JSON.stringify(expertise) : "[]",
        education: education ? JSON.stringify(education) : "[]",
        languages: languages ? JSON.stringify(languages) : "[]",
        featured: featured || false,
      },
    });

    return NextResponse.json({ researcher });
  } catch (error) {
    console.error("[Researcher Create Error]", error);
    return NextResponse.json({ error: "Failed to create researcher" }, { status: 500 });
  }
}
