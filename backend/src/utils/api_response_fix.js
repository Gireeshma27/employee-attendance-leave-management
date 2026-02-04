const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
};

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
