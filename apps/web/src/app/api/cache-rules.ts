/**
 * Route-specific cache rules for API endpoints
 * Defines caching strategy for each endpoint pattern
 */

import type { CacheStrategy } from '../../../../../packages/api/src/config/cache.config';
import { CacheTagGenerators } from '../../../../../packages/api/src/config/cache.config';

export interface CacheRule {
  strategy: CacheStrategy;
  revalidate?: number; // seconds
  immutable?: boolean;
  tags?: string[] | ((params: any) => string[]);
  description?: string;
}

/**
 * Cache rules for API endpoints
 * More specific patterns should come before generic ones
 */
export const CACHE_RULES: Record<string, CacheRule> = {
  // ===== Authentication endpoints - NEVER cache =====
  '/api/auth/*': { 
    strategy: 'NONE',
    description: 'Authentication endpoints should never be cached'
  },
  '/api/v1/auth/*': { 
    strategy: 'NONE',
    description: 'V1 authentication endpoints'
  },
  '/api/mobile/v1/auth/*': { 
    strategy: 'NONE',
    description: 'Mobile authentication endpoints'
  },
  
  // ===== Session and user-specific endpoints =====
  '/api/auth/me': { 
    strategy: 'PRIVATE',
    revalidate: 300, // 5 minutes
    description: 'Current user data'
  },
  '/api/users/me': { 
    strategy: 'PRIVATE',
    revalidate: 1800, // 30 minutes
    description: 'User profile data'
  },
  '/api/users/profile': { 
    strategy: 'PRIVATE',
    revalidate: 1800,
    description: 'User profile endpoint'
  },
  
  // ===== Health and version endpoints =====
  '/api/health': { 
    strategy: 'DYNAMIC',
    revalidate: 30, // 30 seconds
    description: 'Health check endpoint'
  },
  '/api/version': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    immutable: false,
    description: 'API version information'
  },
  
  // ===== Projects endpoints =====
  '/api/projects': { 
    strategy: 'COLLECTION',
    revalidate: 300, // 5 minutes
    tags: () => [CacheTagGenerators.all('projects')],
    description: 'Projects list with filters'
  },
  '/api/projects/[projectId]': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    tags: (params) => [CacheTagGenerators.project(params.projectId)],
    description: 'Individual project details'
  },
  '/api/projects/[projectId]/employees': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes
    tags: (params) => [CacheTagGenerators.project(params.projectId)],
    description: 'Project employees list'
  },
  '/api/projects/[projectId]/materials': { 
    strategy: 'DYNAMIC',
    revalidate: 300, // 5 minutes
    tags: (params) => [CacheTagGenerators.project(params.projectId)],
    description: 'Project materials (changes frequently)'
  },
  '/api/projects/[projectId]/payroll': { 
    strategy: 'PRIVATE',
    revalidate: 1800, // 30 minutes
    tags: (params) => [CacheTagGenerators.project(params.projectId)],
    description: 'Sensitive payroll data'
  },
  
  // ===== Mobile-specific endpoints =====
  '/api/mobile/v1/projects': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes for mobile
    tags: () => [CacheTagGenerators.all('projects')],
    description: 'Mobile projects list - longer cache'
  },
  '/api/mobile/v1/projects/[id]': { 
    strategy: 'STATIC',
    revalidate: 7200, // 2 hours for mobile
    tags: (params) => [CacheTagGenerators.project(params.id)],
    description: 'Mobile project details - aggressive caching'
  },
  '/api/mobile/v1/sync/*': { 
    strategy: 'NONE',
    description: 'Sync endpoints need fresh data'
  },
  
  // ===== Employees endpoints =====
  '/api/employees': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes
    tags: () => [CacheTagGenerators.all('employees')],
    description: 'Employees list'
  },
  '/api/employees/statistics': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    description: 'Employee statistics - computed infrequently'
  },
  '/api/employees/payroll': { 
    strategy: 'PRIVATE',
    revalidate: 1800, // 30 minutes
    description: 'Payroll data - sensitive'
  },
  
  // ===== Users endpoints =====
  '/api/users': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes
    tags: () => [CacheTagGenerators.all('users')],
    description: 'Users list'
  },
  '/api/users/[id]': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    tags: (params) => [CacheTagGenerators.user(params.id)],
    description: 'User details'
  },
  '/api/users/coordinators': { 
    strategy: 'STATIC',
    revalidate: 7200, // 2 hours
    tags: () => [CacheTagGenerators.all('coordinators')],
    description: 'Coordinators list - rarely changes'
  },
  '/api/users/statistics': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    description: 'User statistics'
  },
  
  // ===== Finance endpoints =====
  '/api/finance/overview': { 
    strategy: 'STATIC',
    revalidate: 1800, // 30 minutes
    description: 'Financial overview - expensive computation'
  },
  '/api/finance/cash-flow': { 
    strategy: 'DYNAMIC',
    revalidate: 600, // 10 minutes
    description: 'Cash flow data'
  },
  '/api/finance/categories': { 
    strategy: 'STATIC',
    revalidate: 86400, // 24 hours
    immutable: true,
    description: 'Finance categories - rarely change'
  },
  
  // ===== Vehicles endpoints =====
  '/api/vehicles': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes
    tags: () => [CacheTagGenerators.all('vehicles')],
    description: 'Vehicles list'
  },
  '/api/vehicles/[id]': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    tags: (params) => [CacheTagGenerators.vehicle(params.id)],
    description: 'Vehicle details'
  },
  '/api/vehicles/statistics': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    description: 'Vehicle statistics'
  },
  '/api/vehicles/reminders': { 
    strategy: 'DYNAMIC',
    revalidate: 300, // 5 minutes
    description: 'Vehicle reminders - time sensitive'
  },
  
  // ===== Equipment endpoints =====
  '/api/equipment': { 
    strategy: 'COLLECTION',
    revalidate: 600, // 10 minutes
    tags: () => [CacheTagGenerators.all('equipment')],
    description: 'Equipment list'
  },
  '/api/equipment/[id]': { 
    strategy: 'STATIC',
    revalidate: 3600, // 1 hour
    tags: (params) => [CacheTagGenerators.equipment(params.id)],
    description: 'Equipment details'
  },
  '/api/equipment/categories': { 
    strategy: 'STATIC',
    revalidate: 86400, // 24 hours
    immutable: true,
    description: 'Equipment categories - static data'
  },
  '/api/equipment/assign': { 
    strategy: 'NONE',
    description: 'Assignment operations - no cache'
  },
  
  // ===== Developers endpoints =====
  '/api/developers': { 
    strategy: 'STATIC',
    revalidate: 86400, // 24 hours
    immutable: false,
    description: 'Developers list - rarely changes'
  },
  
  // ===== Static and reference data =====
  '/api/static/*': { 
    strategy: 'STATIC',
    revalidate: 604800, // 1 week
    immutable: true,
    description: 'Static assets and data'
  },
  
  // ===== Default rules =====
  '/api/*': { 
    strategy: 'DYNAMIC',
    revalidate: 300, // 5 minutes default
    description: 'Default API caching'
  },
};

