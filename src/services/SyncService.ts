import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../config/supabase';
import { OfflineQueueService } from './OfflineQueueService';
import { useSyncStore } from '../store/SyncStore';
import { QueuedOperation } from '../types/sync';
import { NetworkService } from './NetworkService';

class SyncServiceBase {
  private processing = false;
  private appStateSubscription: any;
  private debounceTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Monitor for app foreground
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Monitor Network, trigger sync on online
    NetworkService.startMonitoring(() => {
        this.debouncedProcessQueue();
    });

    // Start background processor interval (Fallback check every 60s)
    setInterval(() => {
      if (useSyncStore.getState().isOnline) {
        this.processQueue();
      }
    }, 60000);

    // Initial load
    OfflineQueueService.loadQueue().then(() => {
       if (useSyncStore.getState().isOnline) {
         this.processQueue();
       }
    });
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && useSyncStore.getState().isOnline) {
      this.debouncedProcessQueue();
    }
  }

  private debouncedProcessQueue() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, 2000);
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    useSyncStore.getState().setIsSyncing(true);

    try {
      const pendingOps = await OfflineQueueService.getPendingOperations();
      if (pendingOps.length === 0) {
        this.processing = false;
        useSyncStore.getState().setIsSyncing(false);
        return;
      }

      for (const op of pendingOps) {
        if (!useSyncStore.getState().isOnline) {
           break; // Stop processing if network lost completely
        }
        await this.processOperation(op);
      }
      
      // Update global last sync time
      useSyncStore.getState().updateStats({ lastSyncTime: new Date().toISOString() });

    } catch (error) {
      console.error('Core sync error:', error);
    } finally {
      this.processing = false;
      useSyncStore.getState().setIsSyncing(false);
      // Ensure sync store view is up-to-date
      await OfflineQueueService.loadQueue();
    }
  }

  private async processOperation(op: QueuedOperation): Promise<void> {
    try {
      // Mark processing
      await OfflineQueueService.updateOperation(op.id, { status: 'processing' });

      // Execute against Supabase
      let error = null;
      if (op.type === 'CREATE') {
        const { error: insertError } = await supabase.from(op.table).insert([op.payload]);
        error = insertError;
      } else if (op.type === 'UPDATE') {
         const { error: updateError } = await supabase.from(op.table).update(op.payload).eq('id', op.payload.id);
         error = updateError;
      } else if (op.type === 'DELETE') {
         const { error: deleteError } = await supabase.from(op.table).delete().eq('id', op.payload.id || op.localId);
         error = deleteError;
      }

      if (error) throw error;

      // Finished processing
      await OfflineQueueService.updateOperation(op.id, { 
        status: 'completed' as const,
        lastError: null 
      });

      // Show success notification & update stats
      useSyncStore.getState().addNotification({
         type: 'success',
         title: 'Sync Successful',
         message: `Item synced to ${op.table}`
      });
      
      useSyncStore.getState().updateStats({
        successfulOperations: useSyncStore.getState().stats.successfulOperations + 1,
        totalOperations: useSyncStore.getState().stats.totalOperations + 1
      });

      // Audit Log for Super Admin
      useSyncStore.getState().addLog({
        level: 'success',
        module: 'SyncService',
        message: `Synced ${op.type} to ${op.table}`,
        details: `LocalID: ${op.localId}`,
        operationId: op.id,
        table: op.table,
        localId: op.localId
      });

    } catch (error: any) {
      console.error(`Operation failed id [${op.id}]:`, error);
      
      // Retry via Queue Service (which handles Exponential Backoff)
      await OfflineQueueService.handleFailure(op.id, error.message || 'Unknown network error');
      
      const updatedOp = (await OfflineQueueService.loadQueue()).find(item => item.id === op.id);
      
      useSyncStore.getState().updateStats({
          failedOperations: updatedOp?.status === 'failed' 
            ? useSyncStore.getState().stats.failedOperations + 1
            : useSyncStore.getState().stats.failedOperations,
          totalOperations: useSyncStore.getState().stats.totalOperations + 1
      });

      if (updatedOp?.status === 'failed') {
          useSyncStore.getState().addNotification({
              type: 'error',
              title: 'Sync Failed Permanently',
              message: `Max retries reached for ${op.table}. Requires manual retry.`
          });
      }

      // Detailed Error Log for Super Admin/Audit
      useSyncStore.getState().addLog({
        level: updatedOp?.status === 'failed' ? 'error' : 'warn',
        module: 'SyncService',
        message: `Failed to sync ${op.table}`,
        details: error.message || 'Unknown network/Supabase error',
        operationId: op.id,
        table: op.table,
        localId: op.localId
      });
    }
  }

  // Allow manual force sync from UI
  async forceSync(): Promise<void> {
    const isOnline = await NetworkService.checkStatus();
    if (isOnline) {
       this.debouncedProcessQueue();
    } else {
       useSyncStore.getState().addNotification({
          type: 'error',
          title: 'Offline',
          message: 'Cannot manually sync while device is offline.'
       });
    }
  }
}

export const SyncService = new SyncServiceBase();
