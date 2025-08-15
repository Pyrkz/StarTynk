import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@repo/api';

export async function GET(request: NextRequest) {
  const versionInfo = {
    api: {
      version: '1.0.0',
      name: 'StarTynk API',
      description: 'Production-ready API for StarTynk platform'
    },
    versions: {
      v1: {
        status: 'active',
        baseUrl: '/api/v1',
        endpoints: {
          auth: ['/auth/login', '/auth/logout', '/auth/refresh'],
          users: ['/users', '/users/{id}'],
          projects: ['/projects', '/projects/{id}']
        }
      }
    },
    documentation: {
      openapi: '/api/docs',
      postman: '/api/docs/postman'
    },
    support: {
      contact: 'api-support@startynk.com',
      status: '/api/health'
    }
  };

  return createSuccessResponse(versionInfo);
}