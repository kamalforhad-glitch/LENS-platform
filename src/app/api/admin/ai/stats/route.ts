import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unauthorized";
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const totalConversations = await db.aIConversation.count();
    const totalMessages = await db.aIMessage.count();
    const tokenAgg = await db.aIMessage.aggregate({
      _sum: { tokenCount: true },
      where: { role: "assistant" },
    });

    return NextResponse.json({
      totalConversations,
      totalMessages,
      totalTokens: tokenAgg._sum.tokenCount || 0,
    });
  } catch {
    return NextResponse.json({ totalConversations: 0, totalMessages: 0, totalTokens: 0 });
  }
}
