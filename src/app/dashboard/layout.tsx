'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader user={session.user as any} />
      <div className="flex">
        <DashboardSidebar userRole={(session.user as any).role} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardHeader({ user }: { user: any }) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">💪 Gym Portal</h1>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-white font-semibold">{user.name}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardSidebar({ userRole }: { userRole: string }) {
  const router = useRouter();

  const navItems =
    userRole === 'SUPER_ADMIN'
      ? [
          { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
          { label: 'Gyms', href: '/dashboard/admin/gyms', icon: '🏢' },
          { label: 'Plans', href: '/dashboard/admin/plans', icon: '📋' },
          { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
          { label: 'Analytics', href: '/dashboard/admin/analytics', icon: '📈' },
        ]
      : userRole === 'GYM_OWNER'
      ? [
          { label: 'Dashboard', href: '/dashboard/owner', icon: '📊' },
          { label: 'Members', href: '/dashboard/owner/members', icon: '👥' },
          { label: 'Attendance', href: '/dashboard/owner/attendance', icon: '📝' },
          { label: 'Payments', href: '/dashboard/owner/payments', icon: '💰' },
          { label: 'Branches', href: '/dashboard/owner/branches', icon: '🏢' },
          { label: 'Reports', href: '/dashboard/owner/reports', icon: '📈' },
          { label: 'Settings', href: '/dashboard/owner/settings', icon: '⚙️' },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard/staff', icon: '📊' },
          { label: 'Attendance', href: '/dashboard/staff/attendance', icon: '📝' },
          { label: 'Members', href: '/dashboard/staff/members', icon: '👥' },
        ];

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition space-x-2 flex items-center"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-6 pt-6 border-t border-slate-700">
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
          className="w-full px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
