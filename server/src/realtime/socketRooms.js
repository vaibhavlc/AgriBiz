import logger from '../config/logger.js';

export const getCompanyRoom = (companyId) => {
  return `company:${companyId}`;
};

export const joinCompanyRoom = (socket) => {
  const companyId = socket.user?.companyId;
  if (!companyId) {
    logger.warn(`[Realtime Rooms] Socket ${socket.id} has no company details to join room.`);
    return;
  }
  
  const room = getCompanyRoom(companyId);
  socket.join(room);
  logger.info(`[Realtime Rooms] Socket ${socket.id} (User: ${socket.user.userId}) joined room: ${room}`);
};

export const leaveCompanyRoom = (socket) => {
  const companyId = socket.user?.companyId;
  if (!companyId) return;
  
  const room = getCompanyRoom(companyId);
  socket.leave(room);
  logger.info(`[Realtime Rooms] Socket ${socket.id} left room: ${room}`);
};
