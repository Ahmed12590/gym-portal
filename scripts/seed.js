import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('?? Starting database seed...');

  console.log('?? Clearing existing data...');
  await prisma.attendance.deleteMany();
  await prisma.biometricMapping.deleteMany();
  await prisma.biometricDevice.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.member.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.subscriptionInstance.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.superAdmin.deleteMany();
  await prisma.gymOwner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.report.deleteMany();

  console.log('? Database cleared');

  console.log('?? Creating subscription plan...');
  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium',
      description: 'Premium plan with advanced reporting and multi-branch support',
      monthlyPrice: 299,
    },
  });

  console.log('? Subscription plan created');

  console.log('?? Creating super admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@gym-portal.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.superAdmin.create({
    data: {
      userId: adminUser.id,
    },
  });

  console.log('? Super admin created: admin@gym-portal.com / admin123');

  console.log('?? Creating gym owner user...');
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@gym-portal.com',
      password: ownerPassword,
      name: 'Gym Owner',
      role: 'GYM_OWNER',
      status: 'ACTIVE',
      phone: '+92-300-1234567',
    },
  });

  const gymOwner = await prisma.gymOwner.create({
    data: {
      userId: ownerUser.id,
    },
  });

  console.log('? Gym owner created: owner@gym-portal.com / owner123');

  console.log('?? Creating gym...');
  const gym = await prisma.gym.create({
    data: {
      name: 'Elite Fitness Center',
      email: 'info@elitefitness.com',
      phone: '+92-21-1234567',
      address: '123 Main Street',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75000',
      country: 'Pakistan',
      description: 'Premium fitness center with state-of-the-art equipment',
      website: 'https://www.elitefitness.com',
      status: 'ACTIVE',
      gymOwnerId: gymOwner.id,
    },
  });

  const subscriptionStart = new Date();
  const subscriptionEnd = new Date(subscriptionStart);
  subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

  await prisma.subscriptionInstance.create({
    data: {
      planId: premiumPlan.id,
      gymId: gym.id,
      startDate: subscriptionStart,
      endDate: subscriptionEnd,
      status: 'ACTIVE',
    },
  });

  console.log('? Gym and premium subscription created');

  console.log('?? Creating members...');
  const joinDate = new Date();
  const expiryDate = new Date(joinDate);
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  await prisma.member.createMany({
    data: [
      {
        gymId: gym.id,
        firstName: 'Hassan',
        lastName: 'Khan',
        email: 'hassan@example.com',
        phone: '+92-300-5550001',
        joinDate,
        expiryDate,
        status: 'ACTIVE',
      },
      {
        gymId: gym.id,
        firstName: 'Zainab',
        lastName: 'Ahmed',
        email: 'zainab@example.com',
        phone: '+92-300-5550002',
        joinDate,
        expiryDate,
        status: 'ACTIVE',
      },
    ],
  });

  console.log('? 2 members created');

  console.log('');
  console.log('? Database seeded successfully!');
  console.log('');
  console.log('Test Accounts:');
  console.log('Super Admin: admin@gym-portal.com / admin123');
  console.log('Gym Owner:   owner@gym-portal.com / owner123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
