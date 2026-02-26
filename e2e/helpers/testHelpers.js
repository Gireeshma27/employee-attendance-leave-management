/**
 * E2E Test Helpers & Page Object Models
 * Shared utilities for all Playwright E2E tests
 */

// ─── TEST USERS ───────────────────────────────────────────

export const TEST_USERS = {
  admin: {
    email: "admin@test.com",
    password: "Admin@1234",
    name: "Test Admin",
    role: "ADMIN",
  },
  manager: {
    email: "manager@test.com",
    password: "Manager@1234",
    name: "Test Manager",
    role: "MANAGER",
  },
  employee: {
    email: "employee@test.com",
    password: "Employee@1234",
    name: "Test Employee",
    role: "EMPLOYEE",
  },
};

// ─── API HELPER ───────────────────────────────────────────

const API_BASE = process.env.E2E_API_URL || "http://localhost:5000/api/v1";

/**
 * Login via API and return token (bypasses UI for speed).
 */
export async function apiLogin(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(`API login failed: ${data.message}`);
  return data.data.token;
}

/**
 * Seed a test user via API registration.
 */
export async function apiRegisterUser(userData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    }),
  });
  return response.json();
}

// ─── PAGE OBJECT: LOGIN ───────────────────────────────────

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .error, .text-red');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(text) {
    await expect(this.errorMessage).toContainText(text);
  }
}

// ─── PAGE OBJECT: DASHBOARD ──────────────────────────────

export class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async expectLoaded() {
    // Wait for dashboard content to be visible
    await this.page.waitForLoadState("networkidle");
    // Verify we're on a dashboard page
    const url = this.page.url();
    expect(url).toMatch(/(admin|manager|employee|dashboard)/);
  }

  async navigateTo(section) {
    await this.page.click(`a[href*="${section}"], [data-nav="${section}"]`);
    await this.page.waitForLoadState("networkidle");
  }
}

// ─── AUTH STATE SETUP ─────────────────────────────────────

/**
 * Set authentication token in browser localStorage.
 */
export async function setAuthToken(page, token) {
  await page.evaluate((t) => {
    localStorage.setItem("token", t);
  }, token);
}

/**
 * Clear authentication state from browser.
 */
export async function clearAuth(page) {
  await page.evaluate(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  });
}

/**
 * Login via API and set token in browser — fast auth for E2E.
 */
export async function loginAsUser(page, user) {
  const token = await apiLogin(user.email, user.password);
  await page.goto("/");
  await setAuthToken(page, token);
  return token;
}
