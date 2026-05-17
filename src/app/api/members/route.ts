import { NextRequest } from 'next/server';
import { MemberService } from '@/lib/services/member.service';
import {
  errorResponse,
  successResponse,
  withMultiTenant,
  getPaginationParams,
} from '@/utils/api';
import { ApiError, CreateMemberRequest } from '@/types';
import { MemberStatus } from '@prisma/client';

export const POST = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const body: CreateMemberRequest = await request.json();

      if (!body.firstName || !body.lastName || !body.phone) {
        return errorResponse('Missing required fields', 400);
      }

      const member = await MemberService.createMember(
        gymId,
        body.firstName,
        body.lastName,
        body.phone,
        new Date(body.joinDate),
        new Date(body.expiryDate),
        body.branchId,
        body.email,
        body.cnic,
        body.address,
        body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        body.emergencyContact,
        body.emergencyContactPhone,
        body.membershipPlan,
        undefined // notes
      );

      return successResponse(member, 201);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.message, error.status);
      }
      return errorResponse('Failed to create member', 500);
    }
  }
);

export const GET = withMultiTenant(
  async (request: NextRequest, gymId: string) => {
    try {
      const { page, pageSize, skip } = getPaginationParams(request);
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get('status') as MemberStatus | null;
      const branchId = searchParams.get('branchId');

      const { members, total } = await MemberService.getMembersByGym(
        gymId,
        branchId || undefined,
        status || undefined,
        skip,
        pageSize
      );

      return successResponse({
        members,
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
      return errorResponse('Failed to fetch members', 500);
    }
  }
);
