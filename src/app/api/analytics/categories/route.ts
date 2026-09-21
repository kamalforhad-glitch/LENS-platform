import { NextResponse } from "next/server";
import { getCategoryTrends } from "@/lib/actions/analytics";

export async function GET() {
  try {
    const data = await getCategoryTrends();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
