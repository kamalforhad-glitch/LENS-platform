import { NextRequest, NextResponse } from "next/server";
import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    return authErrorResponse(error);
  }
  const resources = await db.resource.findMany({ orderBy: { dateCreated: "desc" } });
  return NextResponse.json({ resources });
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
  if (!data.slug) data.slug = slugify(data.title);
  data.createdBy = user.id;
  const resource = await db.resource.create({ data });
  return NextResponse.json({ resource });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  const { id, ...data } = await req.json();
  const resource = await db.resource.update({ where: { id }, data });
  return NextResponse.json({ resource });
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
  await db.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
