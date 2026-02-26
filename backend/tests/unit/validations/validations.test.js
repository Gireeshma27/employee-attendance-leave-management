/**
 * Unit Tests: Validation Schemas
 * Tests Zod validation schemas for auth, leave, user, attendance
 */
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../../src/validations/authvalidation.js";

import {
  applyLeaveSchema,
  rejectLeaveSchema,
  getLeavesSchema,
} from "../../../src/validations/leavevalidation.js";

import { getAttendanceSchema } from "../../../src/validations/attendancevalidation.js";

describe("Validation Schemas", () => {
  // ─── AUTH VALIDATIONS ───────────────────────────────────

  describe("Auth — signupSchema", () => {
    it("should pass with valid signup data", () => {
      const result = signupSchema.safeParse({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with password mismatch", () => {
      const result = signupSchema.safeParse({
        body: {
          name: "John",
          email: "john@example.com",
          password: "Password123",
          confirmPassword: "Different123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with invalid email", () => {
      const result = signupSchema.safeParse({
        body: {
          name: "John",
          email: "not-an-email",
          password: "Password123",
          confirmPassword: "Password123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with short name", () => {
      const result = signupSchema.safeParse({
        body: {
          name: "J",
          email: "john@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with short password (< 6 chars)", () => {
      const result = signupSchema.safeParse({
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "12345",
          confirmPassword: "12345",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with missing fields", () => {
      const result = signupSchema.safeParse({ body: {} });
      expect(result.success).toBe(false);
    });
  });

  describe("Auth — loginSchema", () => {
    it("should pass with valid login data", () => {
      const result = loginSchema.safeParse({
        body: { email: "john@example.com", password: "Password123" },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with empty password", () => {
      const result = loginSchema.safeParse({
        body: { email: "john@example.com", password: "" },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with invalid email format", () => {
      const result = loginSchema.safeParse({
        body: { email: "invalid", password: "password" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Auth — forgotPasswordSchema", () => {
    it("should pass with valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        body: { email: "test@example.com" },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with missing email", () => {
      const result = forgotPasswordSchema.safeParse({ body: {} });
      expect(result.success).toBe(false);
    });
  });

  describe("Auth — resetPasswordSchema", () => {
    it("should pass with valid reset data", () => {
      const result = resetPasswordSchema.safeParse({
        body: {
          token: "valid-token-string",
          newPassword: "NewPass123",
          confirmPassword: "NewPass123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail when passwords don't match", () => {
      const result = resetPasswordSchema.safeParse({
        body: {
          token: "valid-token",
          newPassword: "NewPass123",
          confirmPassword: "Different123",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with empty token", () => {
      const result = resetPasswordSchema.safeParse({
        body: {
          token: "",
          newPassword: "NewPass123",
          confirmPassword: "NewPass123",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── LEAVE VALIDATIONS ─────────────────────────────────

  describe("Leave — applyLeaveSchema", () => {
    it("should pass with valid leave application", () => {
      const result = applyLeaveSchema.safeParse({
        body: {
          leaveType: "CL",
          fromDate: "2026-03-01",
          toDate: "2026-03-02",
          numberOfDays: 2,
          reason: "Personal work",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with invalid leave type", () => {
      const result = applyLeaveSchema.safeParse({
        body: {
          leaveType: "INVALID",
          fromDate: "2026-03-01",
          toDate: "2026-03-02",
          numberOfDays: 2,
          reason: "Test",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with negative number of days", () => {
      const result = applyLeaveSchema.safeParse({
        body: {
          leaveType: "CL",
          fromDate: "2026-03-01",
          toDate: "2026-03-02",
          numberOfDays: -1,
          reason: "Test",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should fail with empty reason", () => {
      const result = applyLeaveSchema.safeParse({
        body: {
          leaveType: "SL",
          fromDate: "2026-03-01",
          toDate: "2026-03-02",
          numberOfDays: 1,
          reason: "",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept all valid leave types (CL, SL, PL, UL)", () => {
      for (const type of ["CL", "SL", "PL", "UL"]) {
        const result = applyLeaveSchema.safeParse({
          body: {
            leaveType: type,
            fromDate: "2026-03-01",
            toDate: "2026-03-02",
            numberOfDays: 1,
            reason: "Test",
          },
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Leave — rejectLeaveSchema", () => {
    it("should pass with valid rejection reason", () => {
      const result = rejectLeaveSchema.safeParse({
        body: { rejectionReason: "Insufficient leave balance" },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with empty rejection reason", () => {
      const result = rejectLeaveSchema.safeParse({
        body: { rejectionReason: "" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Leave — getLeavesSchema", () => {
    it("should pass with valid query parameters", () => {
      const result = getLeavesSchema.safeParse({
        query: { status: "Pending", page: "1", limit: "10" },
      });
      expect(result.success).toBe(true);
    });

    it("should pass with empty query", () => {
      const result = getLeavesSchema.safeParse({ query: {} });
      expect(result.success).toBe(true);
    });

    it("should fail with invalid status", () => {
      const result = getLeavesSchema.safeParse({
        query: { status: "InvalidStatus" },
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── ATTENDANCE VALIDATIONS ─────────────────────────────

  describe("Attendance — getAttendanceSchema", () => {
    it("should pass with valid date range query", () => {
      const result = getAttendanceSchema.safeParse({
        query: {
          fromDate: "2026-01-01",
          toDate: "2026-01-31",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should pass with empty query", () => {
      const result = getAttendanceSchema.safeParse({ query: {} });
      expect(result.success).toBe(true);
    });

    it("should pass with valid status filter", () => {
      const result = getAttendanceSchema.safeParse({
        query: { status: "Present" },
      });
      expect(result.success).toBe(true);
    });

    it("should pass with empty string status (preprocessed to undefined)", () => {
      const result = getAttendanceSchema.safeParse({
        query: { status: "" },
      });
      expect(result.success).toBe(true);
    });

    it("should fail with invalid status value", () => {
      const result = getAttendanceSchema.safeParse({
        query: { status: "InvalidStatus" },
      });
      expect(result.success).toBe(false);
    });

    it("should pass with valid role filter", () => {
      const result = getAttendanceSchema.safeParse({
        query: { role: "EMPLOYEE" },
      });
      expect(result.success).toBe(true);
    });
  });
});
