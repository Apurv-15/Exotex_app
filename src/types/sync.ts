export interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH';
  table: string;
  payload: any;
  localId: string;
  timestamp: string; // ISO String
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string; // ISO String
  lastError: string | null;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  priority: 'high' | 'medium' | 'low';
  batchId?: string;
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string; // ISO String
}

export interface ConflictRecord {
  localId: string;
  table: string;
  localData: any;
  serverData: any;
  resolved: boolean;
  timestamp: string;
}

export interface SyncStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  lastSyncTime: string | null;
  averageRetryAttempts: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string; // e.g., 'SyncService', 'UploadService'
  message: string;
  location?: string; // e.g. 'SyncService.ts:142'
  stack?: string;
  details?: string;
  operationId?: string;
  table?: string;
  localId?: string;
}
