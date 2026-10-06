import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    return authErrorResponse(error);
  }
  const group = req.nextUrl.searchParams.get("group");
  const where = group ? { group } : {};
  const settings = await db.siteSetting.findMany({ where, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const data = await req.json();
  const { key, ...rest } = data;
  const setting = await db.siteSetting.upsert({ where: { key }, update: rest, create: { key, ...rest } });
  return NextResponse.json({ setting });
}
