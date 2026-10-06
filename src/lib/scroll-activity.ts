// ============================================================
// Scroll-activity signal for scroll-aware canvas rendering.
//
// While the user is actively scrolling, the globe and map canvases pause
// their animation work (bitmap persists — no flash, no reset); full
// rendering resumes ~150ms after the last scroll event. Animation clocks
// are time-based (map) or frozen with the frameloop (globe), so resume is
// jump-free. Single module timer — no leaks; no-ops on the server.
// ============================================================

const SETTLE_MS = 150;

let active = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(scrolling: boolean) => void>();

function setActive(value: boolean): void {
  if (active === value) return;
  active = value;
  listeners.forEach((fn) => fn(value));
}

/** Call on every scroll tick (e.g. Lenis scroll event). Cheap: no-op-ish. */
export function markScrollActive(): void {
  if (typeof window === "undefined") return;
  setActive(true);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    setActive(false);
  }, SETTLE_MS);
}

/** True while scroll input/animation is in flight (plus settle window). */
export function isScrollActive(): boolean {
  return active;
}

/** Subscribe for React-driven pause (e.g. R3F frameloop). Returns unsubscribe. */
export function subscribeScrollActivity(fn: (scrolling: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
