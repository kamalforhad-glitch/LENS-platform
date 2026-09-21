import { NextRequest, NextResponse } from "next/server";
import { fetchOrcidProfile, searchOrcid } from "@/lib/academic/orcid";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // If it looks like an ORCID iD, fetch profile directly
  if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(q.replace(/\s/g, ""))) {
    const profile = await fetchOrcidProfile(q);
    if (!profile) {
      return NextResponse.json({ error: "ORCID profile not found" }, { status: 404 });
    }
    return NextResponse.json({ type: "profile", profile });
  }

  // Otherwise search
  const results = await searchOrcid(q);
  return NextResponse.json({ type: "search", ...results });
}
