import { describe, expect, it, vi, beforeEach } from "vitest";
import { sanitizeUrl } from "@/lib/cms-validation";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms-defaults";
import type { AuthUser } from "@/lib/auth";

type UserRole = AuthUser["role"];

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn((user: unknown) => user),
  requireEditor: vi.fn((user: unknown) => user),
  requireAdmin: vi.fn((user: unknown) => user),
}));

// Mock audit
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    SETTING_SAVED: "setting_saved",
    MENU_UPDATED: "menu_updated",
    MENU_DELETED: "menu_deleted",
  },
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    siteSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    menuItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSiteSettingsBulk, updateMenuItem, deleteMenuItem } from "@/lib/actions/cms";

// Helper functions mirroring SiteFooterClient resolution logic
function isSocialDisabled(val: string | undefined | null): boolean {
  if (val === undefined || val === null) return false;
  const trimmed = val.trim();
  return trimmed === "" || trimmed === "__DISABLED__" || trimmed.startsWith("__DISABLED__:");
}

function getCleanSocialUrl(val: string | undefined | null): string | null {
  if (!val) return null;
  const url = val.trim();
  if (url === "__DISABLED__" || url.startsWith("__DISABLED__:")) {
    return null;
  }
  const check = sanitizeUrl(url);
  return check.ok && check.url ? check.url : null;
}

function resolveSocialUrl(
  key: string,
  settings: Record<string, { value: string; valueBn: string }> | undefined,
  fallback: string,
  isBn = false
): string | null {
  const entry = settings?.[key];
  if (entry !== undefined) {
    const raw = isBn ? entry.valueBn || entry.value : entry.value;
    if (isSocialDisabled(raw)) {
      return null;
    }
    return getCleanSocialUrl(raw);
  }
  return getCleanSocialUrl(fallback);
}

function resolveFooterText(
  key: string,
  settings: Record<string, { value: string; valueBn: string }> | undefined,
  fallback: string,
  isBn = false
): string {
  const entry = settings?.[key];
  if (entry !== undefined) {
    const raw = isBn ? entry.valueBn || entry.value : entry.value;
    if (isSocialDisabled(raw)) {
      return "";
    }
    return raw.trim() ? raw : "";
  }
  return fallback;
}

