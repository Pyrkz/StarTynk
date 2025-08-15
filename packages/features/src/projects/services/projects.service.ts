import { ProjectDTO, PaginatedResponse, ApiResponse } from '@repo/shared/types';
import { tokenService } from '../../auth/services/token.service';

interface ProjectsFilters {
  search?: string;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateProjectData {
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  clientName?: string;
  clientContact?: string;
}

interface UpdateProjectData extends Partial<CreateProjectData> {
  isActive?: boolean;
}

class ProjectsService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   '/api/v1';
  }

  async getProjects(filters: ProjectsFilters = {}): Promise<PaginatedResponse<ProjectDTO>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${this.baseURL}/projects?${params.toString()}`, {
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data: ApiResponse<PaginatedResponse<ProjectDTO>> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch projects');
    }

    return data.data;
  }

  async getProjectById(id: string): Promise<ProjectDTO> {
    const response = await fetch(`${this.baseURL}/projects/${id}`, {
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    const data: ApiResponse<{ project: ProjectDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch project');
    }

    return data.data.project;
  }

  async createProject(projectData: CreateProjectData): Promise<ProjectDTO> {
    const response = await fetch(`${this.baseURL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(projectData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const data: ApiResponse<{ project: ProjectDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to create project');
    }

    return data.data.project;
  }

  async updateProject(id: string, projectData: UpdateProjectData): Promise<ProjectDTO> {
    const response = await fetch(`${this.baseURL}/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(projectData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    const data: ApiResponse<{ project: ProjectDTO }> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update project');
    }

    return data.data.project;
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/projects/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete project');
    }
  }

  async assignUserToProject(projectId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify({ userId }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to assign user to project');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to assign user to project');
    }
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/projects/${projectId}/users/${userId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to remove user from project');
    }

    const data: ApiResponse<void> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to remove user from project');
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await tokenService.getAccessToken();
    const headers: Record<string, string> = {
      'X-Client-Type': this.getClientType(),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private getClientType(): string {
    return typeof window !== 'undefined' && !('expo' in window)
      ? 'web'
      : 'mobile';
  }
}

export const projectsService = new ProjectsService();