import { sendError } from "#utils/api_response_fix";

/**
 * @description Authorization middleware for admin-only routes.
 * @module middlewares/isadmin
 */

/**
 * Middleware to verify user has administrative privileges.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    return sendError(
      res,
      "Access denied, admin privilege required",
      "Unauthorized",
      403,
    );
  }
};

export default isAdmin;
