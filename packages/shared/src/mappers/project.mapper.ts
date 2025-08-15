import type { Project, Task, Apartment, Developer, User } from '@repo/database';
import type { 
  ProjectDTO, 
  ProjectListDTO, 
  ProjectDetailDTO,
  ApartmentDTO,
  TaskDTO 
} from '../types/dto/project.dto';

/**
 * Project mapper class for converting between Prisma models and DTOs
 */
export class ProjectMapper {
  /**
   * Convert Project model to ProjectDTO
   */
  static toDTO(
    project: Project, 
    relations?: {
      developer?: Developer;
      coordinator?: User;
      createdBy?: User;
    }
  ): ProjectDTO {
    const { deletedAt, ...dto } = project;
    return {
      ...dto,
      developer: relations?.developer ? {
        id: relations.developer.id,
        name: relations.developer.name,
        contact: relations.developer.contact
      } : undefined,
      coordinator: relations?.coordinator ? {
        id: relations.coordinator.id,
        name: relations.coordinator.name,
        email: relations.coordinator.email
      } : undefined,
      createdBy: relations?.createdBy ? {
        id: relations.createdBy.id,
        name: relations.createdBy.name,
        email: relations.createdBy.email
      } : undefined
    };
  }

  /**
   * Convert Project model to ProjectListDTO (for table displays)
   */
  static toListDTO(
    project: Project,
    relations: {
      developer: Developer;
      coordinator?: User;
    },
    stats?: {
      taskCount: number;
      completedTaskCount: number;
      progress: number;
    }
  ): ProjectListDTO {
    return {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      baseRate: project.baseRate,
      developerName: relations.developer.name,
      coordinatorName: relations.coordinator?.name,
      progress: stats?.progress,
      taskCount: stats?.taskCount,
      completedTaskCount: stats?.completedTaskCount
    };
  }

  /**
   * Convert Project model to ProjectDetailDTO (comprehensive info)
   */
  static toDetailDTO(
    project: Project,
    relations: {
      developer: Developer;
      coordinator?: User;
      createdBy: User;
    },
    stats?: {
      taskCount: number;
      completedTaskCount: number;
      apartmentCount: number;
      totalArea: number;
      progress: number;
      estimatedCompletion: Date;
    },
    recentTasks?: Array<{
      id: string;
      title: string;
      status: string;
      assignedTo?: string;
    }>
  ): ProjectDetailDTO {
    return {
      ...this.toDTO(project, relations),
      stats,
      recentTasks
    };
  }

  /**
   * Convert array of Project models to ProjectDTO array
   */
  static toDTOArray(projects: Project[]): ProjectDTO[] {
    return projects.map(project => this.toDTO(project));
  }

  /**
   * Convert array of Project models to ProjectListDTO array
   */
  static toListDTOArray(
    projects: Array<Project & { developer: Developer; coordinator?: User }>,
    statsMap?: Map<string, { taskCount: number; completedTaskCount: number; progress: number }>
  ): ProjectListDTO[] {
    return projects.map(project => 
      this.toListDTO(
        project, 
        { developer: project.developer, coordinator: project.coordinator },
        statsMap?.get(project.id)
      )
    );
  }
}

/**
 * Apartment mapper class
 */
export class ApartmentMapper {
  /**
   * Convert Apartment model to ApartmentDTO
   */
  static toDTO(
    apartment: Apartment,
    stats?: {
      taskCount: number;
      completedTaskCount: number;
      progress: number;
    }
  ): ApartmentDTO {
    const { deletedAt, ...dto } = apartment;
    return {
      ...dto,
      ...stats
    };
  }

  /**
   * Convert array of Apartment models to ApartmentDTO array
   */
  static toDTOArray(apartments: Apartment[]): ApartmentDTO[] {
    return apartments.map(apartment => this.toDTO(apartment));
  }
}

/**
 * Task mapper class
 */
export class TaskMapper {
  /**
   * Convert Task model to TaskDTO
   */
  static toDTO(
    task: Task,
    relations?: {
      project?: { id: string; name: string };
      apartment?: { id: string; number: string; floor?: number | null };
      assignedUsers?: Array<{ id: string; name: string; role?: string }>;
      qualityControl?: {
        status: string;
        completionRate: number;
        lastControlDate?: Date;
      };
    }
  ): TaskDTO {
    const { deletedAt, ...dto } = task;
    return {
      ...dto,
      project: relations?.project,
      apartment: relations?.apartment ? {
        ...relations.apartment,
        floor: relations.apartment.floor ?? undefined
      } : undefined,
      assignedUsers: relations?.assignedUsers,
      qualityControl: relations?.qualityControl
    };
  }

  /**
   * Convert array of Task models to TaskDTO array
   */
  static toDTOArray(tasks: Task[]): TaskDTO[] {
    return tasks.map(task => this.toDTO(task));
  }
}