import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GATEWAY_URL } from '../config';
import { getPasskeyAuthenticateOptionsApi, verifyPasskeyAuthenticateApi } from '../api/authApi';
import { Mail, Lock, Fingerprint, LogIn, UserPlus, Info, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onToggleRegister: () => void;
}

export default function LoginPage({ onToggleRegister }: LoginPageProps) {
  const { login, error, clearError, loading, syncProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Error handled by store
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      const options = await getPasskeyAuthenticateOptionsApi(email);
      
      const challengeBytes = Uint8Array.from(
        atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), 
        c => c.charCodeAt(0)
      );
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBytes,
          rpId: options.rpId,
          userVerification: options.userVerification,
          timeout: options.timeout,
          allowCredentials: options.allowCredentials.map((c: any) => ({
            type: c.type,
            id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))
          }))
        }
      }) as PublicKeyCredential;

      if (!credential) throw new Error('No credential returned');

      const response = credential.response as AuthenticatorAssertionResponse;
      const authRequest = {
        credentialId: credential.id,
        authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
        signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
        userHandle: response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle))) : null
      };

      await verifyPasskeyAuthenticateApi(authRequest);
      await syncProfile();
    } catch (err: any) {
      useAuthStore.setState({ error: err.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 px-6 py-12">
      <div className="card w-full max-w-md bg-base-200 border-2 border-base-300 shadow-xl rounded-box p-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-base-content">Welcome Back</h2>
          <p className="text-xs text-base-content/60">Sign in to your ProjectScarlet security profile</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-xs flex justify-between items-center py-2.5 shadow-sm">
            <span>{error}</span>
            <button onClick={clearError} className="btn btn-xs btn-ghost btn-circle">✕</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full pl-10 pr-10"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-base-content/40" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-base-content/40 hover:text-base-content transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full gap-2 mt-2"
          >
            {loading ? <span className="loading loading-spinner loading-xs" /> : <LogIn className="w-4 h-4" />}
            Sign In
          </button>
        </form>

        <div className="divider text-xs text-base-content/40 uppercase tracking-widest font-semibold my-4">Or connect via</div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`${GATEWAY_URL}/oauth2/authorization/google`}
            className="btn btn-outline border-base-300 hover:bg-base-300 gap-2 text-xs font-bold w-full"
          >
            <GoogleIcon />
            Google
          </a>
          <button
            onClick={handlePasskeyLogin}
            className="btn btn-outline border-base-300 hover:bg-base-300 gap-2 text-xs font-bold w-full cursor-pointer"
          >
            <Fingerprint className="w-4 h-4 text-primary" />
            Passkey
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-3 pt-2">
          <button
            onClick={onToggleRegister}
            className="link link-primary font-bold text-xs flex items-center justify-center gap-1.5 mx-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create a new account
          </button>
          <p className="flex items-center justify-center gap-1 text-xs text-base-content/50">
            <Info className="w-3.5 h-3.5" />
            Sessions are secured in httpOnly cookies.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
