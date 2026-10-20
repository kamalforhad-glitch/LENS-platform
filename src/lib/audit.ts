// ============================================================
// Audit logging — records sensitive administrative actions.
// Fire-and-forget by design: a logging failure must never break a
// user-facing operation. Sensitive values (passwords, tokens,
// secrets) must NEVER be passed in `meta`.
// ============================================================

import { db } from "./db";
import type { AuthUser } from "./auth";
import { toJson } from "./cms-validation";

export interface AuditActor {
  id?: string;
  email?: string;
  role?: string;
}

export interface AuditContext {
  ip?: string;
  userAgent?: string;
}

export interface AuditEntryInput {
  action: string;
  actor?: AuthUser | AuditActor | null;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
  context?: AuditContext | null;
}

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGIN_RATE_LIMITED: "login_rate_limited",
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_INVITED: "account_invited",
  ACCOUNT_ROLE_CHANGED: "account_role_changed",
  ACCOUNT_DEACTIVATED: "account_deactivated",
  ACCOUNT_REACTIVATED: "account_reactivated",
  ACCOUNT_SESSIONS_REVOKED: "account_sessions_revoked",
  ACCOUNT_PASSWORD_RESET_INITIATED: "account_password_reset_initiated",
  ACCOUNT_ACCEPTED_INVITE: "account_accepted_invite",
  ACCOUNT_PASSWORD_RESET_COMPLETED: "account_password_reset_completed",
  PASSWORD_CHANGED: "password_changed",
  AUDIT_LOGGED_OUT_OTHER_SESSIONS: "audit_log_out_other_sessions",
  PAGE_CREATED: "page_created",
  PAGE_UPDATED: "page_updated",
  PAGE_PUBLISHED: "page_published",
  PAGE_UNPUBLISHED: "page_unpublished",
  PAGE_DUPLICATED: "page_duplicated",
  PAGE_ARCHIVED: "page_archived",
  PAGE_RESTORED: "page_restored",
  PAGE_DELETED: "page_deleted",
  PAGE_REVISION_SAVED: "page_revision_saved",
  PAGE_REVISION_RESTORED: "page_revision_restored",
  SECTION_CREATED: "section_created",
  SECTION_UPDATED: "section_updated",
  SECTION_DELETED: "section_deleted",
  SECTION_REORDERED: "section_reordered",
  SETTING_SAVED: "setting_saved",
  MENU_CREATED: "menu_created",
  MENU_UPDATED: "menu_updated",
  MENU_DELETED: "menu_deleted",
  MENU_REORDERED: "menu_reordered",
  MEDIA_UPLOADED: "media_uploaded",
  MEDIA_UPDATED: "media_updated",
  MEDIA_DELETED: "media_deleted",
  MEDIA_DELETED_BLOCKED: "media_delete_blocked",
  MEDIA_REPLACED: "media_replaced",
  CONTENT_STATUS_CHANGED: "content_status_changed",
  CONTENT_DELETED: "content_deleted",
  VERSION_RESTORED: "version_restored",
  BACKUP_ACTION: "backup_action",
} as const;

function toActorFields(actor: AuditEntryInput["actor"]) {
  if (!actor) return {};
  const a = actor as AuditActor;
  const isAuthUser = typeof (actor as AuthUser).id === "string";
  return {
    actorId: a.id ?? null,
    actorEmail: a.email ?? null,
    actorRole: a.role ?? (isAuthUser ? null : null),
  };
}

/**
 * Insert an audit row. Never throws into the caller's flow.
 * @param entry audit description
 * @returns the created row id (best-effort), or null
 */
export async function logAudit(entry: AuditEntryInput): Promise<string | null> {
  try {
    const row = await db.auditLog.create({
      data: {
        action: entry.action,
        ...toActorFields(entry.actor),
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        meta: entry.meta ? toJson(entry.meta) : "{}",
        ip: entry.context?.ip ?? null,
        userAgent: entry.context?.userAgent ?? null,
      },
      select: { id: true },
    });
    return row.id;
  } catch (error) {
    // Never let audit failures break the application flow.
    console.error("[audit] failed to record entry", error instanceof Error ? error.message : error);
    return null;
  }
}
