import { Platform } from 'react-native';
import { logger } from '../logging/Logger';

/**
 * GlobalHandlers - Registers listeners for JS-level unhandled errors and promise rejections.
 *
 * CRASH-SAFE DESIGN:
 * - Fatal JS errors are logged to Sentry but NEVER re-thrown in production.
 *   This lets the GlobalErrorBoundary show a recovery screen instead of killing the app.
 * - All setup is wrapped in try/catch so a failure here never prevents the app from starting.
 */
export const registerGlobalHandlers = () => {
    try {
        // 1. Handle Uncaught JS Exceptions
        if (Platform.OS !== 'web') {
            const originalHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
                try {
                    logger.error('GlobalHandler', `Unhandled JS Error: ${error?.message || error}`, {
                        isFatal,
                        stack: error?.stack,
                    });
                } catch (_) {
                    // Prevent logger from causing a secondary crash
                }

                if (__DEV__) {
                    // In dev: pass through so the red box still shows
                    if (originalHandler) originalHandler(error, isFatal);
                }
                // In PRODUCTION: we intentionally do NOT re-throw fatal errors.
                // The GlobalErrorBoundary will catch render-level errors and show a
                // recovery UI. Swallowing JS-level fatal errors prevents OS from
                // force-killing the process and freezing the splash screen.
            });
        } else {
            window.onerror = (message, source, lineno, colno, error) => {
                try {
                    logger.error('GlobalHandler', `Web Error: ${message}`, {
                        source, lineno, colno, error
                    });
                } catch (_) {}
                return true; // Prevent default browser error dialog
            };
        }
    } catch (handlerSetupError) {
        console.warn('[GlobalHandlers] Failed to set global error handler (non-fatal):', handlerSetupError);
    }

    // 2. Handle Unhandled Promise Rejections
    try {
        if (Platform.OS === 'web') {
            window.onunhandledrejection = (event) => {
                try {
                    logger.error('GlobalHandler', `Unhandled Promise Rejection: ${event.reason}`, {
                        reason: event.reason
                    });
                } catch (_) {}
            };
        } else {
            // Wrapped in try/catch: this polyfill may not be available in all environments
            const tracking = require('promise/setimmediate/rejection-tracking');
            tracking.enable({
                allRejections: true,
                onUnhandled: (id: string, error: any) => {
                    try {
                        logger.warn('GlobalHandler', `Unhandled Promise Rejection [${id}]: ${error?.message || error}`, {
                            error
                        });
                    } catch (_) {}
                },
                onHandled: (_id: string) => {
                    // Silent — handled rejections don't need to be logged
                }
            });
        }
    } catch (promiseSetupError) {
        console.warn('[GlobalHandlers] Failed to set up promise rejection tracking (non-fatal):', promiseSetupError);
    }
};
