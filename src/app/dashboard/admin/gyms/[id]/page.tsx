import { GymService } from '@/lib/services/auth.service';
import { MemberService } from '@/lib/services/member.service';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GymDetailPage({ params }: Props) {
  const { id } = await params;

  const gym = await GymService.getGymById(id);

  if (!gym) {
    return <div className="p-6">Gym not found</div>;
  }

  const members = await MemberService.getMembersByGym(
    id,
    undefined,
    undefined,
    0,
    1
  );

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white">{gym.name}</h1>
        <p className="text-slate-400 mt-2">
          {gym.description || 'No description'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Details</h3>
          <div className="mt-4 text-slate-200 space-y-2">
            <div>
              <strong>Address:</strong> {gym.address}, {gym.city},{' '}
              {gym.state} {gym.zipCode}, {gym.country}
            </div>
            <div><strong>Phone:</strong> {gym.phone}</div>
            <div><strong>Email:</strong> {gym.email}</div>
            <div><strong>Website:</strong> {gym.website || '—'}</div>
            <div><strong>Status:</strong> {gym.status}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Owner</h3>
          <div className="mt-4 text-slate-200">
            <div className="font-medium">
              {gym.owner?.user?.name || '—'}
            </div>
            <div className="text-slate-500">
              {gym.owner?.user?.email || '—'}
            </div>

            {gym.owner?.id && (
              <Link
                href={`/dashboard/admin/owners/${gym.owner.id}`}
                className="mt-4 inline-block rounded bg-slate-700 px-3 py-1 text-sm text-white"
              >
                View Owner
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Subscription</h3>
          <div className="mt-4 text-slate-200">
            <div>
              <strong>Plan:</strong> {gym.subscription?.plan?.name || 'No plan'}
            </div>
            <div>
              <strong>Status:</strong> {gym.subscription?.status || '—'}
            </div>
            <div>
              <strong>Ends:</strong>{' '}
              {gym.subscription?.endDate
                ? new Date(gym.subscription.endDate).toLocaleDateString()
                : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Members</h3>
          <Link
            href={`/dashboard/admin/gyms/edit/${gym.id}`}
            className="rounded px-3 py-1 bg-slate-700 text-slate-100"
          >
            Edit Gym
          </Link>
        </div>

        <div className="mt-3 text-slate-200">
          Total members: {members.total}
        </div>
      </div>
    </div>
  );
}