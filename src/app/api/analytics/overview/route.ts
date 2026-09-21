import { NextResponse } from "next/server";
import { getAnalyticsOverview, getMonthlyActivity, getCategoryTrends, getTopArticles } from "@/lib/actions/analytics";

export async function GET() {
  try {
    const data = await getAnalyticsOverview();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}
