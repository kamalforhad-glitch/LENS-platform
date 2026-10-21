"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { validateSlug, CMS_MIGRATABLE_SLUGS } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { migrationPlan, SECTION_SKELETONS, type MigrationPlanEntry } from "@/lib/cms-migration";

/**
 * Admin-only migration of hardcoded public routes onto the CMS.
 *
 * Safety rules enforced here:
 *  - dry-run by default: the caller must explicitly pass dryRun:false to write
 *  - draft only: created pages are never published automatically
 *  - idempotent: an existing Page row for the slug is NEVER overwritten
 *  - curated slugs only: CMS_MIGRATABLE_SLUGS (home/admin/api stay reserved)
 */

export interface MigrationRunResult {
  dryRun: boolean;
  /** Populated in dry-run mode: exactly what would be created. */
  plan: MigrationPlanEntry[];
  /** Populated when writing: per-slug outcome. */
  results: Array<{ slug: string; created: boolean; pageId?: string; reason?: string }>;
}

/** Read-only dry run: reports exactly what would be created, without writing. */
export async function dryRunCmsMigration(slug?: string): Promise<MigrationPlanEntry[]> {
  const plan = migrationPlan(slug);
  for (const entry of plan) {
    const existing = await db.page.findUnique({ where: { slug: entry.slug } });
    entry.exists = !!existing;
    entry.message = existing
      ? `Page "${entry.slug}" already exists — skipped (idempotent, no overwrite).`
      : `Would create draft page "${entry.slug}" with ${entry.sections.length} section(s).`;
  }
  return plan;
}

/** Create draft CMS pages for migratable reserved slugs. Idempotent: never overwrites, never publishes. */
export async function runCmsMigration(input: { slug?: string; dryRun?: boolean }): Promise<MigrationRunResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const auth = requireAdmin(user);

  if (input.dryRun) {
    return { dryRun: true, plan: await dryRunCmsMigration(input.slug), results: [] };
  }

  const targets = input.slug ? [input.slug] : Array.from(CMS_MIGRATABLE_SLUGS);
  const results: MigrationRunResult["results"] = [];

  for (const slug of targets) {
    if (!CMS_MIGRATABLE_SLUGS.has(slug)) {
      results.push({ slug, created: false, reason: "Not a migratable reserved slug" });
      continue;
    }
    const slugCheck = validateSlug(slug, { allowMigratableReserved: true });
    if (!slugCheck.valid) {
      results.push({ slug, created: false, reason: slugCheck.error || "Invalid slug" });
      continue;
    }

    const existing = await db.page.findUnique({ where: { slug } });
    if (existing) {
      results.push({ slug, created: false, reason: "Page already exists — no overwrite" });
      continue;
    }

    const page = await db.page.create({
      data: {
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        titleBn: "",
        description: "",
        descriptionBn: "",
        status: "draft",
        template: "default",
        createdBy: auth.id,
        sections: {
          create: (SECTION_SKELETONS[slug] ?? []).map((s, index) => ({
            type: s.type,
            title: s.title,
            titleBn: s.titleBn,
            description: s.description,
            descriptionBn: "",
            sortOrder: index,
            visible: s.visible,
            settings: "{}",
            content: "{}",
            contentBn: "{}",
          })),
        },
      },
      include: { sections: true },
    });

    await logAudit({
      action: AUDIT_ACTIONS.PAGE_CREATED,
      actor: auth,
      targetType: "page",
      targetId: page.id,
      meta: { slug: page.slug, title: page.title, status: page.status, migration: true },
    });
    results.push({ slug, created: true, pageId: page.id });
  }

  return { dryRun: false, plan: [], results };
}
