import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};
  const submissions = await db.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ submissions });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  const submission = await db.contactSubmission.update({ where: { id }, data: { status } });
  return NextResponse.json({ submission });
}
