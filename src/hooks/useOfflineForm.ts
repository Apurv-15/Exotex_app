import { useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useSyncQueue } from './useSyncQueue';
import { OfflineQueueService } from '../services/OfflineQueueService';
import { SyncService } from '../services/SyncService';
import uuid from 'react-native-uuid';
import { QueuedOperation } from '../types/sync';

interface SubmitOptions {
  type?: QueuedOperation['type'];
  priority?: QueuedOperation['priority'];
  localId?: string;
  batchId?: string;
}

export function useOfflineForm(tableName: string) {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, forceSync } = useSyncQueue();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'queued' | 'syncing' | 'error' | 'success'>('idle');

  const submit = async (payload: any, options?: SubmitOptions): Promise<string> => {
    try {
      setSyncStatus('saving');
      const localId = options?.localId || uuid.v4().toString();
      const opType = options?.type || 'CREATE';
      
      // Step 1: Always Enqueue First (Zero Data Loss Architecture)
      await OfflineQueueService.enqueue(
        opType,
        tableName,
        payload,
        localId,
        options?.priority || 'high',
        options?.batchId
      );
      
      setSyncStatus('queued');

      // Step 2: If Online, attempt immediate Sync processing
      if (isOnline) {
        setSyncStatus('syncing');
        // We run force sync without waiting so the UI is responsive.
        // SyncService orchestrates clearing the queue asynchronously
        SyncService.forceSync().then(() => {
           setSyncStatus('success');
        }).catch(() => {
           // It's still safely in the queue and will retry
           setSyncStatus('error');
        });
      }

      return localId;
    } catch (err) {
      console.error('Failed to submit form to offline queue:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  return {
    submit,
    isOffline: !isOnline,
    syncStatus,
    pendingCount
  };
}
