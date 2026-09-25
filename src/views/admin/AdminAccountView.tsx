import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Key,
  Mail,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
} from 'lucide-react';

interface AdminAccountViewProps {
  onLoggedOut: () => void;
}

export const AdminAccountView: React.FC<AdminAccountViewProps> = ({ onLoggedOut }) => {
  const { user, signOut, sendPasswordReset, adminEmailConfigured } = useAuth();
  const [resetToast, setResetToast] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    const res = await sendPasswordReset(user.email);
    setIsSendingReset(false);
    if (res.success) {
      setResetToast(`Password reset link dispatched to ${user.email}. Check your inbox.`);
      setTimeout(() => setResetToast(null), 5000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onLoggedOut();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b border-[#232635] pb-5">
        <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
          Author Administrator Account
        </h2>
        <p className="text-xs text-[#8e887a] mt-0.5">
          Manage your verified administrator session and credentials.
        </p>
      </div>

      {resetToast && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetToast}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="p-6 rounded-xl bg-[#11131c] border border-[#232635] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="font-cinzel font-bold text-[#f5efeb] text-sm">
              Matthew E. Messmer
            </div>
            <div className="text-xs text-[#c5a059] font-mono">
              {user?.email || adminEmailConfigured}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#1f2231] space-y-3 text-xs text-[#aba597]">
          <div className="flex justify-between">
            <span>Authentication Provider:</span>
            <span className="text-[#f5efeb]">Firebase Authentication (Email/Password)</span>
          </div>
          <div className="flex justify-between">
            <span>Authorization Status:</span>
            <span className="text-emerald-400 font-semibold uppercase">Authorized Administrator</span>
          </div>
          <div className="flex justify-between">
            <span>Primary Root Email:</span>
            <span className="font-mono text-[#c5a059]">{adminEmailConfigured}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#1f2231] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={isSendingReset}
            onClick={handlePasswordReset}
            className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isSendingReset ? 'Sending Reset...' : 'Send Password Reset Email'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-cinzel rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Admin</span>
          </button>
        </div>
      </div>

      {/* Security Policies */}
      <div className="p-5 rounded-xl bg-[#0c0d12] border border-[#212332] space-y-2 text-xs text-[#8e887a]">
        <div className="flex items-center gap-1.5 text-[#c5a059] font-cinzel font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Security Architecture & Rules</span>
        </div>
        <p className="leading-relaxed">
          Administrative writes to books, covers, series ordering, and newsletter records are enforced at the Firestore and Cloud Storage level. Passwords are never stored in databases or local cache.
        </p>
      </div>
    </div>
  );
};
