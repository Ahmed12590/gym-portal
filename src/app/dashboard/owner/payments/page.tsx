'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface PaymentRecord {
  id: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  notes?: string;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  });
  const [members, setMembers] = useState<any[]>([]);

  const gymId = (session?.user as any)?.primaryGymId;

  useEffect(() => {
    if (gymId) {
      fetchPayments();
      fetchMembers();
      fetchTotalRevenue();
    }
  }, [gymId]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/analytics?type=total-revenue&gymId=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayments(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRevenue = async () => {
    try {
      const response = await fetch(`/api/analytics?type=total-revenue&gymId=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.total) {
          setTotalRevenue(data.data.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/members?pageSize=100&gymId=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMembers(data.data.members);
        }
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount) return;

    setRecordingPayment(true);
    try {
      const response = await fetch(`/api/payments?gymId=${gymId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: formData.memberId,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        setFormData({ memberId: '', amount: '', paymentMethod: 'CASH', notes: '' });
        setShowForm(false);
        fetchPayments();
        fetchTotalRevenue();
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading payments...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-gray-400">Manage member payments and invoices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
        >
          💰 Record Payment
        </button>
      </div>

      {/* Total Revenue */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
        <p className="text-gray-400 mb-1">Total Revenue</p>
        <p className="text-4xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Record New Payment</h2>
          <form onSubmit={handleRecordPayment} className="grid grid-cols-4 gap-4">
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="px-4 py-2 bg-slate-700 text-white rounded"
              required
            >
              <option value="">Select Member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-4 py-2 bg-slate-700 text-white rounded"
              required
            />

            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              className="px-4 py-2 bg-slate-700 text-white rounded"
            >
              <option>CASH</option>
              <option>CARD</option>
              <option>BANK_TRANSFER</option>
              <option>CHECK</option>
            </select>

            <button
              type="submit"
              disabled={recordingPayment}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold"
            >
              {recordingPayment ? 'Recording...' : 'Record'}
            </button>
          </form>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Recent Payments</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-6 py-3 text-left text-gray-300">Member</th>
                <th className="px-6 py-3 text-left text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-gray-300">Method</th>
                <th className="px-6 py-3 text-left text-gray-300">Date</th>
                <th className="px-6 py-3 text-left text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No payments recorded
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 text-white">Member</td>
                    <td className="px-6 py-4 text-green-400 font-semibold">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
