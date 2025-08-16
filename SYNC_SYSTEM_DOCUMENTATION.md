# Enterprise-Grade Synchronization & Caching System Documentation

## Overview

This document outlines the comprehensive synchronization and caching system implemented for the StarTynk construction workforce management platform. The system ensures reliable data synchronization between mobile devices and the server, with intelligent caching, push notifications, and conflict resolution.

## Architecture Components

### 1. Database Schema (Prisma)

#### Core Sync Tables
- **SyncQueue**: Manages pending sync operations with retry logic
- **PushToken**: Stores device push notification tokens
- **NotificationLog**: Tracks all sent notifications
- **CachePolicy**: Defines caching strategies per entity type
- **SyncLog**: Records sync operations for analytics
- **ConflictLog**: Tracks and resolves data conflicts
- **IdMapping**: Maps local IDs to server IDs

### 2. Push Notification System

#### Server-Side (Expo Push Service)
- **Location**: `packages/features/src/services/notification/push-notification.service.ts`
- **Features**:
  - Expo Push Notification integration
  - Batch processing with Redis queue
  - Automatic token validation and cleanup
  - Multi-language support
  - Scheduled notifications
  - Failure tracking and retry logic

#### Mobile-Side (Push Manager)
- **Location**: `apps/mobile/src/lib/notifications/push-manager.ts`
- **Features**:
  - Token registration with device info
  - In-app notification handling
  - Deep linking support
  - Badge count management
  - Local notification scheduling

### 3. Background Sync Implementation

#### Sync Queue Manager
- **Location**: `apps/mobile/src/lib/sync/sync-queue.ts`
- **Features**:
  - Offline queue management
  - Priority-based processing
  - Checksum validation
  - Batch sync support
  - Exponential backoff retry
  - ID mapping for offline-created entities

#### Background Sync Manager
- **Location**: `apps/mobile/src/lib/sync/background-sync.ts`
- **Features**:
  - 15-minute background sync intervals
  - Network-aware sync
  - Data cleanup (30-day retention)
  - Sync result logging

### 4. Intelligent Cache Strategy

#### Cache Strategy Manager
- **Location**: `packages/features/src/cache/cache-strategy.ts`
- **Features**:
  - LRU memory cache (50MB limit)
  - Persistent cache with compression
  - Entity-specific strategies
  - Dynamic TTL and stale time
  - React Query integration

#### Cache Strategies by Entity
```typescript
{
  user: 'CACHE_FIRST' (1 hour TTL),
  project: 'STALE_WHILE_REVALIDATE' (30 min TTL),
  attendance: 'NETWORK_FIRST' (5 min TTL),
  task: 'CACHE_FIRST' (15 min TTL),
  payroll: 'NETWORK_FIRST' (1 min TTL - critical data),
}
```

### 5. Real-time WebSocket Sync

#### Server-Side
- **Location**: `packages/features/src/sync/realtime-sync.ts`
- **Features**:
  - Socket.io with Redis adapter
  - JWT authentication
  - Room-based broadcasting
  - Presence tracking
  - Conflict detection

#### Client-Side
- **Location**: `apps/mobile/src/lib/sync/websocket-manager.ts`
- **Features**:
  - Auto-reconnection
  - Event-based updates
  - Entity subscriptions
  - Presence updates

### 6. TRPC Endpoints

#### Sync Router
- **Location**: `packages/trpc/src/routers/sync.router.ts`
- **Endpoints**:
  - `syncItem`: Single item sync
  - `syncBatch`: Batch sync operations
  - `getUpdates`: Fetch changes since timestamp
  - `getSyncStatus`: Queue and sync health
  - `retryFailed`: Retry failed sync items

#### Notification Router
- **Location**: `packages/trpc/src/routers/notification.router.ts`
- **Endpoints**:
  - `registerPushToken`: Register device token
  - `getNotifications`: Paginated notification history
  - `markAsRead`: Update notification status
  - `sendTestNotification`: Testing endpoint

### 7. Conflict Resolution

#### Conflict Resolution Service
- **Location**: `packages/features/src/sync/conflict-resolution.service.ts`
- **Strategies**:
  - **CLIENT_WINS**: Local changes take precedence
  - **SERVER_WINS**: Server data takes precedence
  - **MERGE**: Intelligent field-level merging
  - **MANUAL_RESOLVE**: User intervention required

