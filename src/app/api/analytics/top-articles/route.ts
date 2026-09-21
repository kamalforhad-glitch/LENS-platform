import { NextResponse } from "next/server";
import { getTopArticles } from "@/lib/actions/analytics";

export async function GET() {
  try {
    const data = await getTopArticles(10);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
