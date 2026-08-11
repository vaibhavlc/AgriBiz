import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../config/logger.js';

export const authenticate = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      logger.warn('Authentication failed: Missing authorization token');
      return res.status(401).json({ success: false, message: 'Authorization token is required.' });
    }

    const decoded = verifyAccessToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication failed: Token verification error: %s', error.message);
    let message = 'Access token is invalid or expired.';
    if (error.name === 'TokenExpiredError') {
      message = 'Access token has expired.';
    }
    return res.status(401).json({ success: false, message });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(
        'Authorization failed: User %s with role %s attempted to access resource requiring %s',
        req.user?.userId || 'unknown',
        req.user?.role || 'none',
        roles.join(', ')
      );
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};
