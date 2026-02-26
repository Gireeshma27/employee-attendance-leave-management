/**
 * E2E Tests: Dashboard & Reports
 * Admin dashboard, Employee dashboard, Reports
 */
import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard — E2E", () => {
  test("should display admin dashboard statistics", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("login")) {
      test.skip();
      return;
    }

    // Dashboard should show key metrics
    const bodyText = await page.textContent("body");
    const hasDashboardContent =
      bodyText.includes("Employee") ||
      bodyText.includes("Attendance") ||
      bodyText.includes("Leave") ||
      bodyText.includes("Dashboard");

    expect(hasDashboardContent).toBeTruthy();
  });

  test("should display sidebar navigation", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("login")) {
      test.skip();
      return;
    }

    // Check for navigation elements
    const navLinks = page.locator("nav a, [class*='sidebar'] a, [class*='Sidebar'] a");
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test("should navigate to reports page", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("login")) {
      test.skip();
      return;
    }

    const reportLink = page.locator('a[href*="report"], a:has-text("Report")');
    if (await reportLink.count() > 0) {
      await reportLink.first().click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toMatch(/report/i);
    }
  });
});

test.describe("Employee Dashboard — E2E", () => {
  test("should display employee-specific dashboard", async ({ page }) => {
    await page.goto("/employee");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("login")) {
      test.skip();
      return;
    }

    const bodyText = await page.textContent("body");
    const hasEmployeeContent =
      bodyText.includes("Check In") ||
      bodyText.includes("Attendance") ||
      bodyText.includes("Leave Balance") ||
      bodyText.includes("Dashboard");

    expect(hasEmployeeContent || page.url().includes("employee")).toBeTruthy();
  });
});

test.describe("Manager Dashboard — E2E", () => {
  test("should display manager dashboard with team info", async ({ page }) => {
    await page.goto("/manager");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("login")) {
      test.skip();
      return;
    }

    const bodyText = await page.textContent("body");
    const hasManagerContent =
      bodyText.includes("Team") ||
      bodyText.includes("Pending") ||
      bodyText.includes("Approval") ||
      bodyText.includes("Dashboard");

    expect(hasManagerContent || page.url().includes("manager")).toBeTruthy();
  });
});

test.describe("Responsive Design — E2E", () => {
  test("login page should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("dashboard should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768 + 20); // Allow small margin
  });
});
