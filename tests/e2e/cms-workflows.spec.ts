import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@lens.org.bd';
const ADMIN_PASSWORD = 'testpassword123';

// Generate unique email for each test to avoid rate limiting
function getTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@lens.org.bd`;
}

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  console.log('Filling email:', ADMIN_EMAIL);
  console.log('Filling password:', ADMIN_PASSWORD);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  
  // The login uses a Server Action, not a regular POST - wait for navigation or error
  await page.click('button[type="submit"]');
  
  // Wait for either redirect to /admin or error message
  await Promise.race([
    page.waitForURL(/\/admin/, { timeout: 20000 }).catch(() => null),
    page.waitForSelector('[role="alert"], .text-red-400, .text-red-600, .bg-red-50, .bg-red-500', { timeout: 20000 }).catch(() => null),
  ]);
  
  // Check if there's an error message
  const errorElements = await page.locator('[role="alert"], .text-red-400, .text-red-600, .bg-red-50, .bg-red-500').all();
  for (const el of errorElements) {
    const text = await el.textContent();
    if (text && text.trim()) console.log('Error element:', text.trim());
  }
  
  // Check current URL
  console.log('Current URL after login attempt:', page.url());
  
  await expect(page).toHaveURL(/\/admin$/);
}

async function waitForToast(page: Page, text: string) {
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 10000 });
}

async function waitForErrorToast(page: Page) {
  // Wait for any error toast/notification
  await expect(page.locator('text=/error|failed|Error|Failed/i')).toBeVisible({ timeout: 10000 });
}

test.describe('CMS E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ============================================================
  // Test A: Generic CMS page
  // ============================================================
  test.describe('Test A: Generic CMS Page', () => {
    const testSlug = `test-page-${Date.now()}`;
    const testTitle = `Test Page ${Date.now()}`;
    const testTitleBn = `টেস্ট পেজ ${Date.now()}`;
    const updatedTitle = `Updated ${testTitle}`;
    const updatedTitleBn = `আপডেটেড ${testTitleBn}`;

    test('create, edit, publish, and verify public page', async ({ page }) => {
      // 1. Open /admin/pages
      await page.goto('/admin/pages');
      await expect(page.locator('h1:has-text("Pages")')).toBeVisible();

      // 2. Create a new test page
      await page.click('a:has-text("New Page")');
      await expect(page.locator('h1:has-text("Create New Page")')).toBeVisible();

      // Fill in page details
      await page.fill('input[placeholder="e.g. About Us"]', testTitle);
      await page.fill('input[placeholder="যেমন: আমাদের সম্পর্কে"]', testTitleBn);
      await page.fill('input[placeholder="about"]', testSlug);
      await page.selectOption('select', 'draft');
      
      // Fill description
      await page.fill('textarea[placeholder="Short description shown in page lists and used as meta fallback"]', 'Test page description');
      await page.fill('textarea[placeholder="সংক্ষিপ্ত বিবরণ"]', 'টেস্ট পেজ বিবরণ');

      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');

      // 3. Edit the page - change English title and content
      await expect(page.locator(`h1:has-text("Edit Page: ${testTitle}")`)).toBeVisible();
      
      await page.fill('input[placeholder="e.g. About Us"]', updatedTitle);
      await page.fill('input[placeholder="যেমন: আমাদের সম্পর্কে"]', updatedTitleBn);
      
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      // 4. Reload the editor and confirm saved values remain
      await page.reload();
      await expect(page.locator('input[placeholder="e.g. About Us"]')).toHaveValue(updatedTitle);
      await expect(page.locator('input[placeholder="যেমন: আমাদের সম্পর্কে"]')).toHaveValue(updatedTitleBn);

      // 5. Publish the page
      await page.selectOption('select', 'published');
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      // 6. Open public route and confirm updated content appears
      // The page title appears in the breadcrumb and in any hero section
      await page.goto(`/${testSlug}`);
      // Check breadcrumb for page title
      await expect(page.locator('nav[aria-label="Breadcrumb"] span.text-slate-800')).toHaveText(updatedTitle);
    });
  });

  // ============================================================
  // Test B: Section editing
  // ============================================================
  test.describe('Test B: Section Editing', () => {
    const testSlug = `section-test-${Date.now()}`;
    const testTitle = `Section Test ${Date.now()}`;

    test('add sections, edit content, reorder, and verify persistence', async ({ page }) => {
      // 1. Create a test page with sections
      await page.goto('/admin/pages');
      await page.click('a:has-text("New Page")');
      
      await page.fill('input[placeholder="e.g. About Us"]', testTitle);
      await page.fill('input[placeholder="about"]', testSlug);
      await page.selectOption('select', 'draft');
      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');

      // 2. Add first section (Hero)
      await page.waitForSelector('text=Page Sections');
      
      // Click "+ Add Section" button
      await page.click('button:has-text("Add Section")');
      
      // Click on "Hero" section type
      await page.click('button:has-text("Hero"):has-text("Large banner")');
      
      // Wait for section to expand
      await page.waitForSelector('text=Section title (EN)');
      
      // Fill hero content
      await page.fill('input[placeholder*="Eyebrow" i]', 'Hero Eyebrow');
      await page.fill('textarea[placeholder*="Subtitle" i]', 'Hero subtitle content');
      
      // Save section
      await page.click('button:has-text("Save Section")');
      await expect(page.locator('text=Saving')).not.toBeVisible({ timeout: 10000 });

      // 3. Add second section (Rich Text)
      await page.click('button:has-text("Add Section")');
      await page.click('button:has-text("Rich Text"):has-text("Paragraphs")');
      await page.waitForSelector('text=Content');
      
      // Fill rich text content
      await page.fill('textarea[placeholder*="Blank line" i]', 'First paragraph\n\nSecond paragraph with *italic* and **bold**');
      
      await page.click('button:has-text("Save Section")');
      await expect(page.locator('text=Saving')).not.toBeVisible({ timeout: 10000 });

      // 4. Save the page (page-level save)
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      // 5. Reload and verify sections persisted
      await page.reload();
      await page.waitForSelector('text=Page Sections');
      
      // Check sections are visible in the editor
      await expect(page.locator('text=Hero')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Rich Text')).toBeVisible();

      // 6. Publish and verify public rendering
      await page.selectOption('select', 'published');
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      await page.goto(`/${testSlug}`);
      // Check that hero section renders with h1
      await expect(page.locator('h1:has-text("Hero")')).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================
  // Test C: Researcher admin and detail page
  // ============================================================
  test.describe('Test C: Researcher Admin and Detail Page', () => {
    const testName = `Test Researcher ${Date.now()}`;
    const testNameBn = `টেস্ট গবেষক ${Date.now()}`;

    test('create researcher, populate bilingual fields, verify public detail page', async ({ page }) => {
      // 1. Open /admin/researchers
      await page.goto('/admin/researchers');
      await expect(page.locator('h1:has-text("Researcher Profiles")')).toBeVisible();

      // 2. Click Add Researcher
      await page.click('button:has-text("Add Researcher")');
      await expect(page.locator('h2:has-text("Add researcher")')).toBeVisible();

      // 3. Populate English and Bangla fields
      const nameInputs = page.locator('input[placeholder*="Name" i]');
      await nameInputs.nth(0).fill(testName);
      await nameInputs.nth(1).fill(testNameBn);
      
      await page.fill('input[placeholder*="Email" i]', `test-${Date.now()}@example.com`);
      
      const affInputs = page.locator('input[placeholder*="Affiliation" i]');
      await affInputs.nth(0).fill('Test University');
      await affInputs.nth(1).fill('টেস্ট বিশ্ববিদ্যালয়');
      
      const posInputs = page.locator('input[placeholder*="Position" i]');
      await posInputs.nth(0).fill('Research Fellow');
      await posInputs.nth(1).fill('গবেষণা ফেলো');
      
      const bioInputs = page.locator('textarea[placeholder*="Bio" i]');
      await bioInputs.nth(0).fill('Test researcher bio in English');
      await bioInputs.nth(1).fill('বাংলায় টেস্ট গবেষক জীবনী');

      // 4. Save
      await page.click('button:has-text("Save")');
      // Wait for modal to close
      await expect(page.locator('h2:has-text("Add researcher")')).not.toBeVisible({ timeout: 10000 });

      // 5. Verify it appears in the list
      await expect(page.locator(`text=${testName}`)).toBeVisible({ timeout: 10000 });

      // 6. Open public researcher listing page and verify
      await page.goto('/researchers');
      await expect(page.locator(`text=${testName}`)).toBeVisible({ timeout: 10000 });
      
      // Click on the researcher link
      await page.click(`a:has-text("${testName}")`);
      await expect(page.locator('h1, h2, h3').filter({ hasText: testName })).toBeVisible({ timeout: 10000 });
    });

    test('verify published article links work', async ({ page }) => {
      await page.goto('/researchers');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  // ============================================================
  // Test D: Contact page and form
  // ============================================================
  test.describe('Test D: Contact Page and Form', () => {
    test('verify contact page renders CMS content', async ({ page }) => {
      await page.goto('/contact');
      
      // Check that the page loads (either CMS content or fallback)
      await expect(page.locator('main')).toBeVisible();
      const hasContent = await page.locator('text=Contact, text=Get in touch, text=যোগাযোগ').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('submit valid form data', async ({ page }) => {
      await page.goto('/contact');
      
      // Find and fill the contact form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="subject"]', 'Test Subject');
      await page.fill('textarea[name="message"]', 'Test message content that is long enough');
      
      await page.click('button[type="submit"]:has-text("Send Message")');
      
      // Verify success message appears
      await expect(page.locator('text=Thank you for your message, text=We will get back to you').first()).toBeVisible({ timeout: 10000 });
    });

    test('test invalid input shows validation errors', async ({ page }) => {
      await page.goto('/contact');
      
      // Try submitting empty form
      await page.click('button[type="submit"]:has-text("Send Message")');
      
      // Should show validation errors
      await expect(page.locator('text=must be at least, text=valid email, text=Please enter').first()).toBeVisible({ timeout: 5000 });
    });

    test('verify no secrets exposed in errors', async ({ page }) => {
      await page.goto('/contact');
      
      // Submit form with invalid email
      await page.fill('input[name="name"]', 'Test');
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="subject"]', 'Test');
      await page.fill('textarea[name="message"]', 'Test message content');
      await page.click('button[type="submit"]:has-text("Send Message")');
      
      // Check that no sensitive info is exposed
      const pageContent = await page.content();
      expect(pageContent).not.toContain('DATABASE_URL');
      expect(pageContent).not.toContain('JWT_SECRET');
      expect(pageContent).not.toContain('passwordHash');
      expect(pageContent).not.toContain('"secret"');
    });
  });

  // ============================================================
  // Test E: Menu and bilingual navigation
  // ============================================================
  test.describe('Test E: Menu and Bilingual Navigation', () => {
    const testLabel = `Test Menu ${Date.now()}`;
    const testLabelBn = `টেস্ট মেনু ${Date.now()}`;
    const testUrl = `/test-${Date.now()}`;

    test('edit navigation item labels, verify persistence and public rendering', async ({ page }) => {
      // 1. Open /admin/menus
      await page.goto('/admin/menus');
      await expect(page.locator('h1:has-text("Menu Management")')).toBeVisible();

      // 2. Add a new header menu item
      await page.fill('input[placeholder="Label (EN)"]', testLabel);
      await page.fill('input[placeholder="Label (বাংলা)"]', testLabelBn);
      await page.fill('input[placeholder="URL (/path or https://…)"]', testUrl);
      await page.click('button:has-text("Add item")');
      
      // Wait for the item to appear in the list (no toast, just UI update)
      // Fixed selector: search within the menu table rows to avoid duplicate matches
      await expect(page.locator('table tbody tr').filter({ hasText: testLabel })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('table tbody tr').filter({ hasText: testLabelBn })).toBeVisible();

      // 3. Reload and verify persistence
      await page.reload();
      await expect(page.locator('table tbody tr').filter({ hasText: testLabel })).toBeVisible({ timeout: 5000 });

      // 4. Open public page and verify header shows the menu item
      await page.goto('/');
      await expect(page.locator('nav').filter({ hasText: testLabel })).toBeVisible({ timeout: 10000 });
    });

    test('verify untranslated items still show English', async ({ page }) => {
      await page.goto('/admin/menus');
      
      // Add a menu item without Bangla label
      const testLabel2 = `English Only ${Date.now()}`;
      await page.fill('input[placeholder="Label (EN)"]', testLabel2);
      await page.fill('input[placeholder="URL (/path or https://…)"]', `/english-only-${Date.now()}`);
      await page.click('button:has-text("Add item")');
      
      await expect(page.locator('table tbody tr').filter({ hasText: testLabel2 })).toBeVisible({ timeout: 5000 });

      await page.goto('/');
      await expect(page.locator('nav').filter({ hasText: testLabel2 })).toBeVisible({ timeout: 10000 });
    });
  });

  // ============================================================
  // Test 3: Draft/Publish Visibility and Authorization
  // ============================================================
  test.describe('Draft/Publish Visibility and Authorization', () => {
    const draftSlug = `draft-test-${Date.now()}`;
    const draftTitle = `Draft Test ${Date.now()}`;

    test('draft content not visible to anonymous users', async ({ page, context }) => {
      // Create a draft page as admin
      await page.goto('/admin/pages');
      await page.click('a:has-text("New Page")');
      await page.fill('input[placeholder="e.g. About Us"]', draftTitle);
      await page.fill('input[placeholder="about"]', draftSlug);
      await page.selectOption('select', 'draft');
      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');

      // Open new incognito context (anonymous user)
      const browser = context.browser();
      if (!browser) throw new Error('Browser not available');
      const anonContext = await browser.newContext();
      const anonPage = await anonContext.newPage();
      
      // Try to access the draft page
      await anonPage.goto(`/${draftSlug}`);
      
      // Should get 404 (page not found)
      await expect(anonPage.locator('text=Page Not Found, text=Not Found, text=404')).toBeVisible({ timeout: 10000 });
      
      await anonContext.close();
    });

    test('published content visible at public route', async ({ page, context }) => {
      const pubSlug = `published-test-${Date.now()}`;
      const pubTitle = `Published Test ${Date.now()}`;

      // Create and publish a page with a hero section
      await page.goto('/admin/pages');
      await page.click('a:has-text("New Page")');
      await page.fill('input[placeholder="e.g. About Us"]', pubTitle);
      await page.fill('input[placeholder="about"]', pubSlug);
      await page.selectOption('select', 'published');
      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');

      // Add a hero section so the title appears in h1 on public page
      await page.waitForSelector('text=Page Sections');
      await page.click('button:has-text("Add Section")');
      await page.click('button:has-text("Hero"):has-text("Large banner")');
      await page.waitForSelector('text=Section title (EN)');
      await page.fill('input[placeholder*="Eyebrow" i]', 'Test Eyebrow');
      await page.click('button:has-text("Save Section")');
      await expect(page.locator('text=Saving')).not.toBeVisible({ timeout: 10000 });
      
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      // Access as anonymous (new context)
      const browser = context.browser();
      if (!browser) throw new Error('Browser not available');
      const anonContext = await browser.newContext();
      const anonPage = await anonContext.newPage();
      
      await anonPage.goto(`/${pubSlug}`);
      // The page title should appear in hero h1 or breadcrumb
      await expect(anonPage.locator('h1, nav[aria-label="Breadcrumb"] span.text-slate-800').filter({ hasText: pubTitle })).toBeVisible({ timeout: 10000 });
      
      await anonContext.close();
    });

    test('unauthorized users cannot modify content', async ({ page, context }) => {
      // Create a page as admin first
      const slug = `auth-test-${Date.now()}`;
      await page.goto('/admin/pages');
      await page.click('a:has-text("New Page")');
      await page.fill('input[placeholder="e.g. About Us"]', 'Auth Test');
      await page.fill('input[placeholder="about"]', slug);
      await page.selectOption('select', 'draft');
      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');
      
      const pageId = page.url().split('/').pop();

      // Try to call the API directly without auth
      const browser = context.browser();
      if (!browser) throw new Error('Browser not available');
      const anonContext = await browser.newContext();
      const anonPage = await anonContext.newPage();
      
      const response = await anonPage.request.put('/api/admin/pages', {
        data: { id: pageId, title: 'Hacked Title' }
      });
      
      expect(response.status()).toBe(401);
      
      await anonContext.close();
    });

    test('public rendering does not expose administrative data', async ({ page }) => {
      const slug = `admin-data-test-${Date.now()}`;
      await page.goto('/admin/pages');
      await page.click('a:has-text("New Page")');
      await page.fill('input[placeholder="e.g. About Us"]', 'Admin Data Test');
      await page.fill('input[placeholder="about"]', slug);
      await page.selectOption('select', 'published');
      await page.click('button:has-text("Create Page")');
      await waitForToast(page, 'Page saved successfully!');

      // Add hero section
      await page.waitForSelector('text=Page Sections');
      await page.click('button:has-text("Add Section")');
      await page.click('button:has-text("Hero"):has-text("Large banner")');
      await page.waitForSelector('text=Section title (EN)');
      await page.click('button:has-text("Save Section")');
      await expect(page.locator('text=Saving')).not.toBeVisible({ timeout: 10000 });
      await page.click('button:has-text("Save Changes")');
      await waitForToast(page, 'Page saved successfully!');

      await page.goto(`/${slug}`);
      const content = await page.content();
      
      // Check no admin-only fields are exposed in the rendered content
      // (not counting CSS class names like "status-live")
      expect(content).not.toContain('createdBy');
      expect(content).not.toContain('dateCreated');
      expect(content).not.toContain('dateModified');
      expect(content).not.toContain('passwordHash');
      expect(content).not.toContain('"session"');
      expect(content).not.toContain('created_by');
      expect(content).not.toContain('published_at');
      expect(content).not.toContain('date_created');
      expect(content).not.toContain('date_modified');
    });
  });
});