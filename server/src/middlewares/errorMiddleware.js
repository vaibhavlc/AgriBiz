import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    logger.error('Unhandled server error on path %s: %s', req.path, err.stack);
  } else {
    logger.warn('Client request error on path %s (status %d): %s', req.path, statusCode, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
