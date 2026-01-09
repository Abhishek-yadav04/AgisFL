import { test, expect } from '@playwright/test';

test('Dashboard loads metrics quickly', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'user1');
  await page.fill('input[name="password"]', 'StrongPass123!');
  await page.click('button[type="submit"]');
  await page.goto('http://localhost:3000/dashboard');
  const start = Date.now();
  await expect(page.locator('.metrics')).toBeVisible();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(500);
});
