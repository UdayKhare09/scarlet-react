import React, { useRef, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Lock, UserPlus, ArrowLeft, Shield, Fingerprint, LogIn, Info } from 'lucide-react';
import gsap from 'gsap';

interface RegisterPageProps {
  onToggleLogin: () => void;
}

export default function RegisterPage({ onToggleLogin }: RegisterPageProps) {
  const { register, error, clearError, logs, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(leftPanelRef.current, 
        { opacity: 0, x: -50 }, 
        { opacity: 1, x: 0, duration: 1, ease: 'power4.out' }
      );
      gsap.fromTo(rightPanelRef.current, 
        { opacity: 0, x: 50 }, 
        { opacity: 1, x: 0, duration: 1, ease: 'power4.out', delay: 0.2 }
      );
      if (featuresRef.current) {
        gsap.fromTo(featuresRef.current.children, 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)', delay: 0.5 }
        );
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    try {
      const msg = await register(fullName, email, password);
      setSuccessMessage(msg);
      setFullName('');
      setEmail('');
      setPassword('');
    } catch {
      // Handled by store
    }
  };

  return (
    <div ref={containerRef} className="flex min-height-screen w-full overflow-hidden login-root">
      {/* Left branding pane */}
      <div 
        ref={leftPanelRef}
        className="hidden md:flex flex-col justify-between flex-1 p-16 border-r border-brand-border bg-black/40 relative z-10"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Project<span className="text-scarlet-light">Scarlet</span>
          </h1>
          <p className="text-gray-400 text-lg">Create Your Secure Identity</p>
        </div>

        <div ref={featuresRef} className="flex flex-col gap-4">
          {[
            { icon: <Shield className="w-5 h-5 text-scarlet-light" />, title: 'Self-Sovereign Identity', desc: 'Own your credentials and data without external aggregators' },
            { icon: <Fingerprint className="w-5 h-5 text-teal-400" />, title: 'End-to-End Security', desc: 'Secure database architecture mimicking enterprise-level backends' },
            { icon: <LogIn className="w-5 h-5 text-blue-400" />, title: 'Immediate Activation', desc: 'Verification link sent straight to your inbox' },
          ].map((f) => (
            <div className="flex gap-4 p-4 rounded-xl glass glass-hover transition-all duration-300" key={f.title}>
              <div className="p-2 rounded-lg bg-white/5">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-sm text-white">{f.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Console logger */}
        <div className="p-4 rounded-xl bg-black/50 border border-brand-border h-40 overflow-y-auto">
          <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">Auth Event Logs</div>
          <div className="font-mono text-xs text-emerald-400 space-y-1">
            {logs.length === 0 ? (
              <span className="italic text-gray-600">Waiting for actions...</span>
            ) : (
              logs.map((l, i) => <div key={i} className="leading-relaxed">{l}</div>)
            )}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div 
        ref={rightPanelRef}
        className="flex items-center justify-center flex-1 p-6 relative z-10"
      >
        <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-scarlet/10 flex items-center justify-center text-3xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 text-sm mt-1">Get started with your Scarlet identity profile</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm space-y-3">
              <p className="font-medium">{successMessage}</p>
              <button 
                onClick={onToggleLogin}
                className="px-3 py-1.5 rounded bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Go to Sign In
              </button>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-scarlet to-scarlet-dark hover:from-scarlet-light hover:to-scarlet text-white font-semibold text-sm shadow-lg shadow-scarlet/30 hover:shadow-scarlet/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <span className="spinner" /> : <UserPlus className="w-4 h-4" />}
                Sign Up
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
            <button 
              onClick={onToggleLogin}
              className="text-scarlet-light hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Already have an account? Sign In
            </button>
            <p className="flex items-center justify-center gap-1 text-gray-600">
              <Info className="w-3 h-3" />
              We respect your privacy. No password sharing or tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
