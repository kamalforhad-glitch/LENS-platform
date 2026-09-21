import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location") || "header";
  const items = await db.menuItem.findMany({ where: { location }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const maxOrder = await db.menuItem.findFirst({ where: { location: data.location }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const item = await db.menuItem.create({ data: { ...data, sortOrder: (maxOrder?.sortOrder ?? 0) + 1 } });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data;
  const item = await db.menuItem.update({ where: { id }, data: rest });
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