#### Default Strategies by Entity
```typescript
{
  attendance: 'MERGE',
  task: 'MERGE',
  material: 'SERVER_WINS',
  payroll: 'SERVER_WINS',
  project: 'SERVER_WINS',
  user: 'SERVER_WINS',
}
```

### 8. Monitoring & Analytics

#### Sync Monitoring Service
- **Location**: `packages/features/src/monitoring/sync-monitoring.service.ts`
- **Metrics**:
  - Sync performance (duration, success rate)
  - Notification delivery rates
  - Cache hit/miss rates
  - Queue sizes and health
  - Network latency

## Production Deployment Guide

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- PM2 or similar process manager
- SSL certificates
- Expo account (for push notifications)

### Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/startynk"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"

# JWT
JWT_SECRET="your-jwt-secret"

# Expo Push Notifications
EXPO_ACCESS_TOKEN="your-expo-access-token"

# WebSocket
WS_URL="wss://your-domain.com"

# API URLs
API_URL="https://api.your-domain.com"
WEB_URL="https://app.your-domain.com"
```

### Database Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed cache policies
npx prisma db seed
```

### Redis Setup

```bash
# Configure Redis for persistence
echo "save 900 1" >> /etc/redis/redis.conf
echo "save 300 10" >> /etc/redis/redis.conf
echo "save 60 10000" >> /etc/redis/redis.conf
echo "appendonly yes" >> /etc/redis/redis.conf

# Set memory policy
echo "maxmemory 2gb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'startynk-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'startynk-websocket',
      script: './dist/websocket.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'startynk-worker',
      script: './dist/worker.js',
      instances: 2,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API endpoints
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket endpoint
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Monitoring Setup

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-auto-pull

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Setup health endpoint monitoring
# Add to your monitoring service (e.g., Datadog, New Relic)
```

## Performance Targets

- **Sync Latency**: < 500ms (p95)
- **Push Notification Delivery**: < 3 seconds
- **Background Sync Interval**: 15 minutes
- **Cache Hit Rate**: > 80%
- **Queue Processing**: < 100ms per item
- **WebSocket Latency**: < 100ms
- **Conflict Resolution**: < 1% of syncs

## Security Considerations

1. **Authentication**:
   - JWT tokens for API access
   - Device-specific tokens
   - Token rotation on security events

2. **Data Encryption**:
   - TLS 1.3 for all communications
   - Encrypted cache storage for sensitive data
   - Checksum validation for data integrity

3. **Rate Limiting**:
   - API rate limiting per user/device
   - Sync queue throttling
   - Push notification limits

4. **Access Control**:
   - Entity-level permissions
   - Project-based data isolation
   - Role-based sync permissions

## Troubleshooting

### Common Issues

1. **High Sync Queue**:
   - Check network connectivity
   - Verify server capacity
   - Review conflict rates

2. **Low Cache Hit Rate**:
   - Adjust TTL values
   - Review cache eviction
   - Check memory limits

3. **Push Notification Failures**:
   - Validate Expo tokens
   - Check platform-specific issues
   - Review failure logs

### Debug Commands

```bash
# Check sync queue status
npm run sync:status

# Clear failed sync items
npm run sync:clear-failed

# Test push notifications
npm run notification:test USER_ID

# Monitor WebSocket connections
npm run ws:monitor

# View cache statistics
npm run cache:stats
```

## Maintenance

### Daily Tasks
- Monitor sync queue size
- Check notification delivery rates
- Review error logs

### Weekly Tasks
- Analyze conflict patterns
- Clean old sync logs
- Update cache policies

### Monthly Tasks
- Performance optimization review
- Security audit
- Capacity planning

## Scaling Considerations

1. **Horizontal Scaling**:
   - Redis Cluster for cache distribution
   - Multiple WebSocket servers with sticky sessions
   - Database read replicas

2. **Vertical Scaling**:
   - Increase Redis memory for larger cache
   - Optimize database queries
   - Upgrade server resources

3. **Geographic Distribution**:
   - CDN for static assets
   - Regional Redis instances
   - Database replication

## Success Metrics

- **99.9%** notification delivery rate
- **Zero** data loss during sync
- **<1%** conflict rate
- **>80%** cache hit rate
- **<500ms** sync latency (p95)
- **100%** background sync success rate

## Contact & Support

For technical support or questions about the sync system:
- Technical Lead: [email]
- DevOps Team: [email]
- Emergency: [phone]