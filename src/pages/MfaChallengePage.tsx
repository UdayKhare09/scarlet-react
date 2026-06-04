import React, { useRef, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { sendEmailOtpApi } from '../api/authApi';
import { Shield, Mail, Key, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';

export default function MfaChallengePage() {
  const { mfaChallenge, completeMfa, error, clearError, clearMfaChallenge, addLog, loading } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mfaChallenge && mfaChallenge.methods.length > 0 && !selectedMethod) {
      setSelectedMethod(mfaChallenge.methods[0]);
    }
  }, [mfaChallenge, selectedMethod]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!mfaChallenge) return null;

  const handleSendEmailOtp = async () => {
    setOtpSending(true);
    clearError();
    try {
      addLog('Triggering email OTP delivery...');
      await sendEmailOtpApi(mfaChallenge.pendingToken);
      setOtpSent(true);
      addLog('MFA OTP email dispatched successfully.');
    } catch (err: any) {
      addLog(`Failed to send email OTP: ${err.message}`);
      useAuthStore.setState({ error: err.message });
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !selectedMethod) return;
    try {
      await completeMfa(selectedMethod, code);
    } catch {
      // Handled in store
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center p-6 relative">
      <div ref={cardRef} className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-scarlet/10 flex items-center justify-center text-3xl mb-4 text-scarlet-light">🛡️</div>
          <h2 className="text-2xl font-bold text-white">MFA Verification</h2>
          <p className="text-gray-400 text-sm mt-1">Multi-factor security is enabled for your profile</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200">✕</button>
          </div>
        )}

        {/* Method selector tabs */}
        {mfaChallenge.methods.length > 1 && (
          <div className="flex bg-black/40 rounded-lg p-1 border border-brand-border mb-6">
            {mfaChallenge.methods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setSelectedMethod(method);
                  setCode('');
                  setOtpSent(false);
                  clearError();
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedMethod === method
                    ? 'bg-scarlet text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {method === 'totp' ? 'Authenticator App' : 'Email Code'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedMethod === 'email_otp' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 border border-brand-border p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Send code to</div>
                    <div className="text-sm text-white font-medium">Your registered inbox</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={otpSending || loading}
                  className="px-3 py-1.5 rounded-lg bg-scarlet hover:bg-scarlet-light text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {otpSending ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
              
              {otpSent && (
                <p className="text-xs text-emerald-400 text-center font-medium">Code dispatched. Please check your spam folder if not received.</p>
              )}
            </div>
          )}

          {selectedMethod === 'totp' && (
            <div className="flex items-center gap-3 bg-white/5 border border-brand-border p-4 rounded-xl">
              <KeyRound className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Authenticator App</div>
                <div className="text-sm text-white font-medium">Open Google Authenticator / Authy</div>
              </div>
            </div>
          )}

          {(selectedMethod === 'totp' || (selectedMethod === 'email_otp' && otpSent)) && (
            <div className="space-y-3">
              <label className="block text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Enter Verification Code
              </label>
              
              <div className="flex justify-center">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (selectedMethod === 'totp') {
                      setCode(val.replace(/\D/g, ''));
                    } else {
                      setCode(val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                    }
                  }}
                  className="w-48 py-3 rounded-lg bg-black/40 border border-brand-border text-white text-2xl font-bold tracking-widest text-center outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-scarlet to-scarlet-dark hover:from-scarlet-light hover:to-scarlet text-white font-semibold text-sm shadow-lg shadow-scarlet/30 hover:shadow-scarlet/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <span className="spinner" /> : <ArrowRight className="w-4 h-4" />}
                Verify Code
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-4 border-t border-brand-border text-center">
          <button
            onClick={clearMfaChallenge}
            className="text-gray-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
