import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { db } from '../../db/db';
import { getDeviceId, synchronizeLocalDatabase } from '../../utils/syncEngine';
import { getSocketStatus } from '../../utils/socketService';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, ShieldCheck, Database, Smartphone } from 'lucide-react';

interface SyncStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({ isOpen, onClose }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSocketConnected, setIsSocketConnected] = useState(getSocketStatus());
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [lastPull, setLastPull] = useState(sessionStorage.getItem('agribiz_last_sync_timestamp') || 'Never');
  const [deviceId] = useState(getDeviceId());

  const fetchQueueStats = async () => {
    try {
      const queue = await db.syncQueue.toArray();
      setPendingCount(queue.length);
      setFailedCount(queue.filter(op => op.retryCount > 0).length);

      // Query tables for conflicts
      let conflicts = 0;
      const tables = [
        db.products, db.customers, db.suppliers, db.invoices,
        db.purchases, db.quotations, db.payments, db.expenses
      ];
      for (const table of tables) {
        const items = await table.toArray();
        conflicts += items.filter((item: any) => item.syncStatus === 'Conflict').length;
      }
      setConflictCount(conflicts);
      
      const lastPullTime = sessionStorage.getItem('agribiz_last_sync_timestamp');
      setLastPull(lastPullTime ? new Date(lastPullTime).toLocaleString() : 'Never');
    } catch (err) {
      console.error('Failed to query sync stats:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchQueueStats();

    // Listeners for real-time status updates
    const handleSyncComplete = () => {
      fetchQueueStats();
    };

    const handleSocketStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsSocketConnected(customEvent.detail?.connected || false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('sync-completed', handleSyncComplete);
    window.addEventListener('socket-status-changed', handleSocketStatus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state check
    setIsOnline(navigator.onLine);
    setIsSocketConnected(getSocketStatus());

    return () => {
      window.removeEventListener('sync-completed', handleSyncComplete);
      window.removeEventListener('socket-status-changed', handleSocketStatus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await synchronizeLocalDatabase();
      await fetchQueueStats();
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sync Diagnostics & Health">
      <div className="sync-status-container" style={{ padding: '8px' }}>
        
        {/* Network & Socket status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: isOnline ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            border: isOnline ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {isOnline ? (
              <Wifi size={24} style={{ color: '#10B981' }} />
            ) : (
              <WifiOff size={24} style={{ color: '#EF4444' }} />
            )}
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Network Status</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: isOnline ? '#10B981' : '#EF4444' }}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: isSocketConnected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            border: isSocketConnected ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShieldCheck size={24} style={{ color: isSocketConnected ? '#10B981' : '#EF4444' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Real-time Gateway</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: isSocketConnected ? '#10B981' : '#EF4444' }}>
                {isSocketConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Queues and conflicts logs */}
        <div style={{
          background: 'rgba(249, 250, 251, 0.5)',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: 600 }}>
              <Database size={16} />
              <span>Pending Sync Queue</span>
            </div>
            <span style={{
              background: pendingCount > 0 ? '#FBBF24' : '#E5E7EB',
              color: pendingCount > 0 ? '#92400E' : '#374151',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {pendingCount} operations
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: 600 }}>
              <AlertTriangle size={16} style={{ color: failedCount > 0 ? '#EF4444' : '#6B7280' }} />
              <span>Failed Retries</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: failedCount > 0 ? '#EF4444' : '#374151' }}>
              {failedCount} queued
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontWeight: 600 }}>
              <AlertTriangle size={16} style={{ color: conflictCount > 0 ? '#EF4444' : '#6B7280' }} />
              <span>Active Conflicts</span>
            </div>
            <span style={{
              background: conflictCount > 0 ? '#FCA5A5' : 'transparent',
              color: conflictCount > 0 ? '#991B1B' : '#374151',
              padding: conflictCount > 0 ? '2px 8px' : '0',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 700
            }}>
              {conflictCount} conflicts
            </span>
          </div>
        </div>

        {/* Sync metadata details */}
        <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Smartphone size={15} style={{ color: '#9CA3AF' }} />
            <span style={{ color: '#9CA3AF' }}>Device Identifier:</span>
            <code style={{ fontSize: '12px', fontWeight: 700, background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
              {deviceId}
            </code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} style={{ color: '#9CA3AF' }} />
            <span style={{ color: '#9CA3AF' }}>Last Successful Pull:</span>
            <span style={{ fontWeight: 600 }}>{lastPull}</span>
          </div>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ borderRadius: '8px' }}
          >
            Close Diagnostics
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            style={{
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
