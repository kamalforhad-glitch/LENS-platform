"use server";

import { headers } from "next/headers";
import { loginUser, destroySession, getCurrentUser } from "@/lib/auth";
import {
  loginRateLimit,
  clearLoginRateLimit,
  LOGIN_LIMIT,
} from "@/lib/rate-limit";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

async function requestContext(): Promise<{ ip?: string; userAgent?: string }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    return { ip, userAgent: h.get("user-agent") || undefined };
  } catch {
    return {};
  }
}

export async function login(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const context = await requestContext();

    // Sliding-window limiter keyed on ip+email. Checked BEFORE credential
    // verification so brute force never reaches bcrypt.
    const limit = loginRateLimit(context.ip || "unknown", email);
    if (!limit.allowed) {
      await logAudit({
        action: AUDIT_ACTIONS.LOGIN_RATE_LIMITED,
        targetType: "account",
        meta: { email },
        context,
      });
      return {
        success: false,
        error: `Too many failed attempts. Try again in ${Math.ceil(limit.retryAfterMs / 60000)} minutes.`,
      };
    }

    const result = await loginUser(email, password, context);

    if (result.success) clearLoginRateLimit(context.ip || "unknown", email);

    return {
      ...result,
      attemptsLeft: result.success ? undefined : limit.attemptsLeft,
      limit: LOGIN_LIMIT,
    };
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return { success: false, error: "An internal error occurred. Please try again." };
  }
}

export async function logout() {
  try {
    return await destroySession();
  } catch (error) {
    console.error("[AUTH] Logout error:", error);
  }
}

export async function checkAuth() {
  try {
    const user = await getCurrentUser();
    return { authenticated: !!user, user };
  } catch (error) {
    console.error("[AUTH] checkAuth error:", error);
    return { authenticated: false, user: null };
  }
}
