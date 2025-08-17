# tRPC API Documentation

Auto-generated documentation for StarTynk tRPC API.

Generated on: 2025-08-17T08:54:56.500Z

## Authentication

### POST /auth/login
Login with email/password for web clients.

### POST /auth/mobileLogin  
Enhanced login for mobile clients with device tracking.

### POST /auth/refreshToken
Refresh JWT access token using refresh token.

### POST /auth/mobileRefresh
Enhanced token refresh for mobile clients.

### GET /auth/me
Get current authenticated user information.

### POST /auth/logout
Logout current user and invalidate tokens.

### GET /auth/verifyToken
Verify if a token is valid and get user info.

### GET /auth/getActiveSessions
Get all active sessions for current user.

### POST /auth/revokeSession
Revoke a specific session.

## Users

### GET /user/list
Get paginated list of users with filtering.

### GET /user/getById
Get detailed user information by ID.

### POST /user/create
Create a new user (admin only).

### PUT /user/update
Update user information.

### DELETE /user/delete
Soft delete a user (admin only).

### POST /user/changePassword
Change user password.

### GET /user/getStats
Get user statistics and metrics.

### GET /user/search
Search users for autocomplete.

## Projects

### GET /project/listPublic
Get public projects list.

### GET /project/list
Get paginated projects with advanced filtering.

### GET /project/getById
Get detailed project information.

### POST /project/create
Create a new project.

### PUT /project/update
Update project information.

### DELETE /project/delete
Soft delete a project.

### POST /project/addMember
Add a member to a project.

### DELETE /project/removeMember
Remove a member from a project.

### GET /project/getStats
Get project statistics and metrics.

## Tasks

### GET /task/list
Get paginated tasks with filtering.

### GET /task/getById
Get detailed task information.

### POST /task/create
Create a new task.

### PUT /task/update
Update task information.

### DELETE /task/delete
Soft delete a task.

## Vehicles

### GET /vehicle/list
Get paginated vehicles with filtering.

### GET /vehicle/getById
Get detailed vehicle information.

### POST /vehicle/create
Create a new vehicle.

### PUT /vehicle/update
Update vehicle information.

### DELETE /vehicle/delete
Soft delete a vehicle.

## System

### GET /health
Health check endpoint.

### GET /info
System information.

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "data": {
      "httpStatus": 400,
      "zodError": null,
      "requestId": "req_123456789",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

Tokens expire in 15 minutes. Use refresh tokens to get new access tokens.
