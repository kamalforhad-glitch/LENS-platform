// ============================================================
// PrefetchLink — navigation that starts loading before the click.
//
// `onMouseEnter` / `onFocus` / `onTouchStart` trigger
// `router.prefetch(href)` exactly once per href, so hovering a
// primary nav tab or a resource card warms the route (JS + data)
// and the click resolves from the prefetched payload instead of
// waiting on a network round trip.
// ============================================================
"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, type MouseEvent, type FocusEvent, type TouchEvent } from "react";

type PrefetchHandler = (href: string) => void;

/** Returns a de-duplicated route prefetcher bound to the app router. */
export function usePrefetchRoute(): PrefetchHandler {
  const router = useRouter();
  const seen = useRef<Set<string>>(new Set());
  return useCallback(
    (href: string) => {
      if (!href || !href.startsWith("/") || href.startsWith("//") || seen.current.has(href)) return;
      seen.current.add(href);
      router.prefetch(href);
    },
    [router],
  );
}

export type PrefetchLinkProps = Omit<LinkProps, "prefetch"> & {
  className?: string;
  children: React.ReactNode;
  /** Extra elements to receive the prefetch trigger. */
  onMouseEnter?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLAnchorElement>) => void;
};

export default function PrefetchLink({
  href,
  className,
  children,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...rest
}: PrefetchLinkProps) {
  const prefetch = usePrefetchRoute();
  const target = typeof href === "string" ? href : "";

  return (
    <Link
      {...rest}
      href={href}
      className={className}
      onMouseEnter={(event) => {
        prefetch(target);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch(target);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        prefetch(target);
        onTouchStart?.(event);
      }}
    >
      {children}
    </Link>
  );
}
