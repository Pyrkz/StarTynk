import { prisma } from '@repo/database';
import { ApiResponse } from '../../responses';
import type { ListProjectsInput } from '../../validators';
import { applyFilters, applySorting, applyPagination, getProjectSortFields } from '../../utils';
import { logger } from '../../middleware';

export async function listProjectsHandler(input: ListProjectsInput): Promise<Response> {
  try {
    const {
      page,
      limit,
      search,
      status,
      developerId,
      coordinatorId,
      minBudget,
      maxBudget,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = input;

    // Build filters
    const where = applyFilters({
      search,
      status,
      developerId,
      coordinatorId,
      minBudget,
      maxBudget,
      startDate,
      endDate
    });

    // Apply sorting
    const orderBy = applySorting(
      { sortBy, sortOrder },
      getProjectSortFields()
    );

    // Apply pagination
    const { skip, take } = applyPagination(page, limit);

    // Execute query with transaction for consistency
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          coordinator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              projectAssignments: true,
              tasks: true,
              materialOrders: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    logger.info('Projects list retrieved', {
      count: projects.length,
      total,
      page,
      filters: {
        status,
        developerId,
        coordinatorId,
        search: !!search,
        budgetRange: !!(minBudget || maxBudget),
        dateRange: !!(startDate || endDate)
      }
    });

    const responseData = ApiResponse.paginated(projects, page, limit, total);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('List projects handler error', error as Error, input);
    throw error;
  }
}