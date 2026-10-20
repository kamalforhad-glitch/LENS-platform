"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  requireAuth,
  requireSuperAdmin,
  roleAtLeast,
  type AuthUser,
} from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { clampText } from "@/lib/cms-validation";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

// ============================================================
// Internal helpers
// ============================================================

async function requireSuperAdminUser(user: AuthUser | null): Promise<AuthUser> {
  if (!user) throw new Error("Unauthorized");
  requireSuperAdmin(user);
  return user;
}

async function requestContext() {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    return { ip, userAgent: h.get("user-agent") || undefined };
  } catch {
    return {};
  }
}

const VALID_ROLES = new Set(["super_admin", "admin", "editor", "viewer"]);
const INVITE_TTL_HOURS = 72;
const RESET_TTL_HOURS = 48;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function sendAccountLink(
  email: string,
  token: string,
  type: "invite" | "reset"
): Promise<void> {
  const path = type === "invite" ? "/admin/invite/accept" : "/admin/invite/accept";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const link = `${origin}${path}?token=${encodeURIComponent(token)}`;
  const subject =
    type === "invite"
      ? "Your LENS admin account invitation"
      : "Your LENS admin password reset link";
  const html = `
    <p>Hi,</p>
    <p>${
      type === "invite"
        ? "An administrator has created a LENS admin account for this email address."
        : "A LENS administrator has initiated a password reset for this email address."
    } Use the secure one-time link below to ${type === "invite" ? "set your password" : "choose a new password"}:</p>
    <p><a class="btn" href="${link}">${type === "invite" ? "Set my password" : "Reset my password"}</a></p>
    <p>This single-use link expires in ${type === "invite" ? INVITE_TTL_HOURS : RESET_TTL_HOURS} hours. If you did not request this, you can safely ignore this email.</p>
    <p>LENS — Lighthouse for Evolving Narrative Systems</p>`;
  await sendEmail({ to: email, subject, html, type: `account_${type}` });
}

// ============================================================
// List accounts (admin+: read-only card data, no credentials)
// ============================================================

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function listAdminUsers(): Promise<{
  users: AdminUserRow[];
  isSuperAdmin: boolean;
}> {
  const me = await getCurrentUser();
  requireAuth(me, "admin");
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return { users, isSuperAdmin: me?.role === "super_admin" };
}

// ============================================================
// Create or invite an account (Super Admin only)
// ============================================================

export async function createAdminUser(data: {
  email: string;
  name: string;
  role: string;
  password?: string;
  invite?: boolean;
}): Promise<{ success: boolean; error?: string; inviteLink?: string; invited?: boolean }> {
  const me = await requireSuperAdminUser(await getCurrentUser());
  const ctx = await requestContext();

  const email = (data.email || "").trim().toLowerCase();
  const name = clampText(data.name, 100).trim();
  const role = (data.role || "editor").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "A valid email address is required" };
  }
  if (!name) return { success: false, error: "Name is required" };
  if (!VALID_ROLES.has(role)) return { success: false, error: "Invalid role" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: "An account with this email already exists" };

  if (data.invite) {
    const user = await db.user.create({
      data: {
        email,
        name,
        role,
        // Random unusable hash until the invitee sets their password.
        passwordHash: hashPassword(crypto.randomBytes(32).toString("hex")),
        active: true,
        createdBy: me.id,
      },
    });
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        type: "invite",
        expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3600 * 1000),
        createdBy: me.id,
      },
    });
    await sendAccountLink(email, token, "invite");
    await logAudit({
      action: AUDIT_ACTIONS.ACCOUNT_INVITED,
      actor: me,
      targetType: "account",
      targetId: user.id,
      meta: { email, role, delivery: process.env.RESEND_API_KEY ? "email" : "dev-log" },
      context: ctx,
    });
    return { success: true, invited: true, inviteLink: `/admin/invite/accept?token=${token}` };
  }

  const password = data.password || "";
  if (password.length < 10) {
    return { success: false, error: "Password must be at least 10 characters" };
  }
  const user = await db.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: hashPassword(password),
      active: true,
      createdBy: me.id,
    },
  });
  await logAudit({
    action: AUDIT_ACTIONS.ACCOUNT_CREATED,
    actor: me,
    targetType: "account",
    targetId: user.id,
    meta: { email, role },
    context: ctx,
  });
  return { success: true };
}

// ============================================================
// Change role (Super Admin only)
// Guards: no self-role-change, protect last active super admin.
// ============================================================

