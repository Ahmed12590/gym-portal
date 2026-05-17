'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Callback: 'There was a problem during authentication. Please try again.',
    OAuthSignin: 'There was a problem signing in with your OAuth provider.',
    OAuthCallback: 'There was a problem with the OAuth callback.',
    OAuthCreateAccount: 'Could not create OAuth account.',
    EmailCreateAccount: 'Could not create email account.',
    Callback: 'There was a problem during the callback.',
    EmailSignInError: 'Could not send sign in email.',
    CredentialsSignin: 'Sign in failed. Check your email and password.',
    SessionCallback: 'There was a problem with your session.',
    AccessDenied: 'Access denied. You are not authorized.',
    default: 'An authentication error occurred. Please try again.',
  };

  const message = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <div className="bg-red-500/10 border border-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Authentication Error</h1>
            <p className="text-gray-400 text-center">{message}</p>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                Try Again
              </button>
            </Link>
            <Link href="/">
              <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
