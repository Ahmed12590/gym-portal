import { db } from '@/lib/db';
import Link from 'next/link';

export default async function GymsPage() {
  const gyms = await db.gym.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { include: { user: true } },
      subscription: { include: { plan: true } },
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Gyms</h1>
        <p className="text-slate-400 mt-2">Manage gyms and subscriptions.</p>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">All gyms</h2>
          <Link href="/dashboard/admin/gyms/new" className="rounded-full bg-blue-500 px-4 py-2 text-sm text-white">Create Gym</Link>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="px-4 py-3">Gym</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gyms.map((gym) => (
                <tr key={gym.id} className="border-t border-slate-700 last:border-b last:border-slate-700">
                  <td className="px-4 py-4 text-slate-100">
                    <div className="font-medium">{gym.name}</div>
                    <div className="text-slate-500 text-sm">{gym.email}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-200">
                    <div>{gym.owner?.user?.name || '—'}</div>
                    <div className="text-slate-500 text-sm">{gym.owner?.user?.email || '—'}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-200">{gym.subscription?.plan?.name || 'No plan'}</td>
                  <td className="px-4 py-4 text-slate-200">{gym.status}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/admin/gyms/${gym.id}`} className="rounded px-3 py-1 bg-slate-700 text-slate-100">View</Link>
                      <Link href={`/dashboard/admin/gyms/edit/${gym.id}`} className="rounded px-3 py-1 bg-slate-700 text-slate-100">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
