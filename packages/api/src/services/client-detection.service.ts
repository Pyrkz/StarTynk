/**
 * Enhanced client detection service for intelligent caching
 * Detects client type, app version, network quality, and offline capabilities
 */

export type ClientType = 'mobile' | 'web' | 'unknown';
export type NetworkQuality = 'fast' | 'slow' | 'offline';

export interface ClientInfo {
  type: ClientType;
  appVersion: string | null;
  platform: string | null;
  networkQuality: NetworkQuality;
  isOfflineCapable: boolean;
  userAgent: string;
  saveDataMode: boolean;
  connectionType?: string;
}

export interface DetectionOptions {
  headers: Headers | Record<string, string>;
  userAgent?: string;
  ip?: string;
}

export class ClientDetectionService {
  private static readonly MOBILE_USER_AGENTS = [
    'Expo',
    'ReactNative',
    'okhttp', // Android HTTP client
    'Dalvik', // Android runtime
    'CFNetwork', // iOS networking
  ];

  private static readonly MOBILE_PLATFORMS = ['ios', 'android'];
  
  private static readonly SLOW_CONNECTION_TYPES = [
    '2g',
    'slow-2g',
    'cellular',
  ];

  /**
   * Detect client type from request headers and patterns
   */
  static detectClientType(options: DetectionOptions): ClientType {
    const headers = this.normalizeHeaders(options.headers);
    
    // 1. Explicit client type header (most reliable)
    const clientTypeHeader = headers['x-client-type'];
    if (clientTypeHeader === 'mobile' || clientTypeHeader === 'web') {
      return clientTypeHeader;
    }
    
    // 2. App version header indicates mobile app
    if (headers['x-app-version']) {
      return 'mobile';
    }
    
    // 3. Platform header check
    const platform = headers['x-platform']?.toLowerCase();
    if (platform && this.MOBILE_PLATFORMS.includes(platform)) {
      return 'mobile';
    }
    
    // 4. User-Agent analysis
    const userAgent = options.userAgent || headers['user-agent'] || '';
    if (this.isMobileUserAgent(userAgent)) {
      return 'mobile';
    }
    
    // 5. Authorization pattern (mobile apps often use Bearer tokens)
    const auth = headers['authorization'];
    if (auth?.startsWith('Bearer ') && !userAgent.includes('Mozilla')) {
      return 'mobile';
    }
    
    // 6. Request patterns (batch requests common in mobile)
    if (headers['x-batch-request'] || headers['x-sync-request']) {
      return 'mobile';
    }
    
    // Default to web if browser-like user agent
    if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
      return 'web';
    }
    