export async function updateAdminRole(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  const me = await requireSuperAdminUser(await getCurrentUser());
  const ctx = await requestContext();

  if (userId === me.id) {
    return { success: false, error: "You cannot change your own role" };
  }
  if (!VALID_ROLES.has(role)) return { success: false, error: "Invalid role" };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { success: false, error: "Account not found" };
  if (target.role === role) return { success: true };

  const activeSuperAdmins = await db.user.count({
    where: { role: "super_admin", active: true },
  });
  if (target.role === "super_admin" && target.active && role !== "super_admin" && activeSuperAdmins <= 1) {
    return { success: false, error: "Cannot demote the last active Super Admin" };
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  await logAudit({
    action: AUDIT_ACTIONS.ACCOUNT_ROLE_CHANGED,
    actor: me,
    targetType: "account",
    targetId: userId,
    meta: { email: target.email, from: target.role, to: role },
    context: ctx,
  });
  return { success: true };
}

// ============================================================
// Deactivate / reactivate (Super Admin only)
// Deactivation revokes all sessions immediately.
// Guards: no self-deactivation; last active super admin protected.
// ============================================================

export async function setAdminActive(userId: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  const me = await requireSuperAdminUser(await getCurrentUser());
  const ctx = await requestContext();

  if (userId === me.id) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { success: false, error: "Account not found" };

  if (active === false && target.role === "super_admin" && target.active) {
    const activeSuperAdmins = await db.user.count({
      where: { role: "super_admin", active: true },
    });
    if (activeSuperAdmins <= 1) {
      return { success: false, error: "Cannot deactivate the last active Super Admin" };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { active } });
    if (!active) {
      await tx.session.deleteMany({ where: { userId } });
      // Invalidate pending invite/reset tokens.
      await tx.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { expiresAt: new Date(0) },
      });
    }
  });

  await logAudit({
    action: active ? AUDIT_ACTIONS.ACCOUNT_REACTIVATED : AUDIT_ACTIONS.ACCOUNT_DEACTIVATED,
    actor: me,
    targetType: "account",
    targetId: userId,
    meta: { email: target.email },
    context: ctx,
  });
  return { success: true };
}

// ============================================================
// Revoke sessions (Super Admin only; self allowed)
// ============================================================

export async function revokeAdminSessions(userId: string): Promise<{ success: boolean; error?: string; count?: number }> {
  const me = await requireSuperAdminUser(await getCurrentUser());
  const ctx = await requestContext();

  const result = await db.session.deleteMany({ where: { userId } });
  await logAudit({
    action: AUDIT_ACTIONS.ACCOUNT_SESSIONS_REVOKED,
    actor: me,
    targetType: "account",
    targetId: userId,
    meta: { email: userId === me.id ? "self" : undefined, count: result.count },
    context: ctx,
  });
  return { success: true, count: result.count };
}

// ============================================================
// Initiate password reset (Super Admin only)
// ============================================================

export async function initiatePasswordReset(userId: string): Promise<{ success: boolean; error?: string; resetLink?: string }> {
  const me = await requireSuperAdminUser(await getCurrentUser());
  const ctx = await requestContext();

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { success: false, error: "Account not found" };
  if (!target.active) return { success: false, error: "Account is deactivated" };

  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      type: "reset",
      expiresAt: new Date(Date.now() + RESET_TTL_HOURS * 3600 * 1000),
      createdBy: me.id,
    },
  });
  await sendAccountLink(target.email, token, "reset");
  await logAudit({
    action: AUDIT_ACTIONS.ACCOUNT_PASSWORD_RESET_INITIATED,
    actor: me,
    targetType: "account",
    targetId: userId,
    meta: { email: target.email, delivery: process.env.RESEND_API_KEY ? "email" : "dev-log" },
    context: ctx,
  });
  return { success: true, resetLink: `/admin/invite/accept?token=${token}` };
}

// ============================================================
// Accept invite / complete reset (public, token-gated — NOT a
// public registration endpoint: the account must already exist)
// ============================================================

export async function acceptAccountToken(input: {
  token: string;
  name?: string;
  password: string;
}): Promise<{ success: boolean; error?: string; userName?: string }> {
  const ctx = await requestContext();

  const token = (input.token || "").trim();
  const password = input.password || "";
  if (password.length < 10) {
    return { success: false, error: "Password must be at least 10 characters" };
  }
  const name = clampText(input.name, 100).trim();

  const hashed = hashToken(token);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashed },
    include: { user: true },
  });

  if (!record) return { success: false, error: "This link is invalid or has already been used" };
  if (record.usedAt) return { success: false, error: "This link has already been used" };
  if (record.expiresAt < new Date()) {
    return { success: false, error: "This link has expired. Ask a Super Admin to issue a new one." };
  }
  if (!record.user.active) {
    return { success: false, error: "This account is deactivated" };
  }

  const wasInvite = record.type === "invite";
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: hashPassword(password),
        ...(wasInvite && name ? { name } : {}),
      },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  });

  await logAudit({
    action: wasInvite ? AUDIT_ACTIONS.ACCOUNT_ACCEPTED_INVITE : AUDIT_ACTIONS.ACCOUNT_PASSWORD_RESET_COMPLETED,
    actor: { id: record.userId, email: record.user.email, role: record.user.role },
    targetType: "account",
    targetId: record.userId,
    meta: { email: record.user.email, type: record.type },
    context: ctx,
  });

  return { success: true, userName: record.user.name };
}

// ============================================================
// Audit log access (Super Admin full, admin read-only)
// ============================================================

export interface AuditRow {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: string;
  ip: string | null;
  createdAt: Date;
}

export async function listAuditLogs(filters?: {
  action?: string;
  actorEmail?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AuditRow[]; total: number; page: number; pageSize: number; canView: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Unauthorized");
  const canView = roleAtLeast(me, "admin");
  if (!canView) throw new Error("Forbidden");

  const page = Math.max(1, Math.min(500, filters?.page ?? 1));
  const pageSize = Math.max(10, Math.min(100, filters?.pageSize ?? 50));
  const where = {
    ...(filters?.action ? { action: filters.action } : {}),
    ...(filters?.actorEmail ? { actorEmail: { contains: filters.actorEmail, mode: "insensitive" as const } } : {}),
  };

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      actorEmail: r.actorEmail,
      actorRole: r.actorRole,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      meta: r.meta,
      ip: r.ip,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    canView,
  };
}
