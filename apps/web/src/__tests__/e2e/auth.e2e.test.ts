import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

describe('Web Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete registration and login flow', async () => {
    // Navigate to registration
    await page.goto(`${BASE_URL}/register`);
    
    // Fill registration form
    await page.fill('input[name="email"]', 'e2e@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.fill('input[name="name"]', 'E2E Test User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to login or verification page
    await expect(page).toHaveURL(/\/(login|verify)/);
    
    // Login with new account
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="identifier"]', 'e2e@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Verify user is logged in
    const userName = await page.textContent('[data-testid="user-name"]');
    expect(userName).toContain('E2E Test User');
  });

  test('Session persistence across page refreshes', async () => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="identifier"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // User should still be logged in
    const logoutButton = await page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
  });

  test('Protected route redirection', async () => {
    // Try to access protected route without login
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    
    // Should show redirect message
    const message = await page.textContent('[data-testid="redirect-message"]');
    expect(message).toContain('Please login to continue');
  });
});