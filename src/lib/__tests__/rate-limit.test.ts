import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeRateLimit,
  clearRateLimit,
  loginRateLimit,
  clearLoginRateLimit,
  __setRateLimitClock,
  __resetRateLimits,
  LOGIN_LIMIT,
} from "@/lib/rate-limit";

let now = 1_700_000_000_000;
beforeEach(() => {
  now = 1_700_000_000_000;
  __setRateLimitClock(() => now);
  __resetRateLimits();
});

describe("consumeRateLimit", () => {
  it("allows up to the limit within a window", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) {
      const r = consumeRateLimit("k", LOGIN_LIMIT, 60_000);
      expect(r.allowed, `attempt ${i + 1}`).toBe(true);
    }
    const blocked = consumeRateLimit("k", LOGIN_LIMIT, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.attemptsLeft).toBe(0);
  });

  it("retries after the sliding window passes", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) consumeRateLimit("k", 2, 60_000);
    expect(consumeRateLimit("k", 2, 60_000).allowed).toBe(false);
    now += 30_000; // half the window: oldest entry still counted
    expect(consumeRateLimit("k", 2, 60_000).allowed).toBe(false);
    now += 31_000; // all entries aged out
    expect(consumeRateLimit("k", 2, 60_000).allowed).toBe(true);
  });

  it("keys are independent", () => {
    consumeRateLimit("a", 1, 60_000);
    expect(consumeRateLimit("b", 1, 60_000).allowed).toBe(true);
  });

  it("clearRateLimit resets the key", () => {
    consumeRateLimit("k", 1, 60_000);
    clearRateLimit("k");
    expect(consumeRateLimit("k", 1, 60_000).allowed).toBe(true);
  });
});

describe("loginRateLimit", () => {
  it("blocks after five failures for same ip+email", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) loginRateLimit("1.1.1.1", "a@lens.org.bd");
    expect(loginRateLimit("1.1.1.1", "a@lens.org.bd").allowed).toBe(false);
  });

  it("email is normalized (case/whitespace insensitive)", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) loginRateLimit("1.1.1.1", "A@LENS.org.bd");
    expect(loginRateLimit("1.1.1.1", " a@lens.org.bd ").allowed).toBe(false);
  });

  it("different IPs are separate buckets", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) loginRateLimit("1.1.1.1", "a@lens.org.bd");
    expect(loginRateLimit("2.2.2.2", "a@lens.org.bd").allowed).toBe(true);
  });

  it("clearLoginRateLimit resets a successful login", () => {
    for (let i = 0; i < LOGIN_LIMIT; i++) loginRateLimit("1.1.1.1", "a@lens.org.bd");
    expect(loginRateLimit("1.1.1.1", "a@lens.org.bd").allowed).toBe(false);
    clearLoginRateLimit("1.1.1.1", "a@lens.org.bd");
    expect(loginRateLimit("1.1.1.1", "a@lens.org.bd").allowed).toBe(true);
  });
});
