import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";

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
  const location = req.nextUrl.searchParams.get("location") || "header";
  const items = await db.menuItem.findMany({ where: { location }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const data = await req.json();
  const maxOrder = await db.menuItem.findFirst({ where: { location: data.location }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const item = await db.menuItem.create({ data: { ...data, sortOrder: (maxOrder?.sortOrder ?? 0) + 1 } });
  return NextResponse.json({ item });
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
  const { id, ...rest } = data;
  const item = await db.menuItem.update({ where: { id }, data: rest });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireAdmin(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { id } = await req.json();
  await db.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
