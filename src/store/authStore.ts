import { create } from 'zustand';
import {
  loginApi,
  registerApi,
  logoutApi,
  completeMfaApi,
  syncUserApi,
  getAuthUserApi,
  updateProfileApi,
  changePasswordApi,
  listSessionsApi,
  revokeSessionApi,
  uploadAvatarApi,
} from '../api/authApi';
import type { UserResponse } from '../api/authApi';

interface MfaChallenge {
  pendingToken: string;
  methods: string[];
}

interface AuthState {
  userProfile: UserResponse | null;
  loading: boolean;
  error: string | null;
  logs: string[];
  mfaChallenge: MfaChallenge | null;
  
  // Actions
  addLog: (msg: string) => void;
  clearError: () => void;
  clearMfaChallenge: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<string>;
  completeMfa: (method: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncProfile: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sessions: any[];
  loadSessions: () => Promise<void>;
  revokeSession: (id: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userProfile: null,
  loading: false,
  error: null,
  logs: [],
  mfaChallenge: null,
  sessions: [],

  addLog: (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [`[${timestamp}] ${msg}`, ...state.logs.slice(0, 49)], // Keep last 50 logs
    }));
  },

  clearError: () => set({ error: null }),
  clearMfaChallenge: () => set({ mfaChallenge: null }),

  login: async (email, password) => {
    get().addLog(`Initiating login for ${email}...`);
    set({ loading: true, error: null });
    try {
      const res = await loginApi(email, password);
      if (res.mfaRequired && res.pendingToken && res.availableMfaMethods) {
        get().addLog(`MFA Required. Methods: ${res.availableMfaMethods.join(', ')}`);
        set({
          mfaChallenge: {
            pendingToken: res.pendingToken,
            methods: res.availableMfaMethods,
          },
          loading: false,
        });
        return false; // MFA needed
      }

      get().addLog(`Login successful. Syncing profile...`);
      await get().syncProfile();
      return true;
    } catch (err: any) {
      get().addLog(`Login failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (fullName, email, password) => {
    get().addLog(`Registering account for ${email}...`);
    set({ loading: true, error: null });
    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
      const lastName = lastNameParts.join(' ');
      const res = await registerApi(firstName, lastName || '', email, password);
      get().addLog(`Registration completed successfully.`);
      set({ loading: false });
      return res.message || 'Registration successful. Check your email to verify your account.';
    } catch (err: any) {
      get().addLog(`Registration failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  completeMfa: async (method, code) => {
    const challenge = get().mfaChallenge;
    if (!challenge) {
      throw new Error('No active MFA challenge session');
    }
    get().addLog(`Submitting ${method} verification...`);
    set({ loading: true, error: null });
    try {
      await completeMfaApi(challenge.pendingToken, method, code);
      get().addLog(`MFA verification successful. Syncing user profile...`);
      
      await get().syncProfile();
      
      set({
        mfaChallenge: null,
        loading: false,
      });
      return true;
    } catch (err: any) {
      get().addLog(`MFA verification failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    get().addLog(`Logging out...`);
    set({ loading: true });
    try {
      await logoutApi();
      get().addLog(`Session cleared.`);
      set({ userProfile: null, mfaChallenge: null, loading: false });
    } catch (err: any) {
      get().addLog(`Logout warning: ${err.message}`);
      set({ userProfile: null, mfaChallenge: null, loading: false });
    }
  },

  syncProfile: async () => {
    set({ loading: true });
    try {
      // Sync user profile in user service database and get profile details
      const profile = await syncUserApi();
      
      // Get authentication details from scarlet-auth service
      const authUser = await getAuthUserApi();
      
      set({
        userProfile: {
          ...authUser,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePictureUrl: profile.profilePictureUrl,
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        },
        loading: false,
      });
    } catch (err: any) {
      set({ userProfile: null, loading: false });
    }
  },

  updateProfile: async (firstName, lastName) => {
    get().addLog(`Updating profile name to: ${firstName} ${lastName}...`);
    set({ loading: true, error: null });
    try {
      await updateProfileApi(firstName, lastName);
      get().addLog(`Profile updated successfully. Re-syncing details...`);
      await get().syncProfile();
    } catch (err: any) {
      get().addLog(`Profile update failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    get().addLog(`Initiating password change...`);
    set({ loading: true, error: null });
    try {
      const res = await changePasswordApi(currentPassword, newPassword);
      get().addLog(res.message || `Password changed successfully.`);
      set({ loading: false });
    } catch (err: any) {
      get().addLog(`Password change failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loadSessions: async () => {
    try {
      const data = await listSessionsApi();
      set({ sessions: data });
    } catch (err: any) {
      get().addLog(`Failed to load active sessions: ${err.message}`);
    }
  },

  revokeSession: async (id: string) => {
    get().addLog(`Revoking session: ${id}...`);
    try {
      await revokeSessionApi(id);
      get().addLog(`Session revoked.`);
      const data = await listSessionsApi();
      set({ sessions: data });
    } catch (err: any) {
      get().addLog(`Failed to revoke session: ${err.message}`);
      throw err;
    }
  },

  uploadAvatar: async (file: File) => {
    get().addLog(`Uploading new profile picture...`);
    set({ loading: true, error: null });
    try {
      await uploadAvatarApi(file);
      get().addLog(`Avatar uploaded successfully. Syncing profile...`);
      await get().syncProfile();
    } catch (err: any) {
      get().addLog(`Avatar upload failed: ${err.message}`);
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
