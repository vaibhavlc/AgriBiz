import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from './logger.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    perMessageDeflate: false,
    httpCompression: false,
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        logger.warn('[SOCKET] Authentication failed: Missing token');
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('[SOCKET] Authentication failed: %s', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const companyId = socket.user?.companyId;
    const userId = socket.user?.userId;
    const role = socket.user?.role;

    if (!companyId) {
      logger.warn('[SOCKET] Connection rejected: No companyId in token for socket %s', socket.id);
      socket.disconnect(true);
      return;
    }

    const room = `company:${companyId}`;
    socket.join(room);

    logger.info(
      '[SOCKET] Connected: %s | User: %s | Role: %s | Room: %s',
      socket.id,
      userId,
      role,
      room
    );

    socket.on('disconnect', (reason) => {
      logger.info('[SOCKET] Disconnected: %s | Reason: %s', socket.id, reason);
    });
  });

  return io;
};

export const getIO = () => io;

export const emitDataChange = ({ companyId, module, action, recordId, record = null, senderSocketId }) => {
  if (!io) {
    logger.warn('[SOCKET] Cannot emit data_change: Socket.IO not initialized');
    return;
  }

  if (!companyId) {
    logger.warn('[SOCKET] Cannot emit data_change: Missing companyId');
    return;
  }

  const room = `company:${companyId}`;
  const eventPayload = {
    companyId,
    module: module || 'General',
    action: action || 'UPDATE',
    recordId: recordId || null,
    record: record || null,
    updatedAt: Date.now(),
    senderSocketId: senderSocketId || null,
  };

  logger.info(
    `[SOCKET] Emitting data_change\ncompany=${companyId}\nmodule=${eventPayload.module}\naction=${eventPayload.action}\nsender=${eventPayload.senderSocketId || 'none'}`
  );

  io.to(room).emit('data_change', eventPayload);
};
