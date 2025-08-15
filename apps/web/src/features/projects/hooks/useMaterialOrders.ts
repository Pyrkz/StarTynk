import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface OrderItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  submissionDate: string;
  submissionTime: string;
  requestedBy: string;
  requestedByRole: string;
  priority: 'standard' | 'urgent' | 'critical';
  status: 'new' | 'processing' | 'inTransit' | 'delivered';
  items: OrderItem[];
  totalValue: number;
  supplier: string;
  expectedDelivery?: string;
  trackingNumber?: string;
  currentStage: string;
}

interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  statusCounts: {
    new: number;
    processing: number;
    inTransit: number;
    delivered: number;
  };
}

export const useMaterialOrders = (projectId: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    new: 0,
    processing: 0,
    inTransit: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/material-orders`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch material orders');
        }

        const data: OrdersResponse = await response.json();
        setOrders(data.orders);
        setStatusCounts(data.statusCounts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load material orders',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchOrders();
    }
  }, [projectId, toast]);

  const createOrder = async (orderData: Partial<Order>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/material-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const newOrder = await response.json();
      setOrders(prev => [...prev, newOrder]);
      
      toast({
        title: 'Success',
        description: 'Material order created successfully',
      });

      return newOrder;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create material order',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/material-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      toast({
        title: 'Success',
        description: 'Order status updated',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const refetch = async () => {
    // Refetch logic
  };

  return {
    orders,
    statusCounts,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refetch,
  };
};