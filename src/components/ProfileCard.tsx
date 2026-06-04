import React from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Calendar, ShieldAlert, Key, FileText, CheckCircle, Shield } from 'lucide-react';

export default function ProfileCard() {
  const { userProfile } = useAuthStore();

  if (!userProfile) return null;

  return (
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
          <InfoRow label="Full Name" value={userProfile.fullName || '—'} />
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
