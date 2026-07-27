import { io, Socket } from 'socket.io-client';
import api from './api';
import { getDeviceId, pullRemoteUpdates, synchronizeLocalDatabase } from './syncEngine';

let socketInstance: Socket | null = null;
let connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
const BASE_RECONNECT_DELAY = 1000;
let heartbeatInterval: any = null;

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;

export const getSocketStatus = (): boolean => {
  return socketInstance?.connected || false;
};

export const getConnectionState = () => connectionState;

const dispatchStatusUpdate = (state: typeof connectionState) => {
  connectionState = state;
  console.log(`[Socket Client] Connection state transitioned to: ${state}`);
  window.dispatchEvent(new CustomEvent('socket-status-changed', { 
    detail: { 
      connected: state === 'connected',
      state: state
    } 
  }));
};

export const initializeSocket = (): Socket | null => {
  if (socketInstance) {
    if (socketInstance.connected) return socketInstance;
    socketInstance.connect();
    return socketInstance;
  }

  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Socket Client] No authentication token found. Postponing initialization.');
    return null;
  }

  dispatchStatusUpdate('connecting');
  console.log(`[Socket Client] Initializing fresh connection to ${SOCKET_URL}...`);

  const localDeviceId = getDeviceId();

  socketInstance = io(SOCKET_URL, {
    auth: { 
      token,
      deviceId: localDeviceId
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: BASE_RECONNECT_DELAY,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 15000
  });

  socketInstance.on('connect', () => {
    reconnectAttempts = 0;
    dispatchStatusUpdate('connected');
    console.log('[Socket Client] Connected. Socket ID:', socketInstance?.id);

    if (socketInstance?.id) {
      api.defaults.headers.common['X-Socket-Id'] = socketInstance.id;
    }

    startHeartbeatMonitor();
    synchronizeLocalDatabase();
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket Client] Disconnected from server. Reason:', reason);
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];
    stopHeartbeatMonitor();

    if (reason === 'io server disconnect') {
      socketInstance?.connect();
    }
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Socket Client] Connection error:', error.message);
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];
    
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Socket Client] Exceeded maximum reconnect attempts. Halting auto-connect.');
      socketInstance?.disconnect();
    }
  });

  // REALTIME SYNCHRONIZATION BINDINGS
  socketInstance.on('sync:data-changed', async (data: {
    module: string;
    action: string;
    recordId: string;
    companyId: string;
    updatedAt: string;
    senderUserId: string | null;
    senderDeviceId: string | null;
    senderSocketId: string | null;
  }) => {
    console.log('[Socket Client] Received sync:data-changed notification:', data);

    const isSelf = (data.senderSocketId && data.senderSocketId === socketInstance?.id) ||
                   (data.senderDeviceId && data.senderDeviceId === localDeviceId);

    if (isSelf) {
      console.log('[Socket Client] Skipping sync event initiated by self connection/device.');
      return;
    }

    console.log(`[Socket Client] Triggering pullRemoteUpdates for remote edit: ${data.action} on ${data.module}`);
    await pullRemoteUpdates();
  });

  socketInstance.on('sync:staff-changed', (data: {
    action: string;
    userId: string;
    companyId: string;
    senderSocketId: string | null;
    updatedAt: string;
  }) => {
    console.log('[Socket Client] Received sync:staff-changed notification:', data);

    if (data.senderSocketId && data.senderSocketId === socketInstance?.id) {
      console.log('[Socket Client] Skipping staff change event initiated by self.');
      return;
    }

    console.log(`[Socket Client] Staff data modified on server. Dispatching staff-list-changed event.`);
    window.dispatchEvent(new CustomEvent('staff-list-changed'));
  });

  socketInstance.on('sync:presence-changed', (data: {
    userId: string;
    presenceStatus: string;
    companyId: string;
    senderSocketId: string | null;
    updatedAt: string;
  }) => {
    console.log('[Socket Client] Received sync:presence-changed notification:', data);

    if (data.senderSocketId && data.senderSocketId === socketInstance?.id) {
      console.log('[Socket Client] Skipping presence change event initiated by self.');
      return;
    }

    console.log(`[Socket Client] Presence state shift: User ${data.userId} -> ${data.presenceStatus}`);
    window.dispatchEvent(new CustomEvent('staff-presence-changed', { detail: data }));
  });

  return socketInstance;
};

const startHeartbeatMonitor = () => {
  stopHeartbeatMonitor();
  heartbeatInterval = setInterval(() => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('heartbeat', { timestamp: Date.now() });
    }
  }, 30000);
};

const stopHeartbeatMonitor = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('[Socket Client] Manual socket disconnection requested.');
    stopHeartbeatMonitor();
    socketInstance.disconnect();
    socketInstance = null;
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];
  }
};
