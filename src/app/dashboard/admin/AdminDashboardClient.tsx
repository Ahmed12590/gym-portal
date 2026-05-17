'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ApiResponse } from '@/types';

type PlanOption = {
  id: string;
  name: string;
  monthlyPrice: number;
};

type OwnerOption = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type GymRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: string;
  owner?: {
    user?: {
      name?: string | null;
      email?: string;
    };
  };
  subscription?: {
    status: string;
    endDate: string;
    plan?: {
      name: string;
    };
  };
};

type Props = {
  plans: PlanOption[];
  owners: OwnerOption[];
};

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  description: '',
  website: '',
  gymOwnerId: '',
  subscriptionPlanId: '',
};

export default function AdminDashboardClient({ plans, owners }: Props) {
  const [gyms, setGyms] = useState<GymRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<typeof initialFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (owners.length && plans.length) {
      setForm((current) => ({
        ...current,
        gymOwnerId: current.gymOwnerId || owners[0]?.id || '',
        subscriptionPlanId: current.subscriptionPlanId || plans[0]?.id || '',
      }));
    }
  }, [owners, plans]);

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gyms?page=1&pageSize=100');
      const json = (await response.json()) as ApiResponse<{
        gyms: GymRow[];
        pagination: { total: number };
      }>;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unable to load gyms');
      }

      setGyms(json.data?.gyms || []);
    } catch (err) {
      setError((err as Error).message || 'Unable to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateGym = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/gyms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const json = (await response.json()) as ApiResponse<GymRow>;

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to create gym');
      }

      setSuccess('Gym created successfully.');
      setForm((current) => ({
        ...initialFormState,
        gymOwnerId: current.gymOwnerId || owners[0]?.id || '',
        subscriptionPlanId: current.subscriptionPlanId || plans[0]?.id || '',
      }));
      fetchGyms();
    } catch (err) {
      setError((err as Error).message || 'Failed to create gym');
    } finally {
      setSubmitting(false);
    }
  };

  const gymCount = gyms.length;

  const availablePlans = useMemo(() => plans, [plans]);
  const availableOwners = useMemo(() => owners, [owners]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Gyms</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{gymCount} gyms</h2>
            </div>
            <div className="rounded-2xl bg-slate-800 px-4 py-3 text-slate-200">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Source</p>
              <p className="font-medium">Prisma Database</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/10">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Create new gym</p>
          <p className="mt-3 text-slate-400">
            Add a gym with a subscription and gym owner assignment.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">All gyms</h3>
              <p className="mt-1 text-slate-400">Review every gym and subscription status.</p>
            </div>
            <button
              type="button"
              onClick={fetchGyms}
              className="rounded-full bg-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-600"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-700">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Loading gyms...
                    </td>
                  </tr>
                ) : gyms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No gyms available.
                    </td>
                  </tr>
                ) : (
                  gyms.map((gym) => {
                    const planName = gym.subscription?.plan?.name || 'No plan';
                    const subscriptionStatus = gym.subscription?.status || 'No subscription';
                    const expiry = gym.subscription?.endDate
                      ? new Date(gym.subscription.endDate).toLocaleDateString()
                      : 'N/A';

                    return (
                      <tr key={gym.id} className="border-t border-slate-700 last:border-b last:border-slate-700">
                        <td className="px-4 py-4 text-slate-100">
                          <div className="font-medium">{gym.name}</div>
                          <div className="text-slate-500 text-sm">{gym.email}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-200">
                          <div>{gym.owner?.user?.name || 'Unknown'}</div>
                          <div className="text-slate-500 text-sm">{gym.owner?.user?.email || '-'}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-200">{planName}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-200">{expiry}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {error ? (
            <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-white">Create new gym</h3>
          <p className="mt-2 text-slate-400">Fill in the details and submit to add a gym to the platform.</p>

          <form onSubmit={handleCreateGym} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Name" name="name" value={form.name} onChange={handleChange} />
              <InputField label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
              <InputField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              <InputField label="City" name="city" value={form.city} onChange={handleChange} />
              <InputField label="State" name="state" value={form.state} onChange={handleChange} />
              <InputField label="Zip Code" name="zipCode" value={form.zipCode} onChange={handleChange} />
              <InputField label="Country" name="country" value={form.country} onChange={handleChange} />
              <InputField label="Website" name="website" value={form.website} onChange={handleChange} />
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Gym Owner"
                  name="gymOwnerId"
                  value={form.gymOwnerId}
                  onChange={handleChange}
                  options={availableOwners.map((owner) => ({
                    value: owner.id,
                    label: `${owner.user.name || owner.user.email}`,
                  }))}
                />
                <SelectField
                  label="Subscription Plan"
                  name="subscriptionPlanId"
                  value={form.subscriptionPlanId}
                  onChange={handleChange}
                  options={availablePlans.map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} — $${plan.monthlyPrice.toFixed(2)}/mo`,
                  }))}
                />
              </div>
            </div>

            {success ? (
              <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !form.gymOwnerId || !form.subscriptionPlanId}
              className="w-full rounded-3xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {submitting ? 'Creating gym...' : 'Create gym'}
            </button>
          </form>

          {(!availableOwners.length || !availablePlans.length) && (
            <div className="mt-4 rounded-2xl bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              Add a gym owner and subscription plan first before creating a gym.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
