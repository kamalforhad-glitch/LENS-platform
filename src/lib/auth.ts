import { db } from "./db";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production" && typeof window === "undefined") {
    // Only throw at runtime, not during build
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
  }
  return secret || "lens-dev-secret-change-in-production-2025";
})();
const SESSION_DURATION_HOURS = 24;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
}

export interface JwtPayload {
  userId: string;
  sessionId: string;
  role: string;
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DURATION_HOURS}h` });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ============================================================
// Session management
// ============================================================
export async function createSession(userId: string): Promise<string> {
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await db.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  const token = signToken({ userId, sessionId, role: "" });

  const cookieStore = await cookies();
  cookieStore.set("lens-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
    path: "/",
  });

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
  password: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { success: false, error: "Invalid email or password" };
  }

  await createSession(user.id);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "editor" | "viewer",
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
      role: user.role as "admin" | "editor" | "viewer",
    };
  } catch {
    return null;
  }
}

// ============================================================
// Authorization
// ============================================================
export function requireAuth(user: AuthUser | null, minRole: "admin" | "editor" | "viewer" = "viewer"): AuthUser {
  if (!user) throw new Error("Unauthorized");
  const hierarchy = { admin: 3, editor: 2, viewer: 1 };
  if (hierarchy[user.role] < hierarchy[minRole]) {
    throw new Error("Forbidden");
  }
  return user;
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  return requireAuth(user, "admin");
}
