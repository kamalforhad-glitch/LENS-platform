import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendContactNotification } from "@/lib/email";
import { isValidEmail, sanitizeInput, isRateLimited } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Rate limit check
    const forwarded = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(`contact:${forwarded}`, 5, 300000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push("Name is required (minimum 2 characters).");
    }

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      errors.push("A valid email address is required.");
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      errors.push("Subject is required (minimum 3 characters).");
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      errors.push("Message is required (minimum 10 characters).");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // Sanitize inputs
    const sanitized = {
      name: sanitizeInput(name.trim()),
      email: sanitizeInput(email.trim().toLowerCase()),
      subject: sanitizeInput(subject.trim()),
      message: sanitizeInput(message.trim()),
    };

    // Save to database
    await db.contactSubmission.create({
      data: {
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        message: sanitized.message,
      },
    });

    // Send notification email to admin
    await sendContactNotification(sanitized);

    return NextResponse.json({
      success: true,
      message: "Thank you for your message. We will get back to you soon.",
    });
  } catch (error) {
    console.error("[Contact API Error]", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
