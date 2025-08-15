import { User, Project, Task, Material, Equipment, Vehicle } from '../types/models';
import { Role, ProjectStatus, TaskStatus } from '../types/enums';

/**
 * Type guard to check if an object is a User
 */
export const isUser = (obj: any): obj is User => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'string' &&
    Object.values(Role).includes(obj.role);
};

/**
 * Type guard to check if an object is a Project
 */
export const isProject = (obj: any): obj is Project => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string' &&
    typeof obj.address === 'string' &&
    Object.values(ProjectStatus).includes(obj.status);
};

/**
 * Type guard to check if an object is a Task
 */
export const isTask = (obj: any): obj is Task => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.title === 'string' &&
    Object.values(TaskStatus).includes(obj.status);
};

/**
 * Type guard to check if an object is a Material
 */
export const isMaterial = (obj: any): obj is Material => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string' &&
    typeof obj.unit === 'string';
};

/**
 * Type guard to check if an object is Equipment
 */
export const isEquipment = (obj: any): obj is Equipment => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string' &&
    typeof obj.categoryId === 'string';
};

/**
 * Type guard to check if an object is a Vehicle
 */
export const isVehicle = (obj: any): obj is Vehicle => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.make === 'string' &&
    typeof obj.model === 'string' &&
    typeof obj.licensePlate === 'string';
};

/**
 * Check if a user has a specific role
 */
export const hasRole = (user: User, role: Role): boolean => {
  return user.role === role;
};

/**
 * Check if a user has admin privileges
 */
export const isAdmin = (user: User): boolean => {
  return user.role === Role.ADMIN;
};

/**
 * Check if a user has coordinator privileges
 */
export const isCoordinator = (user: User): boolean => {
  return user.role === Role.COORDINATOR || user.role === Role.ADMIN;
};

/**
 * Check if a project is active
 */
export const isProjectActive = (project: Project): boolean => {
  return project.status === ProjectStatus.ACTIVE && project.isActive;
};

/**
 * Check if a task is completed
 */
export const isTaskCompleted = (task: Task): boolean => {
  return task.status === TaskStatus.APPROVED || task.status === TaskStatus.PAID;
};