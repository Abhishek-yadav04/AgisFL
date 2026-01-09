import { test, expect } from '@playwright/test';

test('Nonexistent page returns 404', async ({ page }) => {
  await page.goto('http://localhost:3000/nonexistent');
  await expect(page.locator('.error')).toContainText('404');
});
