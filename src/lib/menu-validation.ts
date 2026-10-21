// ============================================================
// Menu integrity validation shared by the menu server actions
// (lib/actions/cms.ts) and the REST admin route (api/admin/menus).
//
// `menu_items.parent_id` is a plain string column without a foreign
// key, so nothing at the storage layer stops dangling or
// cross-location parents — and a parent cycle would make the public
// header's recursive tree builder diverge. These checks restore
// referential sanity without a schema change: the parent must exist,
// live in the same location, and must not be a descendant of the item
// being updated (which would create a cycle).
// ============================================================
import { db } from "@/lib/db";

const MAX_MENU_DEPTH = 32;

export function assertValidMenuParentInput(parentId: unknown, selfId?: string): string | null {
  if (parentId === undefined || parentId === null) return null;
  const id = String(parentId);
  if (id === "") return null;
  if (selfId && id === selfId) {
    throw new Error("A menu item cannot be its own parent");
  }
  return id;
}

/**
 * Validate that `parentId` (non-empty) can be used as the parent of a
 * menu item in `location`. Throws with a readable message when the
 * reference is dangling, cross-location, or cyclic. Returns void.
 */
export async function assertValidMenuParent(
  parentId: string,
  location: string,
  selfId?: string,
): Promise<void> {
  const parent = await db.menuItem.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true, location: true },
  });
  if (!parent) throw new Error("Parent menu item does not exist");
  if (parent.location !== location) {
    throw new Error("A menu item can only be nested under an item in the same location");
  }

  // Walk the candidate parent's ancestor chain; hitting the item
  // itself would create a parent cycle.
  let ancestorId = parent.parentId;
  for (let depth = 0; ancestorId && depth < MAX_MENU_DEPTH; depth += 1) {
    if (selfId && ancestorId === selfId) {
      throw new Error("This parent would create a menu cycle");
    }
    const ancestor = await db.menuItem.findUnique({
      where: { id: ancestorId },
      select: { parentId: true, location: true },
    });
    if (!ancestor) break; // dangling ancestor: tolerate, cycle impossible
    if (ancestor.location !== location) break; // chain leaves this location
    ancestorId = ancestor.parentId;
  }
}
