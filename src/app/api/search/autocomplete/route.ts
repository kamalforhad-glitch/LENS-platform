import { NextResponse } from "next/server";
import { getAutocomplete } from "@/lib/actions/library";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getAutocomplete(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[Autocomplete Error]", error);
    return NextResponse.json({ suggestions: [] });
  }
}
