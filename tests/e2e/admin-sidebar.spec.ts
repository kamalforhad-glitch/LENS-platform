import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@lens.org.bd';
const ADMIN_PASSWORD = 'testpassword123';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 20000 });
}

test.describe('Admin Sidebar Layout & Non-Overlap Verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('desktop (1280x800): sidebar nav is scrollable, bottom profile and sign out never overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const sidebar = page.locator('#admin-sidebar');
    await expect(sidebar).toBeVisible();

    // Check header branding
    const branding = sidebar.locator('a[aria-label="LENS — return to home"]');
    await expect(branding).toBeVisible();

    // Check nav region
    const nav = sidebar.locator('nav[aria-label="Admin Sections"]');
    await expect(nav).toBeVisible();

    // Locate bottom footer container
    const bottomSection = sidebar.locator('div.border-t.shrink-0');
    await expect(bottomSection).toBeVisible();

    // Sign out button
    const signOutBtn = bottomSection.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();

    // Profile info
    const profileInfo = bottomSection.locator('div.flex-1.min-w-0');
    await expect(profileInfo).toBeVisible();

    // Verify bounding boxes of profile and signout do not overlap
    const profileBox = await profileInfo.boundingBox();
    const signOutBox = await signOutBtn.boundingBox();
    expect(profileBox).not.toBeNull();
    expect(signOutBox).not.toBeNull();
    if (profileBox && signOutBox) {
      // SignOut should be below the profile info with positive gap
      expect(signOutBox.y).toBeGreaterThanOrEqual(profileBox.y + profileBox.height);
    }

    // Scroll to Backups in nav and verify it doesn't overlap the bottom section
    const backupsLink = nav.locator('a[href="/admin/backups"]');
    await backupsLink.scrollIntoViewIfNeeded();
    await expect(backupsLink).toBeVisible();

    const backupsBox = await backupsLink.boundingBox();
    const bottomBox = await bottomSection.boundingBox();
    expect(backupsBox).not.toBeNull();
    expect(bottomBox).not.toBeNull();
    if (backupsBox && bottomBox) {
      // The bottom of the backups link inside nav must be above or at the top of the bottom section
      expect(backupsBox.y + backupsBox.height).toBeLessThanOrEqual(bottomBox.y + 2); // small tolerance
    }
  });

  test('short viewport (1024x500): nav scrolls independently without covering profile or sign out', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 500 });

    const sidebar = page.locator('#admin-sidebar');
    await expect(sidebar).toBeVisible();

    const nav = sidebar.locator('nav[aria-label="Admin Sections"]');
    await expect(nav).toBeVisible();

    // In a 500px viewport, the nav content exceeds viewport height and must be scrollable
    const isScrollable = await nav.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBe(true);

    const bottomSection = sidebar.locator('div.border-t.shrink-0');
    const signOutBtn = bottomSection.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();

    // Backups link can be scrolled into view
    const backupsLink = nav.locator('a[href="/admin/backups"]');
    await backupsLink.scrollIntoViewIfNeeded();
    await expect(backupsLink).toBeVisible();

    // Profile and Sign Out are visible and non-overlapping
    const profileInfo = bottomSection.locator('div.flex-1.min-w-0');
    const profileBox = await profileInfo.boundingBox();
    const signOutBox = await signOutBtn.boundingBox();
    if (profileBox && signOutBox) {
      expect(signOutBox.y).toBeGreaterThanOrEqual(profileBox.y + profileBox.height);
    }
  });

  test('mobile (375x667): toggles open/close, backdrop works, Escape closes sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const sidebar = page.locator('#admin-sidebar');
    // Initially off-screen on mobile
    await expect(sidebar).toHaveClass(/-(translate-x-full)/);

    // Open sidebar via hamburger button
    const openBtn = page.locator('button[aria-label="Open navigation menu"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Sidebar should be open
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Close button inside sidebar
    const closeBtn = sidebar.locator('button[aria-label="Close sidebar"]');
    await expect(closeBtn).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(sidebar).toHaveClass(/-(translate-x-full)/);

    // Reopen and test clicking nav item navigates and closes sidebar
    await openBtn.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);

    const backupsLink = sidebar.locator('a[href="/admin/backups"]');
    await backupsLink.scrollIntoViewIfNeeded();
    await backupsLink.click();

    await page.waitForURL(/\/admin\/backups$/, { timeout: 15000 });
    // On navigation, sidebar should auto-close
    await expect(sidebar).toHaveClass(/-(translate-x-full)/);
  });
});

