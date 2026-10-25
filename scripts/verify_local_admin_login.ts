import { chromium } from "playwright";

async function verifyLogin() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) {
    console.error("ADMIN_SEED_PASSWORD not set");
    process.exit(1);
  }

  console.log("=== Verifying Admin Login via Browser (Playwright) ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // 1. Attempt accessing /admin/navigation without authentication
    console.log("1. Navigating to /admin/navigation unauthenticated...");
    await page.goto("http://localhost:3000/admin/navigation", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const unauthUrl = page.url();
    console.log("   Current URL after unauthenticated access:", unauthUrl);
    if (!unauthUrl.includes("/admin/login")) {
      throw new Error(`Expected redirect to /admin/login, got: ${unauthUrl}`);
    }
    console.log("   ✓ Successfully blocked and redirected to /admin/login");

    // Dismiss cookie banner if present
    const cookieButton = page.locator('button:has-text("Accept"), button:has-text("Got it"), button:has-text("Agree")').first();
    if (await cookieButton.isVisible().catch(() => false)) {
      await cookieButton.click();
      await page.waitForTimeout(500);
    }

    // 2. Submit wrong password
    console.log("2. Testing invalid credentials submission...");
    await page.fill('input[type="email"]', "admin@lens.org.bd");
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.locator('button[type="submit"]').click({ force: true });

    // Wait for the alert
    const alertLocator = page.locator('[role="alert"]').filter({ hasText: "Invalid" });
    await alertLocator.waitFor({ state: "visible", timeout: 10000 });
    const errorAlert = await alertLocator.innerText();
    console.log("   Error message displayed:", errorAlert);
    if (!errorAlert.includes("Invalid email or password")) {
      throw new Error(`Expected "Invalid email or password" error, got: ${errorAlert}`);
    }
    console.log("   ✓ Correctly rejected invalid credentials with error message");

    // 3. Submit valid credentials
    console.log("3. Submitting valid credentials for admin@lens.org.bd...");
    await page.fill('input[type="email"]', "admin@lens.org.bd");
    await page.fill('input[type="password"]', seedPassword);
    await page.locator('button[type="submit"]').click({ force: true });

    // Wait for redirect to /admin
    await page.waitForURL("**/admin", { timeout: 15000 });
    console.log("   Current URL after login:", page.url());
    console.log("   ✓ Successfully authenticated and navigated to /admin");

    // 4. Access /admin/navigation with authenticated session
    console.log("4. Navigating to /admin/navigation with active session...");
    await page.goto("http://localhost:3000/admin/navigation", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const authNavUrl = page.url();
    console.log("   Current URL:", authNavUrl);
    if (!authNavUrl.includes("/admin/navigation")) {
      throw new Error(`Expected to stay on /admin/navigation, got: ${authNavUrl}`);
    }

    const heading = await page.locator("h1, h2, h3").first().innerText().catch(() => "");
    console.log("   Page heading found:", heading);
    console.log("   ✓ /admin/navigation is accessible and rendered");

    console.log("\n=== ALL BROWSER AUTHENTICATION CHECKS PASSED ===");
  } finally {
    await browser.close();
  }
}

verifyLogin().catch((err) => {
  console.error("Browser verification failed:", err);
  process.exit(1);
});
