import { useEffect } from 'react';
import { useSyncStore } from '../store/SyncStore';
import { OfflineQueueService } from '../services/OfflineQueueService';
import { SyncService } from '../services/SyncService';

export function useSyncQueue() {
  const { queue, isSyncing, setQueue } = useSyncStore();

  const pendingCount = queue.filter(
    q => q.status === 'pending' || q.status === 'processing'
  ).length;

  const failedCount = queue.filter(q => q.status === 'failed').length;
  
  const completedCount = queue.filter(q => q.status === 'completed').length;

  const failedOperations = queue.filter(q => q.status === 'failed');
  const pendingOperations = queue.filter(
    q => q.status === 'pending' || q.status === 'processing'
  );

  useEffect(() => {
    // Initial load
    OfflineQueueService.loadQueue();
  }, []);

  const clearFailed = async () => {
    await OfflineQueueService.clearAllFailed();
    await OfflineQueueService.loadQueue(); // Refresh state
  };

  const removeOperation = async (id: string) => {
    await OfflineQueueService.removeOperation(id);
    await OfflineQueueService.loadQueue(); // Refresh state
  };

  const forceSync = async () => {
    await SyncService.forceSync();
  };
  
  const retryFailed = async (id: string) => {
     await OfflineQueueService.updateOperation(id, {
         status: 'pending',
         retryCount: 0,
         nextRetryAt: undefined,
         lastError: null
     });
     await OfflineQueueService.loadQueue();
     await SyncService.forceSync();
  };

  return {
    queue,
    isSyncing,
    pendingCount,
    failedCount,
    completedCount,
    failedOperations,
    pendingOperations,
    clearFailed,
    removeOperation,
    forceSync,
    retryFailed
  };
}
