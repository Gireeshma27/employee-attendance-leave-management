/**
 * Integration Tests: Attendance API
 * Check-in, check-out, my attendance, team attendance, update
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

const registerAndLogin = async (overrides = {}) => {
  const data = {
    name: "Test User",
    email: `user_${Date.now()}@example.com`,
    password: "Test@1234",
    confirmPassword: "Test@1234",
    ...overrides,
  };
  const res = await request.post("/api/v1/auth/register").send(data);
  return { token: res.body.data.token, user: res.body.data.user };
};

const createAdminUser = async () => {
  const User = (await import("../../../src/models/user.js")).default;
  const { hashPassword } = await import("../../../src/utils/password.js");
  const { generateToken } = await import("../../../src/utils/jwt.js");

  const hashed = await hashPassword("Admin@1234");
  const admin = await User.create({
    name: "Test Admin",
    email: `admin_${Date.now()}@example.com`,
    password: hashed,
    role: "ADMIN",
    employeeId: `ADM-${Date.now()}`,
    department: "Administration",
    isActive: true,
  });
  const token = generateToken(admin._id, admin.email, admin.role);
  return { token, user: admin };
};

const createManagerUser = async () => {
  const User = (await import("../../../src/models/user.js")).default;
  const { hashPassword } = await import("../../../src/utils/password.js");
  const { generateToken } = await import("../../../src/utils/jwt.js");

  const hashed = await hashPassword("Manager@1234");
  const manager = await User.create({
    name: "Test Manager",
    email: `mgr_${Date.now()}@example.com`,
    password: hashed,
    role: "MANAGER",
    employeeId: `MGR-${Date.now()}`,
    department: "Engineering",
    isActive: true,
  });
  const token = generateToken(manager._id, manager.email, manager.role);
  return { token, user: manager };
};

// ─── TESTS ────────────────────────────────────────────────

describe("Attendance API — /api/v1/attendance", () => {
  describe("POST /api/v1/attendance/check-in", () => {
    it("should check in successfully", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Present");
      expect(res.body.data).toHaveProperty("checkInTime");
    });

    it("should prevent duplicate check-in on same day", async () => {
      const { token } = await registerAndLogin();

      await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      const res = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already checked in");
    });

    it("should check in as WFH when isWFH is true and user has permission", async () => {
      const User = (await import("../../../src/models/user.js")).default;
      const { token, user } = await registerAndLogin();

      // Enable WFH for user
      await User.findByIdAndUpdate(user._id, {
        wfhAllowed: true,
        totalWFHDays: 5,
        usedWFHDays: 0,
      });

      const res = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({ isWFH: true })
        .expect(200);

      expect(res.body.data.status).toBe("WFH");
    });

    it("should reject WFH check-in if user doesn't have WFH permission", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({ isWFH: true })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("WFH is not enabled");
    });

    it("should reject unauthenticated check-in", async () => {
      const res = await request
        .post("/api/v1/attendance/check-in")
        .send({})
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/attendance/check-out", () => {
    it("should check out successfully after check-in", async () => {
      const { token } = await registerAndLogin();

      await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      const res = await request
        .post("/api/v1/attendance/check-out")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("checkOutTime");
      expect(res.body.data).toHaveProperty("workingHours");
      expect(res.body.data).toHaveProperty("workingMinutes");
    });

    it("should reject check-out without check-in", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .post("/api/v1/attendance/check-out")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("No check-in record");
    });

    it("should prevent duplicate check-out", async () => {
      const { token } = await registerAndLogin();

      await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      await request
        .post("/api/v1/attendance/check-out")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      const res = await request
        .post("/api/v1/attendance/check-out")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.message).toContain("already checked out");
    });
  });

  describe("GET /api/v1/attendance/my", () => {
    it("should return user's attendance records", async () => {
      const { token } = await registerAndLogin();

      // Check in first
      await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      const res = await request
        .get("/api/v1/attendance/my")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array for user with no attendance", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .get("/api/v1/attendance/my")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it("should filter by date range", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .get("/api/v1/attendance/my")
        .query({ fromDate: "2025-01-01", toDate: "2025-01-31" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/attendance/team — Role-Based Access", () => {
    it("should allow admin to view team attendance", async () => {
      const { token } = await createAdminUser();

      const res = await request
        .get("/api/v1/attendance/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("records");
      expect(res.body.data).toHaveProperty("stats");
      expect(res.body.data).toHaveProperty("pagination");
    });

    it("should allow manager to view team attendance", async () => {
      const { token } = await createManagerUser();

      const res = await request
        .get("/api/v1/attendance/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("should deny employee access to team attendance", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .get("/api/v1/attendance/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it("should support pagination parameters", async () => {
      const { token } = await createAdminUser();

      const res = await request
        .get("/api/v1/attendance/team")
        .query({ page: "1", limit: "5" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.pagination.limit).toBe(5);
    });

    it("should support search filter", async () => {
      const { token } = await createAdminUser();

      const res = await request
        .get("/api/v1/attendance/team")
        .query({ search: "NonExistentName" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.records).toHaveLength(0);
    });
  });

  describe("PUT /api/v1/attendance/:id — Admin Only", () => {
    it("should allow admin to update attendance record", async () => {
      const { token: empToken } = await registerAndLogin();
      const { token: adminToken } = await createAdminUser();

      // Employee checks in
      const checkInRes = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${empToken}`)
        .send({});

      const attendanceId = checkInRes.body.data._id;

      const res = await request
        .put(`/api/v1/attendance/${attendanceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ totalHours: 8, status: "Present" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.workingHours).toBe(8);
    });

    it("should deny employee from updating attendance", async () => {
      const { token } = await registerAndLogin();

      const res = await request
        .put("/api/v1/attendance/65a000000000000000000000")
        .set("Authorization", `Bearer ${token}`)
        .send({ totalHours: 8 })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent attendance ID", async () => {
      const { token } = await createAdminUser();

      const res = await request
        .put("/api/v1/attendance/65a000000000000000000000")
        .set("Authorization", `Bearer ${token}`)
        .send({ totalHours: 8 })
        .expect(404);

      expect(res.body.message).toContain("not found");
    });

    it("should validate status input", async () => {
      const { token: empToken } = await registerAndLogin();
      const { token: adminToken } = await createAdminUser();

      const checkInRes = await request
        .post("/api/v1/attendance/check-in")
        .set("Authorization", `Bearer ${empToken}`)
        .send({});

      const attendanceId = checkInRes.body.data._id;

      const res = await request
        .put(`/api/v1/attendance/${attendanceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "InvalidStatus" })
        .expect(400);

      expect(res.body.message).toContain("Invalid status");
    });
  });
});
