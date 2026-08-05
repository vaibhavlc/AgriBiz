import { getIO } from './socketServer.js';
import { getCompanyRoom } from './socketRooms.js';
import logger from '../config/logger.js';

class SocketEmitter {
  publishSyncEvent({ companyId, module, action, recordId, updatedAt, senderUserId, senderDeviceId, senderSocketId, version }) {
    const io = getIO();
    const timestamp = new Date().toISOString();

    if (!io) {
      console.log(`[${timestamp}] [SERVER_REALTIME_EMIT] ❌ ERROR: Socket.IO instance not initialized.`);
      logger.error('[Realtime Emitter] Failed to publishSyncEvent: Socket.IO not initialized.');
      return false;
    }

    if (!companyId) {
      console.log(`[${timestamp}] [SERVER_REALTIME_EMIT] ❌ ERROR: Missing companyId.`);
      logger.error('[Realtime Emitter] Failed to publishSyncEvent: Missing companyId.');
      return false;
    }

    const room = getCompanyRoom(companyId);
    const roomSockets = Array.from(io.sockets.adapter.rooms.get(room) || []);
    const socketCount = roomSockets.length;

    const broadcastPayload = {
      module,
      action,
      recordId,
      companyId,
      version: version || 1,
      updatedAt: updatedAt || new Date().toISOString(),
      senderUserId: senderUserId || null,
      senderDeviceId: senderDeviceId || null,
      senderSocketId: senderSocketId || null
    };

    console.log(`[${timestamp}] [SERVER_REALTIME_EMIT] Event: sync:data-changed | Room: "${room}" | Sockets In Room Count: ${socketCount} | Room Sockets: [${roomSockets.join(', ')}] | Sender Socket: ${senderSocketId || 'N/A'}`);
    logger.info(`[Realtime Emitter] Publishing sync:data-changed event to room ${room} (${socketCount} sockets): %o`, broadcastPayload);
    
    io.to(room).emit('sync:data-changed', broadcastPayload);
    return true;
  }

  publishStaffEvent({ companyId, action, userId, senderUserId, senderSocketId, updatedAt }) {
    const io = getIO();
    const timestamp = new Date().toISOString();

    if (!io) {
      logger.error('[Realtime Emitter] Failed to publishStaffEvent: Socket.IO not initialized.');
      return false;
    }

    if (!companyId) {
      logger.error('[Realtime Emitter] Failed to publishStaffEvent: Missing companyId.');
      return false;
    }

    const room = getCompanyRoom(companyId);
    const roomSockets = Array.from(io.sockets.adapter.rooms.get(room) || []);
    const socketCount = roomSockets.length;

    const broadcastPayload = {
      action,
      userId,
      companyId,
      senderUserId: senderUserId || null,
      senderSocketId: senderSocketId || null,
      updatedAt: updatedAt || new Date().toISOString()
    };

    console.log(`[${timestamp}] [SERVER_REALTIME_EMIT] Event: sync:staff-changed | Room: "${room}" | Sockets Count: ${socketCount} | Sockets: [${roomSockets.join(', ')}]`);
    logger.info(`[Realtime Emitter] Publishing sync:staff-changed event to room ${room}: %o`, broadcastPayload);
    io.to(room).emit('sync:staff-changed', broadcastPayload);
    return true;
  }

  publishPresenceEvent({ companyId, userId, presenceStatus, senderUserId, senderSocketId, updatedAt }) {
    const io = getIO();
    const timestamp = new Date().toISOString();

    if (!io) {
      logger.error('[Realtime Emitter] Failed to publishPresenceEvent: Socket.IO not initialized.');
      return false;
    }

    if (!companyId) {
      logger.error('[Realtime Emitter] Failed to publishPresenceEvent: Missing companyId.');
      return false;
    }

    const room = getCompanyRoom(companyId);
    const roomSockets = Array.from(io.sockets.adapter.rooms.get(room) || []);
    const socketCount = roomSockets.length;

    const broadcastPayload = {
      userId,
      presenceStatus,
      companyId,
      senderUserId: senderUserId || null,
      senderSocketId: senderSocketId || null,
      updatedAt: updatedAt || new Date().toISOString()
    };

    console.log(`[${timestamp}] [SERVER_REALTIME_EMIT] Event: sync:presence-changed | Room: "${room}" | Sockets Count: ${socketCount}`);
    logger.info(`[Realtime Emitter] Publishing sync:presence-changed event to room ${room}: %o`, broadcastPayload);
    io.to(room).emit('sync:presence-changed', broadcastPayload);
    return true;
  }
}

export const socketEmitter = new SocketEmitter();
