import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Shield, Save, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfileCard() {
  const { userProfile, updateProfile, changePassword } = useAuthStore();

  // Profile Update Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.firstName) {
        setFirstName(userProfile.firstName);
        setLastName(userProfile.lastName || '');
      } else if (userProfile.fullName) {
        const [first, ...rest] = userProfile.fullName.trim().split(/\s+/);
        setFirstName(first || '');
        setLastName(rest.join(' '));
      }
    }
  }, [userProfile]);

  if (!userProfile) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setProfileError('First name is required');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateProfile(firstName.trim(), lastName.trim());
      setProfileSuccess('Profile name updated successfully.');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('Both current and new passwords are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Identity Card */}
        <div className="rounded-2xl glass p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-scarlet/10 rounded-xl">
              <User className="w-6 h-6 text-scarlet-light" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Identity Details</h3>
              <p className="text-xs text-gray-400">Your profile information</p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-brand-border">
            <InfoRow label="Email Address" value={userProfile.email} />
            <InfoRow label="First Name" value={userProfile.firstName || '—'} />
            <InfoRow label="Last Name" value={userProfile.lastName || '—'} />
            <InfoRow label="Role" value={userProfile.role} />
            <InfoRow 
              label="Member Since" 
              value={userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleString() : '—'} 
            />
          </div>
        </div>

        {/* Security Status Card */}
        <div className="rounded-2xl glass p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Security Status</h3>
              <p className="text-xs text-gray-400">Credentials and active safeguards</p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-brand-border">
            <InfoRow 
              label="Password Auth" 
              value={userProfile.hasPassword ? '✅ Configured' : '❌ No Password (OAuth2 only)'} 
            />
            <InfoRow 
              label="Biometric Passkey" 
              value={userProfile.hasPasskey ? '✅ Active' : '❌ Inactive'} 
            />
            <InfoRow 
              label="Google Linked" 
              value={userProfile.hasOAuth2 ? '✅ Connected' : '❌ Not Connected'} 
            />
            <InfoRow 
              label="MFA Safeguard" 
              value={userProfile.hasPasskey ? '✅ Enabled' : 'Configure via MFA tab'} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Profile Name Update Form */}
        <div className="rounded-2xl glass p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-xl">
              <User className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Update Profile Name</h3>
              <p className="text-xs text-gray-400">Modify your first and last name</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
              <button onClick={() => setProfileError(null)} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-teal-500/10 hover:shadow-teal-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Name
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl glass p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Update Password</h3>
              <p className="text-xs text-gray-400">Change your account security password</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
              <button onClick={() => setPasswordError(null)} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/10 hover:shadow-red-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
