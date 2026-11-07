import { NextRequest, NextResponse } from "next/server";
import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";
import { parsePagination } from "@/lib/admin-pagination";

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
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const program = await db.program.findUnique({ where: { id } });
    return NextResponse.json({ program });
  }

  const pagination = parsePagination(
    req.nextUrl.searchParams.get("page"),
    req.nextUrl.searchParams.get("limit")
  );
  if (pagination.ok === false) {
    return NextResponse.json({ error: pagination.error }, { status: pagination.status });
  }
  const { page, limit, skip } = pagination;

  const [programs, total] = await Promise.all([
    db.program.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        category: true,
        status: true,
      },
    }),
    db.program.count({ where: {} }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return NextResponse.json({ programs, total, page, limit, totalPages, hasMore });
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
  const program = await db.program.create({ data });
  return NextResponse.json({ program });
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
  const program = await db.program.update({ where: { id }, data });
  return NextResponse.json({ program });
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
  await db.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
