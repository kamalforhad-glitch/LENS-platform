import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, detectPromptInjection, sanitizeInput, checkRateLimit } from "@/lib/ai";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Durable conversation ownership (Phase 8): authenticated users own
// conversations via their signed httpOnly session (user id); anonymous
// visitors keep the IP-prefix fallback so the public assistant still works.
// Legacy `session-<ip>-<ts>` rows remain IP-checked (no data migration).
export async function getOwnerKey(request: NextRequest): Promise<{ ownerKey: string; ip: string }> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const user = await getCurrentUser();
  return { ownerKey: user ? `user-${user.id}` : `session-${ip}`, ip };
}

export function ownsConversation(sessionId: string, ownerKey: string, ip: string): boolean {
  if (sessionId.startsWith(`${ownerKey}-`)) return true;
  // Backward compatibility for pre-Phase-8 anonymous conversations.
  return sessionId.startsWith(`session-${ip}-`);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`ai-chat:${ip}`, 20, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }
  const { ownerKey } = await getOwnerKey(request);

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
      // Ownership check: owner key (user id) or legacy IP prefix.
      // Prevents enumerating/appending to other visitors' conversations (IDOR).
      if (conversation && !ownsConversation(conversation.sessionId, ownerKey, ip)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!conversation) {
      conversation = await db.aIConversation.create({
        data: {
          sessionId: `${ownerKey}-${Date.now()}`,
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
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`ai-chat-read:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  try {
    const conversation = await db.aIConversation.findUnique({
      where: { id: conversationId },
      select: { sessionId: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const { ownerKey: readOwnerKey, ip: readIp } = await getOwnerKey(request);
    if (!ownsConversation(conversation.sessionId, readOwnerKey, readIp)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
