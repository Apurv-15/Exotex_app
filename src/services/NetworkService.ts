import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSyncStore } from '../store/SyncStore';

class NetworkServiceBase {
  private isOnline = true;
  private unsubscribe: (() => void) | null = null;
  
  startMonitoring(onBackOnline?: () => void) {
    if (this.unsubscribe) return;
    
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const currentlyOnline = !!state.isConnected && !!state.isInternetReachable;
      
      // Update global Zustand state
      useSyncStore.getState().setIsOnline(currentlyOnline);
      
      // If we back online from offline, trigger the callback
      if (currentlyOnline && !this.isOnline) {
         if (onBackOnline) {
             onBackOnline();
         }
      }
      this.isOnline = currentlyOnline;
    });
  }
  
  stopMonitoring() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async checkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!state.isConnected && !!state.isInternetReachable;
  }
}

export const NetworkService = new NetworkServiceBase();
