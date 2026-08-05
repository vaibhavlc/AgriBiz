import { db } from '../db/db';
import api from './api';

let isSyncing = false;

export const getDeviceId = (): string => {
  let id = sessionStorage.getItem('agribiz_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
    sessionStorage.setItem('agribiz_device_id', id);
  }
  return id;
};

/**
 * Merges a remote record and local record at the field level.
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
    merged.syncStatus = 'Synced';
  }

  merged.version = Math.max(local.version || 1, remote.version || 1);
  merged.updatedAt = new Date().toISOString();
  return merged;
}

/**
 * Pulls remote updates from MongoDB Atlas and merges them into Dexie.
 */
export const pullRemoteUpdates = async () => {
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
      date.setSeconds(date.getSeconds() - 2);
      lastSyncTimestamp = date.toISOString();
    }
    
    const deviceId = getDeviceId();

    console.log(`[Sync Engine] Pulling remote updates since ${lastSyncTimestamp}...`);

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

      if (serverTimestamp) {
        sessionStorage.setItem('agribiz_last_sync_timestamp', serverTimestamp);
      }
      console.log(`[Sync Engine] Pull completed. Server timestamp: ${serverTimestamp}. Updates applied: ${anyUpdates}`);

      if (anyUpdates) {
        window.dispatchEvent(new CustomEvent('sync-completed'));
      }
    }
  } catch (error: any) {
    console.error('[Sync Engine] Error during pullRemoteUpdates:', error.message || error);
  }
};

/**
 * Uploads queued offline operations immediately to MongoDB Atlas via /api/sync endpoint.
 */
export const synchronizeLocalDatabase = async () => {
  if (isSyncing) return;

  if (!navigator.onLine) {
    console.log('[Sync Engine] Device is offline. Local database upload skipped.');
    return;
  }

  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Sync Engine] User is not authenticated. Local database upload postponed.');
    return;
  }

  try {
    const queuedOps = await db.syncQueue.orderBy('id').toArray();
    
    if (queuedOps.length > 0) {
      isSyncing = true;
      console.log(`[Sync Engine] Found ${queuedOps.length} queued operations. Uploading immediately to server...`);

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

          if (result.success && originalOp.id !== undefined) {
            await db.syncQueue.delete(originalOp.id);
            console.log(`[Sync Engine] Uploaded ${originalOp.action} on ${originalOp.module} (${originalOp.recordId}) successfully.`);
          } else if (originalOp.id !== undefined) {
            console.error(`[Sync Engine] Upload failed for ${originalOp.action} on ${originalOp.module} (${originalOp.recordId}): ${result.message}`);
            await db.syncQueue.delete(originalOp.id);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Sync Engine] Error running batch upload:', error.message || error);
  } finally {
    isSyncing = false;
  }

  // Pull remote updates immediately following batch upload
  await pullRemoteUpdates();
};

/**
 * Subscribes to network events and login triggers.
 */
export const startSyncDaemon = () => {
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network status: ONLINE. Uploading queued records...');
    synchronizeLocalDatabase();
  });

  window.addEventListener('login-successful', () => {
    console.log('[Sync Engine] Login event detected. Synchronizing local database...');
    synchronizeLocalDatabase();
  });

  // Trigger sync on boot
  synchronizeLocalDatabase();
};
