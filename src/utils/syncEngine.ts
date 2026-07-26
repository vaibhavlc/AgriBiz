import { db } from '../db/db';
import api from './api';

let isSyncing = false;

/**
 * Reads offline operations from Dexie and posts them to the backend sync batch endpoint.
 */
export const synchronizeLocalDatabase = async () => {
  if (isSyncing) return;

  // 1. Verify network connectivity
  if (!navigator.onLine) {
    console.log('[Sync Engine] Device is offline. Sync skipped.');
    return;
  }

  // 2. Verify authorization
  const token = localStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Sync Engine] User is not authenticated. Sync postponed.');
    return;
  }

  try {
    const queuedOps = await db.syncQueue.orderBy('id').toArray();
    if (queuedOps.length === 0) {
      return;
    }

    isSyncing = true;
    console.log(`[Sync Engine] Found ${queuedOps.length} offline operations. Initiating batch upload...`);

    const operationsPayload = queuedOps.map(op => ({
      action: op.action,
      module: op.module,
      recordId: op.recordId,
      payload: op.payload,
      timestamp: op.timestamp
    }));

    const response = await api.post('/sync', { operations: operationsPayload });
    const { success, results } = response.data;

    if (success && Array.isArray(results)) {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const originalOp = queuedOps[i];

        if (result.success) {
          if (originalOp.id !== undefined) {
            await db.syncQueue.delete(originalOp.id);
          }
          console.log(`[Sync Engine] Successfully synced ${originalOp.action} on ${originalOp.module} (${originalOp.recordId})`);
        } else {
          console.error(`[Sync Engine] Failed to sync ${originalOp.action} on ${originalOp.module} (${originalOp.recordId}): ${result.message}`);
          
          // Discard invalid items to prevent blocking the remainder of the synchronization queue
          if (originalOp.id !== undefined) {
            await db.syncQueue.delete(originalOp.id);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Sync Engine] Error running database sync batch:', error.message || error);
  } finally {
    isSyncing = false;
  }
};

/**
 * Subscribes to network events and runs periodic check intervals.
 */
export const startSyncDaemon = () => {
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network restored. Firing sync daemon...');
    synchronizeLocalDatabase();
  });

  // Run periodic synchronization check every 30 seconds
  setInterval(() => {
    synchronizeLocalDatabase();
  }, 30000);

  // Trigger sync on boot
  synchronizeLocalDatabase();
};
