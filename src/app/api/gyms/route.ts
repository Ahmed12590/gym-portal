import { NextRequest, NextResponse } from 'next/server';
import { GymService } from '@/lib/services/auth.service';
import { 
  errorResponse, 
  successResponse, 
  withRole, 
  getPaginationParams,
  getUserId,
  isSuperAdmin,
  isGymOwner
} from '@/utils/api';
import { ApiError } from '@/types';

export const POST = withRole('SUPER_ADMIN', async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      gymOwnerId,
      subscriptionPlanId,
      description,
      website,
    } = body;

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !country ||
      !gymOwnerId ||
      !subscriptionPlanId
    ) {
      return errorResponse('Missing required fields', 400);
    }

    const gym = await GymService.createGym(
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      gymOwnerId,
      subscriptionPlanId,
      description,
      website
    );

    return successResponse(gym, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to create gym', 500);
  }
});

export const GET = async (request: NextRequest) => {
  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const userId = getUserId(request);
    const role = request.headers.get('x-user-role');

    let gyms, total;

    if (role === 'SUPER_ADMIN') {
      // Super admin can see all gyms
      ({ gyms, total } = await GymService.getAllGyms(skip, pageSize));
    } else if (role === 'GYM_OWNER') {
      // Gym owner can only see their own gyms
      const gymOwner = await db.gymOwner.findUnique({
        where: { userId },
      });

      if (!gymOwner) {
        return errorResponse('Gym owner not found', 404);
      }

      gyms = await db.gym.findMany({
        where: { gymOwnerId: gymOwner.id },
        skip,
        take: pageSize,
      });

      total = await db.gym.count({
        where: { gymOwnerId: gymOwner.id },
      });
    } else {
      return errorResponse('Unauthorized', 403);
    }

    return successResponse({
      gyms,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to fetch gyms', 500);
  }
};

// Need to import db
import { db } from '@/lib/db';
