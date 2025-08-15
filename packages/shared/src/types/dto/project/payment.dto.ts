export interface PaymentCalculationDTO {
  id: string;
  taskId: string;
  area: number;
  rate: number;
  completionRate: number;
  amount: number;
  isPaid: boolean;
  paidAt?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentCalculationDTO {
  taskId: string;
  area: number;
  rate: number;
  completionRate: number;
  amount: number;
  notes?: string;
}

export interface UpdatePaymentCalculationDTO {
  completionRate?: number;
  amount?: number;
  isPaid?: boolean;
  paidAt?: string;
  notes?: string | null;
}

export interface PaymentSummaryDTO {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentCount: number;
  paidCount: number;
  unpaidCount: number;
}