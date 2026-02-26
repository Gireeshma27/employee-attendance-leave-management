/**
 * Unit Tests: Protect Middleware
 * Tests JWT authentication middleware
 */
import { jest } from "@jest/globals";

const mockVerify = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify },
}));

jest.unstable_mockModule("#models/user", () => ({
  default: { findById: jest.fn(() => ({ select: mockFindById })) },
}));

jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: { JWT_SECRET: "test-secret-key-min10" },
}));

// Use real api_response_fix
jest.unstable_mockModule("#utils/api_response_fix", () => ({
  sendError: jest.fn((res, message, error, statusCode) => {
    res.status(statusCode || 500).json({
      success: false,
      message,
      data: null,
      error,
    });
  }),
  sendSuccess: jest.fn(),
}));

const protectModule = await import("../../../src/middlewares/protectmiddleware.js");
const protect = protectModule.default;

const User = (await import("#models/user")).default;
const { sendError } = await import("#utils/api_response_fix");

describe("Protect Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should reject request without authorization header", async () => {
    await protect(req, res, next);

    expect(sendError).toHaveBeenCalledWith(
      res,
      "Not authorized, please log in",
      "Authentication required",
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request with non-Bearer authorization", async () => {
    req.headers.authorization = "Basic some-token";

    await protect(req, res, next);

    expect(sendError).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request with invalid token", async () => {
    req.headers.authorization = "Bearer invalid-token";
    mockVerify.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await protect(req, res, next);

    expect(sendError).toHaveBeenCalledWith(
      res,
      "Not authorized, token failed",
      "invalid signature",
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject if user no longer exists", async () => {
    req.headers.authorization = "Bearer valid-token";
    mockVerify.mockReturnValue({ id: "user123" });
    mockFindById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(sendError).toHaveBeenCalledWith(
      res,
      "User no longer exists",
      "User not found",
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user to request and call next on valid token", async () => {
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      role: "EMPLOYEE",
    };
    req.headers.authorization = "Bearer valid-token";
    mockVerify.mockReturnValue({ id: "user123" });
    mockFindById.mockResolvedValue(mockUser);

    await protect(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should handle expired token", async () => {
    req.headers.authorization = "Bearer expired-token";
    mockVerify.mockImplementation(() => {
      const err = new Error("jwt expired");
      err.name = "TokenExpiredError";
      throw err;
    });

    await protect(req, res, next);

    expect(sendError).toHaveBeenCalledWith(
      res,
      "Not authorized, token failed",
      "jwt expired",
      401
    );
  });
});
