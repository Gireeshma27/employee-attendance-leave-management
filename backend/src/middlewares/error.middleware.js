import ApiResponse from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    const validationError = messages.join(', ');
    return ApiResponse.badRequest(res, validationError);
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const duplicateError = `${field} already exists. Please use a different value.`;
    return ApiResponse.conflict(res, duplicateError);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token.');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token has expired.');
  }

  // Generic error response
  return ApiResponse.error(res, statusCode, message);
};

export default errorHandler;