/**
 * Get cache rule for a specific path
 */
export function getCacheRule(pathname: string): CacheRule {
  // Direct match
  if (CACHE_RULES[pathname]) {
    return CACHE_RULES[pathname];
  }
  
  // Pattern matching
  for (const [pattern, rule] of Object.entries(CACHE_RULES)) {
    if (matchPattern(pattern, pathname)) {
      return rule;
    }
  }
  
  // Default rule
  return {
    strategy: 'DYNAMIC',
    revalidate: 300,
    description: 'Default cache rule'
  };
}

/**
 * Match URL pattern with pathname
 */
function matchPattern(pattern: string, pathname: string): boolean {
  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\[[\w]+\]/g, '[^/]+') + '$'
    );
    return regex.test(pathname);
  }
  
  // Handle parameter patterns like [id]
  if (pattern.includes('[') && pattern.includes(']')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\[[\w]+\]/g, '[^/]+') + '$'
    );
    return regex.test(pathname);
  }
  
  return pattern === pathname;
}

/**
 * Extract parameters from pathname based on pattern
 */
export function extractParams(pattern: string, pathname: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Extract parameter names from pattern
  const paramNames = pattern.match(/\[(\w+)\]/g)?.map(p => p.slice(1, -1)) || [];
  
  if (paramNames.length === 0) {
    return params;
  }
  
  // Create regex from pattern
  const regexPattern = '^' + pattern.replace(/\[[\w]+\]/g, '([^/]+)') + '$';
  const regex = new RegExp(regexPattern);
  
  // Extract values
  const matches = pathname.match(regex);
  if (matches) {
    paramNames.forEach((name, index) => {
      params[name] = matches[index + 1];
    });
  }
  
  return params;
}

/**
 * Generate cache tags for a specific endpoint
 */
export function generateCacheTags(pathname: string, params?: any): string[] {
  const rule = getCacheRule(pathname);
  
  if (!rule.tags) {
    return [];
  }
  
  if (typeof rule.tags === 'function') {
    return rule.tags(params || {});
  }
  
  return rule.tags;
}