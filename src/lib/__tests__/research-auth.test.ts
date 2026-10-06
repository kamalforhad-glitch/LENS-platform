import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishResearchArticle } from "@/lib/actions/research";
import type { AuthUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    researchArticle: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
  slugify: (value: string) => value,
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentUser: mocks.getCurrentUser };
});

const editor: AuthUser = { id: "u-editor", email: "e@x.bd", name: "E", role: "editor" };
const viewer: AuthUser = { id: "u-viewer", email: "v@x.bd", name: "V", role: "viewer" };

describe("publishResearchArticle authorization", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.findUnique.mockReset();
    mocks.update.mockReset();
    mocks.findUnique.mockResolvedValue({ id: "a1", version: 3 });
    mocks.update.mockResolvedValue({ id: "a1" });
  });

  it("rejects unauthenticated callers and never touches the database", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(publishResearchArticle("a1")).rejects.toThrow("Unauthorized");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects viewers (read-only role cannot publish)", async () => {
    mocks.getCurrentUser.mockResolvedValue(viewer);

    await expect(publishResearchArticle("a1")).rejects.toThrow("Forbidden");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows editors to publish", async () => {
    mocks.getCurrentUser.mockResolvedValue(editor);

    await expect(publishResearchArticle("a1")).resolves.toEqual({ success: true });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0]).toMatchObject({
      where: { id: "a1" },
      data: { status: "published" },
    });
  });
});
