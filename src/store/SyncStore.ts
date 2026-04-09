import { create } from 'zustand';
import { Storage } from '../utils/storage';
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

  // Global Sync Settings
  isOfflineModeEnabled: boolean;
  setIsOfflineModeEnabled: (enabled: boolean) => void;
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
  clearLogs: () => set({ logs: [] }),

  // Settings
  isOfflineModeEnabled: true,
  setIsOfflineModeEnabled: (enabled: boolean) => set({ isOfflineModeEnabled: enabled }),
}));

// Setup persistence mapping manually to avoid Webpack/Metro `import.meta` ESM crashing on web
const STORE_KEY = 'sync-store-native-db';

let isHydrated = false;

const initializeStore = async () => {
    try {
        const stored = await Storage.getItem(STORE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const currentLogs = useSyncStore.getState().logs;
            const currentQueue = useSyncStore.getState().queue;

            useSyncStore.setState({
                // Merge live (startup) logs with persisted ones
                logs: [...currentLogs, ...(parsed.logs || [])].slice(0, 100),
                stats: parsed.stats || useSyncStore.getState().stats,
                // Only use persisted queue if current live queue is empty
                queue: currentQueue.length > 0 ? currentQueue : (parsed.queue || []),
                isOfflineModeEnabled: parsed.isOfflineModeEnabled ?? true
            });
        }
    } catch(e) {
        console.warn("Failed to mount persistence store", e);
    } finally {
        isHydrated = true;
    }
};

initializeStore();

useSyncStore.subscribe((state) => {
    // Prevent data loss: Only persist IF we are hydrated or we have data
    if (!isHydrated) return;

    Storage.setItem(STORE_KEY, JSON.stringify({
        logs: state.logs,
        stats: state.stats,
        queue: state.queue,
        isOfflineModeEnabled: state.isOfflineModeEnabled
    })).catch(() => {});
});
