/**
 * Standardized API Response Handler
 * 
 * All API responses follow this format:
 * 
 * Success (with data):
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "error": null,
 *   "data": <actual response payload>,
 *   "message": "Operation successful"
 * }
 * 
 * Success (message only):
 * {
 *   "statusCode": 200,
 *   "success": true,
 *   "error": null,
 *   "message": "Operation successful",
 *   "data": null
 * }
 * 
 * Error:
 * {
 *   "statusCode": 400,
 *   "success": false,
 *   "error": "Readable error message",
 *   "data": null,
 *   "message": "Readable error message"
 * }
 */

export class ApiResponse {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {string} message - Success message
   * @param {any} data - Response data payload
   */
  static success(res, statusCode = 200, message = 'Operation successful', data = null) {
    return res.status(statusCode).json({
      statusCode,
      success: true,
      error: null,
      message,
      data: data || null,
    });
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} error - Error message
   */
  static error(res, statusCode = 500, error = 'Internal Server Error') {
    return res.status(statusCode).json({
      statusCode,
      success: false,
      error,
      message: error,
      data: null,
    });
  }

  /**
   * Send a success response without data
   * Useful for operations that only return a message
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   */
  static ok(res, statusCode = 200, message = 'Operation successful') {
    return res.status(statusCode).json({
      statusCode,
      success: true,
      error: null,
      message,
      data: null,
    });
  }

  /**
   * Send a created response (201)
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {any} data - Response data payload
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, 201, message, data);
  }

  /**
   * Send a no content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send a bad request response (400)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static badRequest(res, error = 'Bad Request') {
    return this.error(res, 400, error);
  }

  /**
   * Send an unauthorized response (401)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static unauthorized(res, error = 'Unauthorized') {
    return this.error(res, 401, error);
  }

  /**
   * Send a forbidden response (403)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static forbidden(res, error = 'Forbidden') {
    return this.error(res, 403, error);
  }

  /**
   * Send a not found response (404)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static notFound(res, error = 'Resource not found') {
    return this.error(res, 404, error);
  }

  /**
   * Send a conflict response (409)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static conflict(res, error = 'Resource already exists') {
    return this.error(res, 409, error);
  }

  /**
   * Send a server error response (500)
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   */
  static serverError(res, error = 'Internal Server Error') {
    return this.error(res, 500, error);
  }
}

export default ApiResponse;
