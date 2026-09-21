import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "LENS <noreply@lens.org.bd>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@lens.org.bd";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  type: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, type } = options;

  if (!resend) {
    console.log(`[Email - DEV] To: ${to}, Subject: ${subject}, Type: ${type}`);
    await logEmail(to.toString(), subject, type, "sent", "dev-mode");
    return { success: true, messageId: "dev-mode" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    const messageId = (result as { data?: { id?: string } }).data?.id || undefined;
    await logEmail(to.toString(), subject, type, "sent", messageId);
    return { success: true, messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await logEmail(to.toString(), subject, type, "failed", undefined, errorMsg);
    return { success: false, error: errorMsg };
  }
}

async function logEmail(
  to: string,
  subject: string,
  type: string,
  status: string,
  messageId?: string,
  error?: string
) {
  try {
    await db.emailLog.create({
      data: { to, subject, type, status, messageId, error },
    });
  } catch (e) {
    console.error("[Email Log Error]", e);
  }
}

// ============================================================
// Email Templates
// ============================================================

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .header p { color: #94a3b8; margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; }
    .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
    .content p { line-height: 1.6; margin: 16px 0; }
    .btn { display: inline-block; background: #0d9488; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .btn:hover { background: #0f766e; }
    .footer { padding: 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #0d9488; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LENS</h1>
      <p>Leadership, Engagement & Social Solutions</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LENS Bangladesh. All rights reserved.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd"}">Visit Website</a> | <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd"}/privacy">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function contactNotificationTemplate(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return baseTemplate(`
    <h2>New Contact Form Submission</h2>
    <p>You have received a new message through the LENS contact form.</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>From:</strong> ${data.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
      <p><strong>Subject:</strong> ${data.subject}</p>
    </div>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${data.message}</p>
    </div>
    <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">Reply to ${data.name}</a>
  `);
}

export function newsletterConfirmationTemplate(email: string, confirmUrl: string): string {
  return baseTemplate(`
    <h2>Welcome to LENS Newsletter!</h2>
    <p>Thank you for subscribing to our newsletter. You'll receive updates about our latest research, publications, and events.</p>
    <p>Please confirm your email address by clicking the button below:</p>
    <a href="${confirmUrl}" class="btn">Confirm Subscription</a>
    <p style="font-size: 14px; color: #64748b;">If you did not subscribe to this newsletter, please ignore this email.</p>
  `);
}

export function adminNotificationTemplate(title: string, body: string): string {
  return baseTemplate(`
    <h2>${title}</h2>
    <p>${body}</p>
  `);
}

export function backupReportTemplate(data: {
  status: string;
  filename: string;
  size: string;
  duration: string;
}): string {
  return baseTemplate(`
    <h2>Database Backup ${data.status === "completed" ? "Completed" : "Failed"}</h2>
    <div style="background: ${data.status === "completed" ? "#f0fdf4" : "#fef2f2"}; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>Status:</strong> <span style="color: ${data.status === "completed" ? "#16a34a" : "#dc2626"};">${data.status.toUpperCase()}</span></p>
      <p><strong>File:</strong> ${data.filename}</p>
      <p><strong>Size:</strong> ${data.size}</p>
      <p><strong>Duration:</strong> ${data.duration}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    </div>
  `);
}

// ============================================================
// Email Senders
// ============================================================

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Contact Form: ${data.subject}`,
    html: contactNotificationTemplate(data),
    type: "contact_notification",
  });
}

export async function sendNewsletterConfirmation(email: string) {
  const token = crypto.randomUUID();
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd"}/api/newsletter?token=${token}`;

  // Store token
  await db.newsletterSubscriber.update({
    where: { email },
    data: { token },
  });

  return sendEmail({
    to: email,
    subject: "Confirm your LENS Newsletter subscription",
    html: newsletterConfirmationTemplate(email, confirmUrl),
    type: "newsletter_confirmation",
  });
}

export async function sendBackupReport(data: {
  status: string;
  filename: string;
  size: string;
  duration: string;
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Backup Report: ${data.status}`,
    html: backupReportTemplate(data),
    type: "backup_report",
  });
}
