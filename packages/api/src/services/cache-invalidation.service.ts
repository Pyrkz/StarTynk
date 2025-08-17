/**
 * Cache invalidation service for managing cache purging
 * Supports invalidation by tag, pattern, and user
 */

import { CacheTagGenerators } from '../config/cache.config';

export interface CacheInvalidationOptions {
  broadcast?: boolean; // Broadcast to CDN
  recursive?: boolean; // Invalidate related caches
  delay?: number; // Delay before invalidation (ms)
}

export interface InvalidationResult {
  success: boolean;
  invalidated: string[];
  errors?: string[];
  timestamp: Date;
}

export class CacheInvalidationService {
  private static invalidationQueue: Map<string, NodeJS.Timeout> = new Map();
  private static invalidationLog: InvalidationResult[] = [];
  
  /**
   * Invalidate cache by tag
   * Tags are used to group related cache entries
   */
  static async invalidateByTag(
    tag: string, 
    options: CacheInvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const result: InvalidationResult = {
      success: true,
      invalidated: [],
      timestamp: new Date(),
    };

    try {
      // Handle delayed invalidation
      if (options.delay) {
        return this.scheduleInvalidation(() => this.invalidateByTag(tag, { ...options, delay: 0 }), options.delay);
      }

      // Add tag to invalidation list
      result.invalidated.push(`tag:${tag}`);

      // If recursive, invalidate related tags
      if (options.recursive) {
        const relatedTags = this.getRelatedTags(tag);
        for (const relatedTag of relatedTags) {
          result.invalidated.push(`tag:${relatedTag}`);
        }
      }

      // Broadcast to CDN if enabled
      if (options.broadcast) {
        await this.broadcastInvalidation('tag', tag);
      }

      // Log invalidation
      this.logInvalidation(result);

      // TODO: Integrate with actual cache storage (Redis, etc.)
      // This is where you would actually purge the cache entries

      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : 'Unknown error'];
      return result;
    }
  }

  /**
   * Invalidate cache by pattern
   * Patterns can use wildcards to match multiple cache keys
   */
  static async invalidateByPattern(
    pattern: string, 
    options: CacheInvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const result: InvalidationResult = {
      success: true,
      invalidated: [],
      timestamp: new Date(),
    };

    try {
      // Handle delayed invalidation
      if (options.delay) {
        return this.scheduleInvalidation(
          () => this.invalidateByPattern(pattern, { ...options, delay: 0 }), 
          options.delay
        );
      }

      // Convert pattern to regex
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      
      // Add pattern to invalidation list
      result.invalidated.push(`pattern:${pattern}`);

      // Broadcast to CDN if enabled
      if (options.broadcast) {
        await this.broadcastInvalidation('pattern', pattern);
      }

      // Log invalidation
      this.logInvalidation(result);

      // TODO: Integrate with actual cache storage
      // This would scan and invalidate all keys matching the pattern

      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : 'Unknown error'];
      return result;
    }
  }

  /**
   * Invalidate all cache entries for a specific user
   */
  static async invalidateByUser(
    userId: string, 
    options: CacheInvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const result: InvalidationResult = {
      success: true,
      invalidated: [],
      timestamp: new Date(),
    };

    try {
      // User-specific patterns to invalidate
      const userPatterns = [
        `user:${userId}:*`,
        `api:*:user:${userId}`,
        `private:${userId}:*`,
      ];

      // User-specific tags
      const userTags = [
        CacheTagGenerators.user(userId),
      ];

      // Invalidate patterns
      for (const pattern of userPatterns) {
        const patternResult = await this.invalidateByPattern(pattern, { ...options, delay: 0 });
        result.invalidated.push(...patternResult.invalidated);
      }

      // Invalidate tags
      for (const tag of userTags) {
        const tagResult = await this.invalidateByTag(tag, { ...options, delay: 0 });
        result.invalidated.push(...tagResult.invalidated);
      }

      // Log invalidation
      this.logInvalidation(result);

      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : 'Unknown error'];
      return result;
    }
  }

  /**
   * Invalidate all cache entries
   * Use with caution!
   */
  static async invalidateAll(
    options: CacheInvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const result: InvalidationResult = {
      success: true,
      invalidated: ['all'],
      timestamp: new Date(),
    };

    try {
      // Broadcast to CDN if enabled
      if (options.broadcast) {
        await this.broadcastInvalidation('all', '*');
      }

      // Log invalidation
      this.logInvalidation(result);

      // TODO: Integrate with actual cache storage
      // This would flush all cache entries

      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error instanceof Error ? error.message : 'Unknown error'];
      return result;
    }
  }

  /**
   * Invalidate cache after data mutation
   * Called by database triggers or ORM middleware
   */
  static async invalidateAfterMutation(
    entity: string,
    operation: 'create' | 'update' | 'delete',
    id?: string,
    options: CacheInvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const tags: string[] = [];
    const patterns: string[] = [];

    // Add entity-wide invalidation
    tags.push(CacheTagGenerators.all(entity));
    patterns.push(`collection:${entity}*`);

    // Add specific entity invalidation if ID provided
    if (id) {
      switch (entity) {
        case 'project':
          tags.push(CacheTagGenerators.project(id));
          patterns.push(`api:*:projects/${id}*`);
          break;
        case 'user':
          tags.push(CacheTagGenerators.user(id));
          patterns.push(`api:*:users/${id}*`);
          break;
        case 'task':
          tags.push(CacheTagGenerators.task(id));
          patterns.push(`api:*:tasks/${id}*`);
          break;
        case 'employee':
          tags.push(CacheTagGenerators.employee(id));
          patterns.push(`api:*:employees/${id}*`);
          break;
        case 'vehicle':
          tags.push(CacheTagGenerators.vehicle(id));
          patterns.push(`api:*:vehicles/${id}*`);
          break;
        case 'equipment':
          tags.push(CacheTagGenerators.equipment(id));
          patterns.push(`api:*:equipment/${id}*`);
          break;
      }
    }

    // Invalidate all tags and patterns
    const result: InvalidationResult = {
      success: true,
      invalidated: [],
      timestamp: new Date(),
    };

    for (const tag of tags) {
      const tagResult = await this.invalidateByTag(tag, options);
      result.invalidated.push(...tagResult.invalidated);
    }

    for (const pattern of patterns) {
      const patternResult = await this.invalidateByPattern(pattern, options);
      result.invalidated.push(...patternResult.invalidated);
    }

    return result;
  }

  /**
   * Get related tags for recursive invalidation
   */
  private static getRelatedTags(tag: string): string[] {
    const related: string[] = [];

    // Extract entity type and ID from tag
    const [entity, id] = tag.split(':');

    // Add related tags based on entity relationships
    switch (entity) {
      case 'project':
        // Projects affect tasks, employees, materials
        related.push(
          CacheTagGenerators.all('tasks'),
          CacheTagGenerators.all('materials'),
          `project-employees:${id}`
        );
        break;
      case 'user':
        // Users affect projects they're assigned to
        related.push(CacheTagGenerators.all('projects'));
        break;
      case 'employee':
        // Employees affect payroll, projects
        related.push(
          CacheTagGenerators.all('payroll'),
          CacheTagGenerators.all('projects')
        );
        break;
    }

    return related;
  }

  /**
   * Schedule delayed invalidation
   */
  private static scheduleInvalidation(
    invalidationFn: () => Promise<InvalidationResult>,
    delay: number
  ): Promise<InvalidationResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        const result = await invalidationFn();
        this.invalidationQueue.delete(timeoutId.toString());
        resolve(result);
      }, delay);

      this.invalidationQueue.set(timeoutId.toString(), timeoutId as any);
    });
  }

  /**
   * Broadcast invalidation to CDN
   */
  private static async broadcastInvalidation(
    type: 'tag' | 'pattern' | 'all',
    value: string
  ): Promise<void> {
    // Implementation depends on CDN provider
    // Example for Cloudflare:
    if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const endpoint = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`;
        
        let body: any;
        switch (type) {
          case 'tag':
            body = { tags: [value] };
            break;
          case 'pattern':
            body = { files: [value] };
            break;
          case 'all':
            body = { purge_everything: true };
            break;
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error('CDN invalidation failed:', error);
      }
    }

    // Example for Vercel:
    if (process.env.VERCEL_TEAM_ID && process.env.VERCEL_API_TOKEN) {
      // Vercel uses revalidation API
      // Implementation would go here
    }
  }

  /**
   * Log invalidation for analytics
   */
  private static logInvalidation(result: InvalidationResult): void {
    this.invalidationLog.push(result);
    
    // Keep only last 1000 entries
    if (this.invalidationLog.length > 1000) {
      this.invalidationLog = this.invalidationLog.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Cache Invalidation]', {
        timestamp: result.timestamp,
        invalidated: result.invalidated.length,
        items: result.invalidated,
      });
    }
  }

  /**
   * Get invalidation history
   */
  static getInvalidationHistory(limit = 100): InvalidationResult[] {
    return this.invalidationLog.slice(-limit);
  }

  /**
   * Clear invalidation queue
   */
  static clearInvalidationQueue(): void {
    this.invalidationQueue.forEach((timeoutId) => {
      clearTimeout(timeoutId as any);
    });
    this.invalidationQueue.clear();
  }
}