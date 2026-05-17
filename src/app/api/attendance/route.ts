import { NextRequest } from 'next/server';
import { AttendanceService } from '@/lib/services/member.service';
import {
  errorResponse,
  successResponse,
  withMultiTenant,
  getPaginationParams,
} from '@/utils/api';
import { ApiError, AttendanceFilterParams } from '@/types';

export const POST = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const body = await request.json();

      if (!body.memberId || !body.checkInTime) {
        return errorResponse('Missing required fields', 400);
      }

      const attendance = await AttendanceService.recordAttendance(
        body.memberId,
        gymId,
        new Date(body.checkInTime),
        body.checkOutTime ? new Date(body.checkOutTime) : undefined,
        body.source || 'MANUAL'
      );

      return successResponse(attendance, 201);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to record attendance', 500);
    }
  }
);

export const GET = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const { page, pageSize, skip } = getPaginationParams(request);
      const searchParams = request.nextUrl.searchParams;
      const memberId = searchParams.get('memberId');
      const type = searchParams.get('type'); // 'daily', 'monthly', 'member', 'stats'

      if (type === 'daily') {
        const branchId = searchParams.get('branchId');
        const daily = await AttendanceService.getDailyAttendance(
          gymId,
          branchId || undefined
        );
        return successResponse(daily);
      }

      if (type === 'monthly') {
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const monthly = await AttendanceService.getMonthlyAttendance(
          gymId,
          year,
          month
        );
        return successResponse(monthly);
      }

      if (type === 'stats') {
        const days = parseInt(searchParams.get('days') || '30');
        const stats = await AttendanceService.getAttendanceStats(gymId, days);
        return successResponse(stats);
      }

      if (memberId) {
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const { attendance, total } =
          await AttendanceService.getAttendanceByMember(
            memberId,
            gymId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            skip,
            pageSize
          );

        return successResponse({
          attendance,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }

      return errorResponse('Invalid query parameters', 400);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to fetch attendance records', 500);
    }
  }
);
