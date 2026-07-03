import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MfaChallengePage from './pages/MfaChallengePage';
import { verifyEmailApi, resetPasswordApi } from './api/authApi';
import { ShieldAlert, CheckCircle, ShieldCheck, Key, Lock, ArrowLeft, RefreshCw } from 'lucide-react';
import Lenis from 'lenis';

export default function App() {
  const { userProfile, mfaChallenge, syncProfile } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Custom router state
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

    // 2. Setup path change listener
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
      setQueryParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handleLocationChange);
    
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPush.apply(this, args);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    window.history.replaceState = function(...args) {
      originalReplace.apply(this, args);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // 3. Initialise auth state by syncing profile
    syncProfile().finally(() => {
      setInitializing(false);
    });

    return () => {
      lenis.destroy();
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  // Correct URL path context if logged in and trying to access root or other paths
  useEffect(() => {
    if (!initializing && userProfile) {
      if (pathname === '/' || pathname === '/login' || pathname === '/register') {
        window.history.replaceState({}, '', '/home');
      }
    } else if (!initializing && !userProfile) {
      if (pathname === '/home' || pathname === '/settings') {
        window.history.replaceState({}, '', '/login');
      }
    }
  }, [userProfile, pathname, initializing]);

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 space-y-4">
        <h1 className="text-3xl font-extrabold text-base-content tracking-tight">
          Project<span className="text-primary">Scarlet</span>
        </h1>
        <div className="flex flex-col items-center gap-2 text-base-content/50">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-xs font-semibold tracking-widest uppercase mt-2">Initialising Security Protocol...</p>
        </div>
      </div>
    );
  }

  // Handle URL verify-email path
  if (pathname === '/verify-email') {
    return <VerifyEmailView queryParams={queryParams} onRedirect={() => {
      window.history.replaceState({}, document.title, '/login');
    }} />;
  }

  // Handle URL reset-password path
  if (pathname === '/reset-password') {
    return <ResetPasswordView queryParams={queryParams} onRedirect={() => {
      window.history.replaceState({}, document.title, '/login');
    }} />;
  }

  // Auth Protection Route Gate
  if (!userProfile) {
    if (mfaChallenge) {
      return <MfaChallengePage />;
    }
    return view === 'login' ? (
      <LoginPage onToggleRegister={() => setView('register')} />
    ) : (
      <RegisterPage onToggleLogin={() => setView('login')} />
    );
  }

  // Authenticated Views routing
  if (pathname === '/settings') {
    return <SettingsPage />;
  }

  return <HomePage />;
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-base-100">
      <div className="card w-full max-w-md p-8 bg-base-200 border border-base-300 shadow-xl text-center space-y-6">
        <h2 className="text-2xl font-bold text-base-content">Email Verification</h2>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
            <p className="text-base-content/60 text-sm">Validating token authenticity...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-success font-semibold">Account Verified Successfully!</p>
            <p className="text-base-content/60 text-sm">You can now proceed to log in with your credentials.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center text-error">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-error font-semibold">Verification Failed</p>
            <p className="text-base-content/60 text-sm leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={onRedirect}
          className="btn btn-primary w-full gap-2 cursor-pointer"
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-base-100">
        <div className="card w-full max-w-md p-8 bg-base-200 border border-base-300 shadow-xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-xl font-bold">Invalid Reset Link</h2>
          <p className="text-base-content/60 text-sm">No reset token was found in the link parameters.</p>
          <button onClick={onRedirect} className="btn btn-primary w-full">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base-100">
      <div className="card w-full max-w-md p-8 bg-base-200 border border-base-300 shadow-xl space-y-6">
        <div className="text-center">
          <Key className="w-12 h-12 text-secondary mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-base-content/60 text-xs mt-1">Enter your new credential parameters</p>
        </div>

        {status === 'error' && (
          <div className="alert alert-error text-xs py-2 shadow-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setStatus('form')} className="btn btn-xs btn-ghost btn-circle">✕</button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center py-6 space-y-3">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-base-content/60 text-xs">Resetting account credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4 py-4">
            <ShieldCheck className="w-16 h-16 text-success mx-auto" />
            <p className="text-success font-semibold">Password Reset Successful!</p>
            <p className="text-base-content/60 text-sm">Your new password is now active.</p>
            <button onClick={onRedirect} className="btn btn-primary w-full">
              Sign In
            </button>
          </div>
        )}

        {status === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="fieldset p-0">
              <span className="fieldset-label text-xs uppercase tracking-wider font-semibold text-base-content/60">New Password</span>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            <div className="fieldset p-0">
              <span className="fieldset-label text-xs uppercase tracking-wider font-semibold text-base-content/60">Confirm Password</span>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
