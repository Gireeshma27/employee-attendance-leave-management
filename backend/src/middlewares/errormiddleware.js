import { sendError } from "#utils/api_response_fix";
import env from "../config/env.js";

/**
 * @description Centralized error handling middleware.
 * @module middlewares/errormiddleware
 */

/**
 * Global error handler for the application.
 * @param {Error} err - Error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 * @returns {Object} Standardized error response.
 */
const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Zod validation errors
  if (
    err.name === "ZodError" ||
    (err instanceof Error && err.name === "ZodError")
  ) {
    statusCode = 400;
    message = "Validation Error";
    const errors = Array.isArray(err.errors) ? err.errors : [];
    const formattedErrors = errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, message, formattedErrors, statusCode);
  }

  // Handle Mongoose cast errors
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  // Standardized error response
  return sendError(
    res,
    message,
    env.NODE_ENV === "development" ? err.stack : null,
    statusCode,
  );
};

export default globalErrorHandler;
