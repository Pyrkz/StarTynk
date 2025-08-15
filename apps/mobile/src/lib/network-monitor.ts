import * as Network from 'expo-network';
import { EventEmitter } from 'events';

class NetworkMonitor extends EventEmitter {
  private isOnline: boolean = true;
  private networkType: Network.NetworkStateType | null = null;

  async initialize(): Promise<void> {
    // Get initial network state
    const state = await Network.getNetworkStateAsync();
    this.isOnline = state.isConnected ?? false;
    this.networkType = state.type;

    // Listen for network changes
    const subscription = Network.addNetworkStateListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      this.networkType = state.type;

      if (wasOnline !== this.isOnline) {
        this.emit('connectionChange', this.isOnline);
        
        if (this.isOnline) {
          this.emit('online');
        } else {
          this.emit('offline');
        }
      }

      this.emit('networkStateChange', state);
    });

    // Cleanup on app termination
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        subscription.remove();
      });
    }
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getNetworkType(): Network.NetworkStateType | null {
    return this.networkType;
  }

  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline) return true;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.removeListener('online', handleOnline);
        resolve(false);
      }, timeout);

      const handleOnline = () => {
        clearTimeout(timer);
        resolve(true);
      };

      this.once('online', handleOnline);
    });
  }
}

export const networkMonitor = new NetworkMonitor();