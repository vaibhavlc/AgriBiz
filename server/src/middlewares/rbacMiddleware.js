import logger from '../config/logger.js';

/**
 * Middleware to restrict access to endpoints based on user roles.
 * 
 * @param {Array<string>} allowedRoles - List of roles permitted to access the route.
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('RBAC Blocked: Request missing authenticated user object');
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login again.' });
    }

    const { role, name } = req.user;
    if (!allowedRoles.includes(role)) {
      logger.warn(`RBAC Forbidden: User '${name}' with role '${role}' attempted unauthorized access to ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${role}' does not have permission to perform this action.`,
      });
    }

    next();
  };
};
