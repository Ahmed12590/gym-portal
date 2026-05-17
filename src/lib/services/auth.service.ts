import { db } from "@/lib/db";
import { hashPassword, comparePassword } from "@/utils/helpers";
import { UserRole, UserStatus } from "@prisma/client";
import { ApiError } from "@/types";

export class AuthService {
  static async registerUser(
    email: string,
    password: string,
    name: string,
    role: UserRole = "GYM_OWNER"
  ) {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: UserStatus.ACTIVE,
      },
    });

    // Create role-specific account
    if (role === "GYM_OWNER") {
      await db.gymOwner.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role === "SUPER_ADMIN") {
      await db.superAdmin.create({
        data: {
          userId: user.id,
        },
      });
    }

    return user;
  }

  static async loginUser(email: string, password: string) {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, "User account is not active");
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    return user;
  }

  static async getUserById(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
    });
  }

  static async updateUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    return db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async deactivateUser(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });
  }
}

export class GymService {
  static async createGym(
    name: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    zipCode: string,
    country: string,
    gymOwnerId: string,
    subscriptionPlanId: string,
    description?: string,
    website?: string
  ) {
    // Check if gym email already exists
    const existingGym = await db.gym.findUnique({
      where: { email },
    });

    if (existingGym) {
      throw new ApiError(400, "Gym with this email already exists");
    }

    // Get subscription plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!plan) {
      throw new ApiError(400, "Subscription plan not found");
    }

    // Create gym with a linked subscription instance
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const gym = await db.gym.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        description,
        website,
        status: "ACTIVE",
        gymOwnerId,
        subscription: {
          create: {
            planId: subscriptionPlanId,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        },
      },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    // Create feature flags based on plan
    await db.featureFlag.create({
      data: {
        gymId: gym.id,
        biometric: plan.biometricEnabled,
        multiBranch: plan.multiBranchEnabled,
        advancedReports: plan.advancedReportsEnabled,
        smsNotifications: plan.smsNotificationsEnabled,
        whatsappNotifications: plan.whatsappNotificationsEnabled,
      },
    });

    return gym;
  }

  static async getGymById(gymId: string) {
    return db.gym.findUnique({
      where: { id: gymId },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        branches: true,
      },
    });
  }

  static async getAllGyms(skip: number = 0, take: number = 10) {
    const [gyms, total] = await Promise.all([
      db.gym.findMany({
        skip,
        take,
        include: {
          owner: {
            include: {
              user: true,
            },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.gym.count(),
    ]);

    return { gyms, total };
  }

  static async getGymsByOwnerId(ownerId: string) {
    return db.gym.findMany({
      where: {
        gymOwnerId: ownerId,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        branches: true,
      },
    });
  }

  static async updateGym(
    gymId: string,
    data: {
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
      status?: string;
    }
  ) {
    return db.gym.update({
      where: { id: gymId },
      data,
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  static async deleteGym(gymId: string) {
    // Soft delete - set status to inactive
    return db.gym.update({
      where: { id: gymId },
      data: { status: "INACTIVE" },
    });
  }

  static async suspendGym(gymId: string) {
    return db.gym.update({
      where: { id: gymId },
      data: { status: "SUSPENDED" },
    });
  }

  static async blockGym(gymId: string, hard: boolean = false) {
    const status = hard ? "HARD_BLOCKED" : "SOFT_BLOCKED";
    return db.gym.update({
      where: { id: gymId },
      data: { status },
    });
  }
}

export class SubscriptionService {
  static async createPlan(
    name: string,
    monthlyPrice: number,
    maxMembers: number,
    maxBranches: number,
    features: {
      biometric: boolean;
      multiBranch: boolean;
      advancedReports: boolean;
      smsNotifications: boolean;
      whatsappNotifications: boolean;
    }
  ) {
    return db.subscriptionPlan.create({
      data: {
        name,
        monthlyPrice,
        maxMembers,
        maxBranches,
        biometricEnabled: features.biometric,
        multiBranchEnabled: features.multiBranch,
        advancedReportsEnabled: features.advancedReports,
        smsNotificationsEnabled: features.smsNotifications,
        whatsappNotificationsEnabled: features.whatsappNotifications,
      },
    });
  }

  static async getPlanById(planId: string) {
    return db.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  }

  static async getAllPlans() {
    return db.subscriptionPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { monthlyPrice: "asc" },
    });
  }

  static async renewSubscription(subscriptionId: string) {
    const subscription = await db.subscriptionInstance.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    return db.subscriptionInstance.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        endDate: newEndDate,
      },
    });
  }

  static async expireSubscription(subscriptionId: string) {
    return db.subscriptionInstance.update({
      where: { id: subscriptionId },
      data: { status: "EXPIRED" },
    });
  }

  static async cancelSubscription(subscriptionId: string) {
    return db.subscriptionInstance.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });
  }
}
