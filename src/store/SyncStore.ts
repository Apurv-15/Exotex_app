import { create } from 'zustand';
import { QueuedOperation, SyncNotification, ConflictRecord, SyncStats, SyncLog } from '../types/sync';

interface SyncState {
  // Queue Data
  queue: QueuedOperation[];
  setQueue: (queue: QueuedOperation[]) => void;
  
  // Sync Status
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (status: boolean) => void;
  
  // Notifications & UI
  notifications: SyncNotification[];
  addNotification: (notification: Omit<SyncNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Conflicts
  conflicts: ConflictRecord[];
  addConflict: (conflict: ConflictRecord) => void;
  resolveConflict: (localId: string) => void;
  
  // Stats
  stats: SyncStats;
  updateStats: (partialStats: Partial<SyncStats>) => void;
  
  // Persistence Tracking & Logging
  logs: SyncLog[];
  addLog: (log: Omit<SyncLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  queue: [],
  setQueue: (queue) => set({ queue }),
  
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),
  
  isSyncing: false,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  
  notifications: [],
  addNotification: (notification) => set((state) => {
    // Keep max 5 notifications
    const newNotif: SyncNotification = {
        ...notification,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString()
    };
    const current = [newNotif, ...state.notifications].slice(0, 5);
    return { notifications: current };
  }),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  conflicts: [],
  addConflict: (conflict) => set((state) => ({
    conflicts: [...state.conflicts, conflict]
  })),
  resolveConflict: (localId) => set((state) => ({
    conflicts: state.conflicts.filter(c => c.localId !== localId)
  })),
  
  stats: {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    lastSyncTime: null,
    averageRetryAttempts: 0
  },
  updateStats: (partialStats) => set((state) => ({
    stats: { ...state.stats, ...partialStats }
  })),

  logs: [],
  addLog: (log) => set((state) => {
    const newLog: SyncLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    };
    // Keep last 100 logs for sub-admin auditing
    const updated = [newLog, ...state.logs].slice(0, 100);
    return { logs: updated };
  }),
  clearLogs: () => set({ logs: [] })
}));
