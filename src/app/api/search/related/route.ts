import { NextResponse } from "next/server";
import { getRelatedContent } from "@/lib/actions/library";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("id") || "";

  if (!articleId) {
    return NextResponse.json({ related: [] });
  }

  try {
    const related = await getRelatedContent(articleId);
    return NextResponse.json({ related });
  } catch (error) {
    console.error("[Related Content Error]", error);
    return NextResponse.json({ related: [] });
  }
}
