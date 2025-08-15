export interface BaseEvent {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// User Events
export interface UserCreatedEvent extends BaseEvent {
  userId: string;
  email: string;
  role: string;
}

export interface UserUpdatedEvent extends BaseEvent {
  userId: string;
  changes: Record<string, any>;
}

export interface UserDeletedEvent extends BaseEvent {
  userId: string;
}

export interface UserAuthenticatedEvent extends BaseEvent {
  userId: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
}

// Project Events
export interface ProjectCreatedEvent extends BaseEvent {
  projectId: string;
  name: string;
  coordinatorId?: string;
}

export interface ProjectUpdatedEvent extends BaseEvent {
  projectId: string;
  changes: Record<string, any>;
}

export interface ProjectStatusChangedEvent extends BaseEvent {
  projectId: string;
  oldStatus: string;
  newStatus: string;
}

// Task Events
export interface TaskCreatedEvent extends BaseEvent {
  taskId: string;
  projectId: string;
  title: string;
  assignedTo?: string[];
}

export interface TaskStatusChangedEvent extends BaseEvent {
  taskId: string;
  oldStatus: string;
  newStatus: string;
  assignedTo?: string;
}

export interface TaskCompletedEvent extends BaseEvent {
  taskId: string;
  projectId: string;
  completedBy: string;
  completionRate: number;
}

// System Events
export interface ErrorEvent extends BaseEvent {
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditEvent extends BaseEvent {
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type EventMap = {
  'user.created': UserCreatedEvent;
  'user.updated': UserUpdatedEvent;
  'user.deleted': UserDeletedEvent;
  'user.authenticated': UserAuthenticatedEvent;
  'project.created': ProjectCreatedEvent;
  'project.updated': ProjectUpdatedEvent;
  'project.status.changed': ProjectStatusChangedEvent;
  'task.created': TaskCreatedEvent;
  'task.status.changed': TaskStatusChangedEvent;
  'task.completed': TaskCompletedEvent;
  'system.error': ErrorEvent;
  'system.audit': AuditEvent;
};

export type EventName = keyof EventMap;
export type EventPayload<T extends EventName> = EventMap[T];

export interface EventHandler<T extends EventName> {
  (payload: EventPayload<T>): Promise<void> | void;
}

export interface EventSubscription {
  unsubscribe(): void;
}