import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import ProfileCard from '../components/ProfileCard';
import MfaSetupCard from '../components/MfaSetupCard';
import AuditLogCard from '../components/AuditLogCard';
import PasskeyCard from '../components/PasskeyCard';
import { LogOut, User, Shield, Fingerprint, Terminal, RefreshCw } from 'lucide-react';
import gsap from 'gsap';

export default function DashboardPage() {
  const { userProfile, syncProfile, logout, loading, addLog } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'passkeys' | 'logs'>('overview');
  const [syncing, setSyncing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial sync
    setSyncing(true);
    addLog('Loading security profile configuration from database...');
    syncProfile()
      .then(() => addLog('Security profile synced successfully.'))
      .catch((err) => addLog(`Sync warning: ${err.message}`))
      .finally(() => setSyncing(false));
  }, []);

  useEffect(() => {
    // GSAP page entrance
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current, 
        { y: -30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]); // Animate again when tabs change for smooth transition!

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { key: 'mfa', label: 'Multi-Factor Auth', icon: <Shield className="w-4 h-4" /> },
    { key: 'passkeys', label: 'WebAuthn Passkeys', icon: <Fingerprint className="w-4 h-4" /> },
    { key: 'logs', label: 'Audit Console', icon: <Terminal className="w-4 h-4" /> },
  ] as const;

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col w-full dashboard-root bg-brand-bg">
      {/* Navbar */}
      <nav ref={navRef} className="flex items-center justify-between px-6 py-4 bg-black/60 border-b border-brand-border sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-scarlet to-purple-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-scarlet/20">S</div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Project<span className="text-scarlet-light">Scarlet</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-scarlet to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                {(userProfile.fullName || userProfile.email || '?')[0].toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white leading-tight">{userProfile.fullName}</div>
                <div className="text-xs text-gray-500">{userProfile.email}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-brand-border hover:border-red-800 text-gray-400 hover:text-red-300 hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Tabs Layout */}
      <div className="flex px-6 py-2 bg-black/30 border-b border-brand-border overflow-x-auto gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === t.key
                ? 'bg-white/10 text-white border border-brand-border'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main ref={contentRef} className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
        {syncing && (
          <div className="flex items-center gap-2 p-3 bg-blue-950/40 border border-blue-900 text-blue-300 rounded-lg text-xs font-medium mb-6">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Updating profile synchronisation parameters...</span>
          </div>
        )}

        {activeTab === 'overview' && <ProfileCard />}
        {activeTab === 'mfa' && <MfaSetupCard />}
        {activeTab === 'passkeys' && <PasskeyCard />}
        {activeTab === 'logs' && <AuditLogCard />}
      </main>
    </div>
  );
}
