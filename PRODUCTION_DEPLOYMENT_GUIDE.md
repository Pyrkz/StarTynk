# 🚀 StarTynk Dual-Mode Authentication - Production Deployment Guide

## 🎯 Overview

This guide covers the production deployment of the enhanced dual-mode authentication system that supports both **cookie sessions (web)** and **JWT tokens (mobile)** simultaneously with enterprise-grade security.

## ⚡ Quick Start Checklist

### Pre-Deployment Requirements
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] RSA key pair generated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup complete

## 🔐 Environment Variables

### Required Production Variables

```bash
# JWT Configuration (CRITICAL - Generate unique RSA key pair)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_RSA_PRIVATE_KEY]\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n[YOUR_RSA_PUBLIC_KEY]\n-----END PUBLIC KEY-----"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# NextAuth Configuration
NEXTAUTH_SECRET="[GENERATE_SECURE_32_CHAR_SECRET]"
NEXTAUTH_URL="https://yourdomain.com"

# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Security Configuration
MAX_DEVICES_PER_USER=5
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=900000
TOKEN_CLEANUP_INTERVAL=3600000

# CORS & Origins
ALLOWED_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"

# Optional: External Services
REDIS_URL="redis://localhost:6379"
MONITORING_API_KEY="[YOUR_MONITORING_KEY]"
```

### Generate RSA Key Pair

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private_key.pem -pkcs8 -aes256

# Generate public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

# Convert to environment variable format
echo "JWT_PRIVATE_KEY=\"$(cat private_key.pem | tr '\n' '\\n')\""
echo "JWT_PUBLIC_KEY=\"$(cat public_key.pem | tr '\n' '\\n')\""
```

## 🗄️ Database Migration

### 1. Run Migration

```bash
# Production migration (requires shadow database permissions)
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Alternative: Push schema changes
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### 2. Verify Schema

```sql
-- Verify RefreshToken table
DESCRIBE refresh_tokens;

-- Verify LoginAttempt table  
DESCRIBE login_attempts;

-- Check indexes
SHOW INDEX FROM refresh_tokens;
SHOW INDEX FROM login_attempts;
```

### 3. Create Database Indexes (if not auto-created)

```sql
-- Performance indexes for auth queries
CREATE INDEX idx_refresh_tokens_user_device ON refresh_tokens(userId, deviceId);
CREATE INDEX idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expiresAt);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts(ip, createdAt);
CREATE INDEX idx_login_attempts_identifier_time ON login_attempts(identifier, createdAt);
```

## 🔒 Security Configuration

### 1. Enable Security Headers

Add to your reverse proxy (Nginx/Apache) or middleware:

```nginx
# Nginx configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
```

### 2. Configure Rate Limiting

The system includes built-in rate limiting. Configure limits based on your needs:

```typescript
// Adjust in packages/auth/src/services/security.service.ts
private readonly RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
  registration: { windowMs: 60 * 60 * 1000, maxRequests: 3, blockDurationMs: 60 * 60 * 1000 },
  tokenRefresh: { windowMs: 5 * 60 * 1000, maxRequests: 20, blockDurationMs: 10 * 60 * 1000 },
  apiCall: { windowMs: 60 * 1000, maxRequests: 100, blockDurationMs: 5 * 60 * 1000 },
};
```

### 3. Enable HTTPS

**CRITICAL**: Never run authentication in production without HTTPS.

```bash
# Ensure SSL certificates are properly configured
# Use Let's Encrypt, CloudFlare, or commercial certificates
```

## 📱 Mobile App Configuration

### 1. Update Mobile Environment

```typescript
// apps/mobile/.env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_APP_ENV=production
```

### 2. Build Production Mobile App

```bash
# Build for production
cd apps/mobile
eas build --platform all --profile production

# Test before release
eas build --platform all --profile preview
```

### 3. Enable Certificate Pinning (Recommended)

```typescript
// Add to apps/mobile/app.json
{
  "expo": {
    "plugins": [
      [
        "expo-certificate-pinning",
        {
          "domains": [
            {
              "domain": "api.yourdomain.com",
              "pins": ["YOUR_CERTIFICATE_PIN"]
            }
          ]
        }
      ]
    ]
  }
}
```

## 🌐 Web App Configuration

### 1. NextAuth Production Setup

```typescript
// apps/web/src/lib/auth.ts - Verify production settings
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // ... rest of configuration
};
```

### 2. Build Web App

```bash
# Build for production
cd apps/web
npm run build

# Verify build
npm run start
```

## 📊 Monitoring Setup

### 1. Security Event Monitoring

```typescript
// Implement in your monitoring service
const securityEvents = [
  'login_attempt',
  'token_reuse', 
  'device_anomaly',
  'rate_limit_exceeded',
  'suspicious_activity'
];

// Set up alerts for critical events
// - Multiple failed logins
// - Token reuse detection
// - Geographic anomalies
// - Unusual login patterns
```

### 2. Performance Monitoring

