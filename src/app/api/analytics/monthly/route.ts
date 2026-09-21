import { NextResponse } from "next/server";
import { getMonthlyActivity } from "@/lib/actions/analytics";

export async function GET() {
  try {
    const data = await getMonthlyActivity(12);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
