import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
