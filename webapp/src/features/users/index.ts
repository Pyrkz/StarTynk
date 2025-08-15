// Export types (including UserFilters interface)
export type {
  UserWithRelations,
  UserFilters,
  CreateUserDTO,
  UpdateUserDTO,
  InvitationWithInviter,
  CreateInvitationDTO,
  BulkInvitationDTO,
  ActivityLogDetails,
  UsersListResponse,
  InvitationsListResponse,
  BulkUserUpdateDTO,
  BulkOperationResult,
  UserStatistics
} from './types'

// Export components (including UserFilters component)
export { UserTable } from './components/UserTable'
export { UserInviteForm } from './components/UserInviteForm'
export { UserFilters as UserFiltersComponent } from './components/UserFilters'

// Export hooks
export * from './hooks'