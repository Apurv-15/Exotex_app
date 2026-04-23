import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { SyncService } from './SyncService';
import { logger } from '../core/logging/Logger';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the background task
// This must be called in the global scope (e.g., at the top of index.ts or imported there)
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    const now = new Date().toISOString();
    try {
        logger.info('BackgroundSyncTask', 'Background fetch execution started', { timestamp: now });
        
        // Execute the existing sync logic
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

/**
 * Helper to register the task
 */
export async function registerBackgroundSync() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
        if (isRegistered) {
            logger.info('BackgroundSyncTask', 'Task already registered');
        }

        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
            minimumInterval: 15 * 60, // 15 minutes (minimum allowed by Android/iOS)
            stopOnTerminate: false,    // Continue sync even if app is swiped away
            startOnBoot: true,        // Restart sync after phone reboot
        });
        
        logger.success('BackgroundSyncTask', 'Background sync registered successfully');
    } catch (err) {
        logger.error('BackgroundSyncTask', 'Task registration failed', { error: err });
    }
}
