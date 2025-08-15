// Import from local database types until @repo/database is available
import type { Project, Task, Prisma, Apartment, QualityControl, Developer } from '../database/prisma-types';
import { 
  ProjectDTO, 
  TaskDTO, 
  CreateProjectDTO,
  ProjectListItemDTO,
  ProjectDetailDTO,
  CreateTaskDTO,
  ApartmentDTO,
  QualityControlDTO,
  DeveloperDTO,
  CreateDeveloperDTO,
  TaskListItemDTO
} from '../dto/project';
import { BaseMapper } from './base.mapper';
import { userMapper } from './user.mapper';
import { ProjectStatus, TaskStatus, TaskPriority, QualityStatus, QualityIssueType } from '../enums';

// Helper function to ensure string return type
function ensureString(value: string | null | undefined, defaultValue = ''): string {
  return value || defaultValue;
}

// Helper function to ensure optional string
function ensureOptionalString(value: string | null | undefined): string | undefined {
  return value || undefined;
}

class ProjectMapper extends BaseMapper<Project, ProjectDTO> {
  toDTO(entity: any): ProjectDTO {
    return {
      id: entity.id,
      name: entity.name,
      address: entity.address,
      developerId: entity.developerId,
      developer: entity.developer ? {
        id: entity.developer.id,
        name: entity.developer.name,
      } : undefined,
      startDate: ensureString(this.toISOString(entity.startDate), new Date().toISOString()),
      endDate: ensureString(this.toISOString(entity.endDate), new Date().toISOString()),
      baseRate: entity.baseRate?.toNumber() || 0,
      status: entity.status as ProjectStatus,
      description: entity.description,
      coordinatorId: entity.coordinatorId,
      coordinator: entity.coordinator 
        ? userMapper.toListItemDTO(entity.coordinator)
        : undefined,
      createdById: entity.createdById,
      createdBy: entity.createdBy 
        ? userMapper.toListItemDTO(entity.createdBy)
        : undefined,
      isActive: entity.isActive,
      createdAt: ensureString(this.toISOString(entity.createdAt), new Date().toISOString()),
      updatedAt: ensureString(this.toISOString(entity.updatedAt), new Date().toISOString()),
      _count: entity._count,
    };
  }

  toListItemDTO(entity: any): ProjectListItemDTO {
    return {
      id: entity.id,
      name: entity.name,
      address: entity.address,
      status: entity.status as ProjectStatus,
      startDate: ensureString(this.toISOString(entity.startDate), new Date().toISOString()),
      endDate: ensureString(this.toISOString(entity.endDate), new Date().toISOString()),
      developer: entity.developer?.name,
      coordinator: entity.coordinator?.name,
      _count: entity._count,
    };
  }

  toDetailDTO(entity: any): ProjectDetailDTO {
    const base = this.toDTO(entity);
    return {
      ...base,
      apartments: entity.apartments 
        ? apartmentMapper.toDTOArray(entity.apartments)
        : undefined,
      recentTasks: entity.tasks 
        ? entity.tasks.slice(0, 10).map((task: any) => taskMapper.toListItemDTO(task))
        : undefined,
      statistics: entity.statistics,
    };
  }

  toEntity(dto: Partial<ProjectDTO>): Partial<Project> {
    return {
      name: dto.name,
      address: dto.address,
      developerId: dto.developerId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      baseRate: dto.baseRate,
      status: dto.status,
      description: dto.description || null,
      coordinatorId: dto.coordinatorId || null,
      createdById: dto.createdById,
      isActive: dto.isActive,
    } as Partial<Project>;
  }

  toCreateEntity(dto: CreateProjectDTO): Prisma.ProjectCreateInput {
    return {
      name: dto.name,
      address: dto.address,
      developer: { connect: { id: dto.developerId } },
      startDate: this.toDate(dto.startDate) || new Date(),
      endDate: this.toDate(dto.endDate) || new Date(),
      baseRate: dto.baseRate,
      status: dto.status || ProjectStatus.PLANNING,
      description: dto.description,
      coordinator: dto.coordinatorId 
        ? { connect: { id: dto.coordinatorId } }
        : undefined,
      createdBy: { connect: { id: dto.createdById } },
    };
  }

