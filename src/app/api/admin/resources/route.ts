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
    const resource = await db.resource.findUnique({ where: { id } });
    return NextResponse.json({ resource });
  }

  // List endpoint with strict pagination and per-status counts.
  const rawPage = req.nextUrl.searchParams.get("page");
  const rawLimit = req.nextUrl.searchParams.get("limit");
  const search = req.nextUrl.searchParams.get("search") || undefined;
  const statusFilter = req.nextUrl.searchParams.get("status") || undefined;

  const pagination = parsePagination(rawPage, rawLimit);
  if (pagination.ok === false) {
    return NextResponse.json({ error: pagination.error }, { status: pagination.status });
  }
  const { page, limit, skip } = pagination;

  // searchWhere: search conditions only. Used for status counts so counts
  // are independent of the currently selected status filter.
  const searchWhere: Record<string, unknown> = {};
  if (search) {
    searchWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  // listWhere: search conditions + selected status. Used for the paginated
  // findMany and the pagination count, so total/totalPages/hasMore reflect
  // the filtered results.
  const listWhere: Record<string, unknown> = { ...searchWhere };
  if (statusFilter && statusFilter !== "all") {
    listWhere.status = statusFilter;
  }

  const [resources, total, allCount, statusRows] = await Promise.all([
    db.resource.findMany({
      where: listWhere,
      orderBy: [{ dateCreated: "desc" }, { id: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        titleBn: true,
        category: true,
        type: true,
        status: true,
        downloads: true,
      },
    }),
    db.resource.count({ where: listWhere }),
    db.resource.count({ where: searchWhere }),
    db.resource.groupBy({
      by: ["status"],
      where: searchWhere,
      _count: { status: true },
    }),
  ]);

  const counts: Record<string, number> = { all: allCount };
  for (const row of statusRows) {
    counts[row.status] = (counts[row.status] || 0) + row._count.status;
  }

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return NextResponse.json({ resources, total, page, limit, totalPages, hasMore, counts });
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
