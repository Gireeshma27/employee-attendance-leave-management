/**
 * Unit Tests: Password Utility
 * Tests for password hashing and comparison functions
 */
import { jest } from "@jest/globals";

// Mock bcryptjs before importing
const mockGenSalt = jest.fn();
const mockHash = jest.fn();
const mockCompare = jest.fn();

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    genSalt: mockGenSalt,
    hash: mockHash,
    compare: mockCompare,
  },
}));

const { hashPassword, comparePassword } = await import(
  "../../../src/utils/password.js"
);

describe("Password Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      mockGenSalt.mockResolvedValue("mock-salt");
      mockHash.mockResolvedValue("hashed-password-123");

      const result = await hashPassword("MyPassword123");

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith("MyPassword123", "mock-salt");
      expect(result).toBe("hashed-password-123");
    });

    it("should throw an error if hashing fails", async () => {
      mockGenSalt.mockRejectedValue(new Error("Salt generation failed"));

      await expect(hashPassword("password")).rejects.toThrow(
        "Password hashing failed"
      );
    });

    it("should throw if bcrypt hash fails", async () => {
      mockGenSalt.mockResolvedValue("salt");
      mockHash.mockRejectedValue(new Error("Hash failed"));

      await expect(hashPassword("password")).rejects.toThrow(
        "Password hashing failed"
      );
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching passwords", async () => {
      mockCompare.mockResolvedValue(true);

      const result = await comparePassword("password", "hashed-password");

      expect(mockCompare).toHaveBeenCalledWith("password", "hashed-password");
      expect(result).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      mockCompare.mockResolvedValue(false);

      const result = await comparePassword("wrong-password", "hashed-password");

      expect(result).toBe(false);
    });

    it("should throw an error if comparison fails", async () => {
      mockCompare.mockRejectedValue(new Error("Comparison error"));

      await expect(
        comparePassword("password", "hashed")
      ).rejects.toThrow("Password comparison failed");
    });
  });
});
