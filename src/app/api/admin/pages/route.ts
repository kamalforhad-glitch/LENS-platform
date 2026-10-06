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
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const data = await req.json();
  const page = await db.page.create({ data: { ...data, createdBy: user.id } });
  return NextResponse.json({ page });
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
  const page = await db.page.update({ where: { id }, data: rest });
  return NextResponse.json({ page });
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
  await db.page.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
