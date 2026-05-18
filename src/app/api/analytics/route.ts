import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/biometric.service';
import { errorResponse, successResponse, withMultiTenant, withRole } from '@/utils/api';
import { ApiError } from '@/types';

/**
 * =========================
 * ANALYTICS
 * =========================
 */
const superAdminAnalyticsHandler = withRole(
  'SUPER_ADMIN',
  async () => {
    try {
      const [activeSubscriptions, expiredSubscriptions] = await Promise.all([
        AnalyticsService.getActiveSubscriptions(),
        AnalyticsService.getExpiredSubscriptions(),
      ]);

      return NextResponse.json({
        activeSubscriptions,
        expiredSubscriptions,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { message: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json(
        { message: 'Failed to fetch admin analytics' },
        { status: 500 }
      );
    }
  }
);

export const GET = async (request: NextRequest) => {
  const type = request.nextUrl.searchParams.get('type');

  if (type === 'admin') {
    return superAdminAnalyticsHandler(request);
  }

  return withMultiTenant(
    async (request: NextRequest, gymId: string) => {
      try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');

        if (type === 'dashboard') {
          const metrics = await AnalyticsService.getDashboardMetrics(gymId);
          return successResponse(metrics);
        }

        if (type === 'revenue') {
          const months = parseInt(searchParams.get('months') || '12');
          const data = await AnalyticsService.getRevenueChartData(gymId, months);
          return successResponse(data);
        }

        if (type === 'attendance-trend') {
          const days = parseInt(searchParams.get('days') || '30');
          const data = await AnalyticsService.getAttendanceTrendData(gymId, days);
          return successResponse(data);
        }

        if (type === 'membership-growth') {
          const months = parseInt(searchParams.get('months') || '12');
          const data = await AnalyticsService.getMembershipGrowthData(gymId, months);
          return successResponse(data);
        }

        if (type === 'branch-comparison') {
          const data = await AnalyticsService.getBranchComparison(gymId);
          return successResponse(data);
        }

        if (type === 'total-revenue') {
          const total = await AnalyticsService.getTotalRevenue(gymId);
          return successResponse({ total });
        }

        return errorResponse('Invalid analytics type', 400);
      } catch (error) {
        if (error instanceof ApiError) {
          return errorResponse(error.message, error.status);
        }
        return errorResponse('Failed to fetch analytics', 500);
      }
    }
  )(request);
};