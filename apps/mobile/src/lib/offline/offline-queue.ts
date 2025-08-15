import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

class OfflineQueue {
  private readonly QUEUE_KEY = '@offline_queue';
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private isOnline = true;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load queue from storage
    await this.loadQueue();

    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Back online - process queue
        console.log('Back online - processing offline queue');
        this.processQueue();
      }
    });

    // Process queue on startup if online
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      this.processQueue();
    }
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        // Sort by priority and timestamp
        this.sortQueue();
        console.log(`Loaded ${this.queue.length} queued requests`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private sortQueue() {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    this.queue.sort((a, b) => {
      // Sort by priority first
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp
      return a.timestamp - b.timestamp;
    });
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: uuidv4(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: request.maxRetries || 3,
    };

    this.queue.push(queuedRequest);
    this.sortQueue();
    await this.saveQueue();

    console.log(`Added request to offline queue: ${request.method} ${request.url}`);

    // Try to process immediately if online
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  async remove(id: string) {
    this.queue = this.queue.filter(req => req.id !== id);
    await this.saveQueue();
  }

  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Processing offline queue: ${this.queue.length} requests`);

    try {
      const processingQueue = [...this.queue];
      
      for (const request of processingQueue) {
        try {
          // Execute request
          const response = await this.executeRequest(request);
          
          if (response.ok) {
            // Remove from queue on success
            await this.remove(request.id);
            console.log(`Successfully processed: ${request.method} ${request.url}`);
            
            // Emit success event
            this.emitEvent('request:success', { request, response });
          } else if (response.status >= 400 && response.status < 500) {
            // Client error - don't retry
            await this.remove(request.id);
            console.warn(`Client error for ${request.method} ${request.url}: ${response.status}`);
            this.emitEvent('request:failed', { request, response });
          } else {
            // Server error - retry
            await this.handleRetry(request);
          }
        } catch (error) {
          // Network error - retry
          console.warn(`Network error for ${request.method} ${request.url}:`, error);
          await this.handleRetry(request);
        }
      }
    } finally {
      this.isProcessing = false;
      
      // Schedule next processing if queue is not empty
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }

  private async executeRequest(request: QueuedRequest): Promise<Response> {
    const { url, method, data, headers } = request;
    
    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async handleRetry(request: QueuedRequest) {
    request.retryCount++;
    
    if (request.retryCount >= request.maxRetries) {
      // Max retries reached - remove from queue
      await this.remove(request.id);
      console.warn(`Max retries reached for ${request.method} ${request.url}`);
      this.emitEvent('request:failed', { request, reason: 'max_retries' });
    } else {
      // Update retry count and save
      const index = this.queue.findIndex(r => r.id === request.id);
      if (index !== -1) {
        this.queue[index].retryCount = request.retryCount;
        await this.saveQueue();
        console.log(`Retry ${request.retryCount}/${request.maxRetries} for ${request.method} ${request.url}`);
      }
    }
  }

  private emitEvent(event: string, data: any) {
    // For React Native, we can use a simple event emitter
    // This would be replaced with actual event system implementation
    console.log(`Event: ${event}`, data);
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    console.log('Offline queue cleared');
  }

  getQueueStats() {
    const stats = {
      total: this.queue.length,
      byPriority: {
        high: this.queue.filter(r => r.priority === 'high').length,
        normal: this.queue.filter(r => r.priority === 'normal').length,
        low: this.queue.filter(r => r.priority === 'low').length,
      },
      byMethod: this.queue.reduce((acc, req) => {
        acc[req.method] = (acc[req.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      oldestRequest: this.queue.length > 0 ? new Date(Math.min(...this.queue.map(r => r.timestamp))) : null,
    };
    
    return stats;
  }
}

export const offlineQueue = new OfflineQueue();