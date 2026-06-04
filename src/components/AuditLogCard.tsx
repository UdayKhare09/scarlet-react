import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Terminal, Shield } from 'lucide-react';

export default function AuditLogCard() {
  const { logs } = useAuthStore();

  return (
    <div className="rounded-2xl glass p-6 space-y-6 w-full">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Terminal className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Client Audit Console</h3>
          <p className="text-xs text-gray-400 font-medium">Real-time state and action history logger</p>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-black/60 p-4 h-96 overflow-y-auto font-mono text-sm leading-relaxed text-emerald-400 space-y-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <Shield className="w-8 h-8 text-gray-600 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">Console Idle</p>
            <p className="text-xs text-gray-700">Audit logs will stream here as actions occur.</p>
          </div>
        ) : (
          logs.map((entry, i) => (
            <div className="flex items-start gap-2.5 py-1 border-b border-brand-border/30 last:border-0" key={i}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0 animate-pulse" />
              <span className="break-all">{entry}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
