import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, detectPromptInjection, sanitizeInput, checkRateLimit } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`ai-chat:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const sanitized = sanitizeInput(message);
    if (detectPromptInjection(sanitized)) {
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 });
    }

    let conversation;
    if (conversationId) {
      conversation = await db.aIConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
    }

    if (!conversation) {
      conversation = await db.aIConversation.create({
        data: {
          sessionId: `session-${ip}-${Date.now()}`,
          title: sanitized.slice(0, 100),
        },
        include: { messages: true },
      });
    }

    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: sanitized,
      },
    });

    const history = conversation.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await generateAIResponse(sanitized, history);

    await db.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: response.answer,
        sources: JSON.stringify(response.sources),
        tokenCount: response.tokenCount,
      },
    });

    return NextResponse.json({
      answer: response.answer,
      sources: response.sources,
      conversationId: conversation.id,
      tokenCount: response.tokenCount,
    });
  } catch (error) {
    console.error("[AI Chat Error]", error);
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  try {
    const messages = await db.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
