# @repo/auth - Unified Authentication Package

This package provides a unified authentication system that supports both web (session-based) and mobile (JWT-based) clients within the same API endpoints.

## Features

- **Unified Authentication**: Single middleware that handles both web and mobile clients
- **Client Type Detection**: Automatic detection of client type based on headers and request patterns
- **Token Rotation**: Secure refresh token rotation for mobile clients
- **Session Management**: NextAuth integration for web clients
- **Security First**: Built-in rate limiting, token cleanup, and security headers
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Architecture

### Client Types

- **Web Clients**: Use session-based authentication (NextAuth + custom sessions)
- **Mobile Clients**: Use JWT Bearer tokens with refresh token rotation

### Authentication Flow

1. **Client Detection**: Middleware detects client type based on:
   - `X-Client-Type` header
   - `Authorization: Bearer` header presence
   - User-Agent patterns
   - Default: web

2. **Authentication**: 
   - **Mobile**: JWT token verification
   - **Web**: Session validation (NextAuth or custom session cookie)

3. **Response**: 
   - **Mobile**: Returns JWT tokens
   - **Web**: Sets session cookies, returns redirect URL

## Installation

The package is already included in the workspace. Install dependencies:

```bash
pnpm install
```

## Usage

### Basic Authentication Middleware

```typescript
import { authenticateRequest, withAuth } from '@repo/auth';

// In API routes
export const GET = withAuth(async (request, { user, clientType }) => {
  // user is guaranteed to be authenticated
  // clientType is 'web' | 'mobile'
});

// Manual authentication
const authResult = await authenticateRequest(request);
if (authResult.authenticated) {
  const user = authResult.user;
  const clientType = authResult.clientType;
}
```

### Role-Based Authentication

```typescript
import { withRoleAuth, withAdminAuth } from '@repo/auth';

// Require specific roles
export const DELETE = withRoleAuth(['ADMIN', 'COORDINATOR'], async (request, { user }) => {
  // Only admins and coordinators can access
});

// Admin only
export const POST = withAdminAuth(async (request, { user }) => {
  // Only admins can access
});
```

### Optional Authentication

```typescript
import { withOptionalAuth } from '@repo/auth';

export const GET = withOptionalAuth(async (request, { user, clientType }) => {
  if (user) {
    // User is authenticated
  } else {
    // User is not authenticated, but that's OK
  }
});
```

### Client Type Detection

```typescript
import { detectClientType, isMobileClient, isWebClient } from '@repo/auth';

const clientType = detectClientType(request);
const isMobile = isMobileClient(request);
const isWeb = isWebClient(request);
```

### Token Management

```typescript
import { 
  createTokens, 
  verifyAccessToken, 
  rotateRefreshToken,
  revokeAllUserTokens 
} from '@repo/auth';

// Create tokens for mobile login
const tokens = await createTokens(user, securityContext);

// Verify access token
const payload = await verifyAccessToken(token);

// Rotate refresh token
const result = await rotateRefreshToken(oldToken, securityContext);

// Revoke all user tokens (logout from all devices)
await revokeAllUserTokens(userId);
```

### User Management

```typescript
import { 
  validateCredentials, 
  generateAuthResponse,
  findUserByIdentifier,
  getSanitizedUser 
} from '@repo/auth';

// Validate login credentials
const { user, loginMethod } = await validateCredentials(identifier, password);

// Generate appropriate response for client type
const response = await generateAuthResponse(user, clientType, loginMethod, securityContext);

// Find user by email or phone
const user = await findUserByIdentifier('user@example.com');

// Get sanitized user data for API responses
const safeUser = getSanitizedUser(user);
```

### Password Utilities

```typescript
import { 
  hashPassword, 
  comparePassword, 
  validatePassword,
  generateSecurePassword 
} from '@repo/auth';

// Hash password
const hashedPassword = await hashPassword(plainPassword);

// Compare password
const isValid = await comparePassword(plainPassword, hashedPassword);

// Validate password strength
const validation = validatePassword(password);
if (!validation.isValid) {
  console.log(validation.errors);
}

// Generate secure password
const password = generateSecurePassword(16);
```

### Security Utilities

```typescript
import { 
  generateSecureToken,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  detectLoginMethod 
} from '@repo/auth';

// Generate secure random token
const token = generateSecureToken(32);

// Validate formats
const emailValid = isValidEmail('user@example.com');
const phoneValid = isValidPhone('+1234567890');

// Normalize identifiers
const email = normalizeEmail(' USER@EXAMPLE.COM '); // 'user@example.com'
const phone = normalizePhone('+1 (234) 567-8900'); // '+12345678900'

// Detect login method
const method = detectLoginMethod('user@example.com'); // 'email'
```

## Configuration

### Environment Variables

Required variables:

```env
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
```

Optional variables:

