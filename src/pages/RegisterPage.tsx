import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Lock, UserPlus, ArrowLeft, Info } from 'lucide-react';

interface RegisterPageProps {
  onToggleLogin: () => void;
}

export default function RegisterPage({ onToggleLogin }: RegisterPageProps) {
  const { register, error, clearError, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-base-100 px-6 py-12">
      <div className="card w-full max-w-md bg-base-200 border-2 border-base-300 shadow-xl rounded-box p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-base-content">Create Account</h2>
          <p className="text-xs text-base-content/60">Register your secure ProjectScarlet identity profile</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-xs flex justify-between items-center py-2.5 shadow-sm">
            <span>{error}</span>
            <button onClick={clearError} className="btn btn-xs btn-ghost btn-circle">✕</button>
          </div>
        )}

        {/* Success View */}
        {successMessage ? (
          <div className="space-y-4">
            <div className="alert alert-success text-xs shadow-sm py-4 flex flex-col items-center text-center gap-2">
              <span className="font-bold">{successMessage}</span>
            </div>
            <button
              onClick={onToggleLogin}
              className="btn btn-outline border-base-300 hover:bg-base-300 w-full gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Sign In
            </button>
          </div>
        ) : (
          /* Register Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="fieldset p-0">
              <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">Full Name</span>
              <div className="relative w-full">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            <div className="fieldset p-0">
              <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">Email Address</span>
              <div className="relative w-full">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            <div className="fieldset p-0">
              <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">Password</span>
              <div className="relative w-full">
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2 mt-2"
            >
              {loading ? <span className="loading loading-spinner loading-xs" /> : <UserPlus className="w-4 h-4" />}
              Sign Up
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center space-y-3 pt-2">
          <button
            onClick={onToggleLogin}
            className="link link-primary font-bold text-xs flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Already have an account? Sign In
          </button>
          <p className="flex items-center justify-center gap-1 text-xs text-base-content/50">
            <Info className="w-3.5 h-3.5" />
            We respect your privacy. No password sharing or tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
