"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditGymPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/gyms/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.success) setForm(j.data);
        else setError(j?.error || 'Failed to load');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!form) return <div className="p-6 text-red-400">{error || 'Not found'}</div>;

  const handleChange = (e: any) => setForm((s: any) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/gyms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update');
      router.push('/dashboard/admin/gyms');
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Edit Gym</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm text-slate-200">Name</label>
          <input name="name" value={form.name || ''} onChange={handleChange} className="w-full rounded border bg-slate-950 px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-slate-200">Email</label>
          <input name="email" value={form.email || ''} onChange={handleChange} className="w-full rounded border bg-slate-950 px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-slate-200">Phone</label>
          <input name="phone" value={form.phone || ''} onChange={handleChange} className="w-full rounded border bg-slate-950 px-3 py-2 text-white" />
        </div>
        <div className="flex gap-2">
          <button disabled={submitting} className="rounded bg-blue-500 px-4 py-2 text-white">{submitting? 'Saving...':'Save'}</button>
          <button type="button" onClick={()=>router.push('/dashboard/admin/gyms')} className="rounded bg-slate-700 px-4 py-2 text-white">Cancel</button>
        </div>
        {error && <div className="text-red-400">{error}</div>}
      </form>
    </div>
  );
}
