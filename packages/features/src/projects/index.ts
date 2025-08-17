// Services
export { projectsService } from './services/projects.service';
export type { CreateProjectData, UpdateProjectData } from './services/projects.service';

// Hooks
export { 
  useProjects, 
  useProject, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject, 
  useAssignUserToProject, 
  useRemoveUserFromProject 
} from './hooks';