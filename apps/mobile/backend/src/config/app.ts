export const appConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },
  rateLimit: {
    max: 100, // max 100 requests
    timeWindow: '1 minute',
  },
  bcrypt: {
    saltRounds: 10,
  },
};