/**
 * Unit Tests: JWT Utility
 * Tests for token generation, verification, and decoding
 */
import { jest } from "@jest/globals";

const mockSign = jest.fn();
const mockVerify = jest.fn();
const mockDecode = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: mockSign,
    verify: mockVerify,
    decode: mockDecode,
  },
}));

jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    JWT_SECRET: "test-secret-key-min10",
    JWT_EXPIRES_IN: "1h",
  },
}));

const { generateToken, verifyToken, decodeToken } = await import(
  "../../../src/utils/jwt.js"
);

describe("JWT Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      mockSign.mockReturnValue("mock-jwt-token");

      const token = generateToken("user123", "test@example.com", "EMPLOYEE");

      expect(mockSign).toHaveBeenCalledWith(
        { id: "user123", email: "test@example.com", role: "EMPLOYEE" },
        "test-secret-key-min10",
        { expiresIn: "1h" }
      );
      expect(token).toBe("mock-jwt-token");
    });

    it("should include user role in token payload", () => {
      mockSign.mockReturnValue("admin-token");

      generateToken("admin1", "admin@test.com", "ADMIN");

      expect(mockSign).toHaveBeenCalledWith(
        expect.objectContaining({ role: "ADMIN" }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it("should generate different tokens for different users", () => {
      mockSign.mockReturnValueOnce("token-1").mockReturnValueOnce("token-2");

      const token1 = generateToken("user1", "u1@test.com", "EMPLOYEE");
      const token2 = generateToken("user2", "u2@test.com", "MANAGER");

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const payload = {
        id: "user123",
        email: "test@example.com",
        role: "EMPLOYEE",
      };
      mockVerify.mockReturnValue(payload);

      const result = verifyToken("valid-token");

      expect(mockVerify).toHaveBeenCalledWith(
        "valid-token",
        "test-secret-key-min10"
      );
      expect(result).toEqual(payload);
    });

    it("should throw error for invalid token", () => {
      mockVerify.mockImplementation(() => {
        throw new Error("invalid signature");
      });

      expect(() => verifyToken("invalid-token")).toThrow(
        "Token verification failed"
      );
    });

    it("should throw error for expired token", () => {
      mockVerify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      expect(() => verifyToken("expired-token")).toThrow(
        "Token verification failed"
      );
    });
  });

  describe("decodeToken", () => {
    it("should decode a token without verification", () => {
      const payload = { id: "user123", role: "ADMIN" };
      mockDecode.mockReturnValue(payload);

      const result = decodeToken("any-token");

      expect(mockDecode).toHaveBeenCalledWith("any-token");
      expect(result).toEqual(payload);
    });

    it("should return null for invalid token format", () => {
      mockDecode.mockImplementation(() => {
        throw new Error("invalid");
      });

      const result = decodeToken("garbage");

      expect(result).toBeNull();
    });
  });
});
