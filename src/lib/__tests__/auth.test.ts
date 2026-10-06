import { describe, expect, it } from "vitest";
import { requireAdmin, requireAuth, requireEditor } from "@/lib/auth";

const admin = { id: "1", email: "a@x.bd", name: "A", role: "admin" as const };
const editor = { id: "2", email: "e@x.bd", name: "E", role: "editor" as const };
const viewer = { id: "3", email: "v@x.bd", name: "V", role: "viewer" as const };

describe("admin API role hierarchy (GET viewer / POST+PUT editor / DELETE admin)", () => {
  it("rejects anonymous users", () => {
    expect(() => requireAuth(null)).toThrow("Unauthorized");
  });

  it("allows viewers to read but not mutate", () => {
    expect(requireAuth(viewer).id).toBe("3");
    expect(() => requireEditor(viewer)).toThrow("Forbidden");
    expect(() => requireAdmin(viewer)).toThrow("Forbidden");
  });

  it("allows editors to write but not delete", () => {
    expect(requireEditor(editor).id).toBe("2");
    expect(() => requireAdmin(editor)).toThrow("Forbidden");
  });

  it("allows admins everything", () => {
    expect(requireAdmin(admin).id).toBe("1");
  });
});
