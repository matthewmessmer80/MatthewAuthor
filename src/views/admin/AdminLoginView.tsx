import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import { UserRole } from '../../types';
import {
  Shield,
  Lock,
  Mail,
  Key,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  UserCheck,
  HelpCircle,
  Sparkles,
  UserPlus,
  BookOpen,
  Info,
  ExternalLink,
} from 'lucide-react';

interface AdminLoginViewProps {
  onSuccess: (role?: UserRole) => void;
  onBackToSite: () => void;
  initialMode?: AuthMode;
}

export type AuthMode = 'sign-in' | 'register-reader' | 'first-time-setup' | 'forgot-password';

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onSuccess,
  onBackToSite,
  initialMode = 'sign-in',
}) => {
  useSEO('home', { title: 'Portal Sign In | Matthew E. Messmer', robots: 'noindex, nofollow' });

  const { signIn, registerReader, createAdminAccount, sendPasswordReset, adminEmailConfigured } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setResetSuccessMessage(null);
    if (newMode === 'first-time-setup' && !email) {
      setEmail(adminEmailConfigured);
    }
  };

  const isOperationNotAllowed =
    errorMessage &&
    (errorMessage.includes('Email and password sign-in is not currently enabled') ||
      errorMessage.toLowerCase().includes('operation-not-allowed') ||
      errorMessage.toLowerCase().includes('operation not allowed'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);
    setLoading(true);

    if (mode === 'forgot-password') {
      if (!email.trim()) {
        setErrorMessage('Please enter your email to receive password reset instructions.');
        setLoading(false);
        return;
      }
      const res = await sendPasswordReset(email);
      setLoading(false);
      if (res.success) {
        setResetSuccessMessage(`Password reset link dispatched to ${email}. Check your inbox.`);
      } else {
        setErrorMessage(res.error || 'Failed to send password reset. Please try again.');
      }
      return;
    }

    if (mode === 'register-reader') {
      if (!firstName.trim()) {
        setErrorMessage('Please provide your first name.');
        setLoading(false);
        return;
      }
      if (!lastName.trim()) {
        setErrorMessage('Please provide your last name.');
        setLoading(false);
        return;
      }
      if (!username.trim()) {
        setErrorMessage('Please choose a username for discussions.');
        setLoading(false);
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Please provide your email address.');
        setLoading(false);
        return;
      }
      if (!password) {
        setErrorMessage('Please provide a password.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Please choose a stronger password.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (!acceptTerms) {
        setErrorMessage('Please accept the website terms of service & privacy policy.');
        setLoading(false);
        return;
      }

      const res = await registerReader(email.trim(), password, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        newsletterOptIn,
      });

      setLoading(false);
      if (res.success) {
        onSuccess(res.role || 'reader');
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
      return;
    }

    if (mode === 'first-time-setup') {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both your email address and a password.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Please choose a stronger password.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        setLoading(false);
        return;
      }

      const res = await createAdminAccount(email.trim(), password);
      setLoading(false);

      if (res.success) {
        onSuccess('author');
      } else {
        setErrorMessage(res.error || 'Failed to initialize author account.');
      }
      return;
    }

    // Default: 'sign-in'
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      setLoading(false);
      return;
    }

    const res = await signIn(email.trim(), password);
    setLoading(false);

    if (res.success) {
      onSuccess(res.role);
    } else {
      setErrorMessage(res.error || 'The email address or password is incorrect.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#0c0d13]">
      <div className="w-full max-w-lg space-y-6 animate-in fade-in duration-300">
        {/* Back Link */}
        <button
          onClick={onBackToSite}
          className="text-xs font-cinzel text-[#8e887a] hover:text-[#c5a059] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Website</span>
        </button>

        {/* Auth Card */}
        <div className="bg-[#12141d] border border-[#26283b] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-cinzel font-bold text-[#f5efeb] tracking-wide">
              {mode === 'register-reader'
                ? 'Create Reader Account'
                : mode === 'first-time-setup'
                ? 'Author Initial Setup'
                : mode === 'forgot-password'
                ? 'Password Recovery'
                : 'Account Sign In'}
            </h1>
            <p className="text-xs text-[#8e887a] font-cormorant italic text-base">
              {mode === 'register-reader'
                ? 'Register to post thoughts on books, participate in discussions, and save your profile.'
                : mode === 'first-time-setup'
                ? 'First-time author password creation for Matthew E. Messmer.'
                : mode === 'forgot-password'
                ? 'Enter your account email to receive password reset instructions.'
                : 'Sign in to access your Reader, Editor, or Author account.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b0c12] border border-[#212332] rounded-xl text-xs font-cinzel">
            <button
              type="button"
              onClick={() => switchMode('sign-in')}
              className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                mode === 'sign-in'
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-sm'
                  : 'text-[#8e887a] hover:text-[#f5efeb]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register-reader')}
              className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                mode === 'register-reader'
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-sm'
                  : 'text-[#8e887a] hover:text-[#f5efeb]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => switchMode('forgot-password')}
              className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                mode === 'forgot-password'
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-sm'
                  : 'text-[#8e887a] hover:text-[#f5efeb]'
              }`}
            >
              Reset
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-4 bg-[#251518] border border-rose-500/40 text-rose-300 text-xs rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>

              {/* Dedicated guidance for auth/operation-not-allowed */}
              {isOperationNotAllowed && (
                <div className="p-3 bg-[#180e11] border border-rose-500/30 rounded-lg text-[11px] text-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-cinzel font-semibold text-amber-300">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Firebase Console Administrator Notice</span>
                  </div>
                  <p className="leading-relaxed text-[#dcd7cb]">
                    Email/Password authentication provider must be turned on in your Firebase Project Console:
                  </p>
                  <div className="font-mono text-[11px] bg-[#0c0d12] p-2 rounded text-[#c5a059] border border-[#2b2e40] break-all">
                    Authentication → Sign-in providers → Email/Password → Enabled
                  </div>
                  <div className="text-[11px] text-[#a8a396] pt-1">
                    Once enabled in the Firebase Console, users can register and sign in immediately with Email and Password.
                  </div>
                </div>
              )}
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3.5 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{resetSuccessMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Fields */}
            {mode === 'register-reader' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                      First Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Samuel"
                      className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                      Last Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Kaye"
                      className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. SamuelKaye"
                    className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                  <p className="text-[10px] text-[#7d786d] mt-1">
                    Used as your public display name on book discussions and comments.
                  </p>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6e685c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot-password' && (
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6e685c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {(mode === 'register-reader' || mode === 'first-time-setup') && (
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6e685c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161825] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                </div>
              </div>
            )}

            {/* Terms and Newsletter checkboxes for reader registration */}
            {mode === 'register-reader' && (
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#a8a396] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059] bg-[#161825]"
                  />
                  <span>
                    I accept the website terms of service and acknowledge the privacy policy.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-[#a8a396] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-0.5 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059] bg-[#161825]"
                  />
                  <span>
                    Subscribe to Matthew E. Messmer's reader newsletter for dispatches and release news.
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-xl transition-all shadow-xl shadow-[#c5a059]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : mode === 'register-reader'
                  ? 'Register as Reader'
                  : mode === 'first-time-setup'
                  ? 'Set Author Password'
                  : mode === 'forgot-password'
                  ? 'Send Reset Link'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-[#1e2130] text-center text-xs text-[#7d786d] space-y-1">
            {mode === 'sign-in' && (
              <p>
                Author initial setup?{' '}
                <button
                  onClick={() => switchMode('first-time-setup')}
                  className="text-[#c5a059] hover:underline font-cinzel"
                >
                  Create Author Password
                </button>
              </p>
            )}
            {mode === 'first-time-setup' && (
              <p>
                Designated author email: <code className="text-[#c5a059]">{adminEmailConfigured}</code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
