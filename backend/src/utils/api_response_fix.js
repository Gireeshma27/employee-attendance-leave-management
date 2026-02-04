/**
 * @description Standardized API response utility.
 * @module utils/api_response_fix
 */

/**
 * Sends a standardized success response.
 * @param {Object} res - Express response object.
 * @param {string} message - Success message.
 * @param {Object|Array|null} [data=null] - Payload data.
 * @param {number} [statusCode=200] - HTTP status code.
 * @returns {Object} res.status().json()
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
};

/**
 * Sends a standardized error response.
 * @param {Object} res - Express response object.
 * @param {string} message - Error message.
 * @param {string|null} [error=null] - Detailed error message or stack.
 * @param {number} [statusCode=500] - HTTP status code.
 * @returns {Object} res.status().json()
 */
const sendError = (res, message, error = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error:
      typeof error === "object"
        ? error.message || JSON.stringify(error)
        : error,
  });
};

export { sendSuccess, sendError };
export default { sendSuccess, sendError };
