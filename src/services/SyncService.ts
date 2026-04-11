import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../config/supabase';
import { OfflineQueueService } from './OfflineQueueService';
import { useSyncStore } from '../store/SyncStore';
import { QueuedOperation } from '../types/sync';
import { NetworkService } from './NetworkService';
import { logger } from '../core/logging/Logger';
import { Platform } from 'react-native';

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

      // FEATURE 2: Track batch completion
      logger.trackEvent('sync_completed', { 
        count: pendingOps.length,
        network: useSyncStore.getState().isOnline ? 'online' : 'offline'
      });

    } catch (error: any) {
      logger.error('SyncService', 'Core sync error during batch processing', { error: error.message || error });
      
      // FEATURE 1: Capture core engine failures
      logger.captureException(error, { context: 'batch_processing' });
      
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

      // ---- NEW: Ensure image attachments are uploaded to Supabase Storage first ----
      // This handles images captured while offline (stored as file:// URIs)
      const enrichedPayload = await this.ensureImagesSynced(op.table, op.payload);

      // Execute against Supabase
      let error = null;
      if (op.type === 'CREATE') {
        const { error: insertError } = await supabase.from(op.table).insert([enrichedPayload]);
        error = insertError;
      } else if (op.type === 'UPDATE') {
         const { error: updateError } = await supabase.from(op.table).update(enrichedPayload).eq('id', enrichedPayload.id);
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
      logger.success('SyncService', `Synced ${op.type} to ${op.table}`, {
        details: `LocalID: ${op.localId}`,
        operationId: op.id,
        table: op.table,
        localId: op.localId
      });

    } catch (error: any) {
      logger.error('SyncService', `Operation execution failed for [${op.id}]`, {
        error: error.message || error,
        table: op.table,
        localId: op.localId
      });

      // FEATURE 1 & 2: Capture operation failure
      logger.trackEvent('sync_failed', { 
        table: op.table, 
        type: op.type, 
        error: error.message || 'Unknown' 
      });
      
      if (!(error?.message?.includes('network') || error?.message?.includes('offline'))) {
        // High priority: Capture non-network errors (logic errors/validations)
        logger.captureException(error, { op_id: op.id, table: op.table });
      }
      
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

      // Detailed Error Log for Super Admin/Audit (using the Logger for consistent formatting)
      const logLevel = updatedOp?.status === 'failed' ? 'error' : 'warn';
      const isOnline = useSyncStore.getState().isOnline;
      
      logger[logLevel]('SyncService', `Failed to sync ${op.table}`, {
        details: error.message || 'Unknown network/Supabase error',
        networkStatus: isOnline ? 'Online' : 'Offline',
        operationId: op.id,
        table: op.table,
        localId: op.localId,
        fullError: error
      });
    }
  }

  /**
   * Scans payload for local file URIs (file://) and uploads them to Supabase Storage
   * returns a new payload with cloud URLs replaced
   */
  private async ensureImagesSynced(table: string, payload: any): Promise<any> {
    if (!payload) return payload;
    
    // Most tables use 'image_urls' or 'imageUrls'
    const imageFields = ['image_urls', 'imageUrls'];
    const newPayload = { ...payload };

    for (const field of imageFields) {
        if (Array.isArray(newPayload[field]) && newPayload[field].length > 0) {
            const currentUrls = [...newPayload[field]];
            const newUrls: string[] = [];
            let modificationsMade = false;
            
            for (let i = 0; i < currentUrls.length; i++) {
                const url = currentUrls[i];
                if (typeof url === 'string' && (url.startsWith('file://') || url.startsWith('/'))) {
                    try {
                        logger.info('SyncService', `Uploading local attachment for ${table}`, { url });
                        const cloudUrl = await this.uploadLocalAttachment(url, table, i);
                        newUrls.push(cloudUrl);
                        modificationsMade = true;
                    } catch (uploadErr: any) {
                        logger.warn('SyncService', 'Failed to upload offline attachment, keeping local URI', { error: uploadErr.message });
                        newUrls.push(url);
                    }
                } else {
                    newUrls.push(url);
                }
            }
            
            if (modificationsMade) {
                newPayload[field] = newUrls;
            }
        }
    }

    return newPayload;
  }

  private async uploadLocalAttachment(localUri: string, table: string, index: number): Promise<string> {
    if (Platform.OS === 'web') return localUri;

    try {
        // 1. Determine Bucket and Path based on table
        let bucket = 'warranty-images';
        let pathPrefix = 'misc-images';
        
        if (table === 'sales') {
            bucket = 'warranty-images';
            pathPrefix = 'sales-images';
        } else if (table === 'complaints') {
            bucket = 'complaint-images';
            pathPrefix = 'complaint_images';
        } else if (table === 'field_visits') {
            bucket = 'warranty-images';
            pathPrefix = 'field-visit-images';
        }

        const fileName = `${Date.now()}_idx${index}_sync.jpg`;
        const filePath = `${pathPrefix}/${fileName}`;

        // 2. Read the local file
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        
        const { Buffer } = require('buffer');
        const fileBody = Buffer.from(base64, 'base64');

        // 3. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBody, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // 4. Get Public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (err) {
        throw err;
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
