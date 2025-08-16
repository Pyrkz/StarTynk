import { prisma } from '@repo/database';
import crypto from 'crypto';

/**
 * Production-grade security service
 * Comprehensive security hardening and monitoring
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

interface SecurityEvent {
  type: 'login_attempt' | 'token_reuse' | 'device_anomaly' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent?: string;
  details: any;
}

interface ThreatLevel {
  level: 'green' | 'yellow' | 'orange' | 'red';
  score: number;
  factors: string[];
}

export class SecurityService {
  private static instance: SecurityService;
  private rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  private threatIntelligence = new Map<string, ThreatLevel>();
  
  // Rate limiting configurations
  private readonly RATE_LIMITS = {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
    registration: { windowMs: 60 * 60 * 1000, maxRequests: 3, blockDurationMs: 60 * 60 * 1000 },
    tokenRefresh: { windowMs: 5 * 60 * 1000, maxRequests: 20, blockDurationMs: 10 * 60 * 1000 },
    apiCall: { windowMs: 60 * 1000, maxRequests: 100, blockDurationMs: 5 * 60 * 1000 },
  };

  private constructor() {
    this.startSecurityMonitoring();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Check rate limit for specific operation
   */
  async checkRateLimit(
    operation: keyof typeof this.RATE_LIMITS,
    identifier: string,
    ip: string
  ): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: Date; blocked: boolean }> {
    const config = this.RATE_LIMITS[operation];
    const now = Date.now();
    
    // Create composite key for rate limiting
    const keys = [
      `${operation}:ip:${ip}`,
      `${operation}:identifier:${identifier}`,
    ];

    let minRemainingAttempts = config.maxRequests;
    let maxResetTime = now + config.windowMs;
    let isBlocked = false;

    for (const key of keys) {
      const current = this.rateLimitStore.get(key);
      
      if (current) {
        // Check if still in blocking period
        if (current.blocked && now < current.resetTime) {
          isBlocked = true;
          continue;
        }
        
        // Reset if window expired
        if (now >= current.resetTime) {
          this.rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
            blocked: false,
          });
          continue;
        }
        
        // Check if limit exceeded
        if (current.count >= config.maxRequests) {
          // Block for extended period
          this.rateLimitStore.set(key, {
            ...current,
            blocked: true,
            resetTime: now + config.blockDurationMs,
          });
          
          await this.logSecurityEvent({
            type: 'rate_limit_exceeded',
            severity: 'medium',
            ip,
            details: { operation, identifier, attempts: current.count },
          });
          
          isBlocked = true;
          continue;
        }
        
        // Increment counter
        current.count++;
        minRemainingAttempts = Math.min(minRemainingAttempts, config.maxRequests - current.count);
        maxResetTime = Math.max(maxResetTime, current.resetTime);
      } else {
        // First request
        this.rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          blocked: false,
        });
      }
    }

    return {
      allowed: !isBlocked,
      remainingAttempts: Math.max(0, minRemainingAttempts),
      resetTime: new Date(maxResetTime),
      blocked: isBlocked,
    };
  }

  /**
   * Analyze request for suspicious activity
   */
  async analyzeThreatLevel(request: {
    ip: string;
    userAgent?: string;
    identifier?: string;
    operation: string;
  }): Promise<ThreatLevel> {
    const factors: string[] = [];
    let score = 0;

    // Check IP reputation
    const ipThreat = await this.checkIpReputation(request.ip);
    if (ipThreat.isMalicious) {
      factors.push('malicious_ip');
      score += 50;
    }

    // Check for bot-like behavior
    if (this.detectBotBehavior(request.userAgent)) {
      factors.push('bot_behavior');
      score += 30;
    }

    // Check for brute force patterns
    const bruteForceScore = await this.detectBruteForcePattern(request.ip, request.identifier);
    if (bruteForceScore > 0) {
      factors.push('brute_force_pattern');
      score += bruteForceScore;
    }

    // Check for geographic anomalies
    const geoAnomaly = await this.detectGeographicAnomaly(request.ip, request.identifier);
    if (geoAnomaly) {
      factors.push('geographic_anomaly');
      score += 20;
    }

    // Check time-based patterns
    const timeAnomaly = this.detectTimeBasedAnomaly();
    if (timeAnomaly) {
      factors.push('time_anomaly');
      score += 15;
    }

    // Determine threat level
    let level: ThreatLevel['level'];
    if (score >= 80) level = 'red';
    else if (score >= 60) level = 'orange';
    else if (score >= 30) level = 'yellow';
    else level = 'green';

    const threatLevel: ThreatLevel = { level, score, factors };
    
    // Cache threat level
    this.threatIntelligence.set(request.ip, threatLevel);
    
    // Log high threat activities
    if (score >= 60) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: score >= 80 ? 'critical' : 'high',
        ip: request.ip,
        userAgent: request.userAgent,
        details: { threatLevel, operation: request.operation },
      });
    }

    return threatLevel;
  }

  /**
   * Log security event for monitoring
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database
      await prisma.loginAttempt.create({
        data: {
          identifier: event.userId || 'system',
          ip: event.ip,
          userAgent: event.userAgent,
          success: false,
          reason: `${event.type}:${event.severity}`,
          deviceId: null,
        },
      });

      // Log to console for immediate monitoring
      console.log(`🚨 Security Event [${event.severity.toUpperCase()}]: ${event.type}`, {
        ip: event.ip,
        userId: event.userId,
        userAgent: event.userAgent,
        details: event.details,
      });

      // Send alerts for critical events
      if (event.severity === 'critical') {
        await this.sendSecurityAlert(event);
      }

    } catch (error) {
      console.error('❌ Failed to log security event:', error);
    }
  }

  /**
   * Generate security headers for responses
   */
  getSecurityHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy
      'Content-Security-Policy': this.generateCSP(),
      
      // HSTS (only for HTTPS)
      ...(process.env.NODE_ENV === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }),
      
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    // CORS headers
    if (origin && this.isAllowedOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Client-Type, X-Device-Id';
      headers['Access-Control-Max-Age'] = '86400';
    }

    return headers;
  }

  /**
   * Validate device fingerprint for consistency
   */
  async validateDeviceFingerprint(
    deviceId: string,
    fingerprint: string,
    userAgent?: string,
    ip?: string
  ): Promise<{ valid: boolean; risk: 'low' | 'medium' | 'high' }> {
    try {
      // Get previous fingerprints for this device
      const recentTokens = await prisma.refreshToken.findMany({
        where: {
          deviceId,
          isRevoked: false,
          issuedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
        select: {
          userAgent: true,
          ip: true,
          issuedAt: true,
        },
        orderBy: { issuedAt: 'desc' },
        take: 10,
      });

      if (recentTokens.length === 0) {
        return { valid: true, risk: 'low' }; // New device
      }

      // Analyze consistency
      let riskScore = 0;
      
      // Check user agent consistency
      const userAgents = recentTokens.map(t => t.userAgent).filter(Boolean);
      if (userAgent && userAgents.length > 0) {
        const consistent = userAgents.some(ua => ua === userAgent);
        if (!consistent) riskScore += 30;
      }

      // Check IP consistency
      const ips = recentTokens.map(t => t.ip).filter(Boolean);
      if (ip && ips.length > 0) {
        const consistent = ips.some(oldIp => oldIp === ip);
        if (!consistent) riskScore += 20;
      }

      // Check frequency of changes
      const uniqueUserAgents = new Set(userAgents).size;
      const uniqueIps = new Set(ips).size;
      if (uniqueUserAgents > 3) riskScore += 25;
      if (uniqueIps > 5) riskScore += 25;

      // Determine risk level
      let risk: 'low' | 'medium' | 'high';
      if (riskScore >= 70) risk = 'high';
      else if (riskScore >= 40) risk = 'medium';
      else risk = 'low';

      return {
        valid: riskScore < 80, // Block if very high risk
        risk,
      };

    } catch (error) {
      console.error('❌ Device fingerprint validation failed:', error);
      return { valid: false, risk: 'high' };
    }
  }

  /**
   * Monitor for concurrent session anomalies
   */
  async detectConcurrentSessionAnomalies(userId: string): Promise<{
    suspicious: boolean;
    details: any;
  }> {
    try {
      const activeSessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        select: {
          deviceId: true,
          ip: true,
          userAgent: true,
          issuedAt: true,
        },
      });

      const details = {
        totalSessions: activeSessions.length,
        uniqueIps: new Set(activeSessions.map(s => s.ip)).size,
        uniqueDevices: new Set(activeSessions.map(s => s.deviceId)).size,
        recentSessions: activeSessions.filter(s => 
          s.issuedAt > new Date(Date.now() - 5 * 60 * 1000)
        ).length,
      };

      // Detect suspicious patterns
      const suspicious = 
        details.totalSessions > 10 || // Too many sessions
        details.uniqueIps > 5 || // Too many IPs
        details.recentSessions > 3; // Too many recent logins

      if (suspicious) {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'medium',
          userId,
          ip: 'multiple',
          details,
        });
      }

      return { suspicious, details };

    } catch (error) {
      console.error('❌ Concurrent session analysis failed:', error);
      return { suspicious: false, details: {} };
    }
  }

  /**
   * Private helper methods
   */

  private async checkIpReputation(ip: string): Promise<{ isMalicious: boolean; categories: string[] }> {
    // In production, integrate with threat intelligence services
    // For now, implement basic checks
    const knownBadRanges = [
      '10.0.0.0/8',    // Private ranges shouldn't be accessing from outside
      '172.16.0.0/12',
      '192.168.0.0/16',
    ];

    // Check against known bad IP ranges
    const isMalicious = knownBadRanges.some(range => this.ipInRange(ip, range));
    
    return {
      isMalicious,
      categories: isMalicious ? ['private_range'] : [],
    };
  }

  private detectBotBehavior(userAgent?: string): boolean {
    if (!userAgent) return true; // No user agent is suspicious
    
    const botIndicators = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
    ];
    
    return botIndicators.some(indicator => 
      userAgent.toLowerCase().includes(indicator)
    );
  }

  private async detectBruteForcePattern(ip: string, identifier?: string): Promise<number> {
    try {
      const timeWindow = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
      
      const recentFailedAttempts = await prisma.loginAttempt.count({
        where: {
          OR: [
            { ip, success: false },
            ...(identifier ? [{ identifier, success: false }] : []),
          ],
          createdAt: { gte: timeWindow },
        },
      });

      // Score based on number of failed attempts
      if (recentFailedAttempts >= 20) return 40;
      if (recentFailedAttempts >= 10) return 25;
      if (recentFailedAttempts >= 5) return 15;
      
      return 0;

    } catch (error) {
      console.error('❌ Brute force detection failed:', error);
      return 0;
    }
  }

  private async detectGeographicAnomaly(ip: string, identifier?: string): Promise<boolean> {
    // In production, use IP geolocation service
    // For now, implement basic checks
    return false;
  }

  private detectTimeBasedAnomaly(): boolean {
    const hour = new Date().getHours();
    // Flag requests during unusual hours (2 AM - 5 AM local time)
    return hour >= 2 && hour <= 5;
  }

  private generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    return allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';
  }

  private ipInRange(ip: string, range: string): boolean {
    // Simple IP range check - in production, use proper CIDR matching
    return false; // Placeholder implementation
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting systems (email, Slack, PagerDuty)
    console.log(`🚨🚨 CRITICAL SECURITY ALERT 🚨🚨`, event);
  }

  private startSecurityMonitoring(): void {
    // Cleanup old rate limit entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.rateLimitStore.entries()) {
        if (now >= value.resetTime && !value.blocked) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('🛡️ Security monitoring started');
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();