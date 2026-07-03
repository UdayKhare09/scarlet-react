import { apiClient } from './apiClient';

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  role: string;
  createdAt: string;
  hasPassword: boolean;
  hasPasskey: boolean;
  hasOAuth2: boolean;
  profilePictureUrl?: string;
}

export interface AuthResponse {
  message?: string;
  user?: UserResponse;
  mfaRequired?: boolean;
  pendingToken?: string;
  availableMfaMethods?: string[];
}

export async function loginApi(email: string, password: String): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
  return res.data;
}

export async function registerApi(firstName: string, lastName: string, email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/register', { firstName, lastName, email, password });
  return res.data;
}

export async function logoutApi(): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/logout');
  return res.data;
}

export async function refreshApi(): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/refresh');
  return res.data;
}

export async function verifyEmailApi(token: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  return res.data;
}

export async function forgotPasswordApi(email: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`);
  return res.data;
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(
    `/api/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`
  );
  return res.data;
}

export async function sendEmailOtpApi(pendingToken: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`/api/mfa/send-email-otp?pendingToken=${encodeURIComponent(pendingToken)}`);
  return res.data;
}

export async function completeMfaApi(pendingToken: string, method: string, code: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/mfa/complete', { pendingToken, method, code });
  return res.data;
}

// User Profile sync API from scarlet-user service
export async function syncUserApi(): Promise<any> {
  const res = await apiClient.get('/api/users/me');
  return res.data;
}

// Get Authenticated User status from scarlet-auth service
export async function getAuthUserApi(): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>('/api/auth/me');
  return res.data;
}

// WebAuthn Passkey operations
export async function getPasskeyRegisterOptionsApi(): Promise<any> {
  const res = await apiClient.get('/api/webauthn/register/options');
  return res.data;
}

export async function verifyPasskeyRegisterApi(request: any): Promise<any> {
  const res = await apiClient.post('/api/webauthn/register', request);
  return res.data;
}

export async function getPasskeyAuthenticateOptionsApi(email?: string): Promise<any> {
  const res = await apiClient.get(`/api/webauthn/authenticate/options${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  return res.data;
}

export async function verifyPasskeyAuthenticateApi(request: any): Promise<any> {
  const res = await apiClient.post('/api/webauthn/authenticate', request);
  return res.data;
}

export async function listPasskeysApi(): Promise<any[]> {
  const res = await apiClient.get('/api/webauthn/passkeys');
  return res.data;
}

export async function deletePasskeyApi(credentialId: string): Promise<any> {
  const res = await apiClient.delete(`/api/webauthn/passkeys/${encodeURIComponent(credentialId)}`);
  return res.data;
}

// MFA Setup operations
export async function getMfaStatusApi(): Promise<any> {
  const res = await apiClient.get('/api/mfa/status');
  return res.data;
}

export async function enableEmailMfaApi(): Promise<any> {
  const res = await apiClient.post('/api/mfa/email-otp/enable');
  return res.data;
}

export async function disableEmailMfaApi(): Promise<any> {
  const res = await apiClient.post('/api/mfa/email-otp/disable');
  return res.data;
}

export async function setupTotpMfaApi(): Promise<any> {
  const res = await apiClient.post('/api/mfa/totp/setup');
  return res.data;
}

export async function confirmTotpMfaApi(code: number): Promise<any> {
  const res = await apiClient.post(`/api/mfa/totp/confirm?code=${code}`);
  return res.data;
}

export async function disableTotpMfaApi(): Promise<any> {
  const res = await apiClient.post('/api/mfa/totp/disable');
  return res.data;
}

export async function updateProfileApi(firstName: string, lastName: string): Promise<any> {
  const res = await apiClient.put<any>('/api/users/me', { firstName, lastName });
  return res.data;
}

export async function uploadAvatarApi(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/api/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/change-password', { currentPassword, newPassword });
  return res.data;
}

// Session management
export async function listSessionsApi(): Promise<any[]> {
  const res = await apiClient.get<any[]>('/api/auth/sessions');
  return res.data;
}

export async function revokeSessionApi(id: string): Promise<any> {
  const res = await apiClient.delete(`/api/auth/sessions/${encodeURIComponent(id)}`);
  return res.data;
}

