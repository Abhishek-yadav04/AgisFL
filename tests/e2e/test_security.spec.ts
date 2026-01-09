import { test, expect } from '@playwright/test';

test('XSS protection on login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', "<script>alert('xss')</script>");
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toContainText('Invalid input');
});
