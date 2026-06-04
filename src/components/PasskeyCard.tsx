import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getPasskeyRegisterOptionsApi,
  verifyPasskeyRegisterApi,
  listPasskeysApi,
  deletePasskeyApi,
} from '../api/authApi';
import { Fingerprint, Key, Trash2, ShieldCheck, AlertCircle, Plus } from 'lucide-react';

export default function PasskeyCard() {
  const { addLog } = useAuthStore();
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPasskeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPasskeysApi();
      setPasskeys(data);
    } catch (err: any) {
      setError(err.message);
      addLog(`Failed to load passkeys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setActionLoading(true);
    setError(null);
    addLog(`Requesting passkey registration options for label "${label}"...`);
    try {
      const options = await getPasskeyRegisterOptionsApi();
      addLog('Registration options received. Invoking browser credentials API...');

      // Convert challenges and ids from base64url back to byte arrays
      const challengeBytes = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const userBytes = Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBytes,
          rp: options.rp,
          user: {
            id: userBytes,
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

      if (!credential) throw new Error('Registration canceled by user or not supported.');
      addLog('Passkey credential generated. Sending attestation to backend...');

      const response = credential.response as AuthenticatorAttestationResponse;
      const regRequest = {
        credentialId: credential.id,
        attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
        label: label,
        transports: JSON.stringify(response.getTransports ? response.getTransports() : [])
      };

      await verifyPasskeyRegisterApi(regRequest);
      addLog('Passkey registered and verified successfully!');
      setLabel('');
      await fetchPasskeys();
      
      // Update hasPasskey flag in userProfile
      const store = useAuthStore.getState();
      if (store.userProfile) {
        store.userProfile.hasPasskey = true;
      }
    } catch (err: any) {
      setError(err.message);
      addLog(`Passkey registration failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePasskey = async (credentialId: string, itemLabel: string) => {
    if (!window.confirm(`Are you sure you want to delete passkey "${itemLabel}"?`)) return;
    setActionLoading(true);
    setError(null);
    addLog(`Deleting passkey: ${itemLabel}...`);
    try {
      await deletePasskeyApi(credentialId);
      addLog('Passkey deleted.');
      await fetchPasskeys();
      
      const store = useAuthStore.getState();
      if (store.userProfile && passkeys.length <= 1) {
        store.userProfile.hasPasskey = false;
      }
    } catch (err: any) {
      setError(err.message);
      addLog(`Failed to delete passkey: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Intro info panel */}
      <div className="rounded-2xl glass p-6 space-y-4">
        <div className="flex gap-4">
          <div className="p-3 bg-teal-500/10 rounded-xl flex-shrink-0">
            <Fingerprint className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Biometric Passkeys (WebAuthn)</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Register your device biometrics (fingerprint scanner, Face ID, Windows Hello or USB security keys) as a passkey. Passkeys are completely passwordless, phishing-resistant, and secure.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Register Form */}
        <div className="rounded-2xl glass p-6 space-y-6">
          <h4 className="text-md font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-scarlet-light" />
            Register Device Passkey
          </h4>

          <form onSubmit={handleRegisterPasskey} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passkey Label</label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook TouchID, YubiKey"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-brand-border text-white text-sm outline-none focus:border-scarlet"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !label.trim()}
              className="w-full py-2.5 rounded-lg bg-scarlet hover:bg-scarlet-light text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <span className="spinner" /> : <Fingerprint className="w-4 h-4" />}
              Register Passkey
            </button>
          </form>
        </div>

        {/* Existing keys list */}
        <div className="rounded-2xl glass p-6 space-y-4">
          <h4 className="text-md font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-400" />
            Active Credentials
          </h4>

          {loading ? (
            <div className="flex justify-center p-6">
              <span className="spinner border-teal-400" />
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No passkeys registered on this profile yet.
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((p) => (
                <div key={p.credentialId} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-brand-border">
                  <div className="text-left space-y-1">
                    <div className="text-sm font-semibold text-white">{p.label}</div>
                    <div className="text-xs text-gray-500">
                      Used: {p.lastUsedAt ? new Date(p.lastUsedAt).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(p.credentialId, p.label)}
                    disabled={actionLoading}
                    className="p-2 rounded bg-red-950/20 text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-all cursor-pointer disabled:opacity-50"
                    title="Delete Passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
