import { create } from 'zustand';
import {
  loginApi,
  registerApi,
  logoutApi,
  completeMfaApi,
  syncUserApi,
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userProfile: null,
  loading: false,
  error: null,
  logs: [],
  mfaChallenge: null,

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
      set({ userProfile: res.user || null, loading: false });
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
      const res = await registerApi(fullName, email, password);
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
      
      // Load user profile from scarlet-user downstream
      const profile = await syncUserApi();
      
      set({
        userProfile: {
          id: profile.id,
          email: profile.email,
          fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          role: 'ROLE_USER',
          createdAt: profile.createdAt,
          hasPassword: true,
          hasPasskey: false, // will update on dashboard load
          hasOAuth2: false,
        },
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
      const profile = await syncUserApi();
      set({
        userProfile: {
          id: profile.id,
          email: profile.email,
          fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          role: 'ROLE_USER',
          createdAt: profile.createdAt,
          hasPassword: true,
          hasPasskey: false, // passkeys list will be fetched in component
          hasOAuth2: false,
        },
        loading: false,
      });
    } catch (err: any) {
      set({ userProfile: null, loading: false });
    }
  },
}));
