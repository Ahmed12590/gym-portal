'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  todayAttendance: number;
  monthlyRevenue: number;
  expiredMembers: number;
  inactiveMembers: number;
}

export default function GymOwnerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMetrics();
    }
  }, [session]);

  const fetchMetrics = async () => {
    try {
      const gymId = (session?.user as any)?.primaryGymId;
      if (!gymId) {
        router.push('/dashboard/owner/select-gym');
        return;
      }

      const response = await fetch(`/api/analytics?type=dashboard&gymId=${gymId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to your gym management dashboard</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Members"
          value={metrics?.totalMembers || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Members"
          value={metrics?.activeMembers || 0}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Attendance Today"
          value={metrics?.todayAttendance || 0}
          icon="📝"
          color="purple"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${metrics?.monthlyRevenue?.toFixed(2) || 0}`}
          icon="💰"
          color="green"
        />
        <MetricCard
          title="Expired Memberships"
          value={metrics?.expiredMembers || 0}
          icon="⏰"
          color="red"
        />
        <MetricCard
          title="Inactive Members"
          value={metrics?.inactiveMembers || 0}
          icon="😴"
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            label="Add Member"
            icon="➕"
            onClick={() => router.push('/dashboard/owner/members?action=add')}
          />
          <QuickActionButton
            label="Record Attendance"
            icon="📝"
            onClick={() => router.push('/dashboard/owner/attendance')}
          />
          <QuickActionButton
            label="View Reports"
            icon="📊"
            onClick={() => router.push('/dashboard/owner/reports')}
          />
          <QuickActionButton
            label="Manage Settings"
            icon="⚙️"
            onClick={() => router.push('/dashboard/owner/settings')}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className={`${bgColors[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-4 transition text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-semibold">{label}</p>
    </button>
  );
}
