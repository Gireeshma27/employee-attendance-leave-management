/**
 * Integration Tests: Authentication API
 * Full auth flow: register, login, forgot-password, reset-password, logout
 */
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod, app, request;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set env before importing app
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-min10";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.EMAIL_USER = "test@example.com";
  process.env.EMAIL_PASSWORD = "test-password";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.PORT = "0";

  await mongoose.connect(uri);

  const appModule = await import("../../../src/app.js");
  app = appModule.default || appModule.app;
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Auth API — /api/v1/auth", () => {
  // ─── REGISTRATION ────────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    const validUser = {
      name: "Test User",
      email: "test@example.com",
      password: "Test@1234",
      confirmPassword: "Test@1234",
    };

    it("should register a new user successfully", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toHaveProperty("email", "test@example.com");
      expect(res.body.data.user).not.toHaveProperty("password");
      expect(res.body.data.user.role).toBe("EMPLOYEE");
    });

    it("should reject duplicate email registration", async () => {
      await request.post("/api/v1/auth/register").send(validUser);

      const res = await request
        .post("/api/v1/auth/register")
        .send(validUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });

    it("should reject registration with missing fields", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject registration with invalid email", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ ...validUser, email: "not-an-email" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject registration with password mismatch", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ ...validUser, confirmPassword: "Different123" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject registration with short password", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({ ...validUser, password: "12345", confirmPassword: "12345" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── LOGIN ───────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request.post("/api/v1/auth/register").send({
        name: "Login User",
        email: "login@example.com",
        password: "Test@1234",
        confirmPassword: "Test@1234",
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "Test@1234" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.email).toBe("login@example.com");
    });

    it("should reject login with wrong password", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "WrongPassword" })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "nonexistent@example.com", password: "Test@1234" })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it("should reject login with empty body", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject login for deactivated user", async () => {
      // Deactivate the user directly in DB
      const User = (await import("../../../src/models/user.js")).default;
      await User.updateOne(
        { email: "login@example.com" },
        { isActive: false }
      );

      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "Test@1234" })
        .expect(403);

      expect(res.body.message).toContain("deactivated");
    });

    it("should return JWT token that works with protected routes", async () => {
      const loginRes = await request
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "Test@1234" });

      const token = loginRes.body.data.token;

      const profileRes = await request
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.email).toBe("login@example.com");
    });
  });

  // ─── FORGOT PASSWORD ────────────────────────────────────

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should return 404 for non-existent email", async () => {
      const res = await request
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nobody@example.com" })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it("should reject invalid email format", async () => {
      const res = await request
        .post("/api/v1/auth/forgot-password")
        .send({ email: "not-email" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── RESET PASSWORD ─────────────────────────────────────

  describe("POST /api/v1/auth/reset-password", () => {
    it("should reject invalid reset token", async () => {
      const res = await request
        .post("/api/v1/auth/reset-password")
        .send({
          token: "invalid-token-string",
          newPassword: "NewPass123",
          confirmPassword: "NewPass123",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject with missing token", async () => {
      const res = await request
        .post("/api/v1/auth/reset-password")
        .send({
          newPassword: "NewPass123",
          confirmPassword: "NewPass123",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── LOGOUT ──────────────────────────────────────────────

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const res = await request
        .post("/api/v1/auth/logout")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Logged out");
    });
  });

  // ─── SECURITY TESTS ─────────────────────────────────────

  describe("Security — Injection Prevention", () => {
    it("should handle SQL injection in email field", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "' OR '1'='1", password: "password" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should handle NoSQL injection in email field", async () => {
      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: { $gt: "" }, password: "password" });

      // Should fail validation or return auth error, not data leak
      expect(res.body.success).toBe(false);
    });

    it("should handle XSS payloads in name field", async () => {
      const res = await request
        .post("/api/v1/auth/register")
        .send({
          name: '<script>alert("xss")</script>',
          email: "xss@example.com",
          password: "Test@1234",
          confirmPassword: "Test@1234",
        });

      // Should either reject or store sanitized — not execute
      if (res.body.success) {
        expect(res.body.data.user.name).not.toContain("<script>");
      }
    });
  });

  // ─── HEALTH CHECK ───────────────────────────────────────

  describe("GET /api/v1/health", () => {
    it("should return health check response", async () => {
      const res = await request.get("/api/v1/health").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("uptime");
      expect(res.body.data).toHaveProperty("timestamp");
    });
  });

  // ─── 404 HANDLING ────────────────────────────────────────

  describe("404 — Route Not Found", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request.get("/api/v1/nonexistent").expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });
  });
});
