import { useState, useEffect, useCallback } from 'react';
import projectService, { ProjectFilters } from '../services/projects';
import { Project } from '../types/models';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filters: ProjectFilters;
  setFilters: (filters: ProjectFilters) => void;
}

export function useProjects(initialFilters?: ProjectFilters): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters || {});

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjects(filters);
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    filters,
    setFilters,
  };
}

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProject(id: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectById(id);
      setProject(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}