import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode;
  let message = err.message || 'An unexpected server error occurred.';

  // Map Mongoose and MongoDB specific errors if statusCode wasn't explicitly set
  if (!statusCode) {
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = `Validation Error: ${Object.values(err.errors || {}).map(e => e.message).join(', ') || err.message}`;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ID format for field '${err.path}'`;
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
      statusCode = 409;
      message = 'Duplicate record constraint violation.';
    } else if (/not found/i.test(message)) {
      statusCode = 404;
    } else if (/unauthorized|token|permission|forbidden/i.test(message)) {
      statusCode = 401;
    } else {
      statusCode = 500;
    }
  }

  // Detailed server-side logging with complete stack, error name, and MongoDB codes
  const logDetails = {
    name: err.name,
    code: err.code,
    codeName: err.codeName,
    path: req.originalUrl || req.path,
    method: req.method,
    message: err.message,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('Unhandled server error on %s %s | Name: %s | Code: %s | Message: %s\nStack: %s',
      req.method, req.path, err.name || 'Error', err.code || 'N/A', err.message, err.stack);
  } else {
    logger.warn('Client request error on %s %s (status %d) | Name: %s | Message: %s',
      req.method, req.path, statusCode, err.name || 'Error', err.message);
  }

  // Send client response
  res.status(statusCode).json({
    success: false,
    message: message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack, details: logDetails } : {}),
  });
};