  toUpdateEntity(dto: Partial<ProjectDTO>): Prisma.ProjectUpdateInput {
    const updateData: Prisma.ProjectUpdateInput = {};
    
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.developerId !== undefined) {
      updateData.developer = { connect: { id: dto.developerId } };
    }
    if (dto.startDate !== undefined) updateData.startDate = this.toDate(dto.startDate) || new Date();
    if (dto.endDate !== undefined) updateData.endDate = this.toDate(dto.endDate) || new Date();
    if (dto.baseRate !== undefined) updateData.baseRate = dto.baseRate;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.coordinatorId !== undefined) {
      updateData.coordinator = dto.coordinatorId 
        ? { connect: { id: dto.coordinatorId } }
        : { disconnect: true };
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    
    return updateData;
  }
}

class TaskMapper extends BaseMapper<Task, TaskDTO> {
  toDTO(entity: any): TaskDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      apartmentId: entity.apartmentId,
      title: entity.title,
      description: entity.description,
      area: entity.area?.toNumber() || 0,
      rate: entity.rate?.toNumber() || 0,
      status: entity.status as TaskStatus,
      priority: entity.priority as TaskPriority,
      estimatedHours: entity.estimatedHours,
      actualHours: entity.actualHours,
      dueDate: this.toISOString(entity.dueDate),
      assignees: this.transformArray(entity.assignments, (a: any) => ({
        userId: a.userId,
        userName: a.user?.name,
        role: a.role,
        assignedAt: ensureOptionalString(this.toISOString(a.createdAt)),
      })),
      isActive: entity.isActive,
      createdAt: ensureString(this.toISOString(entity.createdAt), new Date().toISOString()),
      updatedAt: ensureString(this.toISOString(entity.updatedAt), new Date().toISOString()),
    };
  }

  toListItemDTO(entity: any): TaskListItemDTO {
    return {
      id: entity.id,
      title: entity.title,
      status: entity.status as TaskStatus,
      priority: entity.priority as TaskPriority,
      area: entity.area?.toNumber() || 0,
      rate: entity.rate?.toNumber() || 0,
      dueDate: this.toISOString(entity.dueDate),
      apartmentNumber: entity.apartment?.number,
      assigneeCount: entity._count?.assignments || 0,
    };
  }

  toEntity(dto: Partial<TaskDTO>): Partial<Task> {
    return {
      projectId: dto.projectId,
      apartmentId: dto.apartmentId || null,
      title: dto.title,
      description: dto.description || null,
      area: dto.area,
      rate: dto.rate,
      status: dto.status,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours || null,
      actualHours: dto.actualHours || null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      isActive: dto.isActive,
    } as Partial<Task>;
  }

  toCreateEntity(dto: CreateTaskDTO): Prisma.TaskCreateInput {
    return {
      title: dto.title,
      description: dto.description,
      area: dto.area,
      rate: dto.rate,
      status: dto.status || TaskStatus.NEW,
      priority: dto.priority || TaskPriority.MEDIUM,
      estimatedHours: dto.estimatedHours,
      dueDate: dto.dueDate ? this.toDate(dto.dueDate) || undefined : undefined,
      project: { connect: { id: dto.projectId } },
      apartment: dto.apartmentId 
        ? { connect: { id: dto.apartmentId } }
        : undefined,
    };
  }
}

class ApartmentMapper extends BaseMapper<Apartment, ApartmentDTO> {
  toDTO(entity: Apartment): ApartmentDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      number: entity.number,
      floor: entity.floor,
      area: entity.area?.toNumber() || null,
      rooms: entity.rooms,
      type: entity.type,
      isActive: entity.isActive,
      createdAt: ensureString(this.toISOString(entity.createdAt), new Date().toISOString()),
      updatedAt: ensureString(this.toISOString(entity.updatedAt), new Date().toISOString()),
      _count: (entity as any)._count,
    };
  }

  toEntity(dto: Partial<ApartmentDTO>): Partial<Apartment> {
    return {
      projectId: dto.projectId,
      number: dto.number,
      floor: dto.floor || null,
      area: dto.area,
      rooms: dto.rooms || null,
      type: dto.type || null,
      isActive: dto.isActive,
    } as Partial<Apartment>;
  }

  toCreateEntity(dto: Partial<ApartmentDTO>): Prisma.ApartmentCreateInput {
    return {
      number: dto.number!,
      floor: dto.floor,
      area: dto.area,
      rooms: dto.rooms,
      type: dto.type,
      project: { connect: { id: dto.projectId! } },
    };
  }
}

