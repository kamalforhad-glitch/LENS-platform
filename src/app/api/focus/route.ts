import { NextResponse } from "next/server";
import { getFocusAreas } from "@/lib/focus-areas";
import { FOCUS_LIST_TAG, type FocusListResponse } from "@/lib/focus-types";

export const revalidate = 300;

export async function GET() {
  const areas = await getFocusAreas();
  const body: FocusListResponse = { areas, count: areas.length };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Focus-Tag": FOCUS_LIST_TAG,
    },
  });
}
