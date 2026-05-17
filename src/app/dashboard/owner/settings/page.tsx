'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = async () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Account Section */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input
              type="text"
              defaultValue={session?.user?.name || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-700 text-gray-400 rounded disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              defaultValue={session?.user?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-700 text-gray-400 rounded disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <input
              type="text"
              defaultValue={(session?.user as any)?.role || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-700 text-gray-400 rounded disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Gym Information */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Gym Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Gym Name</label>
              <input
                type="text"
                placeholder="Gym Name"
                defaultValue="Elite Fitness Center"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                placeholder="Email"
                defaultValue="info@elitefitness.com"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                placeholder="Phone"
                defaultValue="+92-21-1234567"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Website</label>
              <input
                type="url"
                placeholder="Website"
                defaultValue="www.elitefitness.com"
                className="w-full px-4 py-2 bg-slate-700 text-white rounded"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Plan</label>
              <div className="px-4 py-2 bg-slate-700 text-white rounded">Premium</div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <div className="px-4 py-2 bg-green-600/20 text-green-400 rounded border border-green-600/50">
                ✓ Active
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
            <div className="px-4 py-2 bg-slate-700 text-gray-300 rounded">
              {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Enabled Features</h2>
        <div className="space-y-2">
          <FeatureToggle label="Biometric Attendance" enabled={true} />
          <FeatureToggle label="Multi-Branch Support" enabled={true} />
          <FeatureToggle label="Advanced Reports" enabled={true} />
          <FeatureToggle label="SMS Notifications" enabled={true} />
          <FeatureToggle label="WhatsApp Notifications" enabled={false} />
        </div>
      </div>

      {/* Security */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
        <div className="space-y-4">
          <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-left">
            🔐 Change Password
          </button>
          <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-left">
            🔑 Two-Factor Authentication
          </button>
          <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-left">
            👤 Manage Backup Codes
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

function FeatureToggle({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 rounded">
      <span className="text-gray-300">{label}</span>
      <div
        className={`w-12 h-6 rounded-full transition ${
          enabled ? 'bg-green-600' : 'bg-gray-600'
        } flex items-center`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition ${
            enabled ? 'ml-6' : 'ml-1'
          }`}
        />
      </div>
    </div>
  );
}
