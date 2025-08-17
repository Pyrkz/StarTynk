import { getExtendedEnv } from '../env';
import type { EmailConfig } from '../types';

export function getEmailConfig(): EmailConfig {
  const env = getExtendedEnv();
  
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.EMAIL_FROM,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.ENABLE_EMAIL_NOTIFICATIONS),
  };
}

export function getNodemailerConfig() {
  const emailConfig = getEmailConfig();
  
  if (!emailConfig.enabled) {
    return null;
  }
  
  return {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465, // true for 465, false for other ports
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
  };
}

export function getEmailTemplates() {
  const env = getExtendedEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || env.EXPO_PUBLIC_APP_NAME;
  const appUrl = env.APP_URL;
  
  return {
    welcomeEmail: {
      subject: `Welcome to ${appName}!`,
      template: 'welcome',
      variables: {
        appName,
        appUrl,
        supportEmail: 'support@startynk.com',
      },
    },
    
    emailVerification: {
      subject: `Verify your email address for ${appName}`,
      template: 'email-verification',
      variables: {
        appName,
        appUrl,
        verificationUrl: `${appUrl}/auth/verify-email`,
      },
    },
    
    passwordReset: {
      subject: `Reset your ${appName} password`,
      template: 'password-reset',
      variables: {
        appName,
        appUrl,
        resetUrl: `${appUrl}/auth/reset-password`,
        supportEmail: 'support@startynk.com',
      },
    },
    
    passwordChanged: {
      subject: `Your ${appName} password was changed`,
      template: 'password-changed',
      variables: {
        appName,
        appUrl,
        supportEmail: 'support@startynk.com',
      },
    },
    
    twoFactorEnabled: {
      subject: `Two-factor authentication enabled for ${appName}`,
      template: 'two-factor-enabled',
      variables: {
        appName,
        appUrl,
        supportEmail: 'support@startynk.com',
      },
    },
    
    loginAlert: {
      subject: `New login to your ${appName} account`,
      template: 'login-alert',
      variables: {
        appName,
        appUrl,
        supportEmail: 'support@startynk.com',
      },
    },
  };
}

export function getEmailLimits() {
  const env = getExtendedEnv();
  
  return {
    // Rate limiting for emails
    perUser: {
      verification: 5, // per hour
      passwordReset: 3, // per hour
      newsletter: 1, // per day
    },
    
    // Global limits
    global: {
      hourly: env.isProduction ? 1000 : 100,
      daily: env.isProduction ? 10000 : 500,
    },
    
    // Retry configuration
    retry: {
      attempts: 3,
      delay: 1000, // 1 second
      backoff: 2, // exponential backoff multiplier
    },
  };
}