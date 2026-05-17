import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/services/member.service';
import {
  errorResponse,
  successResponse,
  withMultiTenant,
  getPaginationParams,
} from '@/utils/api';
import { ApiError } from '@/types';

export const POST = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const body = await request.json();

      if (!body.memberId || !body.amount) {
        return errorResponse('Missing required fields', 400);
      }

      const payment = await PaymentService.recordPayment(
        gymId,
        body.memberId,
        parseFloat(body.amount),
        body.paymentMethod || 'CASH',
        body.feeId,
        body.transactionId,
        body.notes
      );

      return successResponse(payment, 201);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to record payment', 500);
    }
  }
);

export const GET = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const { page, pageSize, skip } = getPaginationParams(request);
      const searchParams = request.nextUrl.searchParams;
      const memberId = searchParams.get('memberId');

      if (!memberId) {
        return errorResponse('Member ID is required', 400);
      }

      const { payments, total } =
        await PaymentService.getPaymentsByMember(
          memberId,
          gymId,
          skip,
          pageSize
        );

      return successResponse({
        payments,
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
      return errorResponse('Failed to fetch payments', 500);
    }
  }
);
