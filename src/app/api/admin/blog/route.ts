import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";
import { parsePagination } from "@/lib/admin-pagination";
import { revalidateHomeContent } from "@/lib/home-revalidation";

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
    const post = await db.blogPost.findUnique({ where: { id } });
    return NextResponse.json({ post });
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
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // listWhere: search conditions + selected status. Used for the paginated
  // findMany and the pagination count, so total/totalPages/hasMore reflect
  // the filtered results.
  const listWhere: Record<string, unknown> = { ...searchWhere };
  if (statusFilter && statusFilter !== "all") {
    listWhere.status = statusFilter;
  }

  const [posts, total, allCount, statusRows] = await Promise.all([
    db.blogPost.findMany({
      where: listWhere,
      orderBy: [{ datePublished: "desc" }, { id: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        author: true,
        category: true,
        status: true,
        datePublished: true,
      },
    }),
    db.blogPost.count({ where: listWhere }),
    db.blogPost.count({ where: searchWhere }),
    db.blogPost.groupBy({
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

  return NextResponse.json({ posts, total, page, limit, totalPages, hasMore, counts });
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
  const post = await db.blogPost.create({ data });
  revalidateHomeContent(["public-blog"]);
  revalidatePath("/blog");
  if (post.slug) revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ post });
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
  const existing = await db.blogPost.findUnique({ where: { id }, select: { slug: true } });
  const post = await db.blogPost.update({ where: { id }, data });
  revalidateHomeContent(["public-blog"]);
  revalidatePath("/blog");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
  if (post.slug && post.slug !== existing?.slug) revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ post });
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
  const deleted = await db.blogPost.delete({ where: { id } });
  revalidateHomeContent(["public-blog"]);
  revalidatePath("/blog");
  if (deleted.slug) revalidatePath(`/blog/${deleted.slug}`);
  return NextResponse.json({ success: true });
}
