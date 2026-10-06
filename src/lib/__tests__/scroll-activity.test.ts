import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isScrollActive,
  markScrollActive,
  subscribeScrollActivity,
} from "@/lib/scroll-activity";

describe("scroll-activity signal (canvas pause coordination)", () => {
  beforeEach(() => {
    // Module guards browser APIs for SSR; tests run in node env.
    vi.stubGlobal("window", {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Settle any pending debounce so tests never leak active state.
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    expect(isScrollActive()).toBe(false);
  });

  it("is inactive initially", () => {
    expect(isScrollActive()).toBe(false);
  });

  it("activates on scroll and settles ~150ms after the last tick", () => {
    markScrollActive();
    expect(isScrollActive()).toBe(true);
    vi.advanceTimersByTime(100);
    markScrollActive(); // second tick resets the settle window
    vi.advanceTimersByTime(149);
    expect(isScrollActive()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isScrollActive()).toBe(false);
  });

  it("notifies subscribers only on transitions (no per-tick spam)", () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeScrollActivity((v) => seen.push(v));
    markScrollActive();
    markScrollActive();
    markScrollActive();
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([true, false]);
    unsubscribe();
    markScrollActive();
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([true, false]);
  });
});
