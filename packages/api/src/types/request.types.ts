export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export interface RequestMetadata {
  ip: string;
  userAgent: string;
  origin?: string;
  referer?: string;
}

export function extractRequestMetadata(request: Request): RequestMetadata {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    origin: request.headers.get('origin') || undefined,
    referer: request.headers.get('referer') || undefined,
  };
}