import { chromium } from 'playwright';

async function runProdSmokeTest() {
  console.log('=== STARTING PRODUCTION SMOKE TEST (LIVE: https://www.lensbd.org) ===');
  const browser = await chromium.launch();
  
  // 1. Desktop Test (1280x800)
  const desktop = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const desktopConsoleErrors: string[] = [];
  const desktopFailedRequests: string[] = [];

  desktop.on('pageerror', err => desktopConsoleErrors.push(err.message));
  desktop.on('console', msg => {
    if (msg.type() === 'error') desktopConsoleErrors.push(msg.text());
  });
  desktop.on('requestfailed', req => {
    desktopFailedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  console.log('\n[Desktop] Navigating to https://www.lensbd.org...');
  await desktop.goto('https://www.lensbd.org', { waitUntil: 'networkidle', timeout: 30000 });
  const desktopTitle = await desktop.title();
  console.log('[Desktop] Title:', desktopTitle);

  // Check header navigation links & dropdowns
  const headerLinks = await desktop.locator('header a').evaluateAll(els => els.map(e => ({ text: e.textContent?.trim(), href: (e as HTMLAnchorElement).href })));
  console.log(`[Desktop] Header Links Found: ${headerLinks.length}`);
  
  // Test nested dropdown open (e.g. About or Resources or Theme)
  const dropdownToggle = desktop.locator('button[data-menu-toggle]').first();
  if (await dropdownToggle.isVisible()) {
    console.log('[Desktop] Clicking nested dropdown menu...');
    await dropdownToggle.click();
    await desktop.waitForTimeout(500);
    const openMenu = desktop.locator('header ul[role="menu"], header ul[aria-label]');
    const isMenuOpen = await openMenu.isVisible();
    console.log('[Desktop] Dropdown menu opened:', isMenuOpen);
  }

  // Check footer links
  const footerLinks = await desktop.locator('footer a').evaluateAll(els => els.map(e => ({ text: e.textContent?.trim(), href: (e as HTMLAnchorElement).href })));
  console.log(`[Desktop] Footer Links Found: ${footerLinks.length}`);

  // Test language switch on desktop
  console.log('\n[Desktop] Testing Language Switcher...');
  const bnButton = desktop.locator('button:has-text("বাং"), a:has-text("বাং"), [aria-label*="Bangla"], [aria-label*="বাং"], button:has-text("BN")').first();
  if (await bnButton.isVisible()) {
    console.log('[Desktop] Clicking Bangla toggle button...');
    await bnButton.click();
    await desktop.waitForTimeout(2000);
  } else {
    console.log('[Desktop] Testing direct ?lang=bn...');
    await desktop.goto('https://www.lensbd.org/?lang=bn', { waitUntil: 'networkidle' });
  }

  const bnBodyText = await desktop.locator('body').innerText();
  const hasBengali = /[\u0980-\u09FF]/.test(bnBodyText);
  console.log('[Desktop] Bengali text rendered on page:', hasBengali);

  // Direct access and page refresh
  console.log('\n[Desktop] Testing page reload / refresh resilience...');
  await desktop.reload({ waitUntil: 'networkidle' });
  const reloadTitle = await desktop.title();
  console.log('[Desktop] Reload Title:', reloadTitle);

  // 2. Mobile Test (375x667)
  console.log('\n[Mobile] Testing Mobile Viewport (375x667)...');
  const mobile = await browser.newPage({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  const mobileConsoleErrors: string[] = [];
  mobile.on('pageerror', err => mobileConsoleErrors.push(err.message));
  mobile.on('console', msg => {
    if (msg.type() === 'error') mobileConsoleErrors.push(msg.text());
  });

  await mobile.goto('https://www.lensbd.org', { waitUntil: 'networkidle', timeout: 30000 });
  const mobileTitle = await mobile.title();
  console.log('[Mobile] Title:', mobileTitle);

  // Mobile menu button
  const mobileToggle = mobile.locator('button[aria-controls="sitenav-mobile-menu"], button[aria-controls="mobile-nav-sheet"]').first();
  const toggleVisible = await mobileToggle.isVisible();
  console.log('[Mobile] Menu toggle button visible:', toggleVisible);

  if (toggleVisible) {
    await mobileToggle.click();
    await mobile.waitForTimeout(500);
    const sheet = mobile.locator('#sitenav-mobile-menu, #mobile-nav-sheet').first();
    const sheetVisible = await sheet.isVisible();
    console.log('[Mobile] Navigation drawer opened:', sheetVisible);

    const sheetLinks = await sheet.locator('a').allInnerTexts();
    console.log(`[Mobile] Navigation links count: ${sheetLinks.length}, Sample: ${sheetLinks.slice(0, 4).join(', ')}`);

    // Close mobile menu
    await mobileToggle.click();
    await mobile.waitForTimeout(500);
    const sheetClosed = !(await sheet.isVisible());
    console.log('[Mobile] Navigation drawer closed:', sheetClosed);
  }

  console.log('\n=== SMOKE TEST EVIDENCE SUMMARY ===');
  console.log('Desktop Console Errors:', desktopConsoleErrors.length ? desktopConsoleErrors : '0 errors');
  console.log('Desktop Failed Requests:', desktopFailedRequests.length ? desktopFailedRequests : '0 failures');
  console.log('Mobile Console Errors:', mobileConsoleErrors.length ? mobileConsoleErrors : '0 errors');

  await browser.close();
  console.log('=== PRODUCTION SMOKE TEST COMPLETED SUCCESSFULLY ===');
}

runProdSmokeTest().catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
