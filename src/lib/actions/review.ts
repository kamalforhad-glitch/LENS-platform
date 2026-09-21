"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { PaginatedResult, ReviewAssignmentStatus, CommentSeverity, AdminReviewAssignment } from "@/lib/admin-types";

export async function getReviewQueue(
  page: number = 1,
  limit: number = 20,
  filters: { status?: string; search?: string } = {}
): Promise<PaginatedResult<AdminReviewAssignment>> {
  const where: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.search) {
    where.article = {
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { author: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const [total, items] = await Promise.all([
    db.reviewAssignment.count({ where }),
    db.reviewAssignment.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        article: { select: { id: true, slug: true, title: true, category: true, author: true, reviewStatus: true, version: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: items as AdminReviewAssignment[],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getReviewAssignment(id: string): Promise<AdminReviewAssignment | null> {
  const item = await db.reviewAssignment.findUnique({
    where: { id },
    include: {
      reviewer: { select: { id: true, name: true, email: true, role: true } },
      article: true,
      comments: { orderBy: { createdAt: "desc" } },
    },
  });
  return (item as AdminReviewAssignment) || null;
}

export async function getArticleReviews(articleId: string) {
  return db.reviewAssignment.findMany({
    where: { articleId },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      comments: { orderBy: { createdAt: "desc" } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function assignReviewer(
  articleId: string,
  reviewerId: string,
  deadline?: string
) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const assignment = await db.reviewAssignment.create({
    data: {
      articleId,
      reviewerId,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  await db.researchArticle.update({
    where: { id: articleId },
    data: { reviewStatus: "pending" },
  });

  return assignment;
}

export async function updateReviewStatus(
  assignmentId: string,
  status: ReviewAssignmentStatus,
  notes?: string
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;

  const assignment = await db.reviewAssignment.update({
    where: { id: assignmentId },
    data: updateData,
  });

  // Update article review status based on assignment statuses
  const articleAssignments = await db.reviewAssignment.findMany({
    where: { articleId: assignment.articleId },
  });

  const allCompleted = articleAssignments.every((a) => a.status === "completed" || a.id === assignmentId && status === "completed");
  const anyInProgress = articleAssignments.some((a) => a.status === "in_progress") || status === "in_progress";
  const anyDeclined = articleAssignments.some((a) => a.status === "declined") || status === "declined";

  let articleReviewStatus = "pending";
  if (allCompleted) articleReviewStatus = "under_review";
  else if (anyInProgress) articleReviewStatus = "under_review";
  else if (anyDeclined) articleReviewStatus = "revision_requested";

  await db.researchArticle.update({
    where: { id: assignment.articleId },
    data: { reviewStatus: articleReviewStatus },
  });

  return assignment;
}

export async function addReviewComment(
  assignmentId: string,
  data: {
    section?: string;
    lineRef?: string;
    comment: string;
    severity?: CommentSeverity;
  }
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  return db.reviewComment.create({
    data: {
      assignmentId,
      section: data.section || "general",
      lineRef: data.lineRef || null,
      comment: data.comment,
      severity: data.severity || "suggestion",
    },
  });
}

export async function resolveReviewComment(commentId: string, resolved: boolean) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  return db.reviewComment.update({
    where: { id: commentId },
    data: { resolved },
  });
}

export async function deleteReviewComment(commentId: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  return db.reviewComment.delete({ where: { id: commentId } });
}

export async function getReviewStats() {
  const [total, pending, inProgress, completed, declined] = await Promise.all([
    db.reviewAssignment.count(),
    db.reviewAssignment.count({ where: { status: "pending" } }),
    db.reviewAssignment.count({ where: { status: "in_progress" } }),
    db.reviewAssignment.count({ where: { status: "completed" } }),
    db.reviewAssignment.count({ where: { status: "declined" } }),
  ]);

  const unresolvedComments = await db.reviewComment.count({ where: { resolved: false } });

  return { total, pending, inProgress, completed, declined, unresolvedComments };
}
