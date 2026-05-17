'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  membershipPlan?: string;
  status: string;
  expiryDate: string;
}

export default function MembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const gymId = (session?.user as any)?.primaryGymId;
  const action = searchParams.get('action');

  useEffect(() => {
    if (gymId) {
      fetchMembers();
    }
  }, [gymId, page]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `/api/members?page=${page}&pageSize=10&gymId=${gymId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMembers(data.data.members);
          setTotal(data.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (action === 'add') {
    return <CreateMemberForm gymId={gymId} />;
  }

  if (loading) {
    return <div className="p-6 text-white">Loading members...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Members</h1>
          <p className="text-gray-400">Manage your gym members</p>
        </div>
        <button
          onClick={() => router.push('?action=add')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          ➕ Add Member
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700 border-b border-slate-600">
              <th className="px-6 py-3 text-left text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-gray-300">Email</th>
              <th className="px-6 py-3 text-left text-gray-300">Phone</th>
              <th className="px-6 py-3 text-left text-gray-300">Plan</th>
              <th className="px-6 py-3 text-left text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-gray-300">Expiry</th>
              <th className="px-6 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-700 hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 text-white">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{member.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-300">{member.phone}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {member.membershipPlan || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        member.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400'
                          : member.status === 'INACTIVE'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(member.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/owner/members/${member.id}`)
                      }
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-gray-400">
          Showing {members.length} of {total} members
        </p>
        <div className="space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-400">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={members.length < 10}
            className="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateMemberForm({ gymId }: { gymId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    membershipPlan: 'Regular',
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/members?gymId=${gymId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/owner/members');
      }
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Add New Member</h1>
        <button
          onClick={() => router.push('/dashboard/owner/members')}
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to Members
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 rounded-lg p-6 max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="cnic"
            placeholder="CNIC"
            value={formData.cnic}
            onChange={handleChange}
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="px-4 py-2 bg-slate-700 text-white rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <select
            name="membershipPlan"
            value={formData.membershipPlan}
            onChange={handleChange}
            className="px-4 py-2 bg-slate-700 text-white rounded"
          >
            <option>Regular</option>
            <option>Premium</option>
            <option>Elite</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Join Date</label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Member'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/owner/members')}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
