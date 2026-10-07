import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Invalid email address or password.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12141d] border border-[#26283b] p-6 rounded-2xl w-full max-w-md text-[#f5efeb] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8e887a] hover:text-[#f5efeb] p-1 rounded-lg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-cinzel font-bold mb-4 text-[#f5efeb]">Account Sign In</h2>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-cinzel text-[#dcd7cb] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-cinzel text-[#dcd7cb] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#2e3146] text-[#8e887a] hover:text-[#f5efeb] hover:bg-[#1a1c2b] text-xs font-cinzel transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#c5a059] text-[#0c0d12] text-xs font-cinzel font-bold hover:bg-[#d6b26c] transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
