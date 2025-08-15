import api from './api';
import { ENDPOINTS } from '../config/api';
import { Project, ProjectStatus } from '../types/models';

export interface CreateProjectData {
  name: string;
  address: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  baseRate: number;
  description?: string;
  coordinatorId?: string;
}

export interface UpdateProjectData {
  name?: string;
  address?: string;
  startDate?: Date;
  endDate?: Date;
  baseRate?: number;
  status?: ProjectStatus;
  description?: string;
  coordinatorId?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  developerId?: string;
  coordinatorId?: string;
  isActive?: boolean;
}

class ProjectService {
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<Project[]>(
      `${ENDPOINTS.projects.list}?${params.toString()}`
    );
    return response.data;
  }

  async getProjectById(id: string): Promise<Project> {
    const response = await api.get<Project>(ENDPOINTS.projects.detail(id));
    return response.data;
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await api.post<Project>(ENDPOINTS.projects.create, data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await api.put<Project>(ENDPOINTS.projects.update(id), data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await api.delete(ENDPOINTS.projects.delete(id));
  }

  async getProjectApartments(projectId: string): Promise<any[]> {
    const response = await api.get<any[]>(ENDPOINTS.projects.apartments(projectId));
    return response.data;
  }

  async getProjectTasks(projectId: string): Promise<any[]> {
    const response = await api.get<any[]>(ENDPOINTS.projects.tasks(projectId));
    return response.data;
  }
}

export default new ProjectService();