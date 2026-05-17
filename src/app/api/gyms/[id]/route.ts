import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { GymService } from '@/lib/services/auth.service';
import {
  errorResponse,
  successResponse,
  withAuth,
  getUserId,
  notFoundResponse,
  forbiddenResponse,
} from '@/utils/api';
import { ApiError } from '@/types';

async function checkGymAccess(gymId: string, userId: string, role: string) {
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    include: {
      owner: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!gym) {
    return null;
  }

  // Super admin has access to all gyms
  if (role === 'SUPER_ADMIN') {
    return gym;
  }

  // Gym owner can only access their own gyms
  if (role === 'GYM_OWNER' && gym.owner.userId === userId) {
    return gym;
  }

  return undefined; // Forbidden
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const gymId = request.nextUrl.pathname.split('/').pop();
    const userId = getUserId(request);
    const role = request.headers.get('x-user-role') || '';

    if (!gymId) {
      return errorResponse('Gym ID is required', 400);
    }

    const gym = await checkGymAccess(gymId, userId, role);

    if (gym === null) {
      return notFoundResponse();
    }

    if (gym === undefined) {
      return forbiddenResponse();
    }

    const gymWithDetails = await GymService.getGymById(gymId);

    return successResponse(gymWithDetails);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to fetch gym', 500);
  }
});

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const gymId = request.nextUrl.pathname.split('/').pop();
    const userId = getUserId(request);
    const role = request.headers.get('x-user-role') || '';

    if (!gymId) {
      return errorResponse('Gym ID is required', 400);
    }

    const gym = await checkGymAccess(gymId, userId, role);

    if (gym === null) {
      return notFoundResponse();
    }

    if (gym === undefined) {
      return forbiddenResponse();
    }

    const body = await request.json();

    const updated = await GymService.updateGym(gymId, body);

    return successResponse(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to update gym', 500);
  }
});

export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const gymId = request.nextUrl.pathname.split('/').pop();
    const userId = getUserId(request);
    const role = request.headers.get('x-user-role') || '';

    if (!gymId) {
      return errorResponse('Gym ID is required', 400);
    }

    // Only super admin can delete
    if (role !== 'SUPER_ADMIN') {
      return forbiddenResponse();
    }

    const gym = await GymService.deleteGym(gymId);

    return successResponse(gym);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to delete gym', 500);
  }
});
