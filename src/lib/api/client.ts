// ============================================================
// Client data layer — cached GETs, abortable requests and
// optimistic mutations.
//
// Everything the browser fetches with GET goes through
// `useApiQuery` so that:
//
//   1. the first response is cached by key (SWR) and a returning
//      view paints instantly from cache while revalidating in the
//      background — no "Loading…" flash on back-navigation;
//   2. only one request per key is in flight (SWR deduplication);
//   3. in-flight requests are cancelled through an AbortController
//      when a hook unmounts or its key changes (rapid tab/filter
//      switching never lets a stale response win.
//
// Mutations go through `useApiMutation`, which owns pending/error
// state and lets callers apply optimistic updates before the
// round trip starts.
// ============================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";

/** True when an error is the deliberate cancellation of a request. */
export function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError";
}

/**
 * JSON GET fetcher. `signal` is supplied by `useApiQuery` so the
 * underlying request can be cancelled when it becomes redundant.
 */
export async function jsonFetcher<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return (await response.json()) as T;
}

/**
 * Cache-first defaults: returning to a view shows cached data
 * immediately and revalidates in the background.
 */
export const API_CACHE_DEFAULTS = {
  revalidateIfStale: true,
  revalidateOnMount: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30_000,
  keepPreviousData: true,
  shouldRetryOnError: false,
} as const;

export type UseApiQueryOptions<T> = Omit<SWRConfiguration<T, Error>, "fetcher">;

/**
 * Cached, abortable GET hook.
 *
 * @param key request URL, or `null` to skip the request.
 */
export function useApiQuery<T>(key: string | null, options?: UseApiQueryOptions<T>): SWRResponse<T, Error> {
  const lastData = useRef<T | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);

  const fetcher = useCallback(async (url: string) => {
    // Cancel the previous request of this hook: it is either for an
    // older key (stale) or superseded by a newer revalidation.
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const data = await jsonFetcher<T>(url, abort.signal);
      lastData.current = data;
      return data;
    } catch (error) {
      if (isAbortError(error)) {
        // Deliberate cancellation: resolve with the last good payload so
        // SWR keeps the cached data and never records an error state for
        // a request we chose to drop.
        return lastData.current as T;
      }
      throw error;
    }
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  return useSWR<T>(key, fetcher, { ...API_CACHE_DEFAULTS, ...options });
}

export type MutationResult<TOutput> =
  | { ok: true; data: TOutput }
  | { ok: false; error: Error | null };

export type UseApiMutationOptions<TInput, TOutput> = {
  onSuccess?: (data: TOutput, input: TInput) => void;
  onError?: (error: Error, input: TInput) => void;
};

/**
 * Mutation hook with its own pending/error state and automatic
 * cancellation of superseded requests.
 */
export function useApiMutation<TInput, TOutput>(
  run: (input: TInput, signal: AbortSignal) => Promise<TOutput>,
  options?: UseApiMutationOptions<TInput, TOutput>,
): {
  mutate: (input: TInput) => Promise<MutationResult<TOutput>>;
  isPending: boolean;
  error: string | null;
  reset: () => void;
} {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  const mutate = useCallback(
    async (input: TInput): Promise<MutationResult<TOutput>> => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      if (mounted.current) {
        setPending(true);
        setError(null);
      }
      try {
        const data = await run(input, abort.signal);
        if (mounted.current) {
          setPending(false);
          setError(null);
        }
        optionsRef.current?.onSuccess?.(data, input);
        return { ok: true, data };
      } catch (caught) {
        if (isAbortError(caught)) return { ok: false, error: null };
        const failure = caught instanceof Error ? caught : new Error(String(caught));
        if (mounted.current) {
          setPending(false);
          setError(failure.message);
        }
        optionsRef.current?.onError?.(failure, input);
        return { ok: false, error: failure };
      }
    },
    [run],
  );

  const reset = useCallback(() => {
    setError(null);
    setPending(false);
  }, []);

  return { mutate, isPending, error, reset };
}
