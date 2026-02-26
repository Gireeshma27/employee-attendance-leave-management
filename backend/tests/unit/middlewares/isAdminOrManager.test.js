/**
 * Unit Tests: isAdminOrManager Middleware
 * Tests admin or manager role authorization
 */
import { jest } from "@jest/globals";

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

const isAdminOrManagerModule = await import(
  "../../../src/middlewares/isadminormanagermiddleware.js"
);
const isAdminOrManager = isAdminOrManagerModule.default;
const { sendError } = await import("#utils/api_response_fix");

describe("isAdminOrManager Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should call next() when user is ADMIN", () => {
    req.user = { role: "ADMIN" };

    isAdminOrManager(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(sendError).not.toHaveBeenCalled();
  });

  it("should call next() when user is MANAGER", () => {
    req.user = { role: "MANAGER" };

    isAdminOrManager(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(sendError).not.toHaveBeenCalled();
  });

  it("should reject EMPLOYEE with 403", () => {
    req.user = { role: "EMPLOYEE" };

    isAdminOrManager(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalledWith(
      res,
      "Access denied, admin or manager privilege required",
      "Unauthorized",
      403
    );
  });

  it("should reject when user has no role", () => {
    req.user = {};

    isAdminOrManager(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalled();
  });

  it("should reject when user is null", () => {
    req.user = null;

    isAdminOrManager(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it("should be case-sensitive — lowercase 'admin' should be rejected", () => {
    req.user = { role: "admin" };

    isAdminOrManager(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalled();
  });
});
