import { useSyncStore } from '../../store/SyncStore';
import { supabase } from '../../config/supabase';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

interface LogOptions {
  details?: any;
  location?: string; // Manually provided location
  table?: string;
  localId?: string;
  operationId?: string;
  silent?: boolean;
  [key: string]: any; // Allow arbitrary metadata
}

class Logger {
  private static instance: Logger;
  private isDev = __DEV__;
  
  // Custom theme colors for console log styling
  private themeColors = {
    DEBUG: '#94A3B8',
    INFO: '#3B82F6',
    SUCCESS: '#10B981',
    WARN: '#F59E0B',
    ERROR: '#EF4444'
  };

  private constructor() {}

  private extractLocation(): string {
    const stack = new Error().stack;
    return this.extractLocationFromStack(stack);
  }

  private extractLocationFromStack(stack?: string): string {
    if (!stack) return '';
    const lines = stack.split('\n');
    // Skip internal lines (usually first few lines are Error creation and Logger core)
    // Looking for a line that isn't from react-native, node_modules or Logger.ts
    const userLine = lines.find(line => 
      !line.includes('Logger.ts') && 
      !line.includes('node_modules') && 
      !line.includes('timers.js') &&
      (line.includes('.ts') || line.includes('.tsx') || line.includes('.js'))
    );
    
    if (userLine) {
      // Clean up the line to just the filename and line number
      const match = userLine.match(/([a-zA-Z0-9_-]+\.[tj]sx?:\d+:\d+)/);
      return match ? match[1] : userLine.trim().split(' ').pop() || '';
    }
    return '';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    module: string,
    message: string,
    options: LogOptions = {}
  ) {
    const { details, table, localId, operationId, silent } = options;
    const timestamp = new Date().toISOString();
    
    let logLocation = options.location;
    let logStack = options.stack;

    // Automatically try to extract location if not provided
    if (!logLocation) {
      logLocation = this.extractLocation();
    }

    // Handle standard Error objects passed in details
    if (details instanceof Error) {
      logStack = details.stack;
      if (!logLocation) logLocation = this.extractLocationFromStack(details.stack);
    }

    // 1. Console Output (Dev only)
    if (this.isDev && !silent) {
      const color = this.getLogColor(level);
      console.log(
        `%c[${timestamp}] [${level}] [${module}]%c${logLocation ? ` @ ${logLocation}` : ''} %c${message}`,
        `color: ${color}; font-weight: bold;`,
        `color: ${this.themeColors.DEBUG}; font-size: 10px; font-style: italic;`,
        'color: inherit; font-weight: normal;',
        details || ''
      );
    }

    // 2. Persist to SyncStore (For Super Admin Dashboard)
    // We only persist INFO/SUCCESS/WARN/ERROR to avoid bloating the offline store with DEBUG
    if (level !== 'DEBUG') {
      try {
        useSyncStore.getState().addLog({
          level: (level.toLowerCase() as any) === 'success' ? 'success' : (level.toLowerCase() as any),
          module,
          message,
          location: logLocation,
          stack: logStack,
          details: typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details || ''),
          table,
          localId,
          operationId
        });
      } catch (e) {
        // Fallback if store is not ready
        console.error('Logger failed to write to SyncStore', e);
      }
    }

    // 3. PRODUCTION OBSERVABILITY: Push to Sentry
    // Note: Temporarily enabled in DEV so you can see it in your dashboard
    if (level === 'ERROR') {
      this.captureException(details || new Error(message), {
        module,
        message,
        location: logLocation,
        ...options
      });
    } else if (level !== 'DEBUG' && !silent) {
      // Send Info/Warn/Success messages to Sentry
      Sentry.captureMessage(message, {
        level: this.mapToSentryLevel(level),
        extra: { module, details, location: logLocation, ...options },
        tags: { module }
      });
    }

