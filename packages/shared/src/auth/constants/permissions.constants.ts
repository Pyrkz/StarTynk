import { Role } from '@repo/database';

export enum Permission {
  // User permissions
  USER_VIEW = 'user:view',
  USER_VIEW_ALL = 'user:view:all',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_UPDATE_ALL = 'user:update:all',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',
  
  // Project permissions
  PROJECT_VIEW = 'project:view',
  PROJECT_VIEW_ALL = 'project:view:all',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_UPDATE_ALL = 'project:update:all',
  PROJECT_DELETE = 'project:delete',
  PROJECT_ASSIGN = 'project:assign',
  
  // Task permissions
  TASK_VIEW = 'task:view',
  TASK_VIEW_ALL = 'task:view:all',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_UPDATE_ALL = 'task:update:all',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
  TASK_COMPLETE = 'task:complete',
  
  // Quality control permissions
  QUALITY_VIEW = 'quality:view',
  QUALITY_CREATE = 'quality:create',
  QUALITY_UPDATE = 'quality:update',
  QUALITY_DELETE = 'quality:delete',
  QUALITY_APPROVE = 'quality:approve',
  
  // Material permissions
  MATERIAL_VIEW = 'material:view',
  MATERIAL_CREATE = 'material:create',
  MATERIAL_UPDATE = 'material:update',
  MATERIAL_DELETE = 'material:delete',
  MATERIAL_ORDER = 'material:order',
  
  // Equipment permissions
  EQUIPMENT_VIEW = 'equipment:view',
  EQUIPMENT_CREATE = 'equipment:create',
  EQUIPMENT_UPDATE = 'equipment:update',
  EQUIPMENT_DELETE = 'equipment:delete',
  EQUIPMENT_ASSIGN = 'equipment:assign',
  
  // Vehicle permissions
  VEHICLE_VIEW = 'vehicle:view',
  VEHICLE_CREATE = 'vehicle:create',
  VEHICLE_UPDATE = 'vehicle:update',
  VEHICLE_DELETE = 'vehicle:delete',
  VEHICLE_ASSIGN = 'vehicle:assign',
  
  // Delivery permissions
  DELIVERY_VIEW = 'delivery:view',
  DELIVERY_CREATE = 'delivery:create',
  DELIVERY_UPDATE = 'delivery:update',
  DELIVERY_DELETE = 'delivery:delete',
  DELIVERY_CONFIRM = 'delivery:confirm',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EXPORT = 'report:export',
  
  // Finance permissions
  FINANCE_VIEW = 'finance:view',
  FINANCE_CREATE = 'finance:create',
  FINANCE_UPDATE = 'finance:update',
  FINANCE_APPROVE = 'finance:approve',
  
  // Admin permissions
  ADMIN_PANEL = 'admin:panel',
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_AUDIT = 'admin:audit',
  ADMIN_SYSTEM = 'admin:system',
}

