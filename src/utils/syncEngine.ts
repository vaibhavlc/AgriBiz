import { db } from '../db/db';
import api from './api';

let isSyncing = false;

export const getDeviceId = (): string => {
  let id = sessionStorage.getItem('agribiz_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    sessionStorage.setItem('agribiz_device_id', id);
  }
  return id;
};

/**
 * Merges a remote record and local record at the field level.
 * If there is a collision, it sets syncStatus to 'Conflict' and maps the remote copy under conflictData.
 */
function resolveAndMergeConflict(local: any, remote: any): any {
  const merged = { ...local };
  let hasOverlappingConflict = false;
  const conflictFields: string[] = [];

  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const key of keys) {
    if (
      key === 'id' ||
      key === 'version' ||
      key === 'updatedAt' ||
      key === 'syncStatus' ||
      key === 'companyId' ||
      key === 'deviceId' ||
      key === 'conflictData' ||
      key === 'createdAt' ||
      key === 'createdBy' ||
      key === 'updatedBy'
    ) {
      continue;
    }

    const localVal = local[key];
    const remoteVal = remote[key];

    if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
      if (localVal !== undefined && remoteVal !== undefined) {
        hasOverlappingConflict = true;
        conflictFields.push(key);
      } else if (localVal === undefined && remoteVal !== undefined) {
        merged[key] = remoteVal;
      }
    }
  }

  if (hasOverlappingConflict) {
    merged.syncStatus = 'Conflict';
    merged.conflictData = {
      remote,
      conflictFields,
      timestamp: new Date().toISOString()
    };
  } else {
    merged.syncStatus = 'Pending';
  }

  merged.version = Math.max(local.version || 1, remote.version || 1);
  merged.updatedAt = new Date().toISOString();
  return merged;
}

/**
 * Pulls remote updates from MongoDB Atlas and merges them into Dexie.
 */
export const pullRemoteUpdates = async () => {
  console.log('[Sync Engine] pullRemoteUpdates started...');
  if (!navigator.onLine) {
    console.log('[Sync Engine] Device is offline. Pull skipped.');
    return;
  }

  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Sync Engine] User is not authenticated. Pull postponed.');
    return;
  }

  try {
    const rawTimestamp = sessionStorage.getItem('agribiz_last_sync_timestamp');
    let lastSyncTimestamp = '1970-01-01T00:00:00.000Z';
    if (rawTimestamp && rawTimestamp !== 'Never') {
      const date = new Date(rawTimestamp);
      // Subtract a 5-second buffer to handle database commit latency and clock drift
      date.setSeconds(date.getSeconds() - 5);
      lastSyncTimestamp = date.toISOString();
    }
    
    const deviceId = getDeviceId();

    console.log(`[Sync Engine] Pulling updates since ${lastSyncTimestamp} (buffered from ${rawTimestamp || 'Never'}) from server...`);

    const response = await api.get('/sync/pull', {
      params: { lastSyncTimestamp, deviceId }
    });

    const { success, serverTimestamp, updates } = response.data;

    if (success && updates) {
      const MODULE_TO_TABLE: Record<string, any> = {
        Product: db.products,
        Customer: db.customers,
        Supplier: db.suppliers,
        Invoice: db.invoices,
        Purchase: db.purchases,
        Quotation: db.quotations,
        Payment: db.payments,
        Expense: db.expenses,
        Settings: db.settings,
        User: db.users
      };

      let anyUpdates = false;

      await db.transaction('rw', [
        db.products, db.customers, db.suppliers, db.invoices,
        db.purchases, db.quotations, db.payments, db.expenses,
        db.settings, db.users, db.syncQueue
      ], async () => {
        for (const moduleName of Object.keys(updates)) {
          const table = MODULE_TO_TABLE[moduleName];
          if (!table) continue;

          const records = updates[moduleName];
          if (!Array.isArray(records) || records.length === 0) continue;

          anyUpdates = true;

          for (const remote of records) {
            // Check if there is an unsynced local modification in queue for this record
            const isQueued = await db.syncQueue
              .where('recordId')
              .equals(remote.id)
              .first();

            if (!isQueued) {
              const cleanRecord = {
                ...remote,
                syncStatus: 'Synced'
              };
              await table.put(cleanRecord);
            } else {
              const local = await table.get(remote.id);
              if (local) {
                const merged = resolveAndMergeConflict(local, remote);
                await table.put(merged);
              } else {
                await table.put({
                  ...remote,
                  syncStatus: 'Synced'
                });
              }
            }
          }
        }
      });
      console.log('[Sync Engine] Dexie database updated successfully.');

      sessionStorage.setItem('agribiz_last_sync_timestamp', serverTimestamp);
      console.log(`[Sync Engine] Pull completed. Server timestamp: ${serverTimestamp}`);

      if (anyUpdates) {
        window.dispatchEvent(new CustomEvent('sync-completed'));
      }
    }
    console.log('[Sync Engine] pullRemoteUpdates finished.');
  } catch (error: any) {
    console.error('[Sync Engine] Error running pull updates:', error.message || error);
  }
};

/**
 * Reads offline operations from Dexie and posts them to the backend sync batch endpoint.
 */
export const synchronizeLocalDatabase = async () => {
  if (isSyncing) return;

  if (!navigator.onLine) {
    console.log('[Sync Engine] Device is offline. Sync skipped.');
    return;
  }

  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Sync Engine] User is not authenticated. Sync postponed.');
    return;
  }

  try {
    const queuedOps = await db.syncQueue.orderBy('id').toArray();
    
    if (queuedOps.length > 0) {
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
            if (originalOp.id !== undefined) {
              await db.syncQueue.delete(originalOp.id);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Sync Engine] Error running database sync batch upload:', error.message || error);
  } finally {
    isSyncing = false;
  }

  // Pull remote updates immediately following upload check
  await pullRemoteUpdates();
};

/**
 * Subscribes to network events and runs periodic check intervals.
 */
export const startSyncDaemon = () => {
  // Listen for reconnects
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network restored. Firing sync daemon...');
    synchronizeLocalDatabase();
  });

  // Listen for login completion
  window.addEventListener('login-successful', () => {
    console.log('[Sync Engine] Login detected. Firing sync daemon...');
    synchronizeLocalDatabase();
  });

  // Run periodic synchronization check every 30 seconds
  setInterval(() => {
    synchronizeLocalDatabase();
  }, 30000);

  // Trigger sync on boot
  synchronizeLocalDatabase();
};
