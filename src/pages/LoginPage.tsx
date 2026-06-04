import React, { useRef, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GATEWAY_URL } from '../config';
import { getPasskeyAuthenticateOptionsApi, verifyPasskeyAuthenticateApi } from '../api/authApi';
import { Mail, Lock, Shield, Fingerprint, LogIn, UserPlus, Info, Eye, EyeOff } from 'lucide-react';
import gsap from 'gsap';

interface LoginPageProps {
  onToggleRegister: () => void;
}

export default function LoginPage({ onToggleRegister }: LoginPageProps) {
  const { login, error, clearError, logs, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP entrance animations
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
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Error handled by store
    }
  };

  const handlePasskeyLogin = async () => {
    const store = useAuthStore.getState();
    store.addLog('Initiating passkey authentication options...');
    try {
      const options = await getPasskeyAuthenticateOptionsApi(email);
      store.addLog('Challenge received. Invoking browser credentials API...');
      
      // Convert challenge base64 back to Uint8Array for browser
      const challengeBytes = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      
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
      store.addLog('Assertion generated. Sending verification to backend...');

      // Convert responses to base64url for transmission
      const response = credential.response as AuthenticatorAssertionResponse;
      const authRequest = {
        credentialId: credential.id,
        authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
        signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
        userHandle: response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle))) : null
      };

      await verifyPasskeyAuthenticateApi(authRequest);
      store.addLog('Passkey login verified successfully!');
      
      // Sync profile
      await store.syncProfile();
    } catch (err: any) {
      store.addLog(`Passkey authentication failed: ${err.message}`);
      useAuthStore.setState({ error: err.message });
    }
  };

  return (
    <div ref={containerRef} className="flex min-height-screen w-full overflow-hidden login-root">
      {/* Left Branding Pane */}
      <div 
        ref={leftPanelRef}
        className="hidden md:flex flex-col justify-between flex-1 p-16 border-r border-brand-border bg-black/40 relative z-10"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Project<span className="text-scarlet-light">Scarlet</span>
          </h1>
          <p className="text-gray-400 text-lg">Next-Gen Identity &amp; Security Services</p>
        </div>

        <div ref={featuresRef} className="flex flex-col gap-4">
          {[
            { icon: <Shield className="w-5 h-5 text-scarlet-light" />, title: 'Custom microservice Auth', desc: 'Secure session management via httpOnly cookies' },
            { icon: <Shield className="w-5 h-5 text-purple-400" />, title: 'TOTP & Email MFA', desc: 'Multi-factor authentication mechanisms for enhanced identity' },
            { icon: <Fingerprint className="w-5 h-5 text-teal-400" />, title: 'WebAuthn Passkeys', desc: 'Passwordless biometric authentication built directly into your browser' },
            { icon: <LogIn className="w-5 h-5 text-blue-400" />, title: 'Google Social Login', desc: 'Secure Google account linking and authentication' },
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

        {/* Live log panel */}
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

      {/* Right Login Pane */}
      <div 
        ref={rightPanelRef}
        className="flex items-center justify-center flex-1 p-6 relative z-10"
      >
        <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-scarlet/10 flex items-center justify-center text-3xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-gray-400 text-sm mt-1">Sign in to your ProjectScarlet profile</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-200">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet focus:ring-1 focus:ring-scarlet"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-scarlet to-scarlet-dark hover:from-scarlet-light hover:to-scarlet text-white font-semibold text-sm shadow-lg shadow-scarlet/30 hover:shadow-scarlet/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <span className="spinner" /> : <LogIn className="w-4 h-4" />}
              Sign In
            </button>
          </form>

          <div className="relative my-6 text-center">
            <span className="bg-brand-bg px-3 text-xs text-gray-500 uppercase tracking-wider relative z-10">Or connect via</span>
            <div className="absolute left-0 right-0 top-2.5 h-px bg-brand-border z-0"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${GATEWAY_URL}/oauth2/authorization/google`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brand-border hover:border-gray-500 bg-white/5 text-white text-xs font-semibold transition-colors duration-200"
            >
              <GoogleIcon />
              Google
            </a>
            <button
              onClick={handlePasskeyLogin}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brand-border hover:border-gray-500 bg-white/5 text-white text-xs font-semibold transition-colors duration-200 cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-teal-400" />
              Passkey
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
            <button 
              onClick={onToggleRegister}
              className="text-scarlet-light hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create a new account
            </button>
            <p className="flex items-center justify-center gap-1 text-gray-600">
              <Info className="w-3 h-3" />
              Sessions are securely kept in httpOnly cookies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
