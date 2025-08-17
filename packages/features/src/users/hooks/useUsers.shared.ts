import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, type CreateUserData } from '../services/users.service';
import type { UserDTO } from '@repo/shared';
import type { PaginatedResponse } from '@repo/shared';
import { usePagination } from '../../shared/hooks/usePagination';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useState, useEffect } from 'react';

interface UseUsersOptions {
  initialFilters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
  };
  pageSize?: number;
}

export function useUsers(options: UseUsersOptions = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(options.initialFilters || {});
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(filters.search || '', 300);
  
  const pagination = usePagination({
    initialPageSize: options.pageSize || 10,
    total,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', debouncedSearch, filters.role, filters.isActive, pagination.page, pagination.pageSize],
    queryFn: () => usersService.getUsers({
      search: debouncedSearch,
      role: filters.role,
      isActive: filters.isActive,
      page: pagination.page,
      limit: pagination.pageSize,
    }),
    placeholderData: (previousData) => previousData,
  });

  // Update total when data changes
  useEffect(() => {
    if (data?.total !== undefined && data.total !== total) {
      setTotal(data.total);
    }
  }, [data?.total, total]);

  return {
    users: data?.items || [],
    total,
    isLoading,
    error,
    filters,
    setFilters,
    pagination,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  };
}

export function useUser(userId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userId ? usersService.getUserById(userId) : null,
    enabled: !!userId,
  });

  return {
    user: data || null,
    isLoading,
    error,
  };
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersService.updateUser>[1] }) => 
      usersService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['users', updatedUser.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => 
      usersService.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersService.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}