describe("Social Media CMS Delete & Disable Controls", () => {
  const standardSettings: Record<string, { value: string; valueBn: string }> = {
    social_facebook: { value: "https://www.facebook.com/lensorgbd", valueBn: "https://www.facebook.com/lensorgbd" },
    social_twitter: { value: "https://twitter.com/lensorgbd", valueBn: "https://twitter.com/lensorgbd" },
    social_linkedin: { value: "https://www.linkedin.com/company/lensorgbd", valueBn: "https://www.linkedin.com/company/lensorgbd" },
    social_youtube: { value: "https://www.youtube.com/@lensorgbd", valueBn: "https://www.youtube.com/@lensorgbd" },
    social_rss: { value: "/rss.xml", valueBn: "/rss.xml" },
  };

  it("renders all 5 configured social platforms when all are active", () => {
    const fb = resolveSocialUrl("social_facebook", standardSettings, "https://www.facebook.com/lensorgbd");
    const tw = resolveSocialUrl("social_twitter", standardSettings, "https://twitter.com/lensorgbd");
    const li = resolveSocialUrl("social_linkedin", standardSettings, "https://www.linkedin.com/company/lensorgbd");
    const yt = resolveSocialUrl("social_youtube", standardSettings, "https://www.youtube.com/@lensorgbd");
    const rss = resolveSocialUrl("social_rss", standardSettings, "/rss.xml");

    expect(fb).toBe("https://www.facebook.com/lensorgbd");
    expect(tw).toBe("https://twitter.com/lensorgbd");
    expect(li).toBe("https://www.linkedin.com/company/lensorgbd");
    expect(yt).toBe("https://www.youtube.com/@lensorgbd");
    expect(rss).toBe("/rss.xml");
  });

  it("removes Facebook independently while leaving all other platforms completely intact", () => {
    const updatedSettings = {
      ...standardSettings,
      social_facebook: { value: "", valueBn: "" }, // Admin cleared/removed Facebook
    };

    const fb = resolveSocialUrl("social_facebook", updatedSettings, "https://www.facebook.com/lensorgbd");
    const tw = resolveSocialUrl("social_twitter", updatedSettings, "https://twitter.com/lensorgbd");
    const li = resolveSocialUrl("social_linkedin", updatedSettings, "https://www.linkedin.com/company/lensorgbd");
    const yt = resolveSocialUrl("social_youtube", updatedSettings, "https://www.youtube.com/@lensorgbd");
    const rss = resolveSocialUrl("social_rss", updatedSettings, "/rss.xml");

    // Facebook must be null (no broken link, no icon)
    expect(fb).toBeNull();

    // All others remain unaffected
    expect(tw).toBe("https://twitter.com/lensorgbd");
    expect(li).toBe("https://www.linkedin.com/company/lensorgbd");
    expect(yt).toBe("https://www.youtube.com/@lensorgbd");
    expect(rss).toBe("/rss.xml");
  });

  it("does NOT resurrect default Facebook URL when Facebook is explicitly cleared or disabled", () => {
    // When value is empty string, the fallback default must NOT be used
    const cleared = {
      social_facebook: { value: "   ", valueBn: "" },
    };
    expect(resolveSocialUrl("social_facebook", cleared, "https://www.facebook.com/lensorgbd")).toBeNull();

    // When value is marked __DISABLED__, fallback must NOT be used
    const disabled = {
      social_facebook: { value: "__DISABLED__", valueBn: "__DISABLED__" },
    };
    expect(resolveSocialUrl("social_facebook", disabled, "https://www.facebook.com/lensorgbd")).toBeNull();

    // When value has preserved URL under __DISABLED__:, fallback must NOT be used
    const softDisabled = {
      social_facebook: {
        value: "__DISABLED__:https://www.facebook.com/custom-page",
        valueBn: "__DISABLED__:https://www.facebook.com/custom-page",
      },
    };
    expect(resolveSocialUrl("social_facebook", softDisabled, "https://www.facebook.com/lensorgbd")).toBeNull();
  });

  it("preserves URL when soft-disabled and allows seamless restore/re-enable", () => {
    const customUrl = "https://www.facebook.com/my-custom-org";
    const softDisabledValue = `__DISABLED__:${customUrl}`;

    // While disabled:
    expect(isSocialDisabled(softDisabledValue)).toBe(true);
    expect(getCleanSocialUrl(softDisabledValue)).toBeNull();

    // When admin toggles "Enable", the prefix is stripped:
    const reEnabledValue = softDisabledValue.slice("__DISABLED__:".length);
    expect(isSocialDisabled(reEnabledValue)).toBe(false);
    expect(getCleanSocialUrl(reEnabledValue)).toBe(customUrl);

    // Or when admin restores default from DEFAULT_SITE_SETTINGS:
    const defaultDef = DEFAULT_SITE_SETTINGS.find((d) => d.key === "social_facebook");
    expect(defaultDef).toBeDefined();
    expect(getCleanSocialUrl(defaultDef!.value)).toBe("https://www.facebook.com/lensorgbd");
  });

  it("handles completely empty social configuration safely without broken links or icons", () => {
    const emptySettings: Record<string, { value: string; valueBn: string }> = {
      social_facebook: { value: "", valueBn: "" },
      social_twitter: { value: "", valueBn: "" },
      social_linkedin: { value: "", valueBn: "" },
      social_youtube: { value: "", valueBn: "" },
      social_rss: { value: "", valueBn: "" },
    };

    const keys = ["social_facebook", "social_twitter", "social_linkedin", "social_youtube", "social_rss"];
    const results = keys.map((k) => resolveSocialUrl(k, emptySettings, "https://fallback.com"));

    // Every single one is null
    expect(results.every((r) => r === null)).toBe(true);

    // Filtered list of socials has length 0
    const activeSocials = results.filter((r): r is string => r !== null);
    expect(activeSocials.length).toBe(0);
  });

  it("strictly validates and rejects malicious social URLs (XSS protection)", () => {
    const attackSettings = {
      social_facebook: { value: "javascript:alert(document.cookie)", valueBn: "" },
      social_twitter: { value: "data:text/html,<script>alert(1)</script>", valueBn: "" },
      social_linkedin: { value: "https://linkedin.com/good", valueBn: "" },
    };

    expect(resolveSocialUrl("social_facebook", attackSettings, "")).toBeNull();
    expect(resolveSocialUrl("social_twitter", attackSettings, "")).toBeNull();
    expect(resolveSocialUrl("social_linkedin", attackSettings, "")).toBe("https://linkedin.com/good");
  });
});

