/**
 * ETag service for efficient cache validation
 * Generates and validates ETags for responses
 */

import { createHash } from 'crypto';

export interface ETagOptions {
  weak?: boolean;
  includeTimestamp?: boolean;
  algorithm?: 'md5' | 'sha1' | 'sha256';
}

export class ETagService {
  private static readonly DEFAULT_ALGORITHM = 'md5';
  
  /**
   * Generate ETag from data
   * @param data - Data to generate ETag from
   * @param options - ETag generation options
   * @returns ETag string (W/"hash" for weak, "hash" for strong)
   */
  static generateETag(data: any, options: ETagOptions = {}): string {
    const {
      weak = true,
      includeTimestamp = false,
      algorithm = this.DEFAULT_ALGORITHM
    } = options;
    
    // Convert data to string for hashing
    let content: string;
    if (typeof data === 'string') {
      content = data;
    } else if (Buffer.isBuffer(data)) {
      content = data.toString();
    } else {
      // For objects, use deterministic JSON stringification
      content = this.deterministicStringify(data);
    }
    
    // Include timestamp for time-sensitive data
    if (includeTimestamp) {
      content += `:${Math.floor(Date.now() / 1000)}`; // Unix timestamp
    }
    
    // Generate hash
    const hash = createHash(algorithm)
      .update(content, 'utf8')
      .digest('hex');
    
    // Return weak or strong ETag
    return weak ? `W/"${hash}"` : `"${hash}"`;
  }

  /**
   * Generate ETag for a collection of items
   * Combines individual ETags into a collection ETag
   */
  static generateCollectionETag(items: any[], options: ETagOptions = {}): string {
    if (!items || items.length === 0) {
      return this.generateETag('empty-collection', options);
    }
    
    // Generate ETags for each item
    const itemETags = items.map(item => 
      this.generateETag(item, { ...options, weak: false })
    );
    
    // Combine ETags
    const combinedHash = createHash(options.algorithm || this.DEFAULT_ALGORITHM)
      .update(itemETags.join(':'))
      .digest('hex');
    
    // Collection ETags are always weak since order might change
    return `W/"${combinedHash}-${items.length}"`;
  }

  /**
   * Validate if request ETag matches current ETag
   * Supports both strong and weak validation
   */
  static validateETag(requestETag: string | null, currentETag: string): boolean {
    if (!requestETag) {
      return false;
    }
    
    // Parse multiple ETags (comma-separated)
    const requestETags = this.parseETags(requestETag);
    
    // Check for wildcard
    if (requestETags.includes('*')) {
      return true;
    }
    
    // Normalize current ETag
    const normalizedCurrent = this.normalizeETag(currentETag);
    
    // Check each request ETag
    return requestETags.some(tag => {
      const normalizedRequest = this.normalizeETag(tag);
      
      // For weak comparison, ignore the W/ prefix
      if (normalizedCurrent.weak || normalizedRequest.weak) {
        return normalizedCurrent.value === normalizedRequest.value;
      }
      
      // Strong comparison requires exact match including weak flag
      return normalizedCurrent.raw === normalizedRequest.raw;
    });
  }

  /**
   * Generate Last-Modified header value
   */
  static generateLastModified(date?: Date): string {
    const d = date || new Date();
    return d.toUTCString();
  }

  /**
   * Check if resource was modified since given date
   */
  static isModifiedSince(lastModified: Date, ifModifiedSince: string | null): boolean {
    if (!ifModifiedSince) {
      return true;
    }
    
    try {
      const sinceDate = new Date(ifModifiedSince);
      // Remove milliseconds for comparison
      const lastModMs = Math.floor(lastModified.getTime() / 1000) * 1000;
      const sinceMs = Math.floor(sinceDate.getTime() / 1000) * 1000;
      
      return lastModMs > sinceMs;
    } catch {
      // Invalid date, assume modified
      return true;
    }
  }

  /**
   * Check if none match (for conditional requests)
   */
  static isNoneMatch(currentETag: string, ifNoneMatch: string | null): boolean {
    if (!ifNoneMatch) {
      return false;
    }
    
    return this.validateETag(ifNoneMatch, currentETag);
  }

  /**
   * Generate cache headers for response
   */
  static generateCacheHeaders(data: any, options: {
    etag?: boolean;
    lastModified?: boolean;
    weak?: boolean;
  } = {}): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (options.etag !== false) {
      headers['ETag'] = this.generateETag(data, { weak: options.weak });
    }
    
    if (options.lastModified !== false) {
      headers['Last-Modified'] = this.generateLastModified();
    }
    
    return headers;
  }

  /**
   * Parse ETags from header value
   */
  private static parseETags(etagHeader: string): string[] {
    // Handle comma-separated ETags
    return etagHeader
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Normalize ETag for comparison
   */
  private static normalizeETag(etag: string): {
    raw: string;
    weak: boolean;
    value: string;
  } {
    const trimmed = etag.trim();
    const weak = trimmed.startsWith('W/');
    const value = trimmed
      .replace(/^W\//, '')
      .replace(/^"/, '')
      .replace(/"$/, '');
    
    return { raw: trimmed, weak, value };
  }

  /**
   * Deterministic JSON stringification for consistent hashing
   */
  private static deterministicStringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      // Sort object keys
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          }, {} as any);
      }
      return value;
    });
  }

  /**
   * Generate ETag for file/stream with metadata
   */
  static generateFileETag(stats: {
    size: number;
    mtime: Date | string;
    inode?: number;
  }): string {
    const mtime = typeof stats.mtime === 'string' 
      ? new Date(stats.mtime).getTime() 
      : stats.mtime.getTime();
    
    const parts = [
      stats.size.toString(16), // Size in hex
      Math.floor(mtime / 1000).toString(16), // mtime in hex (seconds)
    ];
    
    if (stats.inode) {
      parts.push(stats.inode.toString(16)); // inode in hex
    }
    
    return `W/"${parts.join('-')}"`;
  }

  /**
   * Check if client supports ETags
   */
  static clientSupportsETags(headers: Record<string, string>): boolean {
    // Check for conditional request headers
    return !!(
      headers['if-none-match'] || 
      headers['if-match'] || 
      headers['if-modified-since'] ||
      headers['if-unmodified-since']
    );
  }

  /**
   * Generate Vary header based on factors affecting response
   */
  static generateVaryHeader(factors: string[]): string {
    const defaultFactors = ['Accept-Encoding'];
    const uniqueFactors = new Set([...defaultFactors, ...factors]);
    const allFactors = Array.from(uniqueFactors);
    return allFactors.join(', ');
  }
}