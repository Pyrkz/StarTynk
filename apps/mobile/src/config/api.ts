import { env } from './environment';

export const API_CONFIG = {
  baseURL: env.current.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API endpoints - these are relative paths that will be combined with baseURL
export const ENDPOINTS = {
  // Health check
  health: '/health',
  
  // Authentication endpoints (matching web app structure)
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    unifiedLogin: '/auth/unified-login',
    unifiedRefresh: '/auth/unified-refresh',
  },
  
  // User management
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    profile: '/users/profile',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  
  // Project management
  projects: {
    list: '/projects',
    create: '/projects',
    detail: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    apartments: (projectId: string) => `/projects/${projectId}/apartments`,
    tasks: (projectId: string) => `/projects/${projectId}/tasks`,
  },
  
  // Task management
  tasks: {
    list: '/tasks',
    create: '/tasks',
    detail: (id: string) => `/tasks/${id}`,
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    assign: (id: string) => `/tasks/${id}/assign`,
    updateStatus: (id: string) => `/tasks/${id}/status`,
  },
  
  // Quality control
  qualityControl: {
    list: '/quality-controls',
    create: '/quality-controls',
    detail: (id: string) => `/quality-controls/${id}`,
    update: (id: string) => `/quality-controls/${id}`,
  },
  
  // Materials management
  materials: {
    list: '/materials',
    create: '/materials',
    detail: (id: string) => `/materials/${id}`,
    update: (id: string) => `/materials/${id}`,
    categories: '/materials/categories',
  },
  
  // Equipment management
  equipment: {
    list: '/equipment',
    create: '/equipment',
    detail: (id: string) => `/equipment/${id}`,
    update: (id: string) => `/equipment/${id}`,
    assign: (id: string) => `/equipment/${id}/assign`,
    categories: '/equipment/categories',
  },
  
  // Vehicle management
  vehicles: {
    list: '/vehicles',
    create: '/vehicles',
    detail: (id: string) => `/vehicles/${id}`,
    update: (id: string) => `/vehicles/${id}`,
    assign: (id: string) => `/vehicles/${id}/assign`,
    maintenance: (id: string) => `/vehicles/${id}/maintenance`,
  },
  
  // Delivery management
  deliveries: {
    list: '/deliveries',
    create: '/deliveries',
    detail: (id: string) => `/deliveries/${id}`,
    update: (id: string) => `/deliveries/${id}`,
    updateStatus: (id: string) => `/deliveries/${id}/status`,
  },
};