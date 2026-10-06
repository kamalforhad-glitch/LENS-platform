import { describe, expect, it } from "vitest";
import { blogPostCreateSchema, contactSchema, parseDateOrNull } from "@/lib/schemas";

describe("contact API validation", () => {
  it("accepts valid submissions", () => {
    const r = contactSchema.safeParse({
      name: "Test User",
      email: "user@example.com",
      subject: "Hello",
      message: "This is a valid test message.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects short messages and bad emails", () => {
    expect(contactSchema.safeParse({ name: "A", email: "bad", subject: "x", message: "short" }).success).toBe(false);
  });
});

describe("blog whitelist schema", () => {
  it("strips unknown fields on update paths (mass-assignment guard)", () => {
    const parsed = blogPostCreateSchema.parse({ title: "T", hackerField: "x" } as unknown as Record<string, unknown>);
    expect((parsed as Record<string, unknown>).hackerField).toBeUndefined();
  });
});

describe("event date validation", () => {
  it("accepts ISO dates and rejects garbage", () => {
    expect(parseDateOrNull("2025-08-15")).toBeInstanceOf(Date);
    expect(parseDateOrNull("not-a-date")).toBeNull();
    expect(parseDateOrNull("")).toBeNull();
  });
});
