import { io, Socket } from 'socket.io-client';
import api from './api';
import { getDeviceId, pullRemoteUpdates, synchronizeLocalDatabase } from './syncEngine';

let socketInstance: Socket | null = null;
let connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let isListenersRegistered = false;

const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
};

const SOCKET_URL = getSocketURL();

export const getSocketStatus = (): boolean => {
  return socketInstance?.connected || false;
};

export const getConnectionState = () => connectionState;

const dispatchStatusUpdate = (state: typeof connectionState) => {
  connectionState = state;
  console.log(`[Realtime Socket] Connection state transitioned to: ${state}`);
  window.dispatchEvent(new CustomEvent('socket-status-changed', { 
    detail: { 
      connected: state === 'connected',
      state: state
    } 
  }));
};

export const initializeSocket = (): Socket | null => {
  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Realtime Socket] No authentication token found. Initialization postponed.');
    return null;
  }

  if (socketInstance) {
    if (socketInstance.connected) {
      return socketInstance;
    }
    console.log('[Realtime Socket] Reconnecting existing socket instance...');
    socketInstance.auth = { token, deviceId: getDeviceId() };
    socketInstance.connect();
    return socketInstance;
  }

  dispatchStatusUpdate('connecting');
  console.log(`[Realtime Socket] Establishing new WebSocket connection to ${SOCKET_URL}...`);

  const localDeviceId = getDeviceId();

  socketInstance = io(SOCKET_URL, {
    auth: { 
      token,
      deviceId: localDeviceId
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.2,
    timeout: 10000
  });

  registerSocketHandlers(localDeviceId);
  setupMobileWakeupHandlers();

  return socketInstance;
};

const registerSocketHandlers = (localDeviceId: string) => {
  if (!socketInstance || isListenersRegistered) return;

  socketInstance.on('connect', () => {
    dispatchStatusUpdate('connected');
    console.log('[Realtime Socket] Connected successfully. Socket ID:', socketInstance?.id);

    if (socketInstance?.id) {
      api.defaults.headers.common['X-Socket-Id'] = socketInstance.id;
      api.defaults.headers.common['X-Device-Id'] = localDeviceId;
    }

    // Immediately upload offline queue and pull latest changes upon connect
    synchronizeLocalDatabase();
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Realtime Socket] Disconnected from server. Reason:', reason);
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];

    if (reason === 'io server disconnect') {
      socketInstance?.connect();
    }
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Realtime Socket] Handshake/Connection error:', error.message);
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];
  });

  // REALTIME SYNCHRONIZATION EVENT BINDINGS
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
    console.log('[Realtime Socket] Event received: sync:data-changed', data);

    // Self-filtering: Ignore ONLY if the event originated from THIS exact socket connection
    const isSelfSocket = data.senderSocketId && socketInstance?.id && data.senderSocketId === socketInstance.id;
    const isSelfDeviceAndSocket = data.senderDeviceId && data.senderDeviceId === localDeviceId && isSelfSocket;

    if (isSelfSocket || isSelfDeviceAndSocket) {
      console.log('[Realtime Socket] Filtering out self-initiated socket event.');
      return;
    }

    console.log(`[Realtime Socket] Processing remote mutation (${data.action} on ${data.module}). Triggering targeted single-record pull...`);
    await pullRemoteUpdates({ module: data.module, recordId: data.recordId });
  });

  socketInstance.on('sync:staff-changed', (data: {
    action: string;
    userId: string;
    companyId: string;
    senderSocketId: string | null;
    updatedAt: string;
  }) => {
    console.log('[Realtime Socket] Event received: sync:staff-changed', data);

    const isSelfSocket = data.senderSocketId && socketInstance?.id && data.senderSocketId === socketInstance.id;
    if (isSelfSocket) {
      console.log('[Realtime Socket] Filtering out self-initiated staff change event.');
      return;
    }

    console.log('[Realtime Socket] Dispatching staff-list-changed DOM event.');
    window.dispatchEvent(new CustomEvent('staff-list-changed'));
  });

  socketInstance.on('sync:presence-changed', (data: {
    userId: string;
    presenceStatus: string;
    companyId: string;
    senderSocketId: string | null;
    updatedAt: string;
  }) => {
    console.log(`[Realtime Socket] Event received: sync:presence-changed -> User ${data.userId} status: ${data.presenceStatus}`);
    window.dispatchEvent(new CustomEvent('staff-presence-changed', { detail: data }));
  });

  isListenersRegistered = true;
};

// Handle mobile browser wake-up, tab visibility change, network reconnect
let isMobileWakeupBound = false;

const setupMobileWakeupHandlers = () => {
  if (isMobileWakeupBound) return;

  const handleWakeup = () => {
    console.log('[Realtime Socket] Mobile/Tab wake-up detected. Checking connection & triggering pull updates...');
    if (socketInstance && !socketInstance.connected) {
      socketInstance.connect();
    } else {
      pullRemoteUpdates();
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleWakeup();
    }
  });

  window.addEventListener('pageshow', handleWakeup);
  window.addEventListener('focus', handleWakeup);
  window.addEventListener('online', handleWakeup);

  isMobileWakeupBound = true;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('[Realtime Socket] Terminating socket connection...');
    socketInstance.disconnect();
    socketInstance = null;
    isListenersRegistered = false;
    dispatchStatusUpdate('disconnected');
    delete api.defaults.headers.common['X-Socket-Id'];
    delete api.defaults.headers.common['X-Device-Id'];
  }
};
