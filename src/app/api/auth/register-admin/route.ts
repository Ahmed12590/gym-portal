import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthService } from "@/lib/services/auth.service";
import { errorResponse, successResponse } from "@/utils/api";
import { ApiError } from "@/types";

/**
 * Super Admin Registration Endpoint
 * Protected by SUPER_ADMIN_KEY environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin key
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.SUPER_ADMIN_KEY) {
      return errorResponse("Invalid admin key", 401);
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return errorResponse("Missing required fields", 400);
    }

    // Check if super admin already exists
    const existingAdmins = await db.superAdmin.count();
    if (existingAdmins > 0) {
      return errorResponse("Super admin already exists", 400);
    }

    const user = await AuthService.registerUser(
      email,
      password,
      name,
      "SUPER_ADMIN"
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
    console.error("Super admin registration error:", error);
    return errorResponse("Registration failed", 500);
  }
}
