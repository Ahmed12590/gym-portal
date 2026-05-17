import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/services/auth.service';
import { errorResponse, successResponse, withRole } from '@/utils/api';
import { ApiError } from '@/types';

export const POST = withRole('SUPER_ADMIN', async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.name || !body.monthlyPrice) {
      return errorResponse('Missing required fields', 400);
    }

    const plan = await SubscriptionService.createPlan(
      body.name,
      parseFloat(body.monthlyPrice),
      body.maxMembers || -1,
      body.maxBranches || 1,
      {
        biometric: body.biometric || false,
        multiBranch: body.multiBranch || false,
        advancedReports: body.advancedReports || false,
        smsNotifications: body.smsNotifications || false,
        whatsappNotifications: body.whatsappNotifications || false,
      }
    );

    return successResponse(plan, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to create subscription plan', 500);
  }
});

export const GET = withRole('SUPER_ADMIN', async (request: NextRequest) => {
  try {
    const plans = await SubscriptionService.getAllPlans();
    return successResponse(plans);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse('Failed to fetch subscription plans', 500);
  }
});
