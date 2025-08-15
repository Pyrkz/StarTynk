// User and Authentication Types
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  COORDINATOR = 'COORDINATOR',
  WORKER = 'WORKER'
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  invitedBy: string | null;
  deletedAt: Date | null;
  department: string | null;
  employmentEndDate: Date | null;
  employmentStartDate: Date | null;
  lastLoginAt: Date | null;
  loginCount: number;
  phone: string | null;
  position: string | null;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

// Project Related Types
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Developer {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  baseRate: number;
  status: ProjectStatus;
  description: string | null;
  createdById: string;
  coordinatorId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  developer?: Developer;
  coordinator?: User;
  createdBy?: User;
}

export interface Apartment {
  id: string;
  projectId: string;
  number: string;
  floor: number | null;
  area: number | null;
  rooms: number | null;
  type: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  project?: Project;
}

// Task Related Types
export enum TaskStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  APPROVED = 'APPROVED',
  PAID = 'PAID'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Task {
  id: string;
  projectId: string;
  apartmentId: string | null;
  title: string;
  description: string | null;
  area: number;
  rate: number;
  status: TaskStatus;
  estimatedHours: number | null;
  actualHours: number | null;
  priority: TaskPriority;
  dueDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  project?: Project;
  apartment?: Apartment;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  task?: Task;
  user?: User;
}

// Quality Control Types
export enum QualityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED'
}

export enum QualityIssueType {
  OUR_FAULT = 'OUR_FAULT',
  EXTERNAL_FAULT = 'EXTERNAL_FAULT',
  MATERIAL_DEFECT = 'MATERIAL_DEFECT',
  DESIGN_ISSUE = 'DESIGN_ISSUE'
}

export interface QualityControl {
  id: string;
  taskId: string;
  controllerId: string;
  controlNumber: number;
  status: QualityStatus;
  completionRate: number;
  notes: string | null;
  issuesFound: string | null;
  correctionsNeeded: string | null;
  controlDate: Date;
  recontrolDate: Date | null;
  issueType: QualityIssueType | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  task?: Task;
  controller?: User;
}

// Material Types
export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number | null;
  supplier: string | null;
  description: string | null;
  imageUrl: string | null;
  stockLevel: number;
  minStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: MaterialCategory;
}

export enum MaterialOrderStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface MaterialOrder {
  id: string;
  projectId: string;
  orderedById: string;
  status: MaterialOrderStatus;
  totalAmount: number | null;
  notes: string | null;
  orderDate: Date;
  neededDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  project?: Project;
  orderedBy?: User;
}

// Equipment Types
export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  DAMAGED = 'DAMAGED',
  RETIRED = 'RETIRED'
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Equipment {
  id: string;
  name: string;
  categoryId: string;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  status: EquipmentStatus;
  condition: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: EquipmentCategory;
}

// Vehicle Types
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED'
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  insuranceExpiry: Date | null;
  inspectionExpiry: Date | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  status: VehicleStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Delivery Types
export enum DeliveryStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Delivery {
  id: string;
  projectId: string;
  supplierName: string;
  deliveryDate: Date;
  receivedById: string;
  status: DeliveryStatus;
  deliveryType: string;
  totalWeight: number | null;
  notes: string | null;
  documentUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  project?: Project;
  receivedBy?: User;
}

// Other Types
export enum PhotoType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  ISSUE = 'ISSUE',
  DOCUMENTATION = 'DOCUMENTATION',
  INVOICE = 'INVOICE'
}

export interface Photo {
  id: string;
  url: string;
  description: string | null;
  type: PhotoType;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
}

export interface PaymentCalculation {
  id: string;
  taskId: string;
  area: number;
  rate: number;
  completionRate: number;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  task?: Task;
}