import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  blog: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  program: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  career: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  resource: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  researcher: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mediaItem: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  revalidateHomeContent: vi.fn(),
  slugify: vi.fn((v: string) => String(v || "").toLowerCase().replace(/\s+/g, "-")),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
}));

vi.mock("@/lib/home-revalidation", () => ({
  revalidateHomeContent: mocks.revalidateHomeContent,
}));

vi.mock("@/lib/db", () => ({
  db: {
    blogPost: mocks.blog,
    program: mocks.program,
    career: mocks.career,
    resource: mocks.resource,
    researcherProfile: mocks.researcher,
    mediaItem: mocks.mediaItem,
  },
  slugify: mocks.slugify,
}));

let mockUser: { id: string; email: string; role: string } | null = {
  id: "user-1",
  email: "editor@lens.org.bd",
  role: "admin",
};

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => mockUser),
  requireAuth: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
  }),
  requireAdmin: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "admin" && user.role !== "super_admin") throw new Error("Forbidden");
  }),
  requireEditor: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
    if (!["admin", "super_admin", "editor"].includes(user.role)) throw new Error("Forbidden");
  }),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  AUDIT_ACTIONS: {
    CONTENT_CREATED: "content.created",
    CONTENT_UPDATED: "content.updated",
    CONTENT_DELETED: "content.deleted",
  },
}));

vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  return {
    ...actual,
    isRateLimited: vi.fn(() => false),
  };
});

import {
  POST as blogPOST,
  PUT as blogPUT,
  DELETE as blogDELETE,
} from "@/app/api/admin/blog/route";
import {
  POST as programPOST,
  PUT as programPUT,
} from "@/app/api/admin/programs/route";
import {
  POST as careerPOST,
  DELETE as careerDELETE,
} from "@/app/api/admin/careers/route";
import {
  POST as resourcePOST,
  PUT as resourcePUT,
  DELETE as resourceDELETE,
} from "@/app/api/admin/resources/route";
import {
  PUT as researcherPUT,
  DELETE as researcherDELETE,
} from "@/app/api/admin/researchers/route";
import {
  POST as mediaPOST,
  PUT as mediaPUT,
} from "@/app/api/admin/media-items/route";

