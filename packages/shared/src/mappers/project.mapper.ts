import type { Project, Task, Apartment, Developer, User, Role } from '@repo/database';
import type { 
  ProjectDTO, 
  ProjectListItemDTO as ProjectListDTO, 
  ProjectDetailDTO,
  ApartmentDTO,
  TaskDTO,
  TaskListItemDTO
} from '../types/dto/project';
import { ProjectStatus, TaskStatus, TaskPriority } from '../types/enums';
import { UserListItemDTO } from '../types/dto/user';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Project mapper class for converting between Prisma models and DTOs
 */
export class ProjectMapper {
  /**
   * Convert User to UserListItemDTO helper
   */
  private static userToListDTO(user: User): UserListItemDTO {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role as Role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      position: user.position,
      department: user.department,
      lastActivityAt: user.lastLoginAt || user.updatedAt
    };
  }

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
      status: dto.status as ProjectStatus,
      baseRate: Number(dto.baseRate),
      startDate: dto.startDate.toISOString(),
      endDate: dto.endDate?.toISOString() || null,
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
      developer: relations?.developer ? {
        id: relations.developer.id,
        name: relations.developer.name
      } : undefined,
      coordinator: relations?.coordinator ? this.userToListDTO(relations.coordinator) : undefined,
      createdBy: relations?.createdBy ? this.userToListDTO(relations.createdBy) : undefined
    };
  }

  /**
   * Convert Project model to ProjectListDTO (for table displays)
   */
  static toListDTO(
    project: Project,
    relations?: {
      developer?: Developer;
      coordinator?: User;
      _count?: {
        tasks?: number;
        apartments?: number;
      };
    }
  ): ProjectListDTO {
    return {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status as ProjectStatus,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate?.toISOString() || null,
      developer: relations?.developer?.name,
      coordinator: relations?.coordinator?.name ?? undefined,
      _count: relations?._count
    };
  }

  /**
   * Convert Project model to ProjectDetailDTO (comprehensive info)
   */
  static toDetailDTO(
    project: Project,
    relations: {
      developer?: Developer;
      coordinator?: User;
      createdBy?: User;
      apartments?: Apartment[];
      recentTasks?: Task[];
    },
    statistics?: {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      totalApartments: number;
      totalArea: number;
      estimatedValue: number;
      completionPercentage: number;
    }
  ): ProjectDetailDTO {
    const dto = this.toDTO(project, relations);
    return {
      ...dto,
      apartments: relations.apartments?.map(apt => this.apartmentToDTO(apt)),
      recentTasks: relations.recentTasks?.map(task => this.taskToListDTO(task, undefined, 0)),
      statistics
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
    projects: Array<Project & { 
      developer?: Developer; 
      coordinator?: User;
      _count?: {
        tasks?: number;
        apartments?: number;
      };
    }>
  ): ProjectListDTO[] {
    return projects.map(project => this.toListDTO(project, project));
  }

  /**
   * Convert Apartment model to ApartmentDTO
   */
  static apartmentToDTO(
    apartment: Apartment,
    stats?: {
      taskCount?: number;
      completedTaskCount?: number;
      progress?: number;
    }
  ): ApartmentDTO {
    return {
      ...apartment,
      area: apartment.area ? Number(apartment.area) : null,
      createdAt: apartment.createdAt.toISOString(),
      updatedAt: apartment.updatedAt.toISOString()
    };
  }

  /**
   * Convert Task to TaskListItemDTO
   */
  static taskToListDTO(
    task: Task,
    apartment?: { number: string },
    assigneeCount?: number
  ): TaskListItemDTO {
    return {
      id: task.id,
      title: task.title,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      area: Number(task.area),
      rate: Number(task.rate),
      dueDate: task.dueDate?.toISOString() ?? null,
      apartmentNumber: apartment?.number,
      assigneeCount: assigneeCount ?? 0
    };
  }

  /**
   * Convert Task model to TaskDTO
   */
  static toTaskDTO(
    task: Task,
    assignees?: Array<{
      userId: string;
      userName?: string | null;
      role?: string | null;
      assignedAt?: Date;
    }>
  ): TaskDTO {
    const { deletedAt, ...dto } = task;
    return {
      ...dto,
      status: dto.status as TaskStatus,
      priority: dto.priority as TaskPriority,
      area: Number(dto.area),
      rate: Number(dto.rate),
      dueDate: dto.dueDate?.toISOString() ?? null,
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
      assignees: assignees?.map(a => ({
        userId: a.userId,
        userName: a.userName,
        role: a.role,
        assignedAt: a.assignedAt?.toISOString()
      }))
    };
  }
}