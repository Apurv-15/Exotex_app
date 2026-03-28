import { useSyncStore } from '../store/SyncStore';

export function useNetworkStatus() {
  const { isOnline, isSyncing, stats } = useSyncStore();
  
  return {
    isOnline,
    isSyncing,
    lastSyncTime: stats.lastSyncTime
  };
}
