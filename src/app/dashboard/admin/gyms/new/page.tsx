import { db } from '@/lib/db';
import AdminDashboardClient from '../../AdminDashboardClient';

export default async function NewGymPage() {
  const plans = await db.subscriptionPlan.findMany({ orderBy: { name: 'asc' } });
  const owners = await db.gymOwner.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Create Gym</h1>
      </div>

      {/* Reuse the client creation UI from AdminDashboardClient */}
      <AdminDashboardClient plans={plans.map(p=>({id:p.id,name:p.name,monthlyPrice:p.monthlyPrice}))} owners={owners.map(o=>({id:o.id,user:o.user}))} />
    </div>
  );
}
