import { ApiResponse } from './api-response';

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const responseData = ApiResponse.paginated(data, page, limit, total);
  
  return new Response(
    JSON.stringify(responseData),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse<T>(data: T, meta?: any): Response {
  const responseData = ApiResponse.success(data, meta);
  
  return new Response(
    JSON.stringify(responseData),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createCreatedResponse<T>(data: T): Response {
  const responseData = ApiResponse.created(data);
  
  return new Response(
    JSON.stringify(responseData),
    { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createNoContentResponse(): Response {
  return new Response(null, { status: 204 });
}