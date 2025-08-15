import { Logger } from '@repo/utils/logger';
import { 
  EventName, 
  EventPayload, 
  EventHandler, 
  EventSubscription, 
  EventMap 
} from './events.types';

export class EventBus {
  private handlers = new Map<EventName, Set<EventHandler<any>>>();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('EventBus');
  }

  /**
   * Subscribe to an event
   */
  on<T extends EventName>(
    eventName: T,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;
    handlers.add(handler);

    this.logger.debug(`Subscribed to event: ${eventName}`, { 
      handlerCount: handlers.size 
    });

    return {
      unsubscribe: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventName);
        }
        this.logger.debug(`Unsubscribed from event: ${eventName}`);
      }
    };
  }

  /**
   * Subscribe to an event only once
   */
  once<T extends EventName>(
    eventName: T,
    handler: EventHandler<T>
  ): EventSubscription {
    const subscription = this.on(eventName, async (payload) => {
      subscription.unsubscribe();
      await handler(payload);
    });

    return subscription;
  }

  /**
   * Emit an event
   */
  async emit<T extends EventName>(
    eventName: T,
    payload: EventPayload<T>
  ): Promise<void> {
    const handlers = this.handlers.get(eventName);
    
    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers for event: ${eventName}`);
      return;
    }

    this.logger.debug(`Emitting event: ${eventName}`, { 
      handlerCount: handlers.size,
      payload: this.sanitizePayload(payload)
    });

    const promises: Promise<void>[] = [];

    for (const handler of handlers) {
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        this.logger.error(`Synchronous handler error for event ${eventName}`, error);
        // Emit error event if it's not already an error event to avoid loops
        if (eventName !== 'system.error') {
          this.emit('system.error', {
            timestamp: new Date(),
            error: error as Error,
            context: `EventBus handler for ${eventName}`,
            severity: 'medium'
          }).catch(() => {
            // Prevent infinite loops - just log
            this.logger.error('Failed to emit error event', error);
          });
        }
      }
    }

    // Wait for all async handlers
    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        this.logger.error(`Async handler error for event ${eventName}`, error);
      }
    }

    this.logger.debug(`Event ${eventName} processed`);
  }

  /**
   * Emit an event and wait for all handlers to complete
   */
  async emitSync<T extends EventName>(
    eventName: T,
    payload: EventPayload<T>
  ): Promise<void> {
    const handlers = this.handlers.get(eventName);
    
    if (!handlers || handlers.size === 0) {
      return;
    }

    this.logger.debug(`Emitting sync event: ${eventName}`, { 
      handlerCount: handlers.size 
    });

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error(`Handler error for sync event ${eventName}`, error);
        throw error; // Re-throw for sync events
      }
    }
  }

  /**
   * Remove all handlers for an event
   */
  off<T extends EventName>(eventName: T): void {
    this.handlers.delete(eventName);
    this.logger.debug(`Removed all handlers for event: ${eventName}`);
  }

  /**
   * Remove all handlers for all events
   */
  removeAllListeners(): void {
    this.handlers.clear();
    this.logger.debug('Removed all event handlers');
  }

  /**
   * Get the number of handlers for an event
   */
  listenerCount(eventName: EventName): number {
    return this.handlers.get(eventName)?.size || 0;
  }

  /**
   * Get all event names that have handlers
   */
  eventNames(): EventName[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Create a child event bus that inherits from this one
   */
  createChild(): EventBus {
    const child = new EventBus(this.logger.child('ChildEventBus'));
    
    // Copy all handlers to child
    for (const [eventName, handlers] of this.handlers) {
      for (const handler of handlers) {
        child.on(eventName, handler);
      }
    }
    
    return child;
  }

  /**
   * Sanitize payload for logging (remove sensitive data)
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Global event bus instance
let globalEventBus: EventBus | null = null;

/**
 * Get or create the global event bus
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

/**
 * Set a custom global event bus
 */
export function setEventBus(eventBus: EventBus): void {
  globalEventBus = eventBus;
}