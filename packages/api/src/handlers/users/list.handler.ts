import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import { ListUsersInput } from '../../validators';
import { applyFilters, applySorting, applyPagination, getUserSortFields } from '../../utils';
import { logger } from '../../middleware';

export async function listUsersHandler(input: ListUsersInput): Promise<Response> {
  try {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = input;

    // Build filters
    const where = applyFilters({
      search,
      role,
      isActive
    });

    // Apply sorting
    const orderBy = applySorting(
      { sortBy, sortOrder },
      getUserSortFields()
    );

    // Apply pagination
    const { skip, take } = applyPagination(page, limit);

    // Execute query with transaction for consistency
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              developedProjects: true,
              coordinatedProjects: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    logger.info('Users list retrieved', {
      count: users.length,
      total,
      page,
      filters: { role, isActive, search: !!search }
    });

    const responseData = ApiResponse.paginated(users, page, limit, total);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('List users handler error', error as Error, input);
    throw error;
  }
}