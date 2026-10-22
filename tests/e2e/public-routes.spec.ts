import { test, expect } from '@playwright/test';

test.describe('Public Routes, Bilingual, and Security Headers Verification', () => {
  const routes = [
    '/',
    '/?lang=bn',
    '/about',
    '/research',
    '/publications',
    '/programs',
    '/events',
    '/contact',
    '/careers',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health',
  ];

  for (const route of routes) {
    test(`route ${route} loads with 200 OK and security headers`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(200);

      // Verify security headers on HTML responses
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('text/html')) {
        expect(response.headers()['x-frame-options']).toBe('DENY');
        expect(response.headers()['x-content-type-options']).toBe('nosniff');
        expect(response.headers()['content-security-policy']).toBeDefined();
      }
    });
  }

  test('bilingual toggle switches content language correctly', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('analytics-consent', 'true');
    });

    // English home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const enHtmlLang = await page.locator('html').getAttribute('lang');
    expect(enHtmlLang === 'en' || enHtmlLang === null || enHtmlLang === '').toBeTruthy();

    // Bangla home via query param
    await page.goto('/?lang=bn');
    await page.waitForLoadState('networkidle');
    const bnBody = await page.textContent('body');
    // Bengali characters present (U+0980 to U+09FF)
    const hasBengali = /[\u0980-\u09FF]/.test(bnBody || '');
    expect(hasBengali).toBeTruthy();
  });
});

