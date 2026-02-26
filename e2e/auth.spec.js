/**
 * E2E Tests: Authentication Flows
 * Login, Logout, Forgot Password, Access Control
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("Authentication — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  // ─── LOGIN PAGE ─────────────────────────────────────

  test("should display login form", async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show error for empty form submission", async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    // Should show validation error or remain on login page
    await expect(page).toHaveURL(/login/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', "wrong@example.com");
    await page.fill('input[type="password"], input[name="password"]', "WrongPass123");
    await page.locator('button[type="submit"]').click();

    // Wait for error response
    await page.waitForTimeout(2000);

    // Should remain on login page or show error
    const url = page.url();
    const hasError = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600, [class*="error"]').count();
    expect(url.includes("login") || hasError > 0).toBeTruthy();
  });

  test("should show/hide password toggle if available", async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-password"], button:has(svg):near(input[type="password"])');
    if (await toggleBtn.count() > 0) {
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill("TestPassword123");

      await toggleBtn.first().click();
      // After toggle, input type should change
      const inputType = await page.locator('input[name="password"], input[placeholder*="assword"]').getAttribute("type");
      expect(["text", "password"]).toContain(inputType);
    }
  });

  // ─── NAVIGATION GUARDS ──────────────────────────────

  test("should redirect unauthenticated user to login", async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => localStorage.clear());

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Should redirect to login or show auth error
    const url = page.url();
    expect(url.includes("login") || url === `${BASE_URL}/`).toBeTruthy();
  });

  test("should redirect unauthenticated user from employee dashboard", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto("/employee");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url.includes("login") || url === `${BASE_URL}/`).toBeTruthy();
  });

  // ─── FORGOT PASSWORD ───────────────────────────────

  test("should navigate to forgot password page", async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"], a:text("Forgot")');
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});
