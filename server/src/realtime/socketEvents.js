import logger from '../config/logger.js';
import { joinCompanyRoom } from './socketRooms.js';

export const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    logger.info(`[Realtime Events] Socket connection established: Socket ID = ${socket.id}`);
    
    // Automatically join the company isolation room
    joinCompanyRoom(socket);

    socket.on('disconnect', (reason) => {
      logger.info(`[Realtime Events] Socket disconnected: Socket ID = ${socket.id}. Reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`[Realtime Events] Socket error on ID ${socket.id}: %s`, err.message);
    });
  });
};
