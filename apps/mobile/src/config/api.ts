// Tymczasowe rozwiązanie - docelowo użyj @env
const API_URL = process.env.API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  users: {
    list: '/api/users',
    detail: (id: string) => `/api/users/${id}`,
    profile: '/api/users/profile',
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
  projects: {
    list: '/api/projects',
    create: '/api/projects',
    detail: (id: string) => `/api/projects/${id}`,
    update: (id: string) => `/api/projects/${id}`,
    delete: (id: string) => `/api/projects/${id}`,
    apartments: (projectId: string) => `/api/projects/${projectId}/apartments`,
    tasks: (projectId: string) => `/api/projects/${projectId}/tasks`,
  },
  tasks: {
    list: '/api/tasks',
    create: '/api/tasks',
    detail: (id: string) => `/api/tasks/${id}`,
    update: (id: string) => `/api/tasks/${id}`,
    delete: (id: string) => `/api/tasks/${id}`,
    assign: (id: string) => `/api/tasks/${id}/assign`,
    updateStatus: (id: string) => `/api/tasks/${id}/status`,
  },
  qualityControl: {
    list: '/api/quality-controls',
    create: '/api/quality-controls',
    detail: (id: string) => `/api/quality-controls/${id}`,
    update: (id: string) => `/api/quality-controls/${id}`,
  },
  materials: {
    list: '/api/materials',
    create: '/api/materials',
    detail: (id: string) => `/api/materials/${id}`,
    update: (id: string) => `/api/materials/${id}`,
    categories: '/api/materials/categories',
  },
  equipment: {
    list: '/api/equipment',
    create: '/api/equipment',
    detail: (id: string) => `/api/equipment/${id}`,
    update: (id: string) => `/api/equipment/${id}`,
    assign: (id: string) => `/api/equipment/${id}/assign`,
    categories: '/api/equipment/categories',
  },
  vehicles: {
    list: '/api/vehicles',
    create: '/api/vehicles',
    detail: (id: string) => `/api/vehicles/${id}`,
    update: (id: string) => `/api/vehicles/${id}`,
    assign: (id: string) => `/api/vehicles/${id}/assign`,
    maintenance: (id: string) => `/api/vehicles/${id}/maintenance`,
  },
  deliveries: {
    list: '/api/deliveries',
    create: '/api/deliveries',
    detail: (id: string) => `/api/deliveries/${id}`,
    update: (id: string) => `/api/deliveries/${id}`,
    updateStatus: (id: string) => `/api/deliveries/${id}/status`,
  },
};