import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from '../../hooks/useOptimisticMutation';
import type { UserDTO, CreateUserDTO, UpdateUserDTO } from '@repo/shared';

// Mock API - replace with actual API client
const api = {
  users: {
    getList: async (filters?: any): Promise<UserDTO[]> => {
      const response = await fetch('/api/users?' + new URLSearchParams(filters));
      return response.json();
    },
    create: async (data: CreateUserDTO): Promise<UserDTO> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    update: async (id: string, data: UpdateUserDTO): Promise<UserDTO> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    delete: async (id: string): Promise<void> => {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
    },
  },
};

// Fetch users with caching
export function useUsers(filters?: any) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.users.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create user with optimistic update
export function useCreateUser() {
  return useOptimisticMutation<UserDTO, CreateUserDTO>({
    mutationKey: ['users', 'create'],
    mutationFn: (data) => api.users.create(data),
    onOptimisticUpdate: (variables) => ({
      id: `temp-${Date.now()}`,
      email: variables.email,
      name: variables.name,
      role: variables.role || 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
      _optimistic: true, // Flag to identify optimistic updates
    } as UserDTO & { _optimistic: boolean }),
    relatedQueries: [['users']],
    showSuccessMessage: true,
    successMessage: 'User created successfully',
  });
}

// Update user with optimistic update
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useOptimisticMutation<UserDTO, UpdateUserDTO>({
    mutationKey: ['users', 'update', userId],
    mutationFn: (data) => api.users.update(userId, data),
    onOptimisticUpdate: async (variables) => {
      const currentUser = queryClient.getQueryData<UserDTO>(['users', userId]);
      
      return {
        ...currentUser,
        ...variables,
        updatedAt: new Date().toISOString(),
        _optimistic: true,
      } as UserDTO & { _optimistic: boolean };
    },
    relatedQueries: [['users'], ['users', userId]],
    showSuccessMessage: true,
    successMessage: 'User updated successfully',
  });
}

// Delete user with optimistic removal
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useOptimisticMutation<void, string>({
    mutationKey: ['users', 'delete'],
    mutationFn: (userId) => api.users.delete(userId),
    onOptimisticUpdate: (userId) => {
      // Remove user from list optimistically
      queryClient.setQueryData(['users'], (old: UserDTO[] | undefined) => {
        return old?.filter(user => user.id !== userId) || [];
      });
      return undefined as any;
    },
    relatedQueries: [['users']],
    showSuccessMessage: true,
    successMessage: 'User deleted successfully',
  });
}