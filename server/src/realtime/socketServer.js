import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { socketAuthMiddleware } from './socketAuth.js';
import { registerSocketEvents } from './socketEvents.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  logger.info('[Realtime Server] Initializing Socket.IO instance...');
  
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Socket-Id'],
    }
  });

  // Attach Authentication Middleware
  io.use(socketAuthMiddleware);

  // Attach Connection Event Handlers
  registerSocketEvents(io);

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    logger.warn('[Realtime Server] Requested Socket.IO instance before initialization.');
  }
  return ioInstance;
};
