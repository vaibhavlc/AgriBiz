import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../config/logger.js';

export const socketAuthMiddleware = (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    if (!authHeader) {
      logger.warn('[Realtime Auth] Connection rejected: token missing.');
      return next(new Error('Authentication error: Token missing'));
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = verifyAccessToken(token);
    
    // Extract userId, companyId, role
    const { userId, companyId, role } = decoded;
    const deviceId = socket.handshake.query?.deviceId || socket.handshake.auth?.deviceId || null;
    
    if (!userId || !companyId) {
      logger.warn('[Realtime Auth] Connection rejected: invalid token claims.');
      return next(new Error('Authentication error: Invalid token claims'));
    }

    // Attach metadata to socket session
    socket.user = {
      userId,
      companyId,
      role,
      deviceId
    };

    logger.info(`[Realtime Auth] Socket ${socket.id} authenticated. User: ${userId}, Company: ${companyId}, Role: ${role}, Device: ${deviceId}`);
    next();
  } catch (err) {
    logger.warn('[Realtime Auth] Connection rejected: verification failed. %s', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};
