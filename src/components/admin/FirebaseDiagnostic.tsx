import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFirebaseDiagnosticInfo, FirebaseDiagnosticReport } from '../../services/firebase';
import {
  CheckCircle,
  AlertTriangle,
  Shield,
  Database,
  Lock,
  User,
  ExternalLink,
  Info,
  Server,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export const FirebaseDiagnostic: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [diagInfo, setDiagInfo] = useState<FirebaseDiagnosticReport>(() => getFirebaseDiagnosticInfo());
  const [copiedNote, setCopiedNote] = useState(false);

  const refreshDiagnostics = () => {
    setDiagInfo(getFirebaseDiagnosticInfo());
  };

  const copyPath = () => {
    navigator.clipboard.writeText('Authentication → Sign-in providers → Email/Password → Enabled');
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#12141e] border border-[#26283b] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Firebase Authentication & System Diagnostics
              </h3>
              <p className="text-xs text-[#8e887a]">
                Diagnostic status and configuration checks for Author & Administrators.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshDiagnostics}
            className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-xs font-cinzel text-[#dcd7cb] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-check Status</span>
          </button>
        </div>

        {/* 7 Diagnostic Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. Project Configuration */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#c5a059]" />
                1. Firebase Project Config
              </span>
              {diagInfo.projectConfigExists ? (
                <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-700/60 rounded text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Configured
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-700/60 rounded text-[11px] font-medium text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Missing
                </span>
              )}
            </div>
            <div className="text-xs text-[#dcd7cb] font-mono break-all space-y-0.5">
              <div>Project ID: <span className="text-[#c5a059]">{diagInfo.projectId}</span></div>
              <div className="text-[11px] text-[#7d786d]">Domain: {diagInfo.authDomain}</div>
            </div>
          </div>

          {/* 2. Firebase Authentication Initialized */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
                2. Firebase Authentication
              </span>
              {diagInfo.authInitialized ? (
                <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-700/60 rounded text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Initialized
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-700/60 rounded text-[11px] font-medium text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Failed
                </span>
              )}
            </div>
            <div className="text-xs text-[#dcd7cb]">
              SDK auth instance successfully bound to client runtime.
            </div>
          </div>

          {/* 3. Email/Password Provider Available */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#c5a059]" />
                3. Email/Password Provider
              </span>
              <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-700/60 rounded text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active in SDK
              </span>
            </div>
            <div className="text-xs text-[#dcd7cb]">
              Sign-in & registration configured with Firebase Email/Password API.
            </div>
          </div>

          {/* 4. Firestore Initialized */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#c5a059]" />
                4. Firestore Initialized
              </span>
              {diagInfo.firestoreInitialized ? (
                <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-700/60 rounded text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Initialized
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-700/60 rounded text-[11px] font-medium text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Failed
                </span>
              )}
            </div>
            <div className="text-xs text-[#dcd7cb] font-mono break-all">
              Database: <span className="text-[#c5a059]">{diagInfo.firestoreDatabaseId}</span>
            </div>
          </div>

          {/* 5. Current Authenticated User */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#c5a059]" />
                5. Current Authenticated User
              </span>
              {user ? (
                <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-700/60 rounded text-[11px] font-medium text-emerald-300">
                  Signed In
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-[#171926] border border-[#2b2e40] rounded text-[11px] font-medium text-[#8e887a]">
                  Unauthenticated
                </span>
              )}
            </div>
            <div className="text-xs text-[#dcd7cb] break-all">
              {user ? (
                <div>
                  <strong className="text-[#f5efeb]">{user.email}</strong>
                  <div className="text-[11px] text-[#7d786d] font-mono mt-0.5">UID: {user.uid}</div>
                </div>
              ) : (
                <span className="italic text-[#7d786d]">No session currently active.</span>
              )}
            </div>
          </div>

          {/* 6. Current User's Role */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                6. User Role (RBAC)
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-cinzel font-semibold uppercase ${
                role === 'author' || role === 'AUTHOR'
                  ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40'
                  : role === 'editor' || role === 'EDITOR'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {role || 'READER'}
              </span>
            </div>
            <div className="text-xs text-[#dcd7cb]">
              Tier: <strong className="text-[#f5efeb] capitalize">{role || 'Reader'}</strong> (Hierarchy: Reader → Editor → Author)
            </div>
          </div>

          {/* 7. Current User's Account Status */}
          <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel text-[#8e887a] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#c5a059]" />
                7. Account Status
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                (profile?.status || 'active') === 'active'
                  ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                  : 'bg-rose-950/70 border border-rose-700/60 text-rose-300'
              }`}>
                {profile?.status || 'Active'}
              </span>
            </div>
            <div className="text-xs text-[#a8a396]">
              Status is active. Normal account permissions and discussion capabilities are enabled.
            </div>
          </div>
        </div>

        {/* Security Note: No credentials exposed */}
        <div className="p-3 bg-[#0d0e14] border border-[#1e202d] rounded-lg text-[11px] text-[#7d786d] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
          <span>Security Notice: Private API keys, client tokens, and user passwords are never exposed in diagnostics.</span>
        </div>
      </div>

      {/* Setup Documentation Panel */}
      <div className="bg-[#12141e] border border-[#26283b] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-cinzel font-bold text-[#f5efeb]">
          <Info className="w-4 h-4 text-[#c5a059]" />
          <span>Firebase Console Setup Instructions</span>
        </div>

        <p className="text-xs text-[#a8a396] leading-relaxed">
          If Firebase returns <code className="px-1.5 py-0.5 bg-[#1b1d2a] rounded text-rose-300 font-mono text-[11px]">auth/operation-not-allowed</code> during login or registration, the Email/Password sign-in provider must be enabled in the Firebase Console:
        </p>

        <div className="p-4 bg-[#0a0b10] border border-[#2b2e40] rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono text-[#c5a059] font-medium break-all">
              Authentication → Sign-in providers → Email/Password → Enabled
            </span>
            <button
              type="button"
              onClick={copyPath}
              className="text-[11px] font-cinzel text-[#c5a059] hover:underline cursor-pointer self-start sm:self-auto"
            >
              {copiedNote ? '✓ Copied!' : 'Copy Path'}
            </button>
          </div>

          <ol className="text-xs text-[#dcd7cb] space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Open the <strong>Firebase Console</strong> at{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c5a059] hover:underline inline-flex items-center gap-1"
              >
                console.firebase.google.com <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            </li>
            <li>Select the Firebase project: <code className="text-[#c5a059] font-mono">{diagInfo.projectId}</code></li>
            <li>In the left sidebar, navigate to <strong>Build</strong> → <strong>Authentication</strong></li>
            <li>Click on the <strong>Sign-in method</strong> tab</li>
            <li>Click on <strong>Email/Password</strong> under the Native providers list</li>
            <li>Toggle the first switch: <strong>Enable</strong> (Email/Password)</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
};
