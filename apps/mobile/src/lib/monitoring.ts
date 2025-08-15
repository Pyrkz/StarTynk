import * as Sentry from 'sentry-expo';
import { env } from '../config/environment';

export function initializeMonitoring() {
  if (env.isProduction() || env.isStaging()) {
    Sentry.init({
      dsn: env.current.sentryDsn,
      environment: env.current.name,
      debug: env.isDevelopment(),
      tracesSampleRate: env.isProduction() ? 0.1 : 1.0,
    });
  }
}

export function logError(error: Error, context?: Record<string, any>) {
  env.error('Error:', error, context);
  
  if (env.isFeatureEnabled('crashReporting')) {
    Sentry.Native.captureException(error, {
      extra: context,
    });
  }
}

export function logEvent(event: string, properties?: Record<string, any>) {
  env.log('Event:', event, properties);
  
  if (env.isFeatureEnabled('analytics')) {
    // Send to analytics service
  }
}