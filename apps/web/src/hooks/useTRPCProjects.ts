import { useMemo } from 'react';
import { trpc } from '../lib/trpc/provider';
import type { ProjectFilters } from '../types/project';

interface UseProjectsOptions {
  page?: number;
  limit?: number;
  filters?: ProjectFilters;
  enabled?: boolean;
}

/**
 * Hook for fetching projects using tRPC
 * Replaces the old fetch-based useProjects hook with type-safe tRPC queries
 */
export function useTRPCProjects({
  page = 1,
  limit = 20,
  filters = {},
  enabled = true,
}: UseProjectsOptions = {}) {
  // Memoize the input to prevent unnecessary re-renders
  const input = useMemo(
    () => ({
      page,
      limit,
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      managerId: filters.managerId,
      coordinatorId: filters.coordinatorId,
      clientId: filters.clientId,
      dateRange: filters.dateRange
        ? {
            from: filters.dateRange.from,
            to: filters.dateRange.to,
          }
        : undefined,
      budgetRange: filters.budgetRange,
      tags: filters.tags,
      sort: filters.sort,
    }),
    [page, limit, filters]
  );

  // Use tRPC query with automatic caching and error handling
  const projectsQuery = trpc.project.list.useQuery(input, {
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    projects: projectsQuery.data?.projects ?? [],
    pagination: projectsQuery.data?.pagination ?? {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    refetch: projectsQuery.refetch,
    isFetching: projectsQuery.isFetching,
    isStale: projectsQuery.isStale,
  };
}

/**
 * Hook for fetching a single project by ID
 */
export function useTRPCProject(id: string, includeDetails = false) {
  return trpc.project.getById.useQuery(
    { id, includeDetails },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Hook for creating a new project
 */
export function useTRPCCreateProject() {
  const utils = trpc.useUtils();

  return trpc.project.create.useMutation({
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      utils.project.list.invalidate();
      
      // Add the new project to the cache
      utils.project.getById.setData(
        { id: newProject.id, includeDetails: false },
        newProject
      );
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
    },
  });
}

/**
 * Hook for updating a project
 */
export function useTRPCUpdateProject() {
  const utils = trpc.useUtils();

  return trpc.project.update.useMutation({
    onSuccess: (updatedProject) => {
      // Update the project in the cache
      utils.project.getById.setData(
        { id: updatedProject.id, includeDetails: false },
        updatedProject
      );
      
      // Invalidate the projects list to ensure consistency
      utils.project.list.invalidate();
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
    },
  });
}

/**
 * Hook for deleting a project
 */
export function useTRPCDeleteProject() {
  const utils = trpc.useUtils();

  return trpc.project.delete.useMutation({
    onSuccess: (_, variables) => {
      // Remove the project from the cache
      utils.project.getById.removeQueries({ id: variables.id });
      
      // Invalidate the projects list
      utils.project.list.invalidate();
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
    },
  });
}

/**
 * Hook for adding a member to a project
 */
export function useTRPCAddProjectMember() {
  const utils = trpc.useUtils();

  return trpc.project.addMember.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the project details to refetch members
      utils.project.getById.invalidate({ id: variables.projectId });
    },
    onError: (error) => {
      console.error('Failed to add project member:', error);
    },
  });
}

/**
 * Hook for removing a member from a project
 */
export function useTRPCRemoveProjectMember() {
  const utils = trpc.useUtils();

  return trpc.project.removeMember.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the project details to refetch members
      utils.project.getById.invalidate({ id: variables.projectId });
    },
    onError: (error) => {
      console.error('Failed to remove project member:', error);
    },
  });
}

/**
 * Hook for fetching project statistics
 */
export function useTRPCProjectStats(id: string) {
  return trpc.project.getStats.useQuery(
    { id },
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes for stats
      gcTime: 15 * 60 * 1000,
    }
  );
}

/**
 * Hook for prefetching a project (useful for hover effects)
 */
export function useTRPCPrefetchProject() {
  const utils = trpc.useUtils();

  return (id: string, includeDetails = false) => {
    utils.project.getById.prefetch(
      { id, includeDetails },
      {
        staleTime: 5 * 60 * 1000,
      }
    );
  };
}