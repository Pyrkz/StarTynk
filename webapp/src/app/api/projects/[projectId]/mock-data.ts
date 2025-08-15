import { mockProjectDetails } from './detail/mock-data'

export { mockProjectDetails }

// Helper function to get project by ID
export function getMockProject(projectId: string) {
  return mockProjectDetails[projectId] || {
    ...mockProjectDetails['1'],
    id: projectId,
    name: `Project ${projectId}`
  }
}