```typescript
// Key metrics to monitor
const authMetrics = {
  'auth.login.duration': 'Login response time',
  'auth.token_refresh.duration': 'Token refresh time',
  'auth.login.success_rate': 'Login success rate',
  'auth.security.threats_detected': 'Security threats',
  'auth.rate_limits.triggered': 'Rate limit violations',
};
```

### 3. Database Performance

```sql
-- Monitor slow auth queries
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST 
WHERE DB = 'your_database' 
AND COMMAND = 'Query' 
AND TIME > 1;

-- Monitor table sizes
SELECT 
  table_name,
  table_rows,
  data_length,
  index_length,
  (data_length + index_length) as total_size
FROM information_schema.tables 
WHERE table_schema = 'your_database'
AND table_name IN ('refresh_tokens', 'login_attempts', 'users', 'sessions');
```

## 🔄 Deployment Process

### 1. Zero-Downtime Deployment

```bash
#!/bin/bash
# Production deployment script

echo "🚀 Starting production deployment..."

# 1. Backup database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run database migrations
npx prisma migrate deploy

# 3. Build applications
npm run build

# 4. Deploy with zero downtime
# Use your deployment strategy (Docker, PM2, etc.)

# 5. Health check
curl -f https://yourdomain.com/api/health || exit 1

# 6. Start token cleanup job
npm run start:auth-cleanup

echo "✅ Deployment completed successfully"
```

### 2. Health Checks

```typescript
// apps/web/src/pages/api/health.ts
export default async function handler(req: Request, res: Response) {
  try {
    // Check database connection
    await prisma.user.findFirst();
    
    // Check authentication service
    const tokenService = new TokenService();
    // Perform basic validation
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        authentication: 'up',
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}
```

## 🧪 Testing in Production

### 1. Authentication Flow Testing

```bash
# Test mobile login
curl -X POST https://api.yourdomain.com/api/trpc/auth.mobileLogin \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "testpassword",
    "deviceId": "test-device-123",
    "deviceName": "Test Device"
  }'

# Test token refresh
curl -X POST https://api.yourdomain.com/api/trpc/auth.mobileRefresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE",
    "deviceId": "test-device-123"
  }'
```

### 2. Security Testing

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST https://api.yourdomain.com/api/trpc/auth.mobileLogin \
    -H "Content-Type: application/json" \
    -d '{"identifier": "test@test.com", "password": "wrong"}'
done

# Should receive 429 Too Many Requests after 5 attempts
```

### 3. Performance Testing

```bash
# Load test authentication endpoints
artillery run auth-load-test.yml

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/api/auth/session
```

## 🔧 Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   ```bash
   # Check RSA keys
   openssl rsa -in private_key.pem -text -check
   openssl rsa -pubin -in public_key.pem -text
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   npx prisma db pull --schema=packages/database/prisma/schema.prisma
   ```

3. **Rate Limiting Too Aggressive**
   ```typescript
   // Adjust rate limits in SecurityService
   // Monitor rate limit metrics
   ```

4. **Token Cleanup Not Running**
   ```bash
   # Manually trigger cleanup
   npm run auth:cleanup
   
   # Check cleanup job logs
   tail -f logs/auth-cleanup.log
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add missing indexes
   CREATE INDEX idx_user_email_active ON users(email, isActive);
   CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expiresAt, isRevoked);
   ```

2. **Redis Caching (Optional)**
   ```typescript
   // Implement Redis caching for rate limiting
   // Cache user sessions for faster lookups
   ```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Configuration**
   ```nginx
   upstream auth_backend {
       server app1.yourdomain.com:3000;
       server app2.yourdomain.com:3000;
       server app3.yourdomain.com:3000;
   }
   ```

2. **Database Scaling**
   - Read replicas for authentication checks
   - Connection pooling
   - Query optimization

3. **Stateless Design**
   - JWT tokens are stateless
   - Rate limiting can use Redis cluster
   - Session data in database

## 🔒 Security Maintenance

### Regular Tasks

1. **Key Rotation**
   ```bash
   # Rotate RSA keys monthly
   ./scripts/rotate-jwt-keys.sh
   ```

2. **Security Audits**
   ```bash
   # Weekly security scans
   npm audit --audit-level moderate
   docker run --rm -v $(pwd):/src aquasec/trivy fs /src
   ```

3. **Monitor Security Events**
   ```sql
   -- Check for suspicious activities
   SELECT * FROM login_attempts 
   WHERE success = false 
   AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
   ORDER BY created_at DESC;
   ```

## 📞 Support

For production support:
- Monitor security alerts
- Check application logs
- Review database performance
- Validate certificate expiration
- Test backup/restore procedures

## ✅ Post-Deployment Checklist

- [ ] All health checks passing
- [ ] Authentication flows working (web + mobile)
- [ ] Security headers properly set
- [ ] Rate limiting functional
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Token cleanup job running
- [ ] Performance metrics baseline established
- [ ] Security incident response plan ready

---

🎉 **Congratulations!** Your production-grade dual-mode authentication system is now live with enterprise security features.