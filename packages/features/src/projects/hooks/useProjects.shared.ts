import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projects.service';
import { ProjectDTO } from '@repo/shared/types';
import { usePagination } from '../../shared/hooks/usePagination';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useState } from 'react';

interface UseProjectsOptions {
  initialFilters?: {
    search?: string;
    status?: string;
    userId?: string;
  };
  pageSize?: number;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(options.initialFilters || {});
  const debouncedSearch = useDebounce(filters.search || '', 300);
  
  const pagination = usePagination({
    initialPageSize: options.pageSize || 10,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', debouncedSearch, filters.status, filters.userId, pagination.page, pagination.pageSize],
    queryFn: () => projectsService.getProjects({
      search: debouncedSearch,
      status: filters.status,
      userId: filters.userId,
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
    projects: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    filters,
    setFilters,
    pagination,
    refetch: () => queryClient.invalidateQueries(['projects']),
  };
}

export function useProject(projectId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectId ? projectsService.getProjectById(projectId) : null,
    enabled: !!projectId,
  });

  return {
    project: data || null,
    isLoading,
    error,
  };
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectsService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof projectsService.updateProject>[1] }) => 
      projectsService.updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject);
      queryClient.invalidateQueries(['projects']);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectsService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });
}

export function useAssignUserToProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) => 
      projectsService.assignUserToProject(projectId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['projects', variables.projectId]);
      queryClient.invalidateQueries(['projects']);
    },
  });
}

export function useRemoveUserFromProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) => 
      projectsService.removeUserFromProject(projectId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['projects', variables.projectId]);
      queryClient.invalidateQueries(['projects']);
    },
  });
}