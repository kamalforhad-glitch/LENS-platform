// ============================================================
// ApiProvider — global SWR cache configuration.
//
// Mounted once in the root layout so every `useApiQuery` shares a
// single cache: navigating back to a view renders its last known
// payload immediately and revalidates in the background.
// ============================================================
"use client";

import { SWRConfig, type SWRConfigValue } from "swr";
import { API_CACHE_DEFAULTS } from "@/lib/api/client";

const config: SWRConfigValue = {
  ...API_CACHE_DEFAULTS,
  // Errors are surfaced per view (inline skeletons/retry) instead of
  // global retries that would keep the network busy during navigation.
  onErrorRetry: () => undefined,
};

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={config}>{children}</SWRConfig>;
}
