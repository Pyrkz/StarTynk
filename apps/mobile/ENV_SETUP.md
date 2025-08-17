# StarTynk Mobile - Environment Configuration

This document describes the environment variable setup for the StarTynk mobile application.

## 📋 Overview

The StarTynk mobile app uses Expo environment variables to configure different environments (development, staging, production). All client-side environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the mobile app.

## 🗂️ Environment Files

### Available Files

- `.env.example` - Template file with all available variables
- `.env.development` - Local development configuration
- `.env.staging` - Staging environment configuration  
- `.env.production` - Production environment configuration

### File Selection

The app automatically loads the appropriate environment file based on:
1. `EXPO_PUBLIC_ENVIRONMENT` variable
2. Expo app configuration (`extra.environment`)
3. Development flag (`__DEV__`)
4. Defaults to `production` for release builds

## 🔧 Required Environment Variables

### Core Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_ENVIRONMENT` | Environment type | `development`, `staging`, `production` |
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `EXPO_PUBLIC_APP_NAME` | Display name of the app | `StarTynk Dev` |
| `EXPO_PUBLIC_APP_SCHEME` | URL scheme for deep linking | `startynk-dev` |
| `EXPO_PUBLIC_APP_VERSION` | App version | `1.0.0` |

### Optional Services

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |
| `EXPO_PUBLIC_WEBSOCKET_URL` | WebSocket URL for real-time features | `ws://localhost:3001` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking | `false` (dev), `true` (staging/prod) |
| `EXPO_PUBLIC_ENABLE_CRASH_REPORTING` | Enable crash reporting | `false` (dev), `true` (staging/prod) |
| `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS` | Enable push notifications | `true` |
| `EXPO_PUBLIC_ENABLE_LOGS` | Enable console logging | `true` (dev/staging), `false` (prod) |
| `EXPO_PUBLIC_MOCK_API` | Use mock API responses | `false` |

## 🚀 Quick Setup

### 1. Copy Environment Template

```bash
# Copy the example file for your environment
cp .env.example .env.development
```

### 2. Configure Variables

Edit `.env.development` with your local settings:

```env
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_APP_NAME=StarTynk Dev
EXPO_PUBLIC_APP_SCHEME=startynk-dev
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 3. Start Development Server

```bash
npm run start
# or
npm run dev
```

## 🌐 API Endpoint Configuration

The mobile app connects to the backend using these endpoint patterns:

### Base URL Structure
- **Development**: `http://localhost:3000/api/v1`
- **Staging**: `https://staging-api.startynk.com/api/v1`
- **Production**: `https://api.startynk.com/api/v1`

### Available Endpoints

| Category | Endpoints |
|----------|-----------|
| **Health** | `/health` |
| **Authentication** | `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh` |
| **Users** | `/users`, `/users/{id}`, `/users/profile` |
| **Projects** | `/projects`, `/projects/{id}`, `/projects/{id}/tasks` |
| **Tasks** | `/tasks`, `/tasks/{id}`, `/tasks/{id}/assign` |
| **Materials** | `/materials`, `/materials/categories` |
| **Equipment** | `/equipment`, `/equipment/categories` |
| **Vehicles** | `/vehicles`, `/vehicles/{id}/maintenance` |

## 🔒 Security Considerations

### Client-Side Variables Only
⚠️ **Important**: Only use `EXPO_PUBLIC_` prefixed variables. These are embedded in the client bundle and are **publicly accessible**.

### Sensitive Data
❌ **Never include** in mobile environment variables:
- API keys for server-side services
- Database connection strings  
- Private encryption keys
- Server secrets

✅ **Safe to include**:
- Public API endpoints
- Feature flags
- App configuration
- Public service keys (Sentry DSN)

## 🛠️ Environment Detection

The app uses a priority-based system for environment detection:

1. **Environment Variable**: `process.env.EXPO_PUBLIC_ENVIRONMENT`
2. **App Config**: `Constants.expoConfig?.extra?.environment`
3. **Development Flag**: `__DEV__` global variable
4. **Default**: Falls back to `production`

## 📱 Platform-Specific Configuration

### App Configuration (app.config.js)

The app configuration automatically adapts based on environment:

```javascript
// Environment-specific app names and schemes
development: {
  name: "StarTynk Dev",
  scheme: "startynk-dev"
}
staging: {
  name: "StarTynk Staging", 
  scheme: "startynk-staging"
}
production: {
  name: "StarTynk",
  scheme: "startynk"
}
```

## 🧪 Testing Configuration

To verify your environment setup:

```bash
# Check if all required variables are set
npm run start

# Verify API connectivity in the app
# Check the console for environment logs
```

## 🔧 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure file names match exactly (`.env.development`)
   - Restart Metro bundler after changing environment files
   - Verify `EXPO_PUBLIC_` prefix

2. **API connection failed**
   - Check `EXPO_PUBLIC_API_URL` points to running backend
   - Verify network connectivity
   - Check backend server is running on specified port

3. **Wrong environment loaded**
   - Set `EXPO_PUBLIC_ENVIRONMENT` explicitly
   - Clear Metro cache: `npx expo start --clear`

### Debug Information

The app logs current environment information at startup:

```javascript
console.log('Environment:', env.current.name);
console.log('API URL:', env.current.apiUrl);
console.log('Features:', env.current.features);
```

## 📝 Development Workflow

### Local Development

1. Use `.env.development` for local development
2. Backend should run on `localhost:3000`
3. Enable all logging and debugging features
4. Disable analytics and crash reporting

### Staging Testing

1. Use `.env.staging` for testing builds
2. Connect to staging backend environment
3. Enable monitoring and error tracking
4. Test production-like feature configuration

### Production Deployment

1. Use `.env.production` for release builds
2. Connect to production backend
3. Enable all monitoring and analytics
4. Disable development logging

## 🔄 Continuous Integration

### Environment Variables in CI/CD

For automated builds, set environment variables in your CI/CD platform:

```bash
# GitHub Actions example
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.startynk.com/api/v1
EXPO_PUBLIC_SENTRY_DSN=${{ secrets.SENTRY_DSN }}
```

### Build Variants

Different builds can use different environment files:

```bash
# Development build
EXPO_PUBLIC_ENVIRONMENT=development expo build

# Staging build  
EXPO_PUBLIC_ENVIRONMENT=staging expo build

# Production build
EXPO_PUBLIC_ENVIRONMENT=production expo build
```

---

For additional help or questions about environment setup, please refer to the [Expo Environment Variables documentation](https://docs.expo.dev/guides/environment-variables/) or contact the development team.