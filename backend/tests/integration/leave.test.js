/**
 * Integration Tests: Leave Management API
 * Apply, approve, reject, cancel, list leave requests
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
    email: `${role.toLowerCase()}_${Date.now()}@example.com`,
    password: hashed,
    role,
    employeeId: `${role.substring(0, 3)}-${Date.now()}`,
    department: "Engineering",
    isActive: true,
    ...overrides,
  });
  const token = generateToken(user._id, user.email, user.role);
  return { user, token };
};

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const dayAfterTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
};

const validLeaveBody = (overrides = {}) => ({
  leaveType: "CL",
  fromDate: tomorrow(),
  toDate: dayAfterTomorrow(),
  numberOfDays: 2,
  reason: "Personal work",
  ...overrides,
});

// ─── TESTS ────────────────────────────────────────────────

describe("Leave API — /api/v1/leaves", () => {
  // ─── APPLY LEAVE ─────────────────────────────────────

  describe("POST /api/v1/leaves/apply", () => {
    it("should apply for leave successfully", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Pending");
      expect(res.body.data.leaveType).toBe("CL");
    });

    it("should reject leave with from date after to date", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody({
          fromDate: dayAfterTomorrow(),
          toDate: tomorrow(),
        }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject leave in the past", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody({
          fromDate: "2020-01-01",
          toDate: "2020-01-02",
        }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject leave with invalid leave type", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody({ leaveType: "INVALID" }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject leave with empty reason", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody({ reason: "" }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      await request
        .post("/api/v1/leaves/apply")
        .send(validLeaveBody())
        .expect(401);
    });

    it("should accept all valid leave types", async () => {
      for (const type of ["CL", "SL", "PL", "UL"]) {
        const { token } = await createTestUser("EMPLOYEE");

        const res = await request
          .post("/api/v1/leaves/apply")
          .set("Authorization", `Bearer ${token}`)
          .send(validLeaveBody({ leaveType: type }));

        expect(res.body.success).toBe(true);
      }
    });
  });

  // ─── MY LEAVES ───────────────────────────────────────

  describe("GET /api/v1/leaves/my", () => {
    it("should return user's leave requests with balances", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      // Apply for leave first
      await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody());

      const res = await request
        .get("/api/v1/leaves/my")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("records");
      expect(res.body.data).toHaveProperty("pagination");
      expect(res.body.data).toHaveProperty("balances");
      expect(res.body.data.balances).toHaveProperty("CL");
      expect(res.body.data.balances).toHaveProperty("SL");
      expect(res.body.data.balances).toHaveProperty("PL");
    });

    it("should filter by status", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/leaves/my")
        .query({ status: "Pending" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("should paginate results", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/leaves/my")
        .query({ page: "1", limit: "5" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  // ─── APPROVE/REJECT FLOW ────────────────────────────

  describe("Leave Approval Flow", () => {
    it("should complete full leave approval flow (apply → approve)", async () => {
      const { token: empToken } = await createTestUser("EMPLOYEE");
      const { token: mgrToken } = await createTestUser("MANAGER");

      // Step 1: Employee applies for leave
      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${empToken}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;
      expect(applyRes.body.data.status).toBe("Pending");

      // Step 2: Manager sees pending leaves
      const pendingRes = await request
        .get("/api/v1/leaves/pending")
        .set("Authorization", `Bearer ${mgrToken}`)
        .expect(200);

      expect(pendingRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Step 3: Manager approves leave
      const approveRes = await request
        .patch(`/api/v1/leaves/${leaveId}/approve`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .expect(200);

      expect(approveRes.body.data.status).toBe("Approved");
      expect(approveRes.body.data.approvedBy).toBeTruthy();
    });

    it("should complete full leave rejection flow (apply → reject)", async () => {
      const { token: empToken } = await createTestUser("EMPLOYEE");
      const { token: mgrToken } = await createTestUser("MANAGER");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${empToken}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      const rejectRes = await request
        .patch(`/api/v1/leaves/${leaveId}/reject`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .send({ rejectionReason: "Insufficient team coverage" })
        .expect(200);

      expect(rejectRes.body.data.status).toBe("Rejected");
    });

    it("should prevent approving already approved leave", async () => {
      const { token: empToken } = await createTestUser("EMPLOYEE");
      const { token: mgrToken } = await createTestUser("MANAGER");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${empToken}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      // First approval
      await request
        .patch(`/api/v1/leaves/${leaveId}/approve`)
        .set("Authorization", `Bearer ${mgrToken}`);

      // Second approval attempt
      const res = await request
        .patch(`/api/v1/leaves/${leaveId}/approve`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .expect(400);

      expect(res.body.message).toContain("Cannot approve");
    });

    it("should prevent rejecting already rejected leave", async () => {
      const { token: empToken } = await createTestUser("EMPLOYEE");
      const { token: mgrToken } = await createTestUser("MANAGER");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${empToken}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      await request
        .patch(`/api/v1/leaves/${leaveId}/reject`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .send({ rejectionReason: "Reason" });

      const res = await request
        .patch(`/api/v1/leaves/${leaveId}/reject`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .send({ rejectionReason: "Reason" })
        .expect(400);

      expect(res.body.message).toContain("Cannot reject");
    });
  });

  // ─── CANCEL LEAVE ────────────────────────────────────

  describe("DELETE /api/v1/leaves/:leaveId — Cancel Leave", () => {
    it("should allow employee to cancel own pending leave", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${token}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      const res = await request
        .delete(`/api/v1/leaves/${leaveId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("should prevent employee from cancelling another's leave", async () => {
      const { token: emp1Token } = await createTestUser("EMPLOYEE");
      const { token: emp2Token } = await createTestUser("EMPLOYEE");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${emp1Token}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      const res = await request
        .delete(`/api/v1/leaves/${leaveId}`)
        .set("Authorization", `Bearer ${emp2Token}`)
        .expect(403);

      expect(res.body.message).toContain("only cancel your own");
    });

    it("should return 404 for non-existent leave", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .delete("/api/v1/leaves/65a000000000000000000000")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toContain("not found");
    });
  });

  // ─── ROLE-BASED ACCESS ──────────────────────────────

  describe("Role-Based Access Control", () => {
    it("should deny employee access to pending leaves list", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/leaves/pending")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it("should deny employee access to admin leave list", async () => {
      const { token } = await createTestUser("EMPLOYEE");

      const res = await request
        .get("/api/v1/leaves/admin/all")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it("should deny manager access to admin-only leave list", async () => {
      const { token } = await createTestUser("MANAGER");

      const res = await request
        .get("/api/v1/leaves/admin/all")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it("should allow admin to view all leaves", async () => {
      const { token } = await createTestUser("ADMIN");

      const res = await request
        .get("/api/v1/leaves/admin/all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("leaves");
      expect(res.body.data).toHaveProperty("totalPending");
    });

    it("should deny employee from approving leave", async () => {
      const { token: empToken } = await createTestUser("EMPLOYEE");
      const { token: emp2Token } = await createTestUser("EMPLOYEE");

      const applyRes = await request
        .post("/api/v1/leaves/apply")
        .set("Authorization", `Bearer ${empToken}`)
        .send(validLeaveBody());

      const leaveId = applyRes.body.data._id;

      const res = await request
        .patch(`/api/v1/leaves/${leaveId}/approve`)
        .set("Authorization", `Bearer ${emp2Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
