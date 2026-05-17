import { db } from "@/lib/db";
import { ApiError } from "@/types";

export class BiometricService {
  static async addDevice(
    gymId: string,
    name: string,
    brand: string,
    ipAddress: string,
    port: number = 8000,
    model?: string,
    deviceId?: string
  ) {
    // Check if device already exists
    const existing = await db.biometricDevice.findFirst({
      where: {
        gymId,
        ipAddress,
        port,
      },
    });

    if (existing) {
      throw new ApiError(400, "Device with this IP and port already exists");
    }

    return db.biometricDevice.create({
      data: {
        gymId,
        name,
        brand,
        model,
        deviceId,
        ipAddress,
        port,
        enabled: true,
        syncEnabled: false,
      },
    });
  }

  static async getDevicesByGym(gymId: string) {
    return db.biometricDevice.findMany({
      where: { gymId },
      include: {
        biometricMappings: {
          include: {
            member: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getDeviceById(deviceId: string, gymId: string) {
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceId },
      include: {
        biometricMappings: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!device || device.gymId !== gymId) {
      throw new ApiError(404, "Device not found");
    }

    return device;
  }

  static async updateDevice(deviceId: string, gymId: string, data: any) {
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.gymId !== gymId) {
      throw new ApiError(404, "Device not found");
    }

    return db.biometricDevice.update({
      where: { id: deviceId },
      data,
    });
  }

  static async deleteDevice(deviceId: string, gymId: string) {
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.gymId !== gymId) {
      throw new ApiError(404, "Device not found");
    }

    return db.biometricDevice.delete({
      where: { id: deviceId },
    });
  }

  static async mapBiometricId(
    memberId: string,
    deviceId: string,
    gymId: string,
    biometricId: number
  ) {
    // Verify member belongs to gym
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    // Verify device belongs to gym
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.gymId !== gymId) {
      throw new ApiError(404, "Device not found");
    }

    // Check if mapping already exists
    const existing = await db.biometricMapping.findFirst({
      where: {
        memberId,
        deviceId,
      },
    });

    if (existing) {
      return db.biometricMapping.update({
        where: { id: existing.id },
        data: { biometricId, status: "ACTIVE" },
      });
    }

    return db.biometricMapping.create({
      data: {
        memberId,
        deviceId,
        biometricId,
        status: "PENDING",
      },
    });
  }

  static async syncDeviceAttendance(deviceId: string, gymId: string) {
    // This is a placeholder for actual biometric device sync
    // In production, this would connect to the actual device API
    const device = await db.biometricDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.gymId !== gymId) {
      throw new ApiError(404, "Device not found");
    }

    // TODO: Implement actual API call to biometric device
    // For now, just update lastSyncDate
    return db.biometricDevice.update({
      where: { id: deviceId },
      data: { lastSyncDate: new Date() },
    });
  }

  static async testDeviceConnection(ipAddress: string, port: number) {
    // Placeholder for device connection test
    // In production, this would attempt to connect to the device
    try {
      // TODO: Implement actual connection test
      return {
        connected: true,
        message: "Device connection successful",
      };
    } catch (error) {
      return {
        connected: false,
        message: "Device connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export class AnalyticsService {
  static async getDashboardMetrics(gymId: string) {
    const [
      totalMembers,
      activeMembers,
      todayAttendance,
      monthlyRevenue,
      expiredMembers,
    ] = await Promise.all([
      db.member.count({ where: { gymId } }),
      db.member.count({
        where: {
          gymId,
          status: "ACTIVE",
          expiryDate: { gt: new Date() },
        },
      }),
      this.getTodayAttendance(gymId),
      this.getMonthlyRevenue(gymId),
      db.member.count({
        where: {
          gymId,
          expiryDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      todayAttendance,
      monthlyRevenue,
      expiredMembers,
      inactiveMembers: totalMembers - activeMembers,
    };
  }

  static async getTodayAttendance(gymId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db.attendance.count({
      where: {
        gymId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  static async getMonthlyRevenue(gymId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await db.payment.aggregate({
      where: {
        gymId,
        paymentDate: {
          gte: startOfMonth,
          lt: now,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  static async getRevenueChartData(gymId: string, months: number = 12) {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const revenue = await db.payment.aggregate({
        where: {
          gymId,
          paymentDate: {
            gte: date,
            lt: nextMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      data.push({
        month: date.toLocaleString("default", { month: "short" }),
        revenue: revenue._sum.amount || 0,
      });
    }

    return data;
  }

  static async getAttendanceTrendData(gymId: string, days: number = 30) {
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const attendance = await db.attendance.count({
        where: {
          gymId,
          date: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      data.push({
        date: date.toISOString().split("T")[0],
        attendance,
      });
    }

    return data;
  }

  static async getMembershipGrowthData(gymId: string, months: number = 12) {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const members = await db.member.count({
        where: {
          gymId,
          joinDate: {
            lt: nextMonth,
          },
        },
      });

      data.push({
        month: date.toLocaleString("default", { month: "short" }),
        members,
      });
    }

    return data;
  }

  static async getBranchComparison(gymId: string) {
    const branches = await db.branch.findMany({
      where: { gymId },
    });

    const data = await Promise.all(
      branches.map(async (branch) => {
        const [members, todayAttendance, revenue] = await Promise.all([
          db.member.count({
            where: {
              branchId: branch.id,
              status: "ACTIVE",
            },
          }),
          this.getTodayAttendanceByBranch(branch.id),
          this.getMonthlyRevenueByBranch(branch.id),
        ]);

        return {
          name: branch.name,
          members,
          todayAttendance,
          revenue,
        };
      })
    );

    return data;
  }

  private static async getTodayAttendanceByBranch(
    branchId: string
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db.attendance.count({
      where: {
        branchId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  private static async getMonthlyRevenueByBranch(
    branchId: string
  ): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await db.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lt: now,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  static async getTotalRevenue(gymId: string): Promise<number> {
    const result = await db.payment.aggregate({
      where: { gymId },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  static async getExpiredSubscriptions() {
    return db.subscriptionInstance.findMany({
      where: {
        status: "EXPIRED",
      },
      include: {
        gym: true,
        plan: true,
      },
    });
  }

  static async getActiveSubscriptions() {
    return db.subscriptionInstance.count({
      where: {
        status: "ACTIVE",
      },
    });
  }
}

export class NotificationService {
  static async createNotification(
    gymId: string,
    type: string,
    recipient: string,
    subject: string,
    message: string
  ) {
    return db.notification.create({
      data: {
        gymId,
        type: type as any,
        recipient,
        subject,
        message,
        status: "PENDING",
      },
    });
  }

  static async getPendingNotifications(gymId?: string) {
    const where: any = { status: "PENDING" };
    if (gymId) {
      where.gymId = gymId;
    }

    return db.notification.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  static async markAsSent(notificationId: string) {
    return db.notification.update({
      where: { id: notificationId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }

  static async markAsDelivered(notificationId: string) {
    return db.notification.update({
      where: { id: notificationId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });
  }

  static async markAsFailed(notificationId: string, reason: string) {
    return db.notification.update({
      where: { id: notificationId },
      data: {
        status: "FAILED",
        failureReason: reason,
      },
    });
  }
}
