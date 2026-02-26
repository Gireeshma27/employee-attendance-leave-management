/**
 * Unit Tests: isAdmin Middleware
 * Tests admin role authorization
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

const isAdminModule = await import(
  "../../../src/middlewares/isadminmiddleware.js"
);
const isAdmin = isAdminModule.default;
const { sendError } = await import("#utils/api_response_fix");

describe("isAdmin Middleware", () => {
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

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(sendError).not.toHaveBeenCalled();
  });

  it("should reject EMPLOYEE with 403", () => {
    req.user = { role: "EMPLOYEE" };

    isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalledWith(
      res,
      "Access denied, admin privilege required",
      "Unauthorized",
      403
    );
  });

  it("should reject MANAGER with 403", () => {
    req.user = { role: "MANAGER" };

    isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalledWith(
      res,
      "Access denied, admin privilege required",
      "Unauthorized",
      403
    );
  });

  it("should reject when user is null", () => {
    req.user = null;

    isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendError).toHaveBeenCalled();
  });

  it("should reject when user is undefined", () => {
    req.user = undefined;

    isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
