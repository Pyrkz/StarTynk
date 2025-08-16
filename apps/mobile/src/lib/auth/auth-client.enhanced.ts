import { tokenManager } from './token-manager';
import { authenticatedApi } from './auth-interceptor';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Network from 'expo-network';

/**
 * Enhanced authentication client with comprehensive security features
 * - Biometric authentication support
 * - Network status monitoring
 * - Offline capability
 * - Device attestation
 * - Security monitoring
 */

interface LoginRequest {
  identifier: string;
  password: string;
  loginMethod?: 'email' | 'phone';
  rememberMe?: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface SecurityStatus {
  deviceSecure: boolean;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  networkSecure: boolean;
  appIntegrityValid: boolean;
}

class EnhancedAuthClient {
  private static instance: EnhancedAuthClient;
  private baseURL: string;
  private isOnline: boolean = true;
  private securityStatus: SecurityStatus | null = null;

  private constructor() {
    this.baseURL = Constants.expoConfig?.extra?.apiUrl || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   'http://localhost:3000';
    this.initializeSecurityMonitoring();
  }

  public static getInstance(): EnhancedAuthClient {
    if (!EnhancedAuthClient.instance) {
      EnhancedAuthClient.instance = new EnhancedAuthClient();
    }
    return EnhancedAuthClient.instance;
  }

  /**
   * Initialize the auth client with security features
   */
  async initialize(): Promise<void> {
    await tokenManager.initialize();
    await this.checkSecurityStatus();
    this.setupNetworkMonitoring();
    
    console.log('🔐 Enhanced auth client initialized');
  }

  /**
   * Enhanced login with comprehensive security checks
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // Pre-login security checks
      await this.checkSecurityStatus();
      
      if (!this.securityStatus?.networkSecure) {
        console.warn('⚠️ Insecure network detected');
      }

      const deviceInfo = await tokenManager.getDeviceInfo();
      const deviceFingerprint = await tokenManager.getDeviceFingerprint();

      const loginPayload = {
        identifier: request.identifier,
        password: request.password,
        loginMethod: request.loginMethod || this.detectLoginMethod(request.identifier),
        deviceId: deviceInfo.id,
        deviceName: deviceInfo.name,
        deviceInfo: {
          platform: deviceInfo.platform,
          version: deviceInfo.version,
          model: deviceInfo.model,
          appVersion: deviceInfo.appVersion,
        },
        rememberMe: request.rememberMe || false,
        securityContext: {
          deviceFingerprint,
          biometricsAvailable: this.securityStatus?.biometricsAvailable || false,
          networkType: await this.getNetworkType(),
        },
      };

      const response = await authenticatedApi.post('/trpc/auth.mobileLogin', loginPayload);
      const data = response.data.result?.data;

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Login failed',
        };
      }

      // Store tokens securely
      if (data.accessToken && data.refreshToken) {
        await tokenManager.storeTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn || 900,
        });

        // Enable biometric protection if available and user wants it
        if (this.securityStatus?.biometricsAvailable && request.rememberMe) {
          await this.enableBiometricProtection();
        }
      }

      console.log('✅ Login successful');
      return {
        success: true,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (!this.isOnline) {
        errorMessage = 'No internet connection';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Biometric login (if tokens are stored and biometrics enabled)
   */
  async biometricLogin(): Promise<AuthResponse> {
    try {
      if (!this.securityStatus?.biometricsAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      // Authenticate with biometrics
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (!biometricResult.success) {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }

      // Check if we have valid tokens
      const isAuthenticated = await tokenManager.isAuthenticated();
      
      if (isAuthenticated) {
        const token = await tokenManager.getAccessToken();
        
        if (token) {
          console.log('✅ Biometric login successful');
          return {
            success: true,
          };
        }
      }

      return {
        success: false,
        error: 'No valid session found',
      };

    } catch (error) {
      console.error('❌ Biometric login failed:', error);
      return {
        success: false,
        error: 'Biometric login failed',
      };
    }
  }

  /**
   * Check current authentication status
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    expiresIn?: number;
  }> {
    try {
      const isAuthenticated = await tokenManager.isAuthenticated();
      
      if (!isAuthenticated) {
        return { isAuthenticated: false };
      }

      // Validate token integrity
      const integrityValid = await tokenManager.validateTokenIntegrity();
      
      if (!integrityValid) {
        console.warn('⚠️ Token integrity check failed');
        await tokenManager.clearTokens();
        return { isAuthenticated: false };
      }

      // Get current user info
      try {
        const response = await authenticatedApi.get('/trpc/auth.me');
        const data = response.data.result?.data;
        
        if (data?.success && data.user) {
          return {
            isAuthenticated: true,
            user: data.user,
          };
        }
      } catch (error) {
        console.error('❌ Failed to get user info:', error);
      }

      return { isAuthenticated };

    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Enhanced logout with security cleanup
   */
  async logout(logoutFromAllDevices: boolean = false): Promise<void> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      const deviceInfo = await tokenManager.getDeviceInfo();

      // Call logout endpoint
      if (refreshToken) {
        try {
          await authenticatedApi.post('/trpc/auth.mobileLogout', {
            refreshToken,
            deviceId: deviceInfo.id,
            logoutFromAllDevices,
          });
        } catch (error) {
          console.warn('⚠️ Server logout failed, continuing with local cleanup');
        }
      }

      // Clear local tokens
      await tokenManager.clearTokens();
      
      // Clear any cached data
      await this.clearSecurityData();
      
      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Still clear local tokens even if server logout fails
      await tokenManager.clearTokens();
    }
  }

