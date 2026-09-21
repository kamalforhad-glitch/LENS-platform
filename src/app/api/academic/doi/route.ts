import { NextRequest, NextResponse } from "next/server";
import { fetchDoiMetadata, searchCrossRef } from "@/lib/academic/crossref";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { doi } = await params as { doi: string };
  const decodedDoi = decodeURIComponent(doi);

  if (!decodedDoi) {
    return NextResponse.json({ error: "DOI is required" }, { status: 400 });
  }

  // If it's a full DOI, fetch metadata directly
  if (decodedDoi.includes("/")) {
    const metadata = await fetchDoiMetadata(decodedDoi);
    if (!metadata) {
      return NextResponse.json({ error: "DOI not found" }, { status: 404 });
    }
    return NextResponse.json(metadata);
  }

  // Otherwise search CrossRef
  const results = await searchCrossRef(decodedDoi, 5);
  return NextResponse.json(results);
}
