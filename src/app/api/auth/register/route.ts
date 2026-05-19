import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/services/auth.service';
import { errorResponse, successResponse } from '@/utils/api';
import { ApiError } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return errorResponse('Missing required fields', 400);
    }

    const user = await AuthService.registerUser(
      email,
      password,
      name,
      'GYM_OWNER'
    );

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      201
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Registration failed', 500);
  }
}
