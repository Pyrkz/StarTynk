import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface MobileOrderItem {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
}

interface MobileOrder {
  id: string;
  employeeName: string;
  employeeRole: string;
  employeePhoto?: string;
  submissionTime: string;
  location: string;
  items: MobileOrderItem[];
  estimatedValue?: number;
  justification: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  approvalRequired: boolean;
}

interface MobileRequestsResponse {
  requests: MobileOrder[];
  totalCount: number;
  pendingCount: number;
}

export const useMobileRequests = (projectId: string) => {
  const [requests, setRequests] = useState<MobileOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/mobile-requests`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch mobile requests');
        }

        const data: MobileRequestsResponse = await response.json();
        setRequests(data.requests);
        setPendingCount(data.pendingCount);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load mobile requests',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchRequests();
    }
  }, [projectId, toast]);

  const approveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mobile-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      ));
      setPendingCount(prev => prev - 1);

      toast({
        title: 'Success',
        description: 'Request approved successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mobile-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      ));
      setPendingCount(prev => prev - 1);

      toast({
        title: 'Success',
        description: 'Request rejected',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const bulkApprove = async (requestIds: string[]) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mobile-requests/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk approve requests');
      }

      setRequests(prev => prev.map(req => 
        requestIds.includes(req.id) ? { ...req, status: 'approved' as const } : req
      ));
      setPendingCount(prev => prev - requestIds.length);

      toast({
        title: 'Success',
        description: `${requestIds.length} requests approved`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to bulk approve requests',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const refetch = async () => {
    // Refetch logic
  };

  return {
    requests,
    pendingCount,
    loading,
    error,
    approveRequest,
    rejectRequest,
    bulkApprove,
    refetch,
  };
};