import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.NAV_TEST_URL ?? 'http://127.0.0.1:4323' });

for (const mobile of [false, true]) {
  test.describe(mobile ? 'mobile navigation' : 'desktop navigation', () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: mobile });

    test.beforeEach(async ({ page }) => {
      // No third-party map requests are needed to test local navigation.
      await page.route('https://www.google.com/**', route => route.abort());
      await page.goto('/');
    });

    test('apartment dropdown links navigate to the selected apartment', async ({ page }) => {
      if (mobile) await page.locator('[data-mobile-menu] > summary').click();
      else await page.locator('[data-desktop-apartments] > summary').click();
      const list = page.locator(mobile ? '#mobile-apartments' : '#desktop-apartments');
      const link = list.getByRole('link', { name: 'Two-Bedroom Apartment', exact: true });
      if (mobile) await link.tap();
      else await link.click();
      await expect(page).toHaveURL(/\/units\/two-bedroom-apartment\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Two-Bedroom Apartment');
    });

    test('Escape closes the dropdown and returns focus to its trigger', async ({ page }) => {
      const trigger = page.locator(mobile ? '[data-mobile-menu] > summary' : '[data-desktop-apartments] > summary');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });

    test('language dropdown links navigate to the translated page', async ({ page }) => {
      if (mobile) await page.locator('[data-mobile-menu] > summary').click();
      else await page.locator('[aria-controls="desktop-languages"]').click();
      const menu = page.locator(mobile ? '#mobile-navigation' : '#desktop-languages');
      const link = menu.getByRole('link', { name: 'Slovenščina', exact: true });
      if (mobile) await link.tap();
      else await link.click();
      await expect(page).toHaveURL(/\/sl\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sl');
    });
  });
}