describe("Footer Content CMS Delete & Disable Controls", () => {
  it("resolves active footer description and copyright correctly", () => {
    const settings = {
      footer_description: {
        value: "Custom English footer text",
        valueBn: "কাস্টম বাংলা ফুটার টেক্সট",
      },
      footer_copyright: {
        value: "© 2026 Custom Copyright",
        valueBn: "© ২০২৬ কাস্টম কপিরাইট",
      },
    };

    expect(resolveFooterText("footer_description", settings, "Default Text", false)).toBe("Custom English footer text");
    expect(resolveFooterText("footer_description", settings, "Default Text", true)).toBe("কাস্টম বাংলা ফুটার টেক্সট");
    expect(resolveFooterText("footer_copyright", settings, "Default Copyright", false)).toBe("© 2026 Custom Copyright");
    expect(resolveFooterText("footer_copyright", settings, "Default Copyright", true)).toBe("© ২০২৬ কাস্টম কপিরাইট");
  });

  it("removes footer description when cleared or disabled without resurrecting fallback", () => {
    const disabledSettings = {
      footer_description: {
        value: "__DISABLED__",
        valueBn: "",
      },
      footer_copyright: {
        value: "© 2026 LENS",
        valueBn: "",
      },
    };

    expect(resolveFooterText("footer_description", disabledSettings, "Default Description")).toBe("");
    // Unrelated footer items remain intact
    expect(resolveFooterText("footer_copyright", disabledSettings, "Default Copyright")).toBe("© 2026 LENS");
  });

  it("removes footer copyright when cleared without affecting footer description", () => {
    const settings = {
      footer_description: {
        value: "Active Description",
        valueBn: "",
      },
      footer_copyright: {
        value: "",
        valueBn: "",
      },
    };

    expect(resolveFooterText("footer_description", settings, "Default")).toBe("Active Description");
    expect(resolveFooterText("footer_copyright", settings, "Default")).toBe("");
  });
});

describe("Footer Navigation Menu Item Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "admin-1", role: "admin" as UserRole } as never);
  });

  it("soft-disables a footer menu item by setting visible: false without deleting it", async () => {
    vi.mocked(db.menuItem.update).mockResolvedValueOnce({
      id: "menu-footer-1",
      location: "footer",
      label: "Research Briefs",
      labelBn: "গবেষণা ব্রিফ",
      url: "/research",
      visible: false,
      sortOrder: 1,
    } as never);

    const updated = await updateMenuItem("menu-footer-1", { visible: false });
    expect(updated.visible).toBe(false);
    expect(db.menuItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "menu-footer-1" },
        data: expect.objectContaining({ visible: false }),
      })
    );
  });

  it("deletes a footer menu item and detaches children to prevent orphaning", async () => {
    vi.mocked(db.menuItem.updateMany).mockResolvedValueOnce({ count: 2 });
    vi.mocked(db.menuItem.delete).mockResolvedValueOnce({
      id: "menu-col-1",
      location: "footer",
      label: "Focus Areas",
    } as never);

    const deleted = await deleteMenuItem("menu-col-1");
    expect(deleted.id).toBe("menu-col-1");
    expect(db.menuItem.updateMany).toHaveBeenCalledWith({
      where: { parentId: "menu-col-1" },
      data: { parentId: null },
    });
    expect(db.menuItem.delete).toHaveBeenCalledWith({
      where: { id: "menu-col-1" },
    });
  });
});

describe("Auth & Setting Key Validation Safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks unauthenticated users with Unauthorized error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(
      updateSiteSettingsBulk([{ key: "social_facebook", value: "https://facebook.com/lens" }])
    ).rejects.toThrow("Unauthorized");

    await expect(updateMenuItem("item-1", { visible: false })).rejects.toThrow("Unauthorized");
    await expect(deleteMenuItem("item-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects invalid site setting keys with invalid characters when authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "editor-1", role: "editor" as UserRole } as never);

    await expect(
      updateSiteSettingsBulk([
        {
          key: "INVALID KEY WITH SPACES!",
          value: "some-value",
        },
      ])
    ).rejects.toThrow("Invalid setting key");
  });

  it("validates and accepts proper social and footer setting keys when authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "editor-1", role: "editor" as UserRole } as never);
    vi.mocked(db.siteSetting.upsert).mockResolvedValue({} as never);

    const validKeys = [
      "social_facebook",
      "social_twitter",
      "social_linkedin",
      "social_youtube",
      "social_rss",
      "footer_description",
      "footer_copyright",
    ];

    const result = await updateSiteSettingsBulk(
      validKeys.map((key) => ({ key, value: "test" }))
    );

    expect(result.success).toBe(true);
    expect(db.siteSetting.upsert).toHaveBeenCalledTimes(validKeys.length);
  });
});
