import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, ArrowLeft, RefreshCw, Key, Shield } from 'lucide-react';

export default function MfaChallengePage() {
  const { mfaChallenge, completeMfa, clearMfaChallenge, error, clearError, loading } = useAuthStore();
  const [code, setCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(
    mfaChallenge?.methods[0] || 'EMAIL_OTP'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    try {
      await completeMfa(selectedMethod, code);
    } catch {
      // Handled by store
    }
  };

  if (!mfaChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-6">
        <div className="card max-w-sm bg-base-200 border border-base-300 p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-xl font-bold">No Active MFA Session</h2>
          <p className="text-xs text-base-content/60">No multi-factor challenge session was found.</p>
          <button onClick={clearMfaChallenge} className="btn btn-primary w-full">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-6">
      <div className="card w-full max-w-md bg-base-200 border-2 border-base-300 shadow-xl rounded-box p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Two-Factor Authentication</h2>
          <p className="text-xs text-base-content/60">Verify your identity to complete sign-in</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-xs flex justify-between items-center py-2.5 shadow-sm">
            <span>{error}</span>
            <button onClick={clearError} className="btn btn-xs btn-ghost btn-circle">✕</button>
          </div>
        )}

        {/* Method Selection if more than one */}
        {mfaChallenge.methods.length > 1 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Choose Verification Method</span>
            <div className="flex bg-base-300 p-1 rounded-xl">
              {mfaChallenge.methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedMethod === m ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/60'
                  }`}
                >
                  {m === 'EMAIL_OTP' ? 'Email OTP' : 'Authenticator App'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="fieldset p-0">
            <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">
              {selectedMethod === 'EMAIL_OTP' ? 'Enter Email OTP Code' : 'Enter Authenticator App Code'}
            </span>
            <div className="relative w-full">
              <input
                type="text"
                required
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={8}
                placeholder="e.g. 123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="input input-bordered w-full pl-10 text-center tracking-widest font-mono font-bold text-lg"
              />
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
            </div>
            <span className="fieldset-helper text-xs text-base-content/50 mt-1">
              {selectedMethod === 'EMAIL_OTP' 
                ? 'We sent a verification code to your email address.' 
                : 'Enter the 6-digit code from your authenticator app.'
              }
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full gap-2 mt-2"
          >
            {loading ? <span className="loading loading-spinner loading-xs" /> : <RefreshCw className="w-4 h-4" />}
            Verify &amp; Continue
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2">
          <button
            onClick={clearMfaChallenge}
            className="btn btn-sm btn-ghost gap-1.5 font-bold text-xs mx-auto text-base-content/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
