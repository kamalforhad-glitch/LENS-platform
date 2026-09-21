import { NextRequest, NextResponse } from "next/server";
import { db, slugify } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const programs = await db.program.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ programs });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  if (!data.slug) data.slug = slugify(data.title);
  data.createdBy = user.id;
  const program = await db.program.create({ data });
  return NextResponse.json({ program });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...data } = await req.json();
  const program = await db.program.update({ where: { id }, data });
  return NextResponse.json({ program });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
