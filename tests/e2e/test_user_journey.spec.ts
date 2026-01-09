import { test, expect } from '@playwright/test';

test('User registration and login', async ({ page }) => {
  await page.goto('http://localhost:3000/register');
  await page.fill('input[name="username"]', 'user1');
  await page.fill('input[name="password"]', 'StrongPass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/login/);

  await page.fill('input[name="username"]', 'user1');
  await page.fill('input[name="password"]', 'StrongPass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});

test('Protected page access', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/login/);
});

test('Dataset upload and dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'user1');
  await page.fill('input[name="password"]', 'StrongPass123!');
  await page.click('button[type="submit"]');
  await page.goto('http://localhost:3000/datasets');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/test_dataset.csv');
  await page.click('button[type="submit"]');
  await expect(page.locator('.dataset-list')).toContainText('Test Dataset');
});
