import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { QueuedOperation } from '../types/sync';
import { useSyncStore } from '../store/SyncStore';
import { logger } from '../core/logging/Logger';

const QUEUE_STORAGE_KEY = '@app_sync_queue_v1';
const MAX_RETRIES = 5;

export class OfflineQueueService {
  /**
   * Initializes the queue into Zustand from AsyncStorage
   */
  static async loadQueue(): Promise<QueuedOperation[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      const queue: QueuedOperation[] = data ? JSON.parse(data) : [];
      
      // Auto-clean old completed items (> 30 days)
      const now = new Date().getTime();
      const cleanedQueue = queue.filter(item => {
        if (item.status === 'completed') {
           const timeDiff = now - new Date(item.timestamp).getTime();
           if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
        }
        return true;
      });
      
      if (cleanedQueue.length < queue.length) {
          await this.saveQueue(cleanedQueue);
      } else {
          useSyncStore.getState().setQueue(queue);
      }
      return cleanedQueue;
    } catch (error: any) {
      logger.error('OfflineQueue', 'Failed to load sync queue from storage', { error: error.message || error });
      return [];
    }
  }

  static async saveQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      useSyncStore.getState().setQueue(queue);
    } catch (error: any) {
      logger.error('OfflineQueue', 'Failed to save sync queue to storage', { error: error.message || error });
    }
  }

  /**
   * Enqueue a new operation
   */
  static async enqueue(
    type: QueuedOperation['type'],
    table: string,
    payload: any,
    localId: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    batchId?: string
  ): Promise<QueuedOperation> {
    const queue = await this.loadQueue();
    
    // Check for duplicates
    const isDuplicate = queue.some(op => op.localId === localId && op.status !== 'completed' && op.status !== 'failed');
    if (isDuplicate) {
      logger.warn('OfflineQueue', `Duplicate operation detected for localId: ${localId}`, { table, type });
      return queue.find(op => op.localId === localId)!;
    }

    const newItem: QueuedOperation = {
      id: uuid.v4().toString(),
      type,
      table,
      payload,
      localId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      lastError: null,
      status: 'pending',
      priority,
      batchId
    };

    queue.push(newItem);
    await this.saveQueue(queue);

    // Audit Log for Super Admin - Initial Enqueue (Offline Proof)
    logger.info('OfflineQueue', `Enqueued ${type} for ${table}`, {
      details: `Saved locally while offline. LocalID: ${localId}`,
      operationId: newItem.id,
      table: table,
      localId: localId
    });

    return newItem;
  }

  /**
   * Updates an item in the queue (e.g. status)
   */
  static async updateOperation(id: string, updates: Partial<QueuedOperation>): Promise<void> {
    const queue = await this.loadQueue();
    const updatedQueue = queue.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    await this.saveQueue(updatedQueue);
  }

  /**
   * Remove operation (used manually by user)
   */
  static async removeOperation(id: string): Promise<void> {
    const queue = await this.loadQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    await this.saveQueue(updatedQueue);
  }

  /**
   * Process a failure with Exponential Backoff
   */
  static async handleFailure(id: string, errorMsg: string): Promise<void> {
    const queue = await this.loadQueue();
    const updatedQueue = queue.map(item => {
      if (item.id === id) {
        const newRetryCount = item.retryCount + 1;
        if (newRetryCount >= item.maxRetries) {
            return { ...item, status: 'failed' as const, lastError: errorMsg };
        }
        
        // Exponential backoff: 2^retryCount minutes
        const backoffMinutes = Math.pow(2, item.retryCount);
        const nextRetryDate = new Date();
        nextRetryDate.setMinutes(nextRetryDate.getMinutes() + backoffMinutes);
        
        return {
          ...item,
          status: 'pending' as const,
          lastError: errorMsg,
          retryCount: newRetryCount,
          nextRetryAt: nextRetryDate.toISOString()
        };
      }
      return item;
    });
    
    await this.saveQueue(updatedQueue);
  }

  /**
   * Gets items ready for sync, considering backoff and priority
   */
  static async getPendingOperations(): Promise<QueuedOperation[]> {
    const queue = await this.loadQueue();
    const now = new Date();
    
    const pending = queue.filter(item => {
      if (item.status === 'failed' || item.status === 'completed' || item.status === 'processing') return false;
      if (item.nextRetryAt && new Date(item.nextRetryAt) > now) return false;
      return true;
    });
    
    // Sort by priority and then timestamp
    return pending.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  static async clearAllFailed(): Promise<void> {
    const queue = await this.loadQueue();
    const updatedQueue = queue.filter(item => item.status !== 'failed');
    await this.saveQueue(updatedQueue);
  }
}
