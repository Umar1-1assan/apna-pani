/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors,
      success: false,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      statusCode: 409,
      message: `A record with this ${field} already exists`,
      data: null,
      success: false,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      statusCode: 400,
      message: `Invalid format for ${err.path}`,
      success: false,
      timestamp: new Date().toISOString()
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid JSON',
      success: false,
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const response = {
    statusCode: status,
    message,
    success: false,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      stack: err.stack
    };
  }

  res.status(status).json(response);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
    success: false,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
