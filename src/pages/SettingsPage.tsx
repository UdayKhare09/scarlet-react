import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  User, 
  Shield, 
  Fingerprint, 
  Key, 
  Save, 
  Lock, 
  Plus, 
  Trash2, 
  CheckCircle,
  Home,
  LogOut,
  Mail,
  ShieldCheck,
  ChevronRight,
  Info,
  QrCode,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { 
  getPasskeyRegisterOptionsApi,
  verifyPasskeyRegisterApi,
  listPasskeysApi,
  deletePasskeyApi,
  getMfaStatusApi,
  enableEmailMfaApi,
  disableEmailMfaApi,
  setupTotpMfaApi,
  confirmTotpMfaApi,
  disableTotpMfaApi
} from '../api/authApi';

export default function SettingsPage() {
  const store = useAuthStore();
  const user = store.userProfile || {
    fullName: 'Uday Kiran',
    email: 'uday@example.com',
    firstName: 'Uday',
    lastName: 'Kiran',
    role: 'ADMIN',
    hasPassword: true,
    hasPasskey: false,
    hasOAuth2: false,
    profilePictureUrl: undefined as string | undefined
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  
  // Profile state
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Passkey state
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [passkeyLabel, setPasskeyLabel] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);

  // MFA functional state
  const [mfaStatus, setMfaStatus] = useState({
    emailOtpEnabled: false,
    totpEnabled: false,
    totpConfirmed: false
  });
  const [mfaLoading, setMfaLoading] = useState(false);
  
  // TOTP Setup state
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qrCodeBase64: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpVerifyError, setTotpVerifyError] = useState<string | null>(null);

  // Logout/Sessions confirm modals state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<any | null>(null);

  useEffect(() => {
    if (store.userProfile) {
      setFirstName(store.userProfile.firstName || '');
      setLastName(store.userProfile.lastName || '');
      loadPasskeys();
      loadMfaStatus();
    }
  }, [store.userProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File exceeds 5MB size limit.');
      setAvatarSuccess(false);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setAvatarError('Only PNG, JPEG and WEBP formats are allowed.');
      setAvatarSuccess(false);
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(false);

    try {
      await store.uploadAvatar(file);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload photo');
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions' && store.userProfile) {
      store.loadSessions();
    }
  }, [activeTab, store.userProfile]);

  const loadPasskeys = async () => {
    try {
      const list = await listPasskeysApi();
      setPasskeys(list);
    } catch (err) {
      console.error('Failed to load passkeys', err);
    }
  };

  const loadMfaStatus = async () => {
    setMfaLoading(true);
    try {
      if (store.userProfile) {
        const status = await getMfaStatusApi();
        setMfaStatus(status);
      }
    } catch (err) {
      console.error('Failed to load MFA status', err);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError(null);
    try {
      if (store.userProfile) {
        await store.updateProfile(firstName, lastName);
      } else {
        user.firstName = firstName;
        user.lastName = lastName;
        user.fullName = `${firstName} ${lastName}`.trim();
      }
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      if (store.userProfile) {
        await store.changePassword(currentPassword, newPassword);
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordError('You must be signed in with a real session to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyError(null);
    setPasskeySuccess(null);
    try {
      if (!store.userProfile) {
        setPasskeyError('You must be signed in with a real session to add a passkey.');
        return;
      }
      
      const options = await getPasskeyRegisterOptionsApi();
      
      const challengeBytes = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const userIdBytes = Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBytes,
          rp: options.rp,
          user: {
            id: userIdBytes,
            name: options.user.name,
            displayName: options.user.displayName
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          excludeCredentials: options.excludeCredentials.map((c: any) => ({
            type: c.type,
            id: Uint8Array.from(atob(c.id.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))
          })),
          authenticatorSelection: options.authenticatorSelection,
          attestation: options.attestation
        }
      }) as PublicKeyCredential;

      if (!credential) throw new Error('No credential returned');

      const response = credential.response as AuthenticatorAttestationResponse;
      const regRequest = {
        credentialId: credential.id,
        attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
        label: passkeyLabel || 'My Passkey',
        transports: '["internal"]'
      };

      await verifyPasskeyRegisterApi(regRequest);
      setPasskeySuccess('Passkey registered successfully!');
      setPasskeyLabel('');
      loadPasskeys();
      store.syncProfile();
    } catch (err: any) {
      setPasskeyError(err.message || 'Passkey registration failed');
    }
  };

  const handleDeletePasskey = async (credId: string) => {
    try {
      await deletePasskeyApi(credId);
      setPasskeySuccess('Passkey deleted.');
      loadPasskeys();
      store.syncProfile();
    } catch (err: any) {
      setPasskeyError(err.message || 'Failed to delete passkey');
    }
  };

  const handleToggleEmailMfa = async () => {
    if (!store.userProfile) return;
    try {
      if (mfaStatus.emailOtpEnabled) {
        await disableEmailMfaApi();
      } else {
        await enableEmailMfaApi();
      }
      await loadMfaStatus();
    } catch (err: any) {
      console.error('Failed to toggle Email MFA', err);
    }
  };

  const handleToggleTotpMfa = async () => {
    if (!store.userProfile) return;
    try {
      if (mfaStatus.totpConfirmed) {
        await disableTotpMfaApi();
        await loadMfaStatus();
      } else {
        const setup = await setupTotpMfaApi();
        setTotpSetupData(setup);
      }
    } catch (err: any) {
      console.error('Failed to toggle TOTP MFA', err);
    }
  };

  const handleConfirmTotp = async () => {
    setTotpVerifyError(null);
    try {
      const parsedCode = parseInt(totpVerifyCode, 10);
      if (isNaN(parsedCode)) {
        throw new Error('Code must be a number.');
      }
      await confirmTotpMfaApi(parsedCode);
      setTotpSetupData(null);
      setTotpVerifyCode('');
      await loadMfaStatus();
    } catch (err: any) {
      setTotpVerifyError(err.message || 'Failed to verify OTP code.');
    }
  };

  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/home');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmRevokeSession = async () => {
    if (!sessionToRevoke) return;
    try {
      await store.revokeSession(sessionToRevoke.id);
      if (sessionToRevoke.current) {
        // Revoked current session, sign out locally
        await store.logout();
      }
      setSessionToRevoke(null);
    } catch (err) {
      console.error('Failed to revoke session', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-5 h-5 text-base-content/60" />;
      case 'tablet': return <Tablet className="w-5 h-5 text-base-content/60" />;
      default: return <Monitor className="w-5 h-5 text-base-content/60" />;
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">
      {/* Navbar */}
      <header className="navbar bg-base-200 border-b border-base-300 px-6 py-4 shadow-sm z-30">
        <div className="navbar-start">
          <button 
            onClick={handleNavigateHome}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-extrabold text-primary-content text-xl shadow-md">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-base-content">
              Project<span className="text-primary">Scarlet</span>
            </span>
          </button>
        </div>

        <div className="navbar-end gap-4">
          {/* User badge */}
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

          {/* Go Home Button */}
          <button 
            onClick={handleNavigateHome} 
            className="btn btn-ghost btn-circle border border-base-300 hover:bg-base-300/60 shadow-sm cursor-pointer"
            aria-label="Go home"
          >
            <Home className="w-5 h-5 text-base-content" />
          </button>
        </div>
      </header>

      {/* Main Settings Panel */}
      <main className="flex-1 w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Tabs Sidebar */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-base-200 p-5 rounded-3xl border border-base-300 space-y-1 shadow-sm">
            <h3 className="text-xs font-black uppercase text-base-content/55 px-3 mb-4 tracking-widest">Settings</h3>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full py-3 px-4 text-xs font-bold rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-primary text-primary-content shadow-md' 
                  : 'text-base-content/75 hover:bg-base-300/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                Profile Settings
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full py-3 px-4 text-xs font-bold rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-primary text-primary-content shadow-md' 
                  : 'text-base-content/75 hover:bg-base-300/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4" />
                Security &amp; MFA
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full py-3 px-4 text-xs font-bold rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'sessions' 
                  ? 'bg-primary text-primary-content shadow-md' 
                  : 'text-base-content/75 hover:bg-base-300/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                Active Sessions
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Logout Section */}
          <div className="bg-base-200 p-5 rounded-3xl border border-base-300 shadow-sm text-center">
            {store.userProfile ? (
              <button 
                onClick={handleLogout}
                className="btn btn-error btn-outline w-full gap-2 rounded-2xl text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Session
              </button>
            ) : (
              <div className="text-xs text-base-content/40 italic py-1">Mock Guest Profile</div>
            )}
          </div>
        </aside>

        {/* Right Settings Content */}
        <section className="flex-1 bg-base-200 border border-base-300 rounded-3xl p-6 md:p-8 shadow-sm grow">
          
          {/* Profile Settings View */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-base-300 pb-4">
                <h2 className="text-xl font-black text-base-content">Profile Settings</h2>
                <p className="text-xs text-base-content/60">Configure your personal name and identification parameters</p>
              </div>

              {/* Profile Picture Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-base-300">
                <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden shadow-md border border-base-300">
                  {user.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt={user.fullName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-black text-3xl">
                      {getInitials(user.fullName)}
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                  {/* File Input */}
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAvatarChange}
                    disabled={store.loading}
                  />
                </div>
                
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="font-bold text-sm text-base-content">Profile Picture</h3>
                  <p className="text-xs text-base-content/50">PNG, JPEG or WEBP (Max 5MB)</p>
                  {avatarSuccess && (
                    <p className="text-xs text-success font-semibold flex items-center gap-1 justify-center sm:justify-start">
                      <CheckCircle className="w-3.5 h-3.5" /> Photo updated successfully!
                    </p>
                  )}
                  {avatarError && (
                    <p className="text-xs text-error font-semibold flex items-center gap-1 justify-center sm:justify-start">
                      <AlertTriangle className="w-3.5 h-3.5" /> {avatarError}
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="fieldset">
                  <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">First Name</span>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="First name"
                  />
                </div>

                <div className="fieldset">
                  <span className="fieldset-label font-bold text-xs uppercase tracking-wider text-base-content/60">Last Name</span>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Last name"
                  />
                </div>

                <button type="submit" className="btn btn-primary gap-2 mt-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>

                {profileSuccess && (
                  <div className="alert alert-success text-xs py-2 shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Profile details updated successfully.</span>
                  </div>
                )}

                {profileError && (
                  <div className="alert alert-error text-xs py-2 shadow-sm">
                    <span>{profileError}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security & MFA Settings View */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="space-y-1 border-b border-base-300 pb-4">
                <h2 className="text-xl font-black text-base-content">Security &amp; MFA</h2>
                <p className="text-xs text-base-content/60">Manage your passwords, biometric passkeys, and multi-factor challenge parameters</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Change Password & MFA */}
                <div className="space-y-6">
                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="bg-base-300/40 p-5 rounded-2xl border border-base-300 space-y-4">
                    <div className="flex items-center gap-2 border-b border-base-300 pb-2.5">
                      <Key className="w-4.5 h-4.5 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-base-content/85">Change Password</h4>
                    </div>

                    <div className="fieldset p-0">
                      <span className="fieldset-label text-xs">Current Password</span>
                      <input 
                        type="password" 
                        className="input input-sm input-bordered w-full" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="fieldset p-0">
                      <span className="fieldset-label text-xs">New Password</span>
                      <input 
                        type="password" 
                        className="input input-sm input-bordered w-full" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                      />
                    </div>

                    <button type="submit" className="btn btn-sm btn-primary w-full mt-2">
                      Update Password
                    </button>

                    {passwordSuccess && (
                      <div className="alert alert-success text-xs py-1.5 shadow-sm">
                        <span>Password updated.</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="alert alert-error text-xs py-1.5 shadow-sm">
                        <span>{passwordError}</span>
                      </div>
                    )}
                  </form>

                  {/* Multi-Factor Authentication */}
                  <div className="bg-base-300/40 p-5 rounded-2xl border border-base-300 space-y-4">
                    <div className="flex items-center gap-2 border-b border-base-300 pb-2.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-base-content/85">Multi-Factor Authentication</h4>
                    </div>
                    <p className="text-xs text-base-content/60 leading-relaxed">
                      Toggle verification factors for secure login challenges.
                    </p>

                    {mfaLoading ? (
                      <div className="flex justify-center p-4">
                        <span className="loading loading-spinner text-primary loading-sm" />
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {/* Email OTP Toggle */}
                        <div className="flex items-center justify-between p-3 bg-base-100 rounded-xl border border-base-300/50">
                          <div>
                            <div className="text-xs font-bold">Email One-Time Password</div>
                            <div className="text-2xs text-base-content/50">Code sent via email</div>
                          </div>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary toggle-sm cursor-pointer"
                            disabled={!store.userProfile}
                            checked={mfaStatus.emailOtpEnabled}
                            onChange={handleToggleEmailMfa}
                          />
                        </div>

                        {/* Authenticator App Toggle */}
                        <div className="flex items-center justify-between p-3 bg-base-100 rounded-xl border border-base-300/50">
                          <div>
                            <div className="text-xs font-bold">Authenticator App (TOTP)</div>
                            <div className="text-2xs text-base-content/50">Google/Microsoft Authenticator</div>
                          </div>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-primary toggle-sm cursor-pointer"
                            disabled={!store.userProfile}
                            checked={mfaStatus.totpConfirmed}
                            onChange={handleToggleTotpMfa}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Passkeys */}
                <div className="bg-base-300/40 p-5 rounded-2xl border border-base-300 space-y-4 h-fit">
                  <div className="flex items-center gap-2 border-b border-base-300 pb-2.5">
                    <Fingerprint className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-base-content/85">WebAuthn Passkeys</h4>
                  </div>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    Biometric or hardware security key registration for quick and passwordless logins.
                  </p>

                  <div className="space-y-2">
                    <input 
                      type="text" 
                      className="input input-sm input-bordered w-full" 
                      value={passkeyLabel}
                      onChange={(e) => setPasskeyLabel(e.target.value)}
                      placeholder="Passkey label (e.g. Work Laptop)"
                    />
                    <button 
                      onClick={handleRegisterPasskey}
                      className="btn btn-sm btn-secondary w-full gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Passkey
                    </button>
                  </div>

                  {passkeySuccess && (
                    <div className="alert alert-success text-xs py-1.5">
                      <span>{passkeySuccess}</span>
                    </div>
                  )}

                  {passkeyError && (
                    <div className="alert alert-error text-xs py-1.5">
                      <span>{passkeyError}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2">
                    <h5 className="text-xs font-bold text-base-content/65 uppercase tracking-wider">Registered Keys</h5>
                    {passkeys.length === 0 ? (
                      <p className="text-xs text-base-content/40 italic">No passkeys configured.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {passkeys.map((pk) => (
                          <div key={pk.credentialId} className="flex items-center justify-between p-2.5 bg-base-100 rounded-xl border border-base-300/50 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <Fingerprint className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="font-bold truncate">{pk.label}</span>
                            </div>
                            <button 
                              onClick={() => handleDeletePasskey(pk.credentialId)}
                              className="btn btn-xs btn-ghost btn-circle text-error cursor-pointer"
                              aria-label="Delete key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions Settings View */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="space-y-1 border-b border-base-300 pb-4">
                <h2 className="text-xl font-black text-base-content">Active Sessions</h2>
                <p className="text-xs text-base-content/60">Manage other devices and active locations logged into your security profile</p>
              </div>

              {!store.userProfile ? (
                <div className="p-4 bg-base-300/30 rounded-2xl text-center text-xs text-base-content/40 italic">
                  Sign in with an active credentials account to view login session history.
                </div>
              ) : store.sessions.length === 0 ? (
                <div className="flex justify-center p-8">
                  <span className="loading loading-spinner text-primary loading-md" />
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="table table-md w-full border border-base-300/60 rounded-2xl overflow-hidden bg-base-300/10">
                    <thead>
                      <tr className="bg-base-300/40 text-xs font-bold uppercase tracking-wider text-base-content/60">
                        <th className="py-3 px-4">Device / Client</th>
                        <th>IP Address</th>
                        <th>Logged In</th>
                        <th>Last Active</th>
                        <th className="text-right py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold">
                      {store.sessions.map((s) => (
                        <tr key={s.id} className="border-b border-base-300/60 hover:bg-base-300/20 transition-all">
                          <td className="py-4 px-4 flex items-center gap-3">
                            <div className="p-2 bg-base-300/70 rounded-xl">
                              {getDeviceIcon(s.deviceDetails)}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                {s.os} • {s.browser}
                                {s.current && (
                                  <span className="badge badge-success badge-sm py-0.5 px-2 text-2xs font-extrabold uppercase text-success-content tracking-wider shadow-inner">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-3xs text-base-content/40 font-mono tracking-widest uppercase">
                                {s.id.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-base-content/75">{s.ipAddress || 'Unknown IP'}</td>
                          <td className="text-base-content/65">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="text-base-content/65">{new Date(s.lastActiveAt).toLocaleString()}</td>
                          <td className="text-right py-4 px-4">
                            <button
                              onClick={() => setSessionToRevoke(s)}
                              className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* TOTP Setup Modal overlay */}
      {totpSetupData && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm space-y-4 p-6 bg-base-200 border-2 border-base-300 rounded-box shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Setup Authenticator
            </h3>
            
            <p className="text-xs text-base-content/60 leading-relaxed">
              Scan the QR code below using Google Authenticator, Microsoft Authenticator, or 1Password, or enter the secret key manually.
            </p>

            {/* QR Code */}
            <div className="flex justify-center p-3 bg-white rounded-2xl border border-base-300 w-fit mx-auto shadow-inner">
              <img 
                src={totpSetupData.qrCodeBase64} 
                alt="TOTP QR Code" 
                className="w-44 h-44" 
              />
            </div>

            {/* Secret key */}
            <div className="bg-base-300/60 p-3 rounded-xl border border-base-300 text-center">
              <span className="text-2xs uppercase font-bold text-base-content/50 block mb-1">Secret Key</span>
              <code className="text-xs font-mono select-all break-all text-primary font-bold">{totpSetupData.secret}</code>
            </div>

            {/* Verification Code Input */}
            <div className="fieldset p-0 space-y-1">
              <span className="fieldset-label text-xs uppercase tracking-wider text-base-content/60">Enter 6-Digit Code</span>
              <input 
                type="text" 
                maxLength={6}
                pattern="[0-9]*"
                value={totpVerifyCode}
                onChange={(e) => setTotpVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="input input-bordered w-full text-center tracking-widest font-mono font-bold text-lg"
                placeholder="000000"
              />
            </div>

            {totpVerifyError && (
              <div className="alert alert-error text-xs py-1.5 shadow-sm">
                <span>{totpVerifyError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                className="btn btn-ghost flex-1 text-xs font-bold cursor-pointer" 
                onClick={() => { setTotpSetupData(null); setTotpVerifyCode(''); setTotpVerifyError(null); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary flex-1 text-xs font-bold cursor-pointer" 
                onClick={handleConfirmTotp} 
                disabled={totpVerifyCode.length !== 6}
              >
                Verify &amp; Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm space-y-4 p-6 bg-base-200 border-2 border-base-300 rounded-box shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <LogOut className="w-5 h-5 text-error animate-pulse" />
              Sign Out Session
            </h3>
            
            <p className="text-xs text-base-content/60 leading-relaxed">
              Are you sure you want to sign out of your current session? You will need to enter your credentials again to log back in.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                className="btn btn-ghost flex-1 text-xs font-bold cursor-pointer" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error flex-1 text-xs font-bold cursor-pointer" 
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await store.logout();
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Revocation Confirmation Modal */}
      {sessionToRevoke && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm space-y-4 p-6 bg-base-200 border-2 border-base-300 rounded-box shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Revoke Session
            </h3>
            
            <p className="text-xs text-base-content/60 leading-relaxed">
              Are you sure you want to revoke the session on <strong>{sessionToRevoke.os} • {sessionToRevoke.browser}</strong>? 
              {sessionToRevoke.current ? (
                <span className="text-error block mt-1.5 font-bold">
                  Warning: This is your current session. You will be logged out immediately.
                </span>
              ) : (
                <span className="block mt-1.5">
                  The client at IP <code>{sessionToRevoke.ipAddress}</code> will be signed out.
                </span>
              )}
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                className="btn btn-ghost flex-1 text-xs font-bold cursor-pointer" 
                onClick={() => setSessionToRevoke(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error flex-1 text-xs font-bold cursor-pointer" 
                onClick={handleConfirmRevokeSession}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
