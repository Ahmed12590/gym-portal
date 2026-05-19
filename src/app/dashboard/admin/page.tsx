import { db } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const plans = await db.subscriptionPlan.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      monthlyPrice: true,
    },
  });

  const owners = await db.gymOwner.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          View all gyms, track subscription status, and create new gyms in one place.
        </p>
      </div>
      <AdminDashboardClient plans={plans} owners={owners} />
    </div>
  );
}
