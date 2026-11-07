import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

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
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { key, ...rest } = data as { key?: unknown } & Record<string, unknown>;
  if (typeof key !== "string" || !/^[a-z0-9_]{1,60}$/.test(key)) {
    return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
  }
  const setting = await db.siteSetting.upsert({ where: { key }, update: rest, create: { key, ...rest } });
  revalidatePath("/", "layout");
  revalidateTag("site-settings", { expire: 0 });
  return NextResponse.json({ setting });
}
