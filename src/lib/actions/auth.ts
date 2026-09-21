"use server";

import { loginUser, destroySession, getCurrentUser } from "@/lib/auth";

export async function login(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }
    return await loginUser(email, password);
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
