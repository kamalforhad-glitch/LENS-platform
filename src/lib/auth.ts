import { db } from "./db";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./env";
import { logAudit, AUDIT_ACTIONS } from "./audit";
const SESSION_DURATION_HOURS = 24;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "editor" | "viewer";
}

export interface JwtPayload {
  userId: string;
  sessionId: string;
  role: string;
}

// ============================================================
// Role hierarchy
// super_admin > admin > editor > viewer
// super_admin additionally owns admin-account and role management.
// ============================================================
export const ROLE_HIERARCHY: Record<AuthUser["role"], number> = {
  super_admin: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function roleAtLeast(user: AuthUser | null | undefined, minRole: AuthUser["role"]): boolean {
  if (!user) return false;
  const role = user.role as AuthUser["role"];
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

// ============================================================
// Password utilities
// ============================================================
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ============================================================
// JWT utilities
// ============================================================
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: `${SESSION_DURATION_HOURS}h` });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

// ============================================================
// Session management
// ============================================================
const SESSION_COOKIE = "lens-session";

async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
    path: "/",
  });
}

export async function createSession(userId: string, role: string = ""): Promise<string> {
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  const token = signToken({ userId, sessionId, role });

  await setSessionCookie(token);

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("lens-session")?.value;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      await db.session.deleteMany({ where: { id: payload.sessionId } });
    }
  }
  cookieStore.delete("lens-session");
}

// ============================================================
// Authentication
// ============================================================
export async function loginUser(
  email: string,
  password: string,
  meta?: { ip?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  const auditBase = {
    context: meta ? { ip: meta.ip, userAgent: meta.userAgent } : undefined,
  } as const;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await logAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      targetType: "account",
      targetId: user?.id ?? null,
      meta: { email: normalizedEmail },
      ...auditBase,
    });
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.active) {
    await logAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      targetType: "account",
      targetId: user.id,
      meta: { email: normalizedEmail, reason: "deactivated" },
      ...auditBase,
    });
    return { success: false, error: "Account disabled. Contact a Super Admin." };
  }

  const sessionId = await db.$transaction(async (tx) => {
    const sid = uuid();
    await tx.session.create({
      data: {
        id: sid,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000),
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return sid;
  });

  // Sign token for the fresh session and set the auth cookie.
  await setSessionCookie(signToken({ userId: user.id, sessionId, role: user.role }));

  await logAudit({
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    targetType: "account",
    targetId: user.id,
    meta: { email: normalizedEmail },
    ...auditBase,
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
    },
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("lens-session")?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify session exists and not expired
    const session = await db.session.findFirst({
      where: {
        id: payload.sessionId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) return null;

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
    };
  } catch {
    return null;
  }
}

// ============================================================
// Authorization
// ============================================================
export function requireAuth(user: AuthUser | null, minRole: "admin" | "editor" | "viewer" | "super_admin" = "viewer"): AuthUser {
  if (!user) throw new Error("Unauthorized");
  const role = user.role as AuthUser["role"];
  if ((ROLE_HIERARCHY[role] ?? 0) < (ROLE_HIERARCHY[minRole] ?? 0)) {
    throw new Error("Forbidden");
  }
  return user;
}

/** Super Admin only — account management, role assignment, audit log. */
export function requireSuperAdmin(user: AuthUser | null): AuthUser {
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "super_admin") throw new Error("Forbidden");
  return user;
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  return requireAuth(user, "admin");
}

export function requireEditor(user: AuthUser | null): AuthUser {
  return requireAuth(user, "editor");
}
