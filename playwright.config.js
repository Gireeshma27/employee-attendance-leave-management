// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration
 * E2E Tests for Employee Attendance & Leave Management System
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ...(process.env.CI ? [["junit", { outputFile: "e2e-results.xml" }]] : []),
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: [
    {
      command: "cd backend && npm run dev",
      port: 5000,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "cd frontend && npm run dev",
      port: 3000,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
