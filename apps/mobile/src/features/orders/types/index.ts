export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string | null;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderTimeline {
  status: 'pending' | 'seen' | 'approved' | 'delivered' | 'modified';
  timestamp: Date;
  description?: string;
  modificationType?: 'location' | 'items' | 'quantity';
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  deliveryLocation: string;
  status: 'pending' | 'seen' | 'approved' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  timeline: OrderTimeline[];
  isModified?: boolean;
  lastModifiedAt?: Date;
}

export type ProductCategory = 
  | 'Materiały podstawowe'
  | 'Narzędzia i akcesoria'
  | 'Części zamienne'
  | 'BHP'
  | 'Materiały eksploatacyjne'
  | 'Sprzęt pomocniczy';