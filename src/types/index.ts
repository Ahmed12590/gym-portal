import { UserRole, UserStatus, GymStatus, MemberStatus } from "@prisma/client";

// User Types
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  primaryGymId?: string;
  gymId?: string;
}

export interface SessionUser extends AuthUser {
  primaryGymId?: string;
  gymId?: string;
}

// Gym Types
export interface GymData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logo?: string;
  banner?: string;
  description?: string;
  website?: string;
  status: GymStatus;
  subscriptionId?: string;
  gymOwnerId: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

// Member Types
export interface MemberData {
  id: string;
  gymId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  cnic?: string;
  address?: string;
  profileImage?: string;
  dateOfBirth?: Date;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  membershipPlan?: string;
  joinDate: Date;
  expiryDate: Date;
  status: MemberStatus;
  notes?: string;
}

// Subscription Types
export interface SubscriptionPlanData {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  maxMembers: number;
  maxBranches: number;
  biometricEnabled: boolean;
  multiBranchEnabled: boolean;
  advancedReportsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
}

// Error Types
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Request/Response Helper Types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateGymRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
  website?: string;
  gymOwnerId: string;
  subscriptionPlanId: string;
}

export interface UpdateGymRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
  website?: string;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  cnic?: string;
  address?: string;
  profileImage?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  membershipPlan?: string;
  joinDate: string;
  expiryDate: string;
  branchId?: string;
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  profileImage?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  membershipPlan?: string;
  joinDate?: string;
  expiryDate?: string;
  status?: MemberStatus;
  notes?: string;
}

// Query Filter Types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface MemberFilterParams extends PaginationParams {
  status?: MemberStatus;
  branchId?: string;
  searchTerm?: string;
}

export interface AttendanceFilterParams extends PaginationParams {
  memberId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}
