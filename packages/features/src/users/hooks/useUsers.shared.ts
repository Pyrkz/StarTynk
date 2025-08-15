import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import { UserDTO } from '@repo/shared/types';
import { usePagination } from '../../shared/hooks/usePagination';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useState } from 'react';

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
  const debouncedSearch = useDebounce(filters.search || '', 300);
  
  const pagination = usePagination({
    initialPageSize: options.pageSize || 10,
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
    keepPreviousData: true,
  });

  // Update pagination total when data changes
  if (data?.total !== pagination.total) {
    pagination.changePageSize(pagination.pageSize); // This will update the total
  }

  return {
    users: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    filters,
    setFilters,
    pagination,
    refetch: () => queryClient.invalidateQueries(['users']),
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
      queryClient.invalidateQueries(['users']);
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
      queryClient.invalidateQueries(['users']);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => 
      usersService.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations']);
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersService.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations']);
    },
  });
}