    return 'unknown';
  }

  /**
   * Detect app version from headers
   */
  static detectAppVersion(options: DetectionOptions): string | null {
    const headers = this.normalizeHeaders(options.headers);
    
    // Check multiple possible headers
    return headers['x-app-version'] || 
           headers['x-client-version'] || 
           headers['x-version'] || 
           null;
  }

  /**
   * Detect network quality from headers and connection info
   */
  static detectNetworkQuality(options: DetectionOptions): NetworkQuality {
    const headers = this.normalizeHeaders(options.headers);
    
    // 1. Check explicit offline mode
    if (headers['x-offline-mode'] === 'true') {
      return 'offline';
    }
    
    // 2. Check Save-Data header (user opted into data saving)
    if (headers['save-data'] === 'on') {
      return 'slow';
    }
    
    // 3. Check Network Information API headers
    const connectionType = headers['downlink'] || headers['ect'];
    if (connectionType && this.SLOW_CONNECTION_TYPES.includes(connectionType)) {
      return 'slow';
    }
    
    // 4. Check RTT (Round Trip Time) if available
    const rtt = headers['rtt'];
    if (rtt && parseInt(rtt) > 300) { // > 300ms is considered slow
      return 'slow';
    }
    
    // 5. Check downlink speed if available
    const downlink = headers['downlink'];
    if (downlink && parseFloat(downlink) < 1.5) { // < 1.5 Mbps is slow
      return 'slow';
    }
    
    // Default to fast
    return 'fast';
  }

  /**
   * Check if client supports offline capabilities
   */
  static isOfflineCapable(options: DetectionOptions): boolean {
    const headers = this.normalizeHeaders(options.headers);
    const clientType = this.detectClientType(options);
    
    // Mobile apps are generally offline capable
    if (clientType === 'mobile') {
      return true;
    }
    
    // Check for service worker support (PWA)
    if (headers['service-worker'] === 'script') {
      return true;
    }
    
    // Check for explicit offline support header
    if (headers['x-offline-capable'] === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Get complete client information
   */
  static getClientInfo(options: DetectionOptions): ClientInfo {
    const headers = this.normalizeHeaders(options.headers);
    const userAgent = options.userAgent || headers['user-agent'] || '';
    
    return {
      type: this.detectClientType(options),
      appVersion: this.detectAppVersion(options),
      platform: this.detectPlatform(options),
      networkQuality: this.detectNetworkQuality(options),
      isOfflineCapable: this.isOfflineCapable(options),
      userAgent,
      saveDataMode: headers['save-data'] === 'on',
      connectionType: headers['ect'] || headers['downlink'] || undefined,
    };
  }

  /**
   * Detect platform from headers and user agent
   */
  private static detectPlatform(options: DetectionOptions): string | null {
    const headers = this.normalizeHeaders(options.headers);
    const userAgent = options.userAgent || headers['user-agent'] || '';
    
    // Explicit platform header
    if (headers['x-platform']) {
      return headers['x-platform'].toLowerCase();
    }
    
    // Detect from user agent
    if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iOS')) {
      return 'ios';
    }
    
    if (userAgent.includes('Android')) {
      return 'android';
    }
    
    if (userAgent.includes('Windows')) {
      return 'windows';
    }
    
    if (userAgent.includes('Mac')) {
      return 'macos';
    }
    
    if (userAgent.includes('Linux')) {
      return 'linux';
    }
    
    return 'web';
  }

  /**
   * Check if user agent indicates mobile client
   */
  private static isMobileUserAgent(userAgent: string): boolean {
    return this.MOBILE_USER_AGENTS.some(pattern => 
      userAgent.includes(pattern)
    );
  }

  /**
   * Normalize headers to lowercase keys
   */
  private static normalizeHeaders(headers: Headers | Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        normalized[key.toLowerCase()] = value;
      });
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        normalized[key.toLowerCase()] = value;
      });
    }
    
    return normalized;
  }

  /**
   * Generate cache key suffix based on client info
   */
  static getCacheKeySuffix(clientInfo: ClientInfo): string {
    const parts: string[] = [clientInfo.type];
    
    if (clientInfo.networkQuality === 'slow') {
      parts.push('slow');
    }
    
    if (clientInfo.saveDataMode) {
      parts.push('save');
    }
    
    if (clientInfo.appVersion) {
      // Include major version only to avoid cache fragmentation
      const majorVersion = clientInfo.appVersion.split('.')[0];
      parts.push(`v${majorVersion}`);
    }
    
    return parts.join(':');
  }

  /**
   * Determine if response should be cached based on client info
   */
  static shouldCache(clientInfo: ClientInfo, statusCode: number): boolean {
    // Always cache successful responses for mobile clients
    if (clientInfo.type === 'mobile' && statusCode >= 200 && statusCode < 300) {
      return true;
    }
    
    // Cache 304 Not Modified responses
    if (statusCode === 304) {
      return true;
    }
    
    // Don't cache errors except for offline-capable clients
    if (statusCode >= 400 && !clientInfo.isOfflineCapable) {
      return false;
    }
    
    // Web clients follow standard caching rules
    return statusCode >= 200 && statusCode < 300;
  }
}