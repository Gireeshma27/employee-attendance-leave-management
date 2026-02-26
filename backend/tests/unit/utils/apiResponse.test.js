/**
 * Unit Tests: API Response Utility
 * Tests for sendSuccess and sendError helper functions
 */
import { sendSuccess, sendError } from "../../../src/utils/api_response_fix.js";

describe("API Response Utility", () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("sendSuccess", () => {
    it("should send a success response with default 200 status code", () => {
      sendSuccess(mockRes, "Operation successful", { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Operation successful",
        data: { id: 1 },
        error: null,
      });
    });

    it("should send a success response with custom status code", () => {
      sendSuccess(mockRes, "Created", { id: 2 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Created",
        data: { id: 2 },
        error: null,
      });
    });

    it("should send a success response with null data by default", () => {
      sendSuccess(mockRes, "Done");

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Done",
        data: null,
        error: null,
      });
    });

    it("should handle array data", () => {
      sendSuccess(mockRes, "List retrieved", [1, 2, 3]);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "List retrieved",
        data: [1, 2, 3],
        error: null,
      });
    });
  });

  describe("sendError", () => {
    it("should send an error response with default 500 status code", () => {
      sendError(mockRes, "Something went wrong");

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
        data: null,
        error: null,
      });
    });

    it("should send an error response with custom status code", () => {
      sendError(mockRes, "Not found", "Resource not found", 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
        data: null,
        error: "Resource not found",
      });
    });

    it("should handle error object with message property", () => {
      sendError(mockRes, "Failed", { message: "DB connection lost" }, 500);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
        data: null,
        error: "DB connection lost",
      });
    });

    it("should handle error object without message property", () => {
      sendError(mockRes, "Failed", { code: "ERR_001" }, 500);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed",
        data: null,
        error: '{"code":"ERR_001"}',
      });
    });

    it("should send 401 for unauthorized access", () => {
      sendError(mockRes, "Unauthorized", "Authentication required", 401);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should send 403 for forbidden access", () => {
      sendError(mockRes, "Forbidden", "Admin required", 403);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
