/**
 * Response optimizer for mobile clients
 * Reduces payload size and optimizes data structure for mobile consumption
 */

// import { NextResponse } from 'next/server'; // Not available in API package
import { PERFORMANCE_HINTS } from '../config/cache.config';
import type { ClientType } from '../services/client-detection.service';

export interface OptimizationOptions {
  fields?: string[]; // Field filtering
  compress?: boolean; // Enable compression
  removeNulls?: boolean; // Remove null values
  convertDates?: boolean; // Convert dates to timestamps
  truncateStrings?: number; // Max string length
  clientType?: ClientType;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResponseOptimizer {
  /**
   * Optimize response data for mobile clients
   */
  static optimizeForMobile(data: any, options: OptimizationOptions = {}): any {
    const {
      fields,
      removeNulls = true,
      convertDates = true,
      truncateStrings,
    } = options;

    // Handle different data types
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeObject(item, options));
    }

    if (typeof data === 'object' && data !== null) {
      return this.optimizeObject(data, options);
    }

    return data;
  }

  /**
   * Optimize a single object
   */
  private static optimizeObject(obj: any, options: OptimizationOptions): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const optimized: any = {};
    const {
      fields,
      removeNulls = true,
      convertDates = true,
      truncateStrings,
    } = options;

    // Get keys to process
    const keys = fields || Object.keys(obj);

    for (const key of keys) {
      if (!(key in obj)) continue;

      let value = obj[key];

      // Skip null values if removeNulls is true
      if (removeNulls && (value === null || value === undefined)) {
        continue;
      }

      // Convert dates to timestamps
      if (convertDates && value instanceof Date) {
        value = value.getTime();
      } else if (convertDates && typeof value === 'string' && this.isISODate(value)) {
        value = new Date(value).getTime();
      }

      // Truncate long strings
      if (truncateStrings && typeof value === 'string' && value.length > truncateStrings) {
        value = value.substring(0, truncateStrings) + '...';
      }

      // Recursively optimize nested objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value = value.map(item => this.optimizeObject(item, options));
        } else {
          value = this.optimizeObject(value, options);
        }
      }

      optimized[key] = value;
    }

    return optimized;
  }

  /**
   * Compress response data
   */
  static compressResponse(data: any): any {
    // For very large responses, we could implement actual compression
    // For now, we'll focus on structural optimization
    
    // Remove unnecessary whitespace from JSON
    if (typeof data === 'object') {
      return JSON.parse(JSON.stringify(data));
    }
    
    return data;
  }

  /**
   * Add pagination headers to response
   */
  static addPaginationHeaders(response: Response, pagination: PaginationMeta): void {
    response.headers.set('X-Page', pagination.page.toString());
    response.headers.set('X-Limit', pagination.limit.toString());
    response.headers.set('X-Total', pagination.total.toString());
    response.headers.set('X-Total-Pages', pagination.totalPages.toString());
    
    // Add Link header for navigation
    const links: string[] = [];
    const baseUrl = response.url || '';
    
    if (pagination.hasNext) {
      links.push(`<${baseUrl}?page=${pagination.page + 1}&limit=${pagination.limit}>; rel="next"`);
    }
    
    if (pagination.hasPrev) {
      links.push(`<${baseUrl}?page=${pagination.page - 1}&limit=${pagination.limit}>; rel="prev"`);
    }
    
    links.push(`<${baseUrl}?page=1&limit=${pagination.limit}>; rel="first"`);
    links.push(`<${baseUrl}?page=${pagination.totalPages}&limit=${pagination.limit}>; rel="last"`);
    
    if (links.length > 0) {
      response.headers.set('Link', links.join(', '));
    }
  }

  /**
   * Apply field filtering based on query parameters
   */
  static applyFieldFiltering(data: any, fields: string | string[]): any {
    if (!fields) return data;

    const fieldList = Array.isArray(fields) ? fields : fields.split(',').map(f => f.trim());
    
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, fieldList));
    }
    
    return this.filterFields(data, fieldList);
  }

  /**
   * Filter object fields
   */
  private static filterFields(obj: any, fields: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const filtered: any = {};
    
    for (const field of fields) {
      // Handle nested fields (e.g., "user.name")
      if (field.includes('.')) {
        const [parent, ...rest] = field.split('.');
        const nestedField = rest.join('.');
        
        if (obj[parent]) {
          if (!filtered[parent]) {
            filtered[parent] = {};
          }
          
          const nestedValue = this.getNestedValue(obj[parent], nestedField);
          this.setNestedValue(filtered[parent], nestedField, nestedValue);
        }
      } else {
        if (field in obj) {
          filtered[field] = obj[field];
        }
      }
    }
    
    return filtered;
  }

  /**
   * Get nested value from object
   */
  private static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value;
  }

  /**
   * Set nested value in object
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Check if string is ISO date
   */
  private static isISODate(str: string): boolean {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
      return false;
    }
    const date = new Date(str);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Create optimized response for mobile clients
   */
  static createOptimizedResponse(
    data: any,
    clientType: ClientType,
    options: {
      status?: number;
      headers?: Record<string, string>;
      fields?: string[];
      pagination?: PaginationMeta;
    } = {}
  ): Response {
    const hints = PERFORMANCE_HINTS[clientType] || PERFORMANCE_HINTS.web;
    
    // Apply optimizations for mobile
    let optimizedData = data;
    if (clientType === 'mobile') {
      // Apply field filtering if requested
      if (options.fields) {
        optimizedData = this.applyFieldFiltering(data, options.fields);
      }
      
      // Apply mobile optimizations
      optimizedData = this.optimizeForMobile(optimizedData, {
        removeNulls: true,
        convertDates: true,
        truncateStrings: hints.enableFieldFiltering ? 500 : undefined,
        clientType,
      });
      
      // Compress if needed
      if (hints.compressionThreshold) {
        const dataSize = JSON.stringify(optimizedData).length;
        if (dataSize > hints.compressionThreshold) {
          optimizedData = this.compressResponse(optimizedData);
        }
      }
    }
    
    // Create response
    const response = new Response(JSON.stringify(optimizedData), {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Add pagination headers if provided
    if (options.pagination) {
      this.addPaginationHeaders(response, options.pagination);
    }
    
    // Add optimization headers
    response.headers.set('X-Optimized', clientType === 'mobile' ? 'true' : 'false');
    
    return response;
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get default pagination limits based on client type
   */
  static getDefaultPaginationLimits(clientType: ClientType): {
    default: number;
    max: number;
  } {
    const hints = PERFORMANCE_HINTS[clientType] || PERFORMANCE_HINTS.web;
    
    return {
      default: hints.defaultPageSize,
      max: hints.maxPageSize,
    };
  }

  /**
   * Strip sensitive fields from response
   */
  static stripSensitiveFields(
    data: any,
    sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']
  ): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.stripSensitiveFields(item, sensitiveFields));
    }
    
    const cleaned = { ...data };
    
    for (const field of sensitiveFields) {
      delete cleaned[field];
    }
    
    // Recursively clean nested objects
    for (const key in cleaned) {
      if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
        cleaned[key] = this.stripSensitiveFields(cleaned[key], sensitiveFields);
      }
    }
    
    return cleaned;
  }
}