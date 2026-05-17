import { NextRequest } from 'next/server';
import { MemberService } from '@/lib/services/member.service';
import {
  errorResponse,
  successResponse,
  withMultiTenant,
  notFoundResponse,
} from '@/utils/api';
import { ApiError, UpdateMemberRequest } from '@/types';

export const GET = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const memberId = request.nextUrl.pathname.split('/').pop();

      if (!memberId) {
        return errorResponse('Member ID is required', 400);
      }

      const member = await MemberService.getMemberById(memberId, gymId);

      return successResponse(member);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return notFoundResponse();
        }
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to fetch member', 500);
    }
  }
);

export const PUT = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const memberId = request.nextUrl.pathname.split('/').pop();

      if (!memberId) {
        return errorResponse('Member ID is required', 400);
      }

      const body: UpdateMemberRequest = await request.json();

      const updated = await MemberService.updateMember(memberId, gymId, body);

      return successResponse(updated);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return notFoundResponse();
        }
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to update member', 500);
    }
  }
);

export const DELETE = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const memberId = request.nextUrl.pathname.split('/').pop();

      if (!memberId) {
        return errorResponse('Member ID is required', 400);
      }

      await MemberService.deleteMember(memberId, gymId);

      return successResponse({ success: true }, 200);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return notFoundResponse();
        }
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to delete member', 500);
    }
  }
);
