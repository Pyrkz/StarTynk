export * from './token.service';
export * from './jwt.service';
export * from './refresh.service';
export * from './user.service';
export * from './auth.service';
export * from './unified-auth.service';
export * from './session.service';

// Export client detection utilities
export * from '../middleware/client-detector';

// Export token service as TokenService for backward compatibility
export { TokenService, tokenService } from './jwt.service';
export { UnifiedAuthService, unifiedAuthService } from './unified-auth.service';
export { SessionService, sessionService } from './session.service';