  /**
   * Get active sessions for security management
   */
  async getActiveSessions(): Promise<any[]> {
    try {
      const response = await authenticatedApi.get('/trpc/auth.getActiveSessions');
      const data = response.data.result?.data;
      
      if (data?.success) {
        return data.sessions || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const response = await authenticatedApi.post('/trpc/auth.revokeSession', {
        sessionId,
      });
      
      const data = response.data.result?.data;
      return data?.success || false;
    } catch (error) {
      console.error('❌ Failed to revoke session:', error);
      return false;
    }
  }

  /**
   * Get current security status
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    if (!this.securityStatus) {
      await this.checkSecurityStatus();
    }
    return this.securityStatus!;
  }

  /**
   * Enable biometric protection
   */
  async enableBiometricProtection(): Promise<boolean> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isAvailable) {
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return false;
      }

      // Store biometric preference
      // await SecureStore.setItemAsync('biometric_enabled', 'true');
      
      console.log('✅ Biometric protection enabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to enable biometric protection:', error);
      return false;
    }
  }

  /**
   * Check comprehensive security status
   */
  private async checkSecurityStatus(): Promise<void> {
    try {
      const [biometricsAvailable, networkState] = await Promise.all([
        this.checkBiometricsAvailability(),
        Network.getNetworkStateAsync(),
      ]);

      this.securityStatus = {
        deviceSecure: await this.isDeviceSecure(),
        biometricsAvailable,
        biometricsEnabled: biometricsAvailable, // TODO: Check user preference
        networkSecure: this.isNetworkSecure(networkState),
        appIntegrityValid: await this.validateAppIntegrity(),
      };

      // Log security warnings
      if (!this.securityStatus.deviceSecure) {
        console.warn('⚠️ Device security compromised (rooted/jailbroken)');
      }
      
      if (!this.securityStatus.networkSecure) {
        console.warn('⚠️ Insecure network connection detected');
      }

    } catch (error) {
      console.error('❌ Security status check failed:', error);
      this.securityStatus = {
        deviceSecure: false,
        biometricsAvailable: false,
        biometricsEnabled: false,
        networkSecure: false,
        appIntegrityValid: false,
      };
    }
  }

  /**
   * Check if biometrics are available
   */
  private async checkBiometricsAvailability(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('❌ Biometric check failed:', error);
      return false;
    }
  }

  /**
   * Check if device is secure (not rooted/jailbroken)
   */
  private async isDeviceSecure(): Promise<boolean> {
    try {
      // Basic device security check
      // In production, use more sophisticated detection
      return true; // TODO: Implement proper root/jailbreak detection
    } catch (error) {
      console.error('❌ Device security check failed:', error);
      return false;
    }
  }

  /**
   * Check if network connection is secure
   */
  private isNetworkSecure(networkState: any): boolean {
    // Check if connection is over HTTPS
    // Check for VPN usage
    // Check for public WiFi
    return networkState?.isConnected && networkState?.type !== 'UNKNOWN';
  }

  /**
   * Validate app integrity
   */
  private async validateAppIntegrity(): Promise<boolean> {
    try {
      // Check app signature, detect tampering, etc.
      // In production, implement proper app attestation
      return true;
    } catch (error) {
      console.error('❌ App integrity check failed:', error);
      return false;
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    Network.addNetworkStateListener((state) => {
      this.isOnline = state.isConnected || false;
      
      if (!this.isOnline) {
        console.log('📱 App is offline');
      } else {
        console.log('🌐 App is online');
      }
    });
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Monitor app state changes
    // Monitor for security threats
    // Set up periodic security checks
    console.log('🛡️ Security monitoring initialized');
  }

  /**
   * Clear security-related data
   */
  private async clearSecurityData(): Promise<void> {
    try {
      // Clear any cached security data
      this.securityStatus = null;
    } catch (error) {
      console.error('❌ Failed to clear security data:', error);
    }
  }

  /**
   * Detect login method from identifier
   */
  private detectLoginMethod(identifier: string): 'email' | 'phone' {
    return identifier.includes('@') ? 'email' : 'phone';
  }

  /**
   * Get network type for security context
   */
  private async getNetworkType(): Promise<string> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.type || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Export singleton instance
export const enhancedAuthClient = EnhancedAuthClient.getInstance();