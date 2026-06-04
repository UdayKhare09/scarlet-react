import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MfaChallengePage from './pages/MfaChallengePage';
import DashboardPage from './pages/DashboardPage';
import { verifyEmailApi, resetPasswordApi } from './api/authApi';
import { ShieldAlert, CheckCircle, ShieldCheck, Key, Lock, ArrowLeft, RefreshCw } from 'lucide-react';
import Lenis from 'lenis';

export default function App() {
  const { userProfile, mfaChallenge, syncProfile } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Custom router state for email verify and password reset
  const [pathname, setPathname] = useState(window.location.pathname);
  const [queryParams, setQueryParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    // 1. Initialise Lenis smooth scrolling
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Initialise auth state by syncing profile
    syncProfile().finally(() => {
      setInitializing(false);
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Project<span className="text-scarlet-light">Scarlet</span>
        </h1>
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="spinner spinner-lg border-scarlet" />
          <p className="text-xs font-semibold tracking-widest uppercase">Initialising Security Protocol...</p>
        </div>
      </div>
    );
  }

  // Handle URL verify-email path
  if (pathname === '/verify-email') {
    return <VerifyEmailView queryParams={queryParams} onRedirect={() => {
      window.history.replaceState({}, document.title, '/');
      setPathname('/');
    }} />;
  }

  // Handle URL reset-password path
  if (pathname === '/reset-password') {
    return <ResetPasswordView queryParams={queryParams} onRedirect={() => {
      window.history.replaceState({}, document.title, '/');
      setPathname('/');
    }} />;
  }

  // Regular Auth routing
  if (userProfile) {
    return <DashboardPage />;
  }

  if (mfaChallenge) {
    return <MfaChallengePage />;
  }

  return view === 'login' ? (
    <LoginPage onToggleRegister={() => setView('register')} />
  ) : (
    <RegisterPage onToggleLogin={() => setView('login')} />
  );
}

/* ============================================================
   Verification view
   ============================================================ */
function VerifyEmailView({ queryParams, onRedirect }: { queryParams: URLSearchParams; onRedirect: () => void }) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = queryParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided in link.');
      return;
    }

    verifyEmailApi(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message);
      });
  }, [queryParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg">
      <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl text-center space-y-6">
        <h2 className="text-2xl font-bold text-white">Email Verification</h2>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-12 h-12 text-scarlet-light animate-spin" />
            <p className="text-gray-400 text-sm">Validating token authenticity...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-emerald-400 font-semibold">Account Verified Successfully!</p>
            <p className="text-gray-400 text-sm">You can now proceed to log in with your credentials.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-red-400 font-semibold">Verification Failed</p>
            <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={onRedirect}
          className="w-full py-2.5 rounded-lg bg-scarlet hover:bg-scarlet-light text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Login
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Reset Password view
   ============================================================ */
function ResetPasswordView({ queryParams, onRedirect }: { queryParams: URLSearchParams; onRedirect: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setStatus('error');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      await resetPasswordApi(token, newPassword);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg">
        <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
          <p className="text-gray-400 text-sm">No reset token was found in the link parameters.</p>
          <button onClick={onRedirect} className="w-full py-2 rounded bg-scarlet text-white text-xs font-bold cursor-pointer">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg">
      <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl space-y-6">
        <div className="text-center">
          <Key className="w-12 h-12 text-purple-400 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-gray-400 text-xs mt-1">Enter your new credential parameters</p>
        </div>

        {status === 'error' && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setStatus('form')} className="text-red-400">✕</button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center py-6">
            <span className="spinner spinner-lg border-scarlet" />
            <p className="text-gray-400 text-xs mt-3">Resetting account credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4 py-4">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-emerald-400 font-semibold">Password Reset Successful!</p>
            <p className="text-gray-400 text-sm">Your new password is now active.</p>
            <button onClick={onRedirect} className="w-full py-2.5 rounded bg-scarlet text-white text-xs font-bold cursor-pointer">
              Sign In
            </button>
          </div>
        )}

        {status === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-scarlet to-scarlet-dark text-white font-semibold text-sm cursor-pointer"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
