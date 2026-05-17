'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const role = (session.user as any).role;
      if (role === 'SUPER_ADMIN') {
        router.push('/dashboard/admin');
      } else if (role === 'GYM_OWNER') {
        router.push('/dashboard/owner');
      } else if (role === 'STAFF_MEMBER') {
        router.push('/dashboard/staff');
      }
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-6">
          <div className="text-2xl font-bold text-white">
            💪 Gym Portal
          </div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2 text-gray-300 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Register
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Professional Gym Management
            <span className="text-blue-400"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Complete multi-tenant SaaS solution for managing multiple gyms, members,
            attendance, payments, and advanced analytics. Scale your fitness business effortlessly.
          </p>

          {!session ? (
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Get Started
              </Link>
              <Link
                href="/auth/register"
                className="inline-block px-8 py-3 border-2 border-blue-400 text-blue-400 hover:text-white hover:border-blue-500 rounded-lg font-semibold transition"
              >
                Sign Up Free
              </Link>
            </div>
          ) : null}
        </div>

        {/* Features */}
        <div className="py-20 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📊"
            title="Advanced Analytics"
            description="Real-time dashboards and detailed reports for revenue, attendance, and membership trends."
          />
          <FeatureCard
            icon="👥"
            title="Member Management"
            description="Complete member profiles with documents, membership tracking, and status management."
          />
          <FeatureCard
            icon="🏢"
            title="Multi-Tenant"
            description="Manage multiple gyms from a single platform with complete data isolation."
          />
          <FeatureCard
            icon="💰"
            title="Payment Tracking"
            description="Automated fee management, invoicing, and payment history tracking."
          />
          <FeatureCard
            icon="📱"
            title="Biometric Support"
            description="Integration with biometric attendance systems for accurate tracking."
          />
          <FeatureCard
            icon="🔐"
            title="Role-Based Access"
            description="Multi-level security with Super Admin, Gym Owner, and Staff controls."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
