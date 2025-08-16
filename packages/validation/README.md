# @repo/validation

Enterprise-grade validation, error handling, and rate limiting system for the StarTynk monorepo.

## Features

- 🛡️ **Comprehensive Validation Schemas** - Pre-built schemas for auth, projects, tasks, attendance, payroll, and more
- 🔒 **Security First** - Input sanitization, XSS prevention, SQL injection protection
- ⚡ **Rate Limiting** - Flexible rate limiting with multiple strategies
- 🎯 **Type Safety** - Full TypeScript support with Zod schemas
- 📱 **Mobile Support** - React Native hooks and components
- 🔌 **Framework Integration** - Express, tRPC, and React Native support
- 🌍 **i18n Ready** - Customizable error messages
- 🚨 **Enterprise Error Handling** - Structured error hierarchy with operational flags

## Installation

```bash
pnpm add @repo/validation
```

## Quick Start

### Basic Validation

```typescript
import { loginSchema, ValidationError } from '@repo/validation';

// Validate login data
try {
  const validated = loginSchema.parse({
    method: 'email',
    email: 'user@example.com',
    password: 'SecurePass123!',
  });
  // Use validated data
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.fields);
  }
}
```

### Express Middleware

```typescript
import { validate, validationErrorHandler } from '@repo/validation/middleware';
import { createProjectSchema } from '@repo/validation/schemas';

app.post('/api/projects',
  validate({
    body: createProjectSchema,
    sanitize: true,
  }),
  async (req, res) => {
    // req.body is validated and sanitized
    const project = await createProject(req.body);
    res.json(project);
  }
);

// Error handler
app.use(validationErrorHandler);
```

### tRPC Integration

```typescript
import { createValidatedProcedure } from '@repo/validation/trpc';
import { createTaskSchema } from '@repo/validation/schemas';

const t = initTRPC.create();
const validated = createValidatedProcedure(t);

export const taskRouter = t.router({
  create: validated
    .input(createTaskSchema, { sanitize: true })
    .mutation(async ({ input }) => {
      // input is validated and typed
      return await createTask(input);
    }),
});
```

### React Native

```typescript
import { useValidation } from '@repo/validation/mobile';
import { registerSchema } from '@repo/validation/schemas';

function RegisterScreen() {
  const {
    register,
    handleSubmit,
    errors,
    isValid,
  } = useForm(registerSchema, {
    mode: 'onChange',
    onSubmit: async (data) => {
      await api.register(data);
    },
  });

  return (
    <View>
      <TextInput {...register('email')} />
      <ValidationError error={errors.email} />
      
      <TextInput {...register('password')} secureTextEntry />
      <ValidationError error={errors.password} />
      
      <Button
        title="Register"
        onPress={handleSubmit}
        disabled={!isValid}
      />
    </View>
  );
}
```

## Validation Schemas

### Authentication

- `loginSchema` - Multi-method login (email, phone, biometric)
- `registerSchema` - User registration with terms acceptance
- `resetPasswordSchema` - Password reset with token validation
- `changePasswordSchema` - Password change for authenticated users

### Common Patterns

- `emailSchema` - Email validation with typo detection
- `phoneSchema` - International phone numbers (defaults to Polish)
- `passwordSchema` - Strong password with entropy check
- `moneySchema` - Currency amounts with precision
- `dateRangeSchema` - Date range validation
- `coordinateSchema` - GPS coordinates with accuracy
- `fileUploadSchema` - File upload validation

### Business Entities

- `createProjectSchema` - Project creation with budget validation
- `attendanceSchema` - Work attendance with business hours check
- `payrollCalculationSchema` - Payroll calculation with deductions
- `vehicleSchema` - Vehicle registration and management
- `taskSchema` - Task creation with dependencies

## Input Sanitization

```typescript
import { sanitize } from '@repo/validation/sanitizers';

// Sanitize HTML (XSS prevention)
const safeHTML = sanitize.html(userInput);

// SQL injection prevention
const safeSQLValue = sanitize.sql(userInput);

// Path traversal prevention
const safePath = sanitize.path(uploadPath);

// Log sanitization (remove sensitive data)
const safeLog = sanitize.log({
  user: 'john@example.com',
  password: 'secret123', // Will be [REDACTED]
  action: 'login',
});
```

## Rate Limiting

```typescript
import { RateLimiter, createRateLimitMiddleware } from '@repo/validation/rate-limit';
import Redis from 'ioredis';

// Create rate limiter
const redis = new Redis();
const limiter = new RateLimiter(redis);

// Express middleware
app.use(createRateLimitMiddleware(limiter));

// Custom limits
app.post('/api/upload',
  createRateLimitMiddleware(limiter, {
    configSelector: () => 'api:upload', // 10 per hour
  }),
  uploadHandler
);

// Manual rate limiting
try {
  await limiter.consume(userId, 1, 'api:write');
  // Process request
} catch (error) {
  if (error instanceof RateLimitError) {
    // Return 429 with retry-after header
  }
}
```

## Error Handling

```typescript
import {
  ValidationError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ErrorHandler,
} from '@repo/validation/errors';

// Throw specific errors
throw new ValidationError('Invalid input', {
  email: ['Invalid email format'],
  password: ['Password too weak'],
});

throw new NotFoundError('Project', projectId);

throw new RateLimitError(300); // Retry after 300 seconds

// Handle errors
const handled = ErrorHandler.handle(error);
res.status(handled.statusCode).json(handled.body);
```

## Configuration

### Rate Limit Configs

Default configurations:
- `auth:login` - 5 attempts per 15 minutes
- `auth:register` - 3 per hour
- `api:read` - 100 per minute
- `api:write` - 30 per minute
- `api:upload` - 10 per hour

### Validation Options

```typescript
validate({
  body: schema,           // Validate request body
  query: querySchema,     // Validate query params
  params: paramsSchema,   // Validate route params
  sanitize: true,         // Enable sanitization
  transform: true,        // Use Zod transformations
});
```

## Testing

```bash
# Run tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Security Best Practices

1. **Always sanitize user input** - Use the sanitize option in validation
2. **Apply rate limiting** - Protect endpoints from abuse
3. **Use specific error types** - Don't expose internal errors
4. **Log security events** - Track failed validations and rate limits
5. **Keep schemas updated** - Regular security reviews

## Performance

- Validation: < 10ms per request
- Rate limit check: < 5ms
- Sanitization: < 20ms for 1KB payload
- Error handling: < 2ms

## License

Private - StarTynk