    // 4. SUPABASE: Sync to Database (Production & Important Dev logs)
    this.syncToSupabase(level, module, message, { 
      details, table, localId, operationId, location: logLocation, stack: logStack, timestamp 
    });
  }

  /**
   * INTEGRATION 1: Sentry Exception Capture
   * Captures a real exception in production to be tracked by Sentry.
   */
  public captureException(error: any, metadata: any = {}) {
    if (this.isDev) {
      console.warn('[LOGGER] 🐞 Exception Captured:', error, metadata);
    } else {
      Sentry.captureException(error, {
        extra: metadata || {},
        tags: {
          module: metadata?.module || 'Unknown',
          location: metadata?.location || 'Unknown'
        }
      });
    }
  }

  /**
   * Helper to set user context in Sentry
   */
  public setUser(user: { id: string, email: string, [key: string]: any } | null) {
    if (this.isDev) {
      console.log('[LOGGER] 👤 User context set:', user?.email);
    }
    
    if (user) {
      Sentry.setUser({
        ...user,
        id: user.id,
        email: user.email,
        username: user.name || user.email
      });
    } else {
      Sentry.setUser(null);
    }
  }

  /**
   * INTEGRATION 2: User Action Tracking
   * Tracks a meaningful user-facing action for business analytics.
   */
  public trackEvent(event: any, properties: any = {}) {
    // We import analytics dynamically to avoid circular dependencies if any
    import('../analytics/Analytics').then(({ analytics }) => {
      analytics.track(event, properties);
    }).catch(err => {
      if (this.isDev) console.warn('Failed to track event', err);
    });
  }

  /**
   * Non-blocking attempt to push log to Supabase/Central DB
   */
  private async syncToSupabase(
    level: LogLevel,
    module: string,
    message: string,
    data: any
  ) {
    // Only sync if not DEBUG level to avoid excessive traffic
    if (level === 'DEBUG') return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      // Prepare payload to match system_audit_logs schema
      const payload = {
        level: level.toLowerCase(),
        module,
        message,
        details: data.details ? (typeof data.details === 'object' ? JSON.stringify(data.details) : String(data.details)) : null,
        location: data.location || null,
        stack: data.stack || null,
        table_name: data.table || null, // Map 'table' to 'table_name' to avoid reserved keyword issues
        local_id: data.localId || null,
        operation_id: data.operationId || null,
        user_id: userId || null,
        device_info: {
          platform: Platform.OS,
          version: Platform.Version,
          isDev: this.isDev
        },
        created_at: data.timestamp
      };

      // Perform fire-and-forget insert
      supabase
        .from('system_audit_logs')
        .insert(payload)
        .then(({ error }) => {
          if (error && this.isDev) {
            console.warn('Silent failure syncing log to Supabase', error.message);
          }
        });
    } catch (err) {
      // Complete silence on sync failure to avoid infinite logging loops
    }
  }

  /**
   * Maps internal LogLevel to Sentry severity level
   */
  private mapToSentryLevel(level: LogLevel): Sentry.SeverityLevel {
    switch (level) {
      case 'DEBUG': return 'debug';
      case 'INFO': return 'info';
      case 'SUCCESS': return 'info';
      case 'WARN': return 'warning';
      case 'ERROR': return 'error';
      default: return 'info';
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return '#9CA3AF'; // Gray
      case 'INFO': return '#3B82F6';  // Blue
      case 'SUCCESS': return '#10B981'; // Green
      case 'WARN': return '#F59E0B';  // Orange
      case 'ERROR': return '#EF4444'; // Red
      default: return '#000000';
    }
  }

  debug(module: string, message: string, options?: LogOptions) {
    this.log('DEBUG', module, message, options);
  }

  info(module: string, message: string, options?: LogOptions) {
    this.log('INFO', module, message, options);
  }

  success(module: string, message: string, options?: LogOptions) {
    this.log('SUCCESS', module, message, options);
  }

  warn(module: string, message: string, options?: LogOptions) {
    this.log('WARN', module, message, options);
  }

  error(module: string, message: string, options?: LogOptions) {
    this.log('ERROR', module, message, options);
  }
}

export const logger = Logger.getInstance();