class QualityControlMapper extends BaseMapper<QualityControl, QualityControlDTO> {
  toDTO(entity: any): QualityControlDTO {
    return {
      id: entity.id,
      taskId: entity.taskId,
      controllerId: entity.controllerId,
      controller: entity.controller ? {
        id: entity.controller.id,
        name: entity.controller.name,
      } : undefined,
      controlNumber: entity.controlNumber,
      status: entity.status as QualityStatus,
      completionRate: entity.completionRate,
      notes: entity.notes,
      issuesFound: entity.issuesFound,
      correctionsNeeded: entity.correctionsNeeded,
      controlDate: ensureString(this.toISOString(entity.controlDate), new Date().toISOString()),
      recontrolDate: this.toISOString(entity.recontrolDate),
      issueType: entity.issueType as QualityIssueType | null,
      isActive: entity.isActive,
      createdAt: ensureString(this.toISOString(entity.createdAt), new Date().toISOString()),
      updatedAt: ensureString(this.toISOString(entity.updatedAt), new Date().toISOString()),
    };
  }

  toEntity(dto: Partial<QualityControlDTO>): Partial<QualityControl> {
    return {
      taskId: dto.taskId,
      controllerId: dto.controllerId,
      controlNumber: dto.controlNumber,
      status: dto.status,
      completionRate: dto.completionRate,
      notes: dto.notes || null,
      issuesFound: dto.issuesFound || null,
      correctionsNeeded: dto.correctionsNeeded || null,
      controlDate: dto.controlDate ? new Date(dto.controlDate) : new Date(),
      recontrolDate: dto.recontrolDate ? new Date(dto.recontrolDate) : null,
      issueType: dto.issueType || null,
      isActive: dto.isActive,
    } as Partial<QualityControl>;
  }

  toCreateEntity(dto: Partial<QualityControlDTO>): Prisma.QualityControlCreateInput {
    return {
      task: { connect: { id: dto.taskId! } },
      controller: { connect: { id: dto.controllerId! } },
      status: dto.status || QualityStatus.PENDING,
      completionRate: dto.completionRate || 0,
      notes: dto.notes,
      issuesFound: dto.issuesFound,
      correctionsNeeded: dto.correctionsNeeded,
      recontrolDate: dto.recontrolDate ? this.toDate(dto.recontrolDate) || undefined : undefined,
      issueType: dto.issueType,
    };
  }
}

class DeveloperMapper extends BaseMapper<Developer, DeveloperDTO> {
  toDTO(entity: Developer): DeveloperDTO {
    return {
      id: entity.id,
      name: entity.name,
      address: entity.address,
      contact: entity.contact,
      email: entity.email,
      phone: entity.phone,
      isActive: entity.isActive,
      createdAt: ensureString(this.toISOString(entity.createdAt), new Date().toISOString()),
      updatedAt: ensureString(this.toISOString(entity.updatedAt), new Date().toISOString()),
      _count: (entity as any)._count,
    };
  }

  toEntity(dto: Partial<DeveloperDTO>): Partial<Developer> {
    return {
      name: dto.name,
      address: dto.address || null,
      contact: dto.contact || null,
      email: dto.email || null,
      phone: dto.phone || null,
      isActive: dto.isActive,
    } as Partial<Developer>;
  }

  toCreateEntity(dto: CreateDeveloperDTO): Prisma.DeveloperCreateInput {
    return {
      name: dto.name,
      address: dto.address,
      contact: dto.contact,
      email: dto.email,
      phone: dto.phone,
    };
  }
}

export const projectMapper = new ProjectMapper();
export const taskMapper = new TaskMapper();
export const apartmentMapper = new ApartmentMapper();
export const qualityControlMapper = new QualityControlMapper();
export const developerMapper = new DeveloperMapper();