import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireAuth(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const status = req.nextUrl.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};
  const submissions = await db.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ submissions });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { id, status } = await req.json();
  const submission = await db.contactSubmission.update({ where: { id }, data: { status } });
  return NextResponse.json({ submission });
}
