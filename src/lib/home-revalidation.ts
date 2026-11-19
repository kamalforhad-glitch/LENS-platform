import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Shared post-write invalidation for CMS content that can appear on the
 * anonymous homepage. `revalidatePath("/")` marks the ISR page stale; tags
 * also bust any `unstable_cache` loaders that feed it.
 */
export function revalidateHomeContent(tags: readonly string[] = []): void {
  revalidatePath("/");
  for (const tag of new Set(tags)) {
    revalidateTag(tag, { expire: 0 });
  }
}
