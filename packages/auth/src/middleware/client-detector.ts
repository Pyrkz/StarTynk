import { NextRequest } from 'next/server';
import type { ClientType, ClientDetectionOptions } from '../types';
import { getAuthConfig } from '../config';
import { isMobileApp } from '../utils';

/**
 * Detects the client type from request headers
 */
export function detectClientType(request: NextRequest): ClientType;
export function detectClientType(options: ClientDetectionOptions): ClientType;
export function detectClientType(input: NextRequest | ClientDetectionOptions): ClientType {
  let userAgent: string | undefined;
  let authHeader: string | undefined;
  let clientTypeHeader: string | undefined;
  
  if ('headers' in input) {
    // NextRequest
    userAgent = input.headers.get('user-agent') || undefined;
    authHeader = input.headers.get('authorization') || undefined;
    clientTypeHeader = input.headers.get('x-client-type') || undefined;
  } else {
    // ClientDetectionOptions
    userAgent = input.userAgent;
    authHeader = input.authHeader;
    clientTypeHeader = input.clientTypeHeader;
  }
  
  // Check explicit header first
  if (clientTypeHeader === 'mobile' || clientTypeHeader === 'web') {
    return clientTypeHeader;
  }
  
  // Check for Bearer token (mobile)
  if (authHeader?.startsWith('Bearer ')) {
    return 'mobile';
  }
  
  // Check user agent for mobile app
  if (userAgent) {
    const config = getAuthConfig();
    if (isMobileApp(userAgent, config.mobileAppIdentifier)) {
      return 'mobile';
    }
  }
  
  // Default to web
  return 'web';
}

/**
 * Extract Bearer token from authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Extract Bearer token from NextRequest
 */
export function extractBearerTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return extractBearerToken(authHeader);
}

/**
 * Get device ID from request headers
 */
export function extractDeviceId(request: NextRequest): string | undefined {
  return request.headers.get('x-device-id') || undefined;
}

/**
 * Check if request is from mobile client
 */
export function isMobileClient(request: NextRequest): boolean {
  return detectClientType(request) === 'mobile';
}

/**
 * Check if request is from web client
 */
export function isWebClient(request: NextRequest): boolean {
  return detectClientType(request) === 'web';
}