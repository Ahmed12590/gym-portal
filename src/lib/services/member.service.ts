import { db } from "@/lib/db";
import { ApiError } from "@/types";
import { MemberStatus } from "@prisma/client";

export class MemberService {
  static async createMember(
    gymId: string,
    firstName: string,
    lastName: string,
    phone: string,
    joinDate: Date,
    expiryDate: Date,
    branchId?: string,
    email?: string,
    cnic?: string,
    address?: string,
    dateOfBirth?: Date,
    emergencyContact?: string,
    emergencyContactPhone?: string,
    membershipPlan?: string,
    notes?: string
  ) {
    // Check if member with same email already exists in gym
    if (email) {
      const existing = await db.member.findFirst({
        where: {
          gymId,
          email,
        },
      });

      if (existing) {
        throw new ApiError(400, "Member with this email already exists in gym");
      }
    }

    return db.member.create({
      data: {
        gymId,
        firstName,
        lastName,
        email,
        phone,
        cnic,
        address,
        dateOfBirth,
        emergencyContact,
        emergencyContactPhone,
        membershipPlan,
        joinDate,
        expiryDate,
        status: MemberStatus.ACTIVE,
        notes,
        branchId,
      },
    });
  }

  static async getMemberById(memberId: string, gymId: string) {
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        attendance: {
          orderBy: { date: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
      },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    return member;
  }

  static async getMembersByGym(
    gymId: string,
    branchId?: string,
    status?: MemberStatus,
    skip: number = 0,
    take: number = 10
  ) {
    const where: any = { gymId };

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    const [members, total] = await Promise.all([
      db.member.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.member.count({ where }),
    ]);

    return { members, total };
  }

  static async updateMember(memberId: string, gymId: string, data: any) {
    // Verify member belongs to gym
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    // If email is being updated, check for duplicates
    if (data.email && data.email !== member.email) {
      const existing = await db.member.findFirst({
        where: {
          gymId,
          email: data.email,
          id: { not: memberId },
        },
      });

      if (existing) {
        throw new ApiError(400, "Email already in use");
      }
    }

    return db.member.update({
      where: { id: memberId },
      data,
    });
  }

  static async updateMemberStatus(
    memberId: string,
    gymId: string,
    status: MemberStatus
  ) {
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    return db.member.update({
      where: { id: memberId },
      data: { status },
    });
  }

  static async deleteMember(memberId: string, gymId: string) {
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    return db.member.delete({
      where: { id: memberId },
    });
  }

  static async checkMembershipExpiry(memberId: string): Promise<boolean> {
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return false;
    }

    return new Date(member.expiryDate) < new Date();
  }

  static async getExpiredMembers(gymId: string) {
    const today = new Date();

    return db.member.findMany({
      where: {
        gymId,
        expiryDate: {
          lt: today,
        },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  static async getExpiringMembers(gymId: string, daysUntilExpiry: number = 7) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

    return db.member.findMany({
      where: {
        gymId,
        expiryDate: {
          gte: today,
          lte: futureDate,
        },
        status: MemberStatus.ACTIVE,
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  static async searchMembers(
    gymId: string,
    searchTerm: string,
    take: number = 20
  ) {
    return db.member.findMany({
      where: {
        gymId,
        OR: [
          { firstName: { contains: searchTerm, mode: "insensitive" } },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
          { cnic: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take,
    });
  }
}

export class AttendanceService {
  static async recordAttendance(
    memberId: string,
    gymId: string,
    checkInTime: Date,
    checkOutTime?: Date,
    source: "MANUAL" | "BIOMETRIC" = "MANUAL"
  ) {
    // Verify member exists in gym
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await db.attendance.findFirst({
      where: {
        memberId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingAttendance && !checkOutTime) {
      throw new ApiError(400, "Member already checked in today");
    }

    // Create attendance record
    return db.attendance.create({
      data: {
        memberId,
        gymId,
        checkInTime,
        checkOutTime,
        date: today,
        status: "PRESENT",
        source,
      },
    });
  }

  static async getAttendanceByMember(
    memberId: string,
    gymId: string,
    startDate?: Date,
    endDate?: Date,
    skip: number = 0,
    take: number = 30
  ) {
    const where: any = { memberId, gymId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [attendance, total] = await Promise.all([
      db.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { date: "desc" },
      }),
      db.attendance.count({ where }),
    ]);

    return { attendance, total };
  }

  static async getDailyAttendance(gymId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      gymId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return db.attendance.findMany({
      where,
      include: {
        member: true,
      },
      orderBy: { checkInTime: "desc" },
    });
  }

  static async getMonthlyAttendance(gymId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return db.attendance.findMany({
      where: {
        gymId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });
  }

  static async getAttendanceStats(gymId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const attendance = await db.attendance.findMany({
      where: {
        gymId,
        date: {
          gte: startDate,
        },
      },
      include: {
        member: true,
      },
    });

    const totalAttendance = attendance.length;
    const uniqueMembers = new Set(attendance.map((a) => a.memberId)).size;
    const averageDaily = Math.round(totalAttendance / days);

    return {
      totalAttendance,
      uniqueMembers,
      averageDaily,
      days,
      startDate,
    };
  }
}

export class PaymentService {
  static async recordPayment(
    gymId: string,
    memberId: string,
    amount: number,
    paymentMethod: string,
    feeId?: string,
    transactionId?: string,
    notes?: string
  ) {
    // Verify member exists
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.gymId !== gymId) {
      throw new ApiError(404, "Member not found");
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        gymId,
        memberId,
        feeId,
        amount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod as any,
        transactionId,
        status: "COMPLETED",
        notes,
      },
    });

    // Update fee status if feeId provided
    if (feeId) {
      const fee = await db.fee.findUnique({
        where: { id: feeId },
      });

      if (fee) {
        const totalPaid = await db.payment
          .aggregate({
            where: { feeId },
            _sum: { amount: true },
          })
          .then((r) => r._sum.amount || 0);

        let newStatus = "PAID";
        if (totalPaid < fee.amount) {
          newStatus = "PARTIALLY_PAID";
        } else if (totalPaid > fee.amount) {
          newStatus = "PAID";
        }

        await db.fee.update({
          where: { id: feeId },
          data: { status: newStatus as any },
        });
      }
    }

    return payment;
  }

  static async getPaymentsByMember(
    memberId: string,
    gymId: string,
    skip: number = 0,
    take: number = 20
  ) {
    const where = { memberId, gymId };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: "desc" },
      }),
      db.payment.count({ where }),
    ]);

    return { payments, total };
  }
}
