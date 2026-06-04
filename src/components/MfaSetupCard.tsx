import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getMfaStatusApi,
  enableEmailMfaApi,
  disableEmailMfaApi,
  setupTotpMfaApi,
  confirmTotpMfaApi,
  disableTotpMfaApi,
} from '../api/authApi';
import { Shield, Mail, Key, ShieldCheck, HelpCircle } from 'lucide-react';

export default function MfaSetupCard() {
  const { addLog } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totpSetupData, setTotpSetupData] = useState<any>(null);
  const [setupStep, setSetupStep] = useState<'idle' | 'totp_qr' | 'totp_verify'>('idle');
  const [totpCode, setTotpCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMfaStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMfaStatusApi();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
      addLog(`Failed to fetch MFA status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const handleToggleEmailMfa = async () => {
    if (!status) return;
    setActionLoading(true);
    setError(null);
    const targetState = !status.emailOtpEnabled;
    addLog(`${targetState ? 'Enabling' : 'Disabling'} Email OTP MFA...`);
    try {
      if (targetState) {
        await enableEmailMfaApi();
        addLog('Email OTP MFA enabled successfully.');
      } else {
        await disableEmailMfaApi();
        addLog('Email OTP MFA disabled.');
      }
      await fetchMfaStatus();
    } catch (err: any) {
      setError(err.message);
      addLog(`Failed to toggle Email OTP: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTotpSetup = async () => {
    setActionLoading(true);
    setError(null);
    addLog('Requesting TOTP enrollment details...');
    try {
      const data = await setupTotpMfaApi();
      setTotpSetupData(data);
      setSetupStep('totp_qr');
      addLog('TOTP setup generated. Scan QR with your Authenticator app.');
    } catch (err: any) {
      setError(err.message);
      addLog(`TOTP setup initiation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) return;
    setActionLoading(true);
    setError(null);
    addLog('Submitting TOTP code validation...');
    try {
      await confirmTotpMfaApi(parseInt(totpCode));
      addLog('TOTP Authenticator enrollment verified successfully!');
      setTotpCode('');
      setSetupStep('idle');
      setTotpSetupData(null);
      await fetchMfaStatus();
    } catch (err: any) {
      setError(err.message);
      addLog(`TOTP verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!window.confirm('Are you sure you want to disable Authenticator App MFA?')) return;
    setActionLoading(true);
    setError(null);
    addLog('Disabling Authenticator App MFA...');
    try {
      await disableTotpMfaApi();
      addLog('Authenticator App MFA disabled.');
      await fetchMfaStatus();
    } catch (err: any) {
      setError(err.message);
      addLog(`Failed to disable TOTP: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <span className="spinner spinner-lg border-scarlet" />
        <p className="text-gray-400 text-sm mt-4">Loading MFA settings...</p>
      </div>
    );
  }

  const isMfaActive = status?.emailOtpEnabled || (status?.totpEnabled && status?.totpConfirmed);

  return (
    <div className="space-y-6 w-full">
      {/* Overview Status Card */}
      <div className="rounded-2xl glass p-6 space-y-4">
        <div className={`p-4 rounded-xl flex items-center justify-between font-semibold ${
          isMfaActive ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300' : 'bg-red-950/40 border border-red-800 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6" />
            <span>{isMfaActive ? 'MFA is ACTIVE' : 'MFA is DISABLED'}</span>
          </div>
          <span className="text-xs uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full text-white font-bold">
            {isMfaActive ? 'Safeguarded' : 'At Risk'}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: App Authenticator */}
        <div className="rounded-2xl glass p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Key className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Authenticator App</h3>
                <p className="text-xs text-gray-400">TOTP (Google Authenticator, Authy)</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 leading-relaxed">
              Use a standard authenticator app to generate time-based codes. Recommended for high-security profiles.
            </p>

            {setupStep === 'totp_qr' && totpSetupData && (
              <div className="space-y-4 pt-4 border-t border-brand-border">
                <p className="text-xs text-gray-400 font-medium">1. Scan the QR code or enter the code manually:</p>
                <div className="flex justify-center bg-white p-3 rounded-lg w-fit mx-auto">
                  <img src={totpSetupData.qrCodeBase64} alt="QR Code" className="w-40 h-40" />
                </div>
                <div className="text-center">
                  <code className="text-xs bg-black/40 border border-brand-border px-3 py-1.5 rounded text-cyan-400 font-mono">
                    {totpSetupData.secret}
                  </code>
                </div>
                <button
                  onClick={() => setSetupStep('totp_verify')}
                  className="w-full py-2 rounded bg-scarlet hover:bg-scarlet-light text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Continue to Verify
                </button>
              </div>
            )}

            {setupStep === 'totp_verify' && (
              <form onSubmit={handleConfirmTotp} className="space-y-4 pt-4 border-t border-brand-border">
                <p className="text-xs text-gray-400 font-medium">2. Enter the 6-digit authenticator code:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 rounded bg-black/40 border border-brand-border text-center text-white text-lg font-bold tracking-widest outline-none focus:border-scarlet"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || totpCode.length < 6}
                    className="px-4 rounded bg-scarlet text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupStep('totp_qr')}
                  className="text-xs text-gray-500 hover:text-gray-300 hover:underline"
                >
                  ← Back to QR Code
                </button>
              </form>
            )}
          </div>

          {setupStep === 'idle' && (
            <div className="pt-6 border-t border-brand-border">
              {status?.totpEnabled && status?.totpConfirmed ? (
                <button
                  onClick={handleDisableTotp}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-lg border border-red-800 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Disable Authenticator App
                </button>
              ) : (
                <button
                  onClick={handleStartTotpSetup}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-lg bg-scarlet hover:bg-scarlet-light text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Enable Authenticator App
                </button>
              )}
            </div>
          )}
        </div>

        {/* Method 2: Email OTP */}
        <div className="rounded-2xl glass p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Email OTP Code</h3>
                <p className="text-xs text-gray-400">One-time passcodes sent to email</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 leading-relaxed">
              Dispatches a secure code to your registered email address during authentication challenges.
            </p>
          </div>

          <div className="pt-6 border-t border-brand-border">
            <button
              onClick={handleToggleEmailMfa}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                status?.emailOtpEnabled
                  ? 'border border-red-800 hover:bg-red-950/20 text-red-400 hover:text-red-300'
                  : 'bg-scarlet hover:bg-scarlet-light text-white'
              }`}
            >
              {status?.emailOtpEnabled ? 'Disable Email OTP' : 'Enable Email OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
