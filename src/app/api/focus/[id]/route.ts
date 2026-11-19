import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getFocusAreaById, getFocusAreaBySlug } from "@/lib/focus-areas";
import { db, logSupabaseDbError } from "@/lib/prisma";
import { focusIdSchema, focusSlugSchema, focusUpdateSchema } from "@/lib/focus-schema";
import {
  FOCUS_LIST_TAG,
  focusDetailTag,
  type FocusAreaDto,
} from "@/lib/focus-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  return NextResponse.json(
    { error: message === "Forbidden" ? "Forbidden" : "Unauthorized" },
    { status: message === "Forbidden" ? 403 : 401 }
  );
}

function toDto(row: {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  content: string | null;
  imageUrl: string | null;
  order: number;
}): FocusAreaDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    content: row.content,
    imageUrl: row.imageUrl,
    order: row.order,
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id: raw } = await params;
  console.log("[DB Query] Attempting database handshake with Supabase...");

  try {
    const numericId = focusIdSchema.safeParse(raw);
    const area = numericId.success
      ? await getFocusAreaById(numericId.data)
      : await getFocusAreaBySlug(raw);

    if (!area) return NextResponse.json({ error: "Focus area not found" }, { status: 404 });
    return NextResponse.json({ area });
  } catch (error) {
    logSupabaseDbError(`focus detail GET:${raw}`, error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id: raw } = await params;
  console.log("[DB Query] Attempting database handshake with Supabase...");

  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    logSupabaseDbError(`focus auth lookup:${raw}`, error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireAdmin(user);
  } catch (error) {
    return authErrorResponse(error);
  }

  const body = await request.json().catch(() => null);
  const parsed = focusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid focus area",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  console.log(`[CMS Update] Target FocusArea ID ${raw} payload received:`, {
    title: parsed.data.title,
    slug: parsed.data.slug,
  });

  const numericId = focusIdSchema.safeParse(raw);
  const slugParam = focusSlugSchema.safeParse(raw);

  let existing;
  try {
    if (numericId.success) {
      existing = await db.focusArea.findUnique({ where: { id: numericId.data } });
    } else if (slugParam.success) {
      existing = await db.focusArea.findUnique({ where: { slug: slugParam.data } });
    }
  } catch (error) {
    logSupabaseDbError(`focus update lookup:${raw}`, error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Focus area not found" }, { status: 404 });
  }

  const input = parsed.data;
  if (input.slug !== existing.slug) {
    let conflict;
    try {
      conflict = await db.focusArea.findUnique({ where: { slug: input.slug } });
    } catch (error) {
      logSupabaseDbError(`focus slug conflict check:${raw}`, error);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    if (conflict && conflict.id !== existing.id) {
      return NextResponse.json(
        { error: "That slug is already in use", field: "slug" },
        { status: 409 }
      );
    }
  }

  try {
    const updated = await db.focusArea.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description,
        icon: input.icon ?? null,
        slug: input.slug,
        content: input.content ?? null,
        imageUrl: input.imageUrl ?? null,
        ...(input.order === undefined ? {} : { order: input.order }),
      },
    });

    const expireNow = { expire: 0 } as const;
    revalidateTag(FOCUS_LIST_TAG, expireNow);
    revalidateTag(focusDetailTag(existing.slug), expireNow);
    revalidateTag(focusDetailTag(updated.slug), expireNow);
    revalidatePath("/");
    revalidatePath(`/focus/${existing.slug}`);
    revalidatePath(`/focus/${updated.slug}`);

    return NextResponse.json({ area: toDto(updated) });
  } catch (error) {
    logSupabaseDbError(`focus update:${existing.id}`, error);
    return NextResponse.json({ error: "Could not save focus area" }, { status: 500 });
  }
}
