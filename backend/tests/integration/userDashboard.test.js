/**
 * Integration Tests: User Management & Dashboard APIs
 * User CRUD, profile, role-based dashboard
 */
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod, app, request;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-min10";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.EMAIL_USER = "test@example.com";
  process.env.EMAIL_PASSWORD = "test-password";
  process.env.FRONTEND_URL = "http://localhost:3000";

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

// ─── HELPERS ──────────────────────────────────────────────

const createTestUser = async (role = "EMPLOYEE", overrides = {}) => {
  const User = (await import("../../../src/models/user.js")).default;
  const { hashPassword } = await import("../../../src/utils/password.js");
  const { generateToken } = await import("../../../src/utils/jwt.js");

  const hashed = await hashPassword("Test@1234");
  const user = await User.create({
    name: `Test ${role}`,
    email: `${role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
    password: hashed,
    role,
    employeeId: `${role.substring(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    department: "Engineering",
    isActive: true,
    ...overrides,
  });
  const token = generateToken(user._id, user.email, user.role);
  return { user, token };
};

// ─── USER MANAGEMENT TESTS ────────────────────────────────

describe("User API — /api/v1/users", () => {
  describe("GET /api/v1/users/profile", () => {
    it("should return user profile", async () => {
      const { token, user } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should reject unauthenticated profile request", async () => {
      await request.get("/api/v1/users/profile").expect(401);
    });
  });

  describe("PUT /api/v1/users/profile", () => {
    it("should update user profile", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name", phone: "1234567890" })
        .expect(200);

      expect(res.body.data.name).toBe("Updated Name");
    });
  });

  describe("POST /api/v1/users/profile/change-password", () => {
    it("should change password successfully", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/users/profile/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ oldPassword: "Test@1234", newPassword: "NewPass@5678" })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("should reject if old password is incorrect", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/users/profile/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ oldPassword: "WrongPassword", newPassword: "NewPass@5678" })
        .expect(401);

      expect(res.body.message).toContain("Incorrect");
    });

    it("should reject if old and new passwords are the same", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/users/profile/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({ oldPassword: "Test@1234", newPassword: "Test@1234" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users — Admin/Manager Only", () => {
    it("should allow admin to list all users", async () => {
      const { token } = await createTestUser("ADMIN");
      await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty("records");
      expect(res.body.data).toHaveProperty("pagination");
    });

    it("should allow manager to list users", async () => {
      const { token } = await createTestUser("MANAGER");

      const res = await request
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("should deny employee from listing users", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      await request
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should support search filter", async () => {
      const { token } = await createTestUser("ADMIN");
      await createTestUser("EMPLOYEE", { name: "SearchableUser" });

      const res = await request
        .get("/api/v1/users")
        .query({ search: "SearchableUser" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    });

    it("should support role filter", async () => {
      const { token } = await createTestUser("ADMIN");

      const res = await request
        .get("/api/v1/users")
        .query({ role: "ADMIN" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      res.body.data.records.forEach((u) => {
        expect(u.role).toBe("ADMIN");
      });
    });
  });

  describe("POST /api/v1/users — Admin Only (Create User)", () => {
    it("should allow admin to create a user", async () => {
      const { token } = await createTestUser("ADMIN");

      const res = await request
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Employee",
          email: "newemployee@example.com",
          password: "Emp@12345",
          role: "EMPLOYEE",
          department: "Engineering",
          employeeId: "NEW-001",
        })
        .expect(201);

      expect(res.body.data).toHaveProperty("email", "newemployee@example.com");
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should deny employee from creating users", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      await request
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Hacker",
          email: "hacker@example.com",
          password: "Hack@1234",
          department: "Engineering",
        })
        .expect(403);
    });

    it("should deny manager from creating users", async () => {
      const { token } = await createTestUser("MANAGER");

      await request
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "NewUser",
          email: "mgrcreated@example.com",
          password: "Pass@1234",
          department: "Engineering",
        })
        .expect(403);
    });

    it("should reject duplicate email", async () => {
      const { token } = await createTestUser("ADMIN");

      const email = "dupe@example.com";
      await request
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "User One",
          email,
          password: "Pass@1234",
          department: "Engineering",
        });

      const res = await request
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "User Two",
          email,
          password: "Pass@1234",
          department: "Engineering",
        })
        .expect(409);

      expect(res.body.message).toContain("already exists");
    });
  });

  describe("GET /api/v1/users/departments", () => {
    it("should return list of departments", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/users/departments")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain("Engineering");
    });
  });
});

// ─── DASHBOARD TESTS ──────────────────────────────────────

describe("Dashboard API — /api/v1/dashboard", () => {
  describe("GET /api/v1/dashboard/admin — Admin Only", () => {
    it("should return admin dashboard stats", async () => {
      const { token } = await createTestUser("ADMIN");

      const res = await request
        .get("/api/v1/dashboard/admin")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty("summary");
      expect(res.body.data.summary).toHaveProperty("totalEmployees");
      expect(res.body.data.summary).toHaveProperty("presentToday");
      expect(res.body.data.summary).toHaveProperty("pendingLeaves");
      expect(res.body.data).toHaveProperty("trends");
      expect(res.body.data).toHaveProperty("activities");
    });

    it("should deny employee from viewing admin dashboard", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      await request
        .get("/api/v1/dashboard/admin")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should deny manager from viewing admin dashboard", async () => {
      const { token } = await createTestUser("MANAGER");

      await request
        .get("/api/v1/dashboard/admin")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  describe("GET /api/v1/dashboard/employee", () => {
    it("should return employee dashboard stats", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/dashboard/employee")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty("todayStatus");
      expect(res.body.data).toHaveProperty("stats");
      expect(res.body.data.stats).toHaveProperty("leaveBalance");
    });
  });

  describe("GET /api/v1/dashboard/manager", () => {
    it("should return manager dashboard stats", async () => {
      const { token } = await createTestUser("MANAGER");

      const res = await request
        .get("/api/v1/dashboard/manager")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty("stats");
      expect(res.body.data.stats).toHaveProperty("teamSize");
      expect(res.body.data.stats).toHaveProperty("pendingApprovals");
    });
  });
});

// ─── NOTIFICATION TESTS ───────────────────────────────────

describe("Notification API — /api/v1/notifications", () => {
  describe("GET /api/v1/notifications", () => {
    it("should return user notifications", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should reject unauthenticated request", async () => {
      await request.get("/api/v1/notifications").expect(401);
    });
  });

  describe("PATCH /api/v1/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/v1/notifications/clear-all", () => {
    it("should clear all notifications", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .delete("/api/v1/notifications/clear-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
