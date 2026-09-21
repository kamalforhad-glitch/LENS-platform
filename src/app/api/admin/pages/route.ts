import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const page = await db.page.findUnique({ where: { slug }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    return NextResponse.json({ page });
  }
  const pages = await db.page.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const page = await db.page.create({ data: { ...data, createdBy: user.id } });
  return NextResponse.json({ page });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data;
  const page = await db.page.update({ where: { id }, data: rest });
  return NextResponse.json({ page });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.page.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
