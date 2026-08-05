import { db } from '../db/db';
import api from './api';

let isSyncing = false;
let isSyncPending = false;

export const getDeviceId = (): string => {
  let id = sessionStorage.getItem('agribiz_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
    sessionStorage.setItem('agribiz_device_id', id);
  }
  return id;
};

export const getTabId = (): string => {
  let id = sessionStorage.getItem('agribiz_tab_id');
  if (!id) {
    id = 'tab-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36);
    sessionStorage.setItem('agribiz_tab_id', id);
  }
  return id;
};

/**
 * Field-level conflict resolution for concurrent updates.
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
 * Targeted or Delta Pull Remote Updates.
 * If targetRecord is passed, fetches ONLY that specific changed record.
 * Otherwise, fetches delta (updatedAt > lastSyncTimestamp).
 */
export const pullRemoteUpdates = async (targetRecord?: { module: string; recordId: string }) => {
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
    const queryParams: Record<string, string> = { deviceId };

    if (targetRecord?.module && targetRecord?.recordId) {
      queryParams.module = targetRecord.module;
      queryParams.recordId = targetRecord.recordId;
      console.log(`[Sync Engine] Requesting targeted single-record delta: ${targetRecord.module} (${targetRecord.recordId})...`);
    } else {
      queryParams.lastSyncTimestamp = lastSyncTimestamp;
      console.log(`[Sync Engine] Requesting delta updates since ${lastSyncTimestamp}...`);
    }

    const response = await api.get('/sync/pull', { params: queryParams });
    const { success, serverTimestamp, updates } = response.data;

      const ts = new Date().toISOString();
      console.log(`[${ts}] [CLIENT_PULL_HTTP_RESPONSE] HTTP Status 200 | Updates Keys: [${Object.keys(updates).join(', ')}]`);

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

        let anyUpdatesApplied = false;

        // Wrap IndexedDB operations inside an atomic Dexie transaction
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

            anyUpdatesApplied = true;

            for (const remote of records) {
              console.log(`[${ts}] [CLIENT_DEXIE_INSERT] Writing record ${remote.id} into Dexie table ${moduleName}...`);
              const isQueuedLocally = await db.syncQueue
                .where('recordId')
                .equals(remote.id)
                .first();

              if (!isQueuedLocally) {
                await table.put({
                  ...remote,
                  syncStatus: 'Synced'
                });
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

        console.log(`[${ts}] [CLIENT_PULL_COMPLETED] Updates applied to Dexie: ${anyUpdatesApplied}`);

        if (anyUpdatesApplied) {
          console.log(`[${ts}] [CLIENT_EVENT_DISPATCH] Dispatching CustomEvent("sync-completed") to trigger React reloadData...`);
          window.dispatchEvent(new CustomEvent('sync-completed'));
        }
      }
  } catch (error: any) {
    console.error('[Sync Engine] Error in pullRemoteUpdates:', error.message || error);
  }
};

/**
 * Synchronizes queued offline operations with Sync Lock and Exponential Backoff Retry.
 */
export const synchronizeLocalDatabase = async () => {
  if (isSyncing) {
    console.log('[Sync Engine] Sync lock engaged. Queueing next sync run...');
    isSyncPending = true;
    return;
  }

  if (!navigator.onLine) {
    console.log('[Sync Engine] Offline. Upload skipped.');
    return;
  }

  const token = sessionStorage.getItem('agribiz_access_token');
  if (!token) {
    console.log('[Sync Engine] Not authenticated. Upload postponed.');
    return;
  }

  isSyncing = true;

  try {
    const allOps = await db.syncQueue.orderBy('id').toArray();
    const now = Date.now();

    // Filter operations that are ready for retry (exponential backoff)
    const readyOps = allOps.filter(op => !op.nextRetryAt || op.nextRetryAt <= now);

    if (readyOps.length > 0) {
      console.log(`[Sync Engine] Found ${readyOps.length} ready queue operations. Uploading...`);

      const operationsPayload = readyOps.map(op => ({
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
          const originalOp = readyOps[i];
          if (!originalOp.id) continue;

          if (result.success) {
            await db.syncQueue.delete(originalOp.id);
            console.log(`[Sync Engine] Operation ${originalOp.action} on ${originalOp.module} (${originalOp.recordId}) uploaded successfully.`);
          } else {
            // Incremental Exponential Backoff Retry
            const currentRetry = (originalOp.retryCount || 0) + 1;
            const delayMs = Math.min(60000, Math.pow(2, currentRetry) * 1000);
            const nextRetryAt = Date.now() + delayMs;

            await db.syncQueue.update(originalOp.id, {
              retryCount: currentRetry,
              nextRetryAt,
              lastError: result.message
            });

            console.warn(`[Sync Engine] Upload failed for ${originalOp.action} on ${originalOp.module}. Scheduled retry #${currentRetry} in ${delayMs / 1000}s`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[Sync Engine] Error during upload batch:', error.message || error);
  } finally {
    isSyncing = false;

    if (isSyncPending) {
      isSyncPending = false;
      synchronizeLocalDatabase();
    }
  }

  // Execute delta pull immediately after upload batch completes
  await pullRemoteUpdates();
};

/**
 * Initializes listeners for online/offline transitions and login triggers.
 */
export const startSyncDaemon = () => {
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Internet re-established. Triggering queue upload & pull...');
    synchronizeLocalDatabase();
  });

  window.addEventListener('login-successful', () => {
    console.log('[Sync Engine] Login successful. Triggering sync...');
    synchronizeLocalDatabase();
  });

  synchronizeLocalDatabase();
};
