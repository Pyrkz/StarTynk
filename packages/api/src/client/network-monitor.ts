import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { ConnectionQuality, type NetworkState, type NetworkListener } from './types/offline.types';

/**
 * Network monitor for connection state and quality
 */
export class NetworkMonitor {
  private listeners: Set<NetworkListener> = new Set();
  private currentState: NetworkState | null = null;
  private connectionQuality: ConnectionQuality = ConnectionQuality.OFFLINE;
  private unsubscribe: (() => void) | null = null;
  private latencyCache: Map<string, number> = new Map();

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.handleStateChange(state);
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.handleStateChange(state);
  }

  /**
   * Get current network state
   */
  async getCurrentState(): Promise<NetworkState> {
    if (!this.currentState) {
      const state = await NetInfo.fetch();
      this.handleStateChange(state);
    }
    return this.currentState!;
  }

  /**
   * Get connection quality assessment
   */
  async getConnectionQuality(): Promise<ConnectionQuality> {
    const state = await this.getCurrentState();
    
    if (!state.isConnected || !state.isInternetReachable) {
      return ConnectionQuality.OFFLINE;
    }

    // Base quality on connection type
    if (state.type === 'wifi') {
      // Check WiFi strength if available
      const details = state.details as any;
      if (details?.strength) {
        if (details.strength > -50) return ConnectionQuality.EXCELLENT;
        if (details.strength > -70) return ConnectionQuality.GOOD;
        if (details.strength > -80) return ConnectionQuality.FAIR;
        return ConnectionQuality.POOR;
      }
      return ConnectionQuality.EXCELLENT; // Default for WiFi
    }

    if (state.type === 'cellular') {
      const details = state.details as any;
      const cellularGeneration = details?.cellularGeneration;
      
      switch (cellularGeneration) {
        case '5g':
          return ConnectionQuality.EXCELLENT;
        case '4g':
          return ConnectionQuality.GOOD;
        case '3g':
          return ConnectionQuality.FAIR;
        case '2g':
          return ConnectionQuality.POOR;
        default:
          // Estimate based on effective type or default to fair
          return this.estimateQualityFromEffectiveType(details);
      }
    }

    // Unknown connection type - do latency test
    return this.estimateQualityFromLatency();
  }

  /**
   * Subscribe to network state changes
   */
  onStateChange(callback: NetworkListener): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Wait for network connection with timeout
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    const state = await this.getCurrentState();
    if (state.isConnected && state.isInternetReachable) {
      return true;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.onStateChange(async (newState) => {
        if (newState.isConnected && newState.isInternetReachable) {
          clearTimeout(timer);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Measure latency to endpoint
   */
  async measureLatency(endpoint: string): Promise<number> {
    // Check cache first (valid for 5 minutes)
    const cached = this.latencyCache.get(endpoint);
    if (cached && Date.now() - cached < 5 * 60 * 1000) {
      return cached;
    }

    try {
      const start = Date.now();
      
      // Simple HEAD request to measure latency
      const response = await fetch(endpoint, {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        const latency = Date.now() - start;
        this.latencyCache.set(endpoint, latency);
        return latency;
      }
    } catch (error) {
      // Network error
    }

    return -1; // Indicates failure
  }

  /**
   * Check if specific endpoint is reachable
   */
  async isEndpointReachable(endpoint: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed network diagnostics
   */
  async getDiagnostics(): Promise<{
    state: NetworkState;
    quality: ConnectionQuality;
    latency: number;
    bandwidth?: number;
    jitter?: number;
    packetLoss?: number;
  }> {
    const state = await this.getCurrentState();
    const quality = await this.getConnectionQuality();
    
    // Measure latency to common endpoints
    const latencies: number[] = [];
    const endpoints = [
      'https://1.1.1.1/',
      'https://8.8.8.8/',
      'https://dns.google/',
    ];

    for (const endpoint of endpoints) {
      const latency = await this.measureLatency(endpoint);
      if (latency > 0) latencies.push(latency);
    }

    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : -1;

    // Calculate jitter (variation in latency)
    const jitter = latencies.length > 1
      ? Math.sqrt(
          latencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / 
          latencies.length
        )
      : 0;

    return {
      state,
      quality,
      latency: avgLatency,
      jitter,
      // Bandwidth and packet loss would require more sophisticated testing
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.latencyCache.clear();
  }

  // Private helper methods

  private handleStateChange(state: NetInfoState): void {
    const networkState = this.mapNetInfoState(state);
    this.currentState = networkState;
    this.connectionQuality = this.calculateQuality(state);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(networkState);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  private mapNetInfoState(state: NetInfoState): NetworkState {
    const details = state.details as any;
    
    let type: 'wifi' | 'cellular' | 'none' = 'none';
    if (state.type === NetInfoStateType.wifi) {
      type = 'wifi';
    } else if (state.type === NetInfoStateType.cellular) {
      type = 'cellular';
    }

    let strength: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (state.isConnected && state.isInternetReachable) {
      if (type === 'wifi') {
        strength = 'excellent';
      } else if (type === 'cellular') {
        const generation = details?.cellularGeneration;
        if (generation === '5g' || generation === '4g') {
          strength = 'good';
        } else if (generation === '3g') {
          strength = 'fair';
        }
      }
    }

    return {
      isConnected: state.isConnected || false,
      type,
      strength,
      isInternetReachable: state.isInternetReachable || false,
      details: {
        ...details,
        netInfoType: state.type,
      },
    };
  }

  private calculateQuality(state: NetInfoState): ConnectionQuality {
    if (!state.isConnected || !state.isInternetReachable) {
      return ConnectionQuality.OFFLINE;
    }

    const details = state.details as any;

    if (state.type === NetInfoStateType.wifi) {
      return ConnectionQuality.EXCELLENT;
    }

    if (state.type === NetInfoStateType.cellular) {
      const generation = details?.cellularGeneration;
      switch (generation) {
        case '5g':
          return ConnectionQuality.EXCELLENT;
        case '4g':
          return ConnectionQuality.GOOD;
        case '3g':
          return ConnectionQuality.FAIR;
        case '2g':
          return ConnectionQuality.POOR;
        default:
          return ConnectionQuality.FAIR;
      }
    }

    return ConnectionQuality.FAIR;
  }

  private estimateQualityFromEffectiveType(details: any): ConnectionQuality {
    const effectiveType = details?.effectiveType;
    
    switch (effectiveType) {
      case '4g':
        return ConnectionQuality.GOOD;
      case '3g':
        return ConnectionQuality.FAIR;
      case '2g':
      case 'slow-2g':
        return ConnectionQuality.POOR;
      default:
        return ConnectionQuality.FAIR;
    }
  }

  private async estimateQualityFromLatency(): Promise<ConnectionQuality> {
    // Test latency to determine quality
    const testEndpoint = 'https://1.1.1.1/';
    const latency = await this.measureLatency(testEndpoint);
    
    if (latency < 0) return ConnectionQuality.OFFLINE;
    if (latency < 50) return ConnectionQuality.EXCELLENT;
    if (latency < 150) return ConnectionQuality.GOOD;
    if (latency < 300) return ConnectionQuality.FAIR;
    return ConnectionQuality.POOR;
  }
}