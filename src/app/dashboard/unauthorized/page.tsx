'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-6 text-lg">
          You don't have permission to access this resource.
        </p>
        <div className="space-y-2">
          <p className="text-gray-500">
            This may be because:
          </p>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Your account role doesn't have access to this section</li>
            <li>• Your subscription plan doesn't include this feature</li>
            <li>• Your account has been suspended</li>
          </ul>
        </div>
        <div className="mt-8 space-x-4">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 border-2 border-blue-400 text-blue-400 hover:text-white hover:border-blue-500 rounded-lg font-semibold"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
