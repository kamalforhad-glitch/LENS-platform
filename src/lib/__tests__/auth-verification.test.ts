import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import {
  hashPassword,
  verifyPassword,
  loginUser,
  requireAuth,
  requireSuperAdmin,
  requireAdmin,
  requireEditor,
  roleAtLeast,
  type AuthUser,
} from "@/lib/auth";

// Hoisted mocks for database, cookies, and audit
process.env.JWT_SECRET = "test-jwt-secret-min-32-chars-for-test-environment";

const dbMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  sessionCreate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  transaction: vi.fn((cb: any) => cb({
    session: { create: dbMocks.sessionCreate },
    user: { update: dbMocks.userUpdate },
  })),
}));

const cookieStoreMock = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(cookieStoreMock),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: dbMocks.userFindUnique,
      update: dbMocks.userUpdate,
    },
    session: {
      create: dbMocks.sessionCreate,
      deleteMany: dbMocks.sessionDeleteMany,
    },
    $transaction: dbMocks.transaction,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    LOGIN_SUCCESS: "account.login_success",
    LOGIN_FAILED: "account.login_failed",
  },
}));

describe("Authentication & Credential Verification Logic", () => {
  const testPassword = "SuperSecretPassword123!";
  const validHash = bcrypt.hashSync(testPassword, 12);

  const mockAdminUser = {
    id: "usr-admin-123",
    email: "admin@lens.org.bd",
    name: "LENS Admin",
    passwordHash: validHash,
    role: "super_admin",
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing & Verification", () => {
    it("hashes password with bcrypt using 12 rounds", () => {
      const hash = hashPassword("TestPass123!");
      expect(typeof hash).toBe("string");
      expect(hash.startsWith("$2")).toBe(true);
      expect(hash.length).toBe(60);
      expect(bcrypt.getRounds(hash)).toBe(12);
    });

    it("verifies valid password against bcrypt hash", () => {
      const hash = hashPassword("TestPass123!");
      expect(verifyPassword("TestPass123!", hash)).toBe(true);
    });

    it("rejects incorrect password against bcrypt hash", () => {
      const hash = hashPassword("TestPass123!");
      expect(verifyPassword("WrongPassword!", hash)).toBe(false);
    });
  });

  describe("loginUser credential verification and normalization", () => {
    it("succeeds with valid credentials and sets session cookie", async () => {
      dbMocks.userFindUnique.mockResolvedValue(mockAdminUser);
      dbMocks.sessionCreate.mockResolvedValue({ id: "sess-1" });
      dbMocks.userUpdate.mockResolvedValue({ id: mockAdminUser.id });

      const result = await loginUser("admin@lens.org.bd", testPassword);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: "usr-admin-123",
        email: "admin@lens.org.bd",
        name: "LENS Admin",
        role: "super_admin",
      });
      expect(dbMocks.userFindUnique).toHaveBeenCalledWith({
        where: { email: "admin@lens.org.bd" },
      });
      expect(cookieStoreMock.set).toHaveBeenCalledTimes(1);
    });

    it("normalizes email with uppercase letters and whitespace", async () => {
      dbMocks.userFindUnique.mockResolvedValue(mockAdminUser);
      dbMocks.sessionCreate.mockResolvedValue({ id: "sess-1" });
      dbMocks.userUpdate.mockResolvedValue({ id: mockAdminUser.id });

      const result = await loginUser("   Admin@LENS.org.bd   ", testPassword);

      expect(result.success).toBe(true);
      expect(dbMocks.userFindUnique).toHaveBeenCalledWith({
        where: { email: "admin@lens.org.bd" },
      });
    });

    it("fails with incorrect password and does not create session", async () => {
      dbMocks.userFindUnique.mockResolvedValue(mockAdminUser);

      const result = await loginUser("admin@lens.org.bd", "WrongPassword999!");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email or password");
      expect(cookieStoreMock.set).not.toHaveBeenCalled();
      expect(dbMocks.sessionCreate).not.toHaveBeenCalled();
    });

    it("fails with unknown email and does not create session", async () => {
      dbMocks.userFindUnique.mockResolvedValue(null);

      const result = await loginUser("nobody@lens.org.bd", testPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email or password");
      expect(cookieStoreMock.set).not.toHaveBeenCalled();
      expect(dbMocks.sessionCreate).not.toHaveBeenCalled();
    });

    it("rejects deactivated/inactive users", async () => {
      dbMocks.userFindUnique.mockResolvedValue({
        ...mockAdminUser,
        active: false,
      });

      const result = await loginUser("admin@lens.org.bd", testPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Account disabled. Contact a Super Admin.");
      expect(cookieStoreMock.set).not.toHaveBeenCalled();
      expect(dbMocks.sessionCreate).not.toHaveBeenCalled();
    });
  });

  describe("Role Hierarchy & Route Protection", () => {
    const superAdmin: AuthUser = { id: "1", email: "sa@lens.org.bd", name: "SA", role: "super_admin" };
    const admin: AuthUser = { id: "2", email: "a@lens.org.bd", name: "A", role: "admin" };
    const editor: AuthUser = { id: "3", email: "e@lens.org.bd", name: "E", role: "editor" };
    const viewer: AuthUser = { id: "4", email: "v@lens.org.bd", name: "V", role: "viewer" };

    it("rejects unauthenticated users", () => {
      expect(() => requireAuth(null)).toThrow("Unauthorized");
      expect(() => requireSuperAdmin(null)).toThrow("Unauthorized");
      expect(() => requireAdmin(null)).toThrow("Unauthorized");
      expect(() => requireEditor(null)).toThrow("Unauthorized");
    });

    it("enforces super_admin role exclusively", () => {
      expect(requireSuperAdmin(superAdmin).id).toBe("1");
      expect(() => requireSuperAdmin(admin)).toThrow("Forbidden");
      expect(() => requireSuperAdmin(editor)).toThrow("Forbidden");
      expect(() => requireSuperAdmin(viewer)).toThrow("Forbidden");
    });

    it("enforces admin role for admin and above", () => {
      expect(requireAdmin(superAdmin).id).toBe("1");
      expect(requireAdmin(admin).id).toBe("2");
      expect(() => requireAdmin(editor)).toThrow("Forbidden");
      expect(() => requireAdmin(viewer)).toThrow("Forbidden");
    });

    it("enforces editor role for editor and above", () => {
      expect(requireEditor(superAdmin).id).toBe("1");
      expect(requireEditor(admin).id).toBe("2");
      expect(requireEditor(editor).id).toBe("3");
      expect(() => requireEditor(viewer)).toThrow("Forbidden");
    });

    it("roleAtLeast helper computes hierarchical levels correctly", () => {
      expect(roleAtLeast(superAdmin, "super_admin")).toBe(true);
      expect(roleAtLeast(superAdmin, "admin")).toBe(true);
      expect(roleAtLeast(superAdmin, "editor")).toBe(true);
      expect(roleAtLeast(superAdmin, "viewer")).toBe(true);

      expect(roleAtLeast(admin, "super_admin")).toBe(false);
      expect(roleAtLeast(admin, "admin")).toBe(true);
      expect(roleAtLeast(admin, "editor")).toBe(true);

      expect(roleAtLeast(editor, "admin")).toBe(false);
      expect(roleAtLeast(editor, "editor")).toBe(true);

      expect(roleAtLeast(viewer, "editor")).toBe(false);
      expect(roleAtLeast(viewer, "viewer")).toBe(true);

      expect(roleAtLeast(null, "viewer")).toBe(false);
    });
  });
});
