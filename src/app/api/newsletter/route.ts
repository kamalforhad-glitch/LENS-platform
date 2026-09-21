import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNewsletterConfirmation } from "@/lib/email";
import { isValidEmail, isRateLimited } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Rate limit check
    const forwarded = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`newsletter:${forwarded}`, 3, 300000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existing) {
      if (existing.status === "confirmed") {
        return NextResponse.json({
          success: true,
          message: "You are already subscribed to our newsletter.",
        });
      }
      // Re-send confirmation for pending subscribers
      await sendNewsletterConfirmation(sanitizedEmail);
      return NextResponse.json({
        success: true,
        message: "Confirmation email resent. Please check your inbox.",
      });
    }

    // Create subscriber
    await db.newsletterSubscriber.create({
      data: { email: sanitizedEmail, status: "pending" },
    });

    // Send confirmation email
    await sendNewsletterConfirmation(sanitizedEmail);

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing! Check your inbox for confirmation.",
    });
  } catch (error) {
    console.error("[Newsletter API Error]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const subscriber = await db.newsletterSubscriber.findFirst({
      where: { token, status: "pending" },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "confirmed", confirmedAt: new Date(), token: null },
    });

    return NextResponse.json({
      success: true,
      message: "Your subscription has been confirmed!",
    });
  } catch (error) {
    console.error("[Newsletter Confirm Error]", error);
    return NextResponse.json(
      { error: "Confirmation failed" },
      { status: 500 }
    );
  }
}
