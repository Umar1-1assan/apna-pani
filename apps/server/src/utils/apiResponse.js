/**
 * Standardized API Response Format
 */

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Success response
 */
const sendSuccess = (res, statusCode, data, message = 'Request successful') => {
  return res.status(statusCode).json(
    new ApiResponse(statusCode, data, message)
  );
};

/**
 * Error response
 */
const sendError = (res, statusCode, message = 'An error occurred', data = null) => {
  return res.status(statusCode).json({
    statusCode,
    data,
    message,
    success: false,
    timestamp: new Date().toISOString()
  });
};

/**
 * Helpers for common status codes
 */
const ok = (res, data, message = 'Request successful') => sendSuccess(res, 200, data, message);
const created = (res, data, message = 'Resource created successfully') => sendSuccess(res, 201, data, message);
const noContent = (res) => res.status(204).send();
const badRequest = (res, message = 'Bad request', data = null) => sendError(res, 400, message, data);
const unauthorized = (res, message = 'Unauthorized access') => sendError(res, 401, message);
const forbidden = (res, message = 'Access forbidden') => sendError(res, 403, message);
const notFound = (res, message = 'Resource not found') => sendError(res, 404, message);
const conflict = (res, message = 'Conflict with existing resource') => sendError(res, 409, message);
const serverError = (res, message = 'Internal server error', error = null) => {
  const data = process.env.NODE_ENV === 'development' ? { error: error?.message } : null;
  return sendError(res, 500, message, data);
};

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError
};
