import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Settings, UserCheck } from 'lucide-react';

export default function HomePage() {
  const store = useAuthStore();
  const user = store.userProfile || {
    fullName: 'Uday Kiran',
    email: 'uday@example.com',
    firstName: 'Uday',
    lastName: 'Kiran',
    role: 'ADMIN',
    profilePictureUrl: undefined as string | undefined
  };

  const handleNavigateSettings = () => {
    window.history.pushState({}, '', '/settings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">
      {/* Navbar */}
      <header className="navbar bg-base-200 border-b border-base-300 px-6 py-4 shadow-sm z-30">
        <div className="navbar-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-extrabold text-primary-content text-xl shadow-md">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-base-content">
              Project<span className="text-primary">Scarlet</span>
            </span>
          </div>
        </div>

        <div className="navbar-end gap-4">
          {/* User Display Info */}
          <div className="flex items-center gap-3 bg-base-300/40 p-2 pr-4 rounded-full border border-base-300">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-inner border border-base-300 flex items-center justify-center">
                {user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center font-bold text-sm">
                    {getInitials(user.fullName)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold text-base-content leading-tight">
                {user.fullName}
              </div>
              <div className="text-xs text-base-content/60">
                {user.email}
              </div>
            </div>
          </div>

          {/* Settings trigger */}
          <button
            onClick={handleNavigateSettings}
            className="btn btn-ghost btn-circle border border-base-300 hover:bg-base-300/60 shadow-sm cursor-pointer animate-hover-spin"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5 text-base-content" />
          </button>
        </div>
      </header>

      {/* Page Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-base-100 to-base-200">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border-2 border-dashed border-base-300/60">
          <div className="w-20 h-20 bg-base-300/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="w-10 h-10 text-primary/80" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome to /home</h2>
            <p className="text-sm text-base-content/60 leading-relaxed">
              This page is empty for now. Click the settings icon in the top right to configure your security profiles, update details, or manage credentials.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
