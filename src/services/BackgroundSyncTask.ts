import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { SyncService } from './SyncService';
import { logger } from '../core/logging/Logger';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the background task at global scope.
// IMPORTANT: Wrapped in try/catch because TaskManager.defineTask runs synchronously
// during module evaluation. If the native module is unavailable on certain Android
// production builds, an uncaught throw here will freeze the entire app before
// React even starts (shows as a stuck splash screen).
try {
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        const now = new Date().toISOString();
        try {
            logger.info('BackgroundSyncTask', 'Background fetch execution started', { timestamp: now });
            await SyncService.processQueue();
            logger.info('BackgroundSyncTask', 'Background fetch execution completed successfully');
            return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error: any) {
            logger.error('BackgroundSyncTask', 'Background fetch execution failed', { 
                error: error.message || error,
                timestamp: now 
            });
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }
    });
} catch (defineError: any) {
    // Non-fatal: background sync won't run, but the app will still launch normally.
    logger.warn('BackgroundSyncTask', 'TaskManager.defineTask failed (non-fatal)', { details: defineError?.message || defineError });
}

/**
 * Helper to register the task
 */
export async function registerBackgroundSync() {
    try {
        // Guard: verify TaskManager native module is available before proceeding
        if (!TaskManager || typeof TaskManager.isTaskRegisteredAsync !== 'function') {
            logger.warn('BackgroundSyncTask', 'TaskManager native module unavailable, skipping registration');
            return;
        }

        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
        if (isRegistered) {
            logger.info('BackgroundSyncTask', 'Task already registered, skipping re-registration.');
            return;
        }

        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
            minimumInterval: 15 * 60, // 15 minutes minimum (Android/iOS platform limit)
            stopOnTerminate: false,
            startOnBoot: true,
        });
        
        logger.success('BackgroundSyncTask', 'Background sync registered successfully');
    } catch (err: any) {
        // Non-fatal: registration failure should never crash the app.
        logger.warn('BackgroundSyncTask', 'Task registration failed (non-fatal)', { details: err?.message || err });
    }
}