```env
JWT_REFRESH_SECRET=your-refresh-secret  # defaults to JWT_SECRET
JWT_EXPIRY=15m                          # access token expiry
REFRESH_EXPIRY=30d                      # refresh token expiry
PASSWORD_MIN_LENGTH=8                   # minimum password length
MAX_LOGIN_ATTEMPTS=5                    # rate limiting
LOGIN_LOCKOUT_DURATION=900000           # 15 minutes in ms
SESSION_COOKIE_NAME=__session           # session cookie name
MOBILE_APP_IDENTIFIER=com.startynk.mobile
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Database Migration

Update your Prisma schema to include the enhanced RefreshToken model:

```prisma
model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  deviceId    String?
  userAgent   String?
  ip          String?
  loginMethod String?
  
  @@index([userId])
  @@index([deviceId])
  @@map("refresh_tokens")
}
```

Run the migration:

```bash
npx prisma migrate dev --name add_refresh_token_fields
```

## API Endpoints

### Login (Unified)

```
POST /api/auth/unified-login
```

Request body:
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "deviceId": "device-uuid", // optional, for mobile
  "rememberMe": true         // optional
}
```

Response (Mobile):
```json
{
  "success": true,
  "user": { ... },
  "loginMethod": "email",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 900
}
```

Response (Web):
```json
{
  "success": true,
  "user": { ... },
  "loginMethod": "email",
  "redirectUrl": "/dashboard"
}
```

### Refresh Token (Mobile Only)

```
POST /api/auth/refresh
```

Request body:
```json
{
  "refreshToken": "refresh-token",
  "deviceId": "device-uuid"  // optional
}
```

Response:
```json
{
  "success": true,
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900
}
```

### Session Check

```
GET /api/auth/session
```

Response:
```json
{
  "success": true,
  "user": { ... },
  "isAuthenticated": true
}
```

### Logout (Unified)

```
POST /api/auth/unified-logout
GET /api/auth/unified-logout   // web only
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Token Cleanup

The package includes automatic cleanup of expired tokens:

```typescript
import { setupTokenCleanup } from '@repo/auth';

// Start automatic cleanup (runs every hour)
setupTokenCleanup();

// Manual cleanup
import { runTokenCleanup } from '@repo/auth';
const cleanedCount = await runTokenCleanup();
```

## Security Features

- **Refresh Token Rotation**: One-time use refresh tokens
- **Device Tracking**: Track and manage user devices
- **Rate Limiting**: Built-in rate limiting capabilities
- **CORS Headers**: Automatic CORS header management
- **Security Headers**: X-Frame-Options, CSP, etc.
- **Token Cleanup**: Automatic cleanup of expired tokens
- **IP and User-Agent Tracking**: Security context logging

## Mobile Integration

The mobile app should:

1. Set the `X-Client-Type: mobile` header
2. Use the `Authorization: Bearer <token>` header
3. Include a `X-Device-Id` header for device tracking
4. Handle token refresh automatically on 401 responses

Example mobile auth client integration:

```typescript
// In your mobile app
import { authClient } from '@/lib/auth-client';

// Login
const result = await authClient.login('user@example.com', 'password');

// Authenticated requests
const response = await authClient.authenticatedFetch('/api/users');

// Auto-refresh on 401
// The auth client handles this automatically
```

## Web Integration

Web clients automatically use session-based authentication. No special configuration required.

```typescript
// Web apps automatically get session cookies
// NextAuth integration handles the rest
```

## Troubleshooting

### Common Issues

1. **Token not found**: Check that JWT_SECRET is set correctly
2. **Session not working**: Verify NEXTAUTH_SECRET is configured
3. **CORS errors**: Check ALLOWED_ORIGINS environment variable
4. **Mobile detection failing**: Ensure X-Client-Type header is set

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and allow all CORS origins.

### Testing

```typescript
// Test authentication
const authResult = await authenticateRequest(mockRequest);
expect(authResult.authenticated).toBe(true);

// Test token creation
const tokens = await createTokens(mockUser, mockSecurityContext);
expect(tokens.accessToken).toBeDefined();
```

## Migration from Previous Auth

If migrating from the old auth system:

1. Update imports: `@/lib/auth/*` → `@repo/auth`
2. Update API routes to use new middleware
3. Update database schema with new RefreshToken fields
4. Update mobile app to use new endpoints
5. Test both web and mobile authentication flows

## Best Practices

1. Always use the unified middleware (`withAuth`, etc.)
2. Never store JWT secrets in client code
3. Implement proper error handling for auth failures
4. Use HTTPS in production
5. Regularly rotate JWT secrets
6. Monitor failed login attempts
7. Implement proper rate limiting
8. Use secure session cookies
9. Validate all user inputs
10. Keep dependencies updated

## Performance Considerations

- Token verification is O(1) operation
- Database queries are indexed on userId and deviceId
- Automatic cleanup prevents token table bloat
- Session lookups are optimized for NextAuth
- CORS headers are cached per origin

## Contributing

When adding new features:

1. Update TypeScript types
2. Add comprehensive tests
3. Update this documentation
4. Follow existing patterns
5. Consider security implications
6. Test with both web and mobile clients