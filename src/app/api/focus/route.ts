import { NextResponse } from "next/server";
import { getFocusAreasWithSource } from "@/lib/focus-areas";
import { logSupabaseDbError } from "@/lib/prisma";
import { FOCUS_LIST_TAG, type FocusListResponse } from "@/lib/focus-types";

export const revalidate = 300;

export async function GET() {
  console.log("[DB Query] Attempting database handshake with Supabase...");

  try {
    const { areas, source } = await getFocusAreasWithSource();
    const body: FocusListResponse = { areas, count: areas.length, source };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Focus-Tag": FOCUS_LIST_TAG,
        "X-Focus-Source": source,
      },
    });
  } catch (error) {
    logSupabaseDbError("focus list GET", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
