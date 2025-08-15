export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDelete extends Timestamps {
  deletedAt?: string | null;
  isActive: boolean;
}

export interface Identifiable {
  id: string;
}

export interface Named {
  name: string;
}

export interface Describable {
  description?: string | null;
}

export interface Auditable extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
}

export interface Orderable {
  order: number;
}

export interface Translatable {
  translations?: Record<string, any>;
}

export interface HasStatus<T = string> {
  status: T;
}

export interface HasType<T = string> {
  type: T;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ContactInfo {
  email?: string | null;
  phone?: string | null;
  address?: Address | null;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface FileInfo {
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface KeyValue<T = any> {
  key: string;
  value: T;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface TreeNode<T = any> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
  parent?: string;
}