import { db } from '@/lib/db';
import Link from 'next/link';

type Props = { params: { id: string } };

export default async function OwnerDetailPage({ params }: Props) {
  const owner = await db.gymOwner.findUnique({
    where: { id: params.id },
    include: { user: true, gyms: { include: { subscription: { include: { plan: true } } } } },
  });

  if (!owner) return <div className="p-6">Owner not found</div>;

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white">{owner.user.name || owner.user.email}</h1>
        <p className="text-slate-400 mt-2">Owner account details and assigned gyms.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Account</h3>
          <div className="mt-4 text-slate-200">
            <div><strong>Email:</strong> {owner.user.email}</div>
            <div><strong>Status:</strong> {owner.user.status}</div>
          </div>
          <div className="mt-4">
            <button className="rounded bg-slate-700 px-3 py-1 text-white">Reset Password</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Assigned Gyms</h3>
          <div className="mt-4 space-y-3 text-slate-200">
            {owner.gyms.length === 0 && <div>No gyms assigned</div>}
            {owner.gyms.map((g:any) => (
              <div key={g.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-slate-500 text-sm">{g.email}</div>
                </div>
                <Link href={`/dashboard/admin/gyms/${g.id}`} className="rounded bg-slate-700 px-3 py-1 text-sm text-white">View</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