// Define permissions for each role
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission), // All permissions
  
  [Role.MODERATOR]: [
    // User management
    Permission.USER_VIEW,
    Permission.USER_VIEW_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_INVITE,
    
    // Project management
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_UPDATE_ALL,
    Permission.PROJECT_ASSIGN,
    
    // Task management
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_UPDATE_ALL,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_COMPLETE,
    
    // Quality control
    Permission.QUALITY_VIEW,
    Permission.QUALITY_CREATE,
    Permission.QUALITY_UPDATE,
    Permission.QUALITY_APPROVE,
    
    // Materials and equipment
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.MATERIAL_UPDATE,
    Permission.MATERIAL_ORDER,
    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_ASSIGN,
    
    // Vehicles and deliveries
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_CREATE,
    Permission.VEHICLE_UPDATE,
    Permission.VEHICLE_ASSIGN,
    Permission.DELIVERY_VIEW,
    Permission.DELIVERY_CREATE,
    Permission.DELIVERY_UPDATE,
    Permission.DELIVERY_CONFIRM,
    
    // Reports and finance
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    Permission.FINANCE_VIEW,
    
    // Limited admin
    Permission.ADMIN_PANEL,
    Permission.ADMIN_AUDIT,
  ],
  
  [Role.COORDINATOR]: [
    // User permissions (limited)
    Permission.USER_VIEW,
    
    // Project management
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_ASSIGN,
    
    // Task management
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    Permission.TASK_COMPLETE,
    
    // Quality control
    Permission.QUALITY_VIEW,
    Permission.QUALITY_CREATE,
    Permission.QUALITY_UPDATE,
    
    // Materials and equipment
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.MATERIAL_ORDER,
    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_ASSIGN,
    
    // Vehicles and deliveries
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_ASSIGN,
    Permission.DELIVERY_VIEW,
    Permission.DELIVERY_CREATE,
    Permission.DELIVERY_CONFIRM,
    
    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
  ],
  
  [Role.WORKER]: [
    // Basic project access
    Permission.PROJECT_VIEW,
    
    // Task management (own tasks)
    Permission.TASK_VIEW,
    Permission.TASK_UPDATE,
    Permission.TASK_COMPLETE,
    
    // Quality control (create only)
    Permission.QUALITY_VIEW,
    Permission.QUALITY_CREATE,
    
    // View materials and equipment
    Permission.MATERIAL_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.VEHICLE_VIEW,
    
    // Delivery confirmation
    Permission.DELIVERY_VIEW,
    Permission.DELIVERY_CONFIRM,
  ],
  
  // @ts-ignore - Role.DEVELOPER exists in database schema
  [Role.DEVELOPER]: [
    // Project development
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    
    // Task management
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_ASSIGN,
    
    // Quality control
    Permission.QUALITY_VIEW,
    Permission.QUALITY_CREATE,
    
    // Materials and equipment
    Permission.MATERIAL_VIEW,
    Permission.EQUIPMENT_VIEW,
    
    // Reports
    Permission.REPORT_VIEW,
    Permission.FINANCE_VIEW,
  ],
  
  // @ts-ignore - Role.PROJECT_MANAGER exists in database schema
  [Role.PROJECT_MANAGER]: [
    // Full project management
    Permission.PROJECT_VIEW,
    Permission.PROJECT_VIEW_ALL,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_UPDATE_ALL,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_ASSIGN,
    
    // Full task management
    Permission.TASK_VIEW,
    Permission.TASK_VIEW_ALL,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_UPDATE_ALL,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.TASK_COMPLETE,
    
    // Quality control
    Permission.QUALITY_VIEW,
    Permission.QUALITY_CREATE,
    Permission.QUALITY_UPDATE,
    Permission.QUALITY_APPROVE,
    
    // Materials and equipment
    Permission.MATERIAL_VIEW,
    Permission.MATERIAL_CREATE,
    Permission.MATERIAL_UPDATE,
    Permission.MATERIAL_ORDER,
    Permission.EQUIPMENT_VIEW,
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_ASSIGN,
    
    // Vehicles and deliveries
    Permission.VEHICLE_VIEW,
    Permission.VEHICLE_CREATE,
    Permission.VEHICLE_UPDATE,
    Permission.VEHICLE_ASSIGN,
    Permission.DELIVERY_VIEW,
    Permission.DELIVERY_CREATE,
    Permission.DELIVERY_UPDATE,
    Permission.DELIVERY_CONFIRM,
    
    // Reports and finance
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    Permission.FINANCE_VIEW,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_UPDATE,
  ],
  
  [Role.USER]: [
    // Basic view permissions
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW,
    Permission.MATERIAL_VIEW,
    Permission.EQUIPMENT_VIEW,
    Permission.DELIVERY_VIEW,
  ],
};

// Helper to get permissions for multiple roles
export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const permissions = new Set<Permission>();
  
  for (const role of roles) {
    const rolePerms = RolePermissions[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }
  
  return Array.from(permissions);
}

// Resource-based permissions check
export interface ResourcePermissionCheck {
  resource: string;
  action: string;
  ownership?: boolean;
}

export function getResourcePermission(check: ResourcePermissionCheck): Permission | null {
  const { resource, action, ownership } = check;
  const permissionKey = `${resource.toUpperCase()}_${action.toUpperCase()}${ownership === false ? '_ALL' : ''}`;
  
  return Permission[permissionKey as keyof typeof Permission] || null;
}