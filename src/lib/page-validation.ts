// ============================================================
// Page integrity validation shared by page server actions
// (lib/actions/cms.ts) and the REST admin route (api/admin/pages).
//
// Prevents circular page parent hierarchies (e.g. A -> B -> A,
// A -> A, A -> B -> C -> A) and ensures the parent exists before
// creating/updating the foreign key reference.
// ============================================================
import { db } from "@/lib/db";

const MAX_PAGE_DEPTH = 32;

export function assertValidPageParentInput(parentId: unknown, selfId?: string): string | null {
  if (parentId === undefined || parentId === null) return null;
  const id = String(parentId).trim();
  if (id === "") return null;
  if (selfId && id === selfId) {
    throw new Error("A page cannot be its own parent");
  }
  return id;
}

/**
 * Validate that `parentId` (non-empty) can safely be used as the parent of `selfId`.
 * Throws with a readable message when the parent does not exist, when it is the
 * page itself, or when assigning it would create an ancestor cycle (e.g. A -> B -> A).
 */
export async function assertValidPageParent(
  parentId: string,
  selfId?: string,
): Promise<void> {
  if (selfId && parentId === selfId) {
    throw new Error("A page cannot be its own parent");
  }

  const parent = await db.page.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });
  if (!parent) throw new Error("Parent page does not exist");

  // Walk the candidate parent's ancestor chain; hitting selfId creates a cycle
  let ancestorId = parent.parentId;
  const visited = new Set<string>([parentId]);
  for (let depth = 0; ancestorId && depth < MAX_PAGE_DEPTH; depth += 1) {
    if (selfId && ancestorId === selfId) {
      throw new Error("This parent assignment would create a circular page hierarchy");
    }
    if (visited.has(ancestorId)) {
      throw new Error("Existing circular hierarchy detected in parent chain");
    }
    visited.add(ancestorId);

    const ancestor = await db.page.findUnique({
      where: { id: ancestorId },
      select: { id: true, parentId: true },
    });
    if (!ancestor) break;
    ancestorId = ancestor.parentId;
  }
}
