import { Platform } from 'react-native';
import { logger } from '../logging/Logger';

/**
 * GlobalHandlers - Registers listeners for JS-level unhandled errors and promise rejections.
 */
export const registerGlobalHandlers = () => {
    // 1. Handle Uncaught JS Exceptions
    if (Platform.OS !== 'web') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
            logger.error('GlobalHandler', `Fatal JS Error: ${error.message}`, {
                error,
                isFatal,
                stack: error.stack,
            });
            
            // Re-invoke original handler to show the red box in DEV or crash in PROD
            if (originalHandler) {
                originalHandler(error, isFatal);
            }
        });
    } else {
        window.onerror = (message, source, lineno, colno, error) => {
            logger.error('GlobalHandler', `Web Error: ${message}`, {
                source, lineno, colno, error
            });
            return false;
        };
    }

    // 2. Handle Unhandled Promise Rejections
    if (Platform.OS === 'web') {
        window.onunhandledrejection = (event) => {
            logger.error('GlobalHandler', `Unhandled Promise Rejection: ${event.reason}`, {
                reason: event.reason
            });
        };
    } else {
        // @ts-ignore - Some RN versions might not have this globally
        const tracking = require('promise/setimmediate/rejection-tracking');
        tracking.enable({
            allRejections: true,
            onUnhandled: (id: string, error: any) => {
                logger.warn('GlobalHandler', `Unhandled Promise Rejection [${id}]: ${error.message || error}`, {
                    error
                });
            },
            onHandled: (id: string) => {
                logger.info('GlobalHandler', `Promise Rejection [${id}] was later handled.`);
            }
        });
    }

    logger.debug('GlobalHandler', 'Performance/Logging listeners registered successfully.');
};
