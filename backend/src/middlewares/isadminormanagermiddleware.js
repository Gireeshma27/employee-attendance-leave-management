import { sendError } from "#utils/api_response_fix";

/**
 * @description Authorization middleware for admin or manager routes.
 * @module middlewares/isadminormanager
 */

/**
 * Middleware to verify user has administrative or managerial privileges.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
const isAdminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === "ADMIN" || req.user.role === "MANAGER")) {
    next();
  } else {
    return sendError(
      res,
      "Access denied, admin or manager privilege required",
      "Forbidden",
      403,
    );
  }
};

export default isAdminOrManager;