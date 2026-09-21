import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const group = req.nextUrl.searchParams.get("group");
  const where = group ? { group } : {};
  const settings = await db.siteSetting.findMany({ where, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { key, ...rest } = data;
  const setting = await db.siteSetting.upsert({ where: { key }, update: rest, create: { key, ...rest } });
  return NextResponse.json({ setting });
}