function jsonReq(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin content cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1", email: "editor@lens.org.bd", role: "admin" };
  });

  describe("blog routes", () => {
    it("revalidates blog listing and detail paths on create", async () => {
      mocks.blog.create.mockResolvedValueOnce({ id: "b1", slug: "new-post", title: "New Post" });

      const res = await blogPOST(
        jsonReq("http://localhost/api/admin/blog", "POST", { title: "New Post", slug: "new-post" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidateHomeContent).toHaveBeenCalledWith(["public-blog"]);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog/new-post");
    });

    it("revalidates old and new blog detail paths on slug change", async () => {
      mocks.blog.findUnique.mockResolvedValueOnce({ slug: "old-post" });
      mocks.blog.update.mockResolvedValueOnce({ id: "b1", slug: "new-post", title: "Updated" });

      const res = await blogPUT(
        jsonReq("http://localhost/api/admin/blog", "PUT", { id: "b1", slug: "new-post", title: "Updated" })
      );

      expect(res.status).toBe(200);
      expect(mocks.blog.findUnique).toHaveBeenCalledWith({ where: { id: "b1" }, select: { slug: true } });
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog/old-post");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog/new-post");
    });

    it("revalidates blog listing and detail path on delete", async () => {
      mocks.blog.delete.mockResolvedValueOnce({ id: "b1", slug: "gone-post" });

      const res = await blogDELETE(
        jsonReq("http://localhost/api/admin/blog", "DELETE", { id: "b1" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/blog/gone-post");
    });
  });

  describe("program routes", () => {
    it("revalidates programs listing and detail path on create", async () => {
      mocks.program.create.mockResolvedValueOnce({ id: "p1", slug: "youth-program", title: "Youth" });

      const res = await programPOST(
        jsonReq("http://localhost/api/admin/programs", "POST", { title: "Youth", slug: "youth-program" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/programs");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/programs/youth-program");
    });

    it("revalidates old and new program detail paths on slug change", async () => {
      mocks.program.findUnique.mockResolvedValueOnce({ slug: "old-program" });
      mocks.program.update.mockResolvedValueOnce({ id: "p1", slug: "new-program" });

      const res = await programPUT(
        jsonReq("http://localhost/api/admin/programs", "PUT", { id: "p1", slug: "new-program" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/programs/old-program");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/programs/new-program");
    });
  });

  describe("career routes", () => {
    it("revalidates careers listing and detail path on delete", async () => {
      mocks.career.delete.mockResolvedValueOnce({ id: "c1", slug: "open-role" });

      const res = await careerDELETE(
        jsonReq("http://localhost/api/admin/careers", "DELETE", { id: "c1" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/careers");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/careers/open-role");
    });

    it("revalidates careers paths on create", async () => {
      mocks.career.create.mockResolvedValueOnce({ id: "c1", slug: "new-role", title: "Role" });
      const res = await careerPOST(
        jsonReq("http://localhost/api/admin/careers", "POST", { title: "Role", slug: "new-role" })
      );
      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/careers");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/careers/new-role");
    });
  });

  describe("resource routes", () => {
    it("revalidates old and new resource detail paths on slug change", async () => {
      mocks.resource.findUnique.mockResolvedValueOnce({ slug: "old-resource" });
      mocks.resource.update.mockResolvedValueOnce({ id: "r1", slug: "new-resource" });

      const res = await resourcePUT(
        jsonReq("http://localhost/api/admin/resources", "PUT", { id: "r1", slug: "new-resource" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/old-resource");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/new-resource");
    });

    it("revalidates resources paths on create and delete", async () => {
      mocks.resource.create.mockResolvedValueOnce({ id: "r1", slug: "guide", title: "Guide" });
      const createRes = await resourcePOST(
        jsonReq("http://localhost/api/admin/resources", "POST", { title: "Guide", slug: "guide" })
      );
      expect(createRes.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/guide");

      vi.clearAllMocks();
      mocks.resource.delete.mockResolvedValueOnce({ id: "r1", slug: "guide" });
      const deleteRes = await resourceDELETE(
        jsonReq("http://localhost/api/admin/resources", "DELETE", { id: "r1" })
      );
      expect(deleteRes.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/guide");
    });
  });

  describe("researcher routes", () => {
    it("revalidates old and new researcher detail paths on update", async () => {
      mocks.researcher.findUnique.mockResolvedValueOnce({ id: "u1", slug: "old-researcher", name: "Old" });
      mocks.researcher.update.mockResolvedValueOnce({ id: "u1", slug: "new-researcher", name: "New" });

      const res = await researcherPUT(
        jsonReq("http://localhost/api/admin/researchers", "PUT", { id: "u1", name: "New" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/researchers");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/researchers/old-researcher");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/researchers/new-researcher");
    });

    it("revalidates researcher listing and detail path on delete", async () => {
      mocks.researcher.delete.mockResolvedValueOnce({ id: "u1", slug: "researcher-slug", name: "Name" });

      const res = await researcherDELETE(
        jsonReq("http://localhost/api/admin/researchers", "DELETE", { id: "u1" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/researchers");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/researchers/researcher-slug");
    });
  });

  describe("media item routes", () => {
    it("revalidates media and resources/media listings and detail path on create", async () => {
      mocks.mediaItem.create.mockResolvedValueOnce({ id: "m1", slug: "press-item", title: "Press" });

      const res = await mediaPOST(
        jsonReq("http://localhost/api/admin/media-items", "POST", { title: "Press", slug: "press-item" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidateHomeContent).toHaveBeenCalledWith(["public-media"]);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/media");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/media");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/media/press-item");
    });

    it("revalidates old and new media detail paths on slug change", async () => {
      mocks.mediaItem.findUnique.mockResolvedValueOnce({ slug: "old-media" });
      mocks.mediaItem.update.mockResolvedValueOnce({ id: "m1", slug: "new-media", title: "Updated" });

      const res = await mediaPUT(
        jsonReq("http://localhost/api/admin/media-items", "PUT", { id: "m1", slug: "new-media" })
      );

      expect(res.status).toBe(200);
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/media/old-media");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/media/new-media");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/resources/media");
    });
  });
});
