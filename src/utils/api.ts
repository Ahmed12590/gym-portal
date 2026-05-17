import { NextRequest, NextResponse } from "next/server";
import { ApiError, ApiResponse } from "@/types";

export function getGymId(request: NextRequest): string {
  const gymId = request.headers.get("x-gym-id");
  if (!gymId) {
    throw new ApiError(400, "Gym ID not found in request");
  }
  return gymId;
}

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }
  return userId;
}

export function getUserRole(request: NextRequest): string {
  const role = request.headers.get("x-user-role");
  if (!role) {
    throw new ApiError(401, "User role not found in request");
  }
  return role;
}

export function isSuperAdmin(request: NextRequest): boolean {
  return getUserRole(request) === "SUPER_ADMIN";
}

export function isGymOwner(request: NextRequest): boolean {
  return getUserRole(request) === "GYM_OWNER";
}

export function isStaffMember(request: NextRequest): boolean {
  return getUserRole(request) === "STAFF_MEMBER";
}

// API Response helpers
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}

export function errorResponse(
  error: string | Error,
  statusCode: number = 400
): NextResponse<ApiResponse<null>> {
  const message = error instanceof Error ? error.message : error;
  return NextResponse.json(
    { success: false, error: message },
    { status: statusCode }
  );
}

export function notFoundResponse(): NextResponse<ApiResponse<null>> {
  return errorResponse("Resource not found", 404);
}

export function unauthorizedResponse(): NextResponse<ApiResponse<null>> {
  return errorResponse("Unauthorized", 401);
}

export function forbiddenResponse(): NextResponse<ApiResponse<null>> {
  return errorResponse("Forbidden", 403);
}

// Request body parsing
export async function parseRequestBody<T>(
  request: NextRequest
): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new ApiError(400, "Invalid request body");
  }
}

// Request handler wrapper with error handling
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("[API Error]", error);

      if (error instanceof ApiError) {
        return errorResponse(error.message, error.status);
      }

      if (error instanceof Error) {
        return errorResponse(error.message, 500);
      }

      return errorResponse("Internal server error", 500);
    }
  };
}

// Authorization wrapper
export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest) => {
    const userId = getUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }
    return handler(req);
  });
}

// Role-based authorization
export function withRole(
  role: string | string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest) => {
    const userRole = getUserRole(req);
    const allowedRoles = Array.isArray(role) ? role : [role];

    if (!allowedRoles.includes(userRole)) {
      return forbiddenResponse();
    }

    return handler(req);
  });
}

// Gym owner authorization
export function withGymOwnerAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRole("GYM_OWNER", handler);
}

// Super admin authorization
export function withSuperAdminAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRole("SUPER_ADMIN", handler);
}

// Multi-tenancy check
export function withMultiTenant(
  handler: (req: NextRequest, gymId: string) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest) => {
    const gymId = getGymId(req);
    return handler(req, gymId);
  });
}

// Pagination helper
export function getPaginationParams(request: NextRequest): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "10"))
  );
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

// Query builder for filtering
export function buildWhereClause(
  filters: Record<string, any>
): Record<string, any> {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      where[key] = value;
    }
  });

  return where;
}

// Method check
export function requireMethod(
  request: NextRequest,
  method: string | string[]
): boolean {
  const allowedMethods = Array.isArray(method) ? method : [method];
  return allowedMethods.includes(request.method);
}

export function onlyMethod(
  method: string | string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest) => {
    if (!requireMethod(req, method)) {
      return errorResponse("Method not allowed", 405);
    }
    return handler(req);
  });
}
