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
  User,
  Info,
  MapPin,
} from 'lucide-react';

interface AdminLoginViewProps {
  onSuccess: (role?: UserRole) => void;
  onBackToSite: () => void;
  initialMode?: AuthMode;
}

export type AuthMode = 'sign-in' | 'register-reader' | 'forgot-password';

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onSuccess,
  onBackToSite,
  initialMode = 'sign-in',
}) => {
  useSEO('home', { title: 'Sign In | Matthew E. Messmer', robots: 'noindex, nofollow' });

  const { signIn, registerReader, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode === 'register-reader' ? 'register-reader' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  // Optional reader location states
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setResetSuccessMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setAcceptTerms(false);
    setNewsletterOptIn(true);
    setCity('');
    setStateRegion('');
    setCountry('');
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
      const res = await sendPasswordReset(email.trim());
      setLoading(false);
      if (res.success) {
        setResetSuccessMessage(`Password reset link dispatched to ${email.trim()}. Check your inbox.`);
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
        setErrorMessage('Please choose a password with at least 6 characters.');
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
        city: city.trim() || undefined,
        state: stateRegion.trim() || undefined,
        country: country.trim() || undefined,
      });

      setLoading(false);
      if (res.success) {
        onSuccess(res.role || 'reader');
      } else {
        setErrorMessage(res.error || 'Registration failed.');
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
                : mode === 'forgot-password'
                ? 'Password Recovery'
                : 'Account Sign In'}
            </h1>
            <p className="text-xs text-[#8e887a] font-cormorant italic text-base">
              {mode === 'register-reader'
                ? 'Register to post thoughts on books, participate in discussions, and save your reading profile.'
                : mode === 'forgot-password'
                ? 'Enter your account email to receive password reset instructions.'
                : 'Sign in with your credentials to access your account.'}
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

              {isOperationNotAllowed && (
                <div className="p-3 bg-[#180e11] border border-rose-500/30 rounded-lg text-[11px] text-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-cinzel font-semibold text-amber-300">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Authentication Notice</span>
                  </div>
                  <p className="leading-relaxed text-[#dcd7cb]">
                    Email/Password sign-in provider must be enabled in your Firebase Project Console.
                  </p>
                </div>
              )}
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3.5 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Fields */}
            {mode === 'register-reader' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                    Community Username *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="WeaverReader99"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                    />
                  </div>
                  <p className="text-[10px] text-[#7d786d] mt-1">
                    This public handle appears on your book comments and discussion threads.
                  </p>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-cinzel text-[#dcd7cb]">
                    Password *
                  </label>
                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
                      className="text-[11px] text-[#c5a059] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {mode === 'register-reader' && (
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#7d786d] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                </div>
              </div>
            )}

            {/* Optional Reader Location Information */}
            {mode === 'register-reader' && (
              <div className="pt-3 pb-2 space-y-3 border-t border-[#212435]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#c5a059]">
                    <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>Optional — Just for Matthew&apos;s Curiosity</span>
                  </div>
                  <blockquote className="text-[11px] text-[#a8a396] leading-relaxed italic border-l-2 border-[#c5a059]/40 pl-2.5 py-0.5">
                    &ldquo;I&apos;d love to know where readers are discovering my books from! Sharing your city, state/province, and country is completely optional and is simply to satisfy my curiosity about where readers are joining me from. You can leave these fields blank if you&apos;d rather not share.&rdquo;
                  </blockquote>
                  <p className="text-[10px] text-[#736e63]">
                    Completely voluntary. Leaving this blank has zero effect on your account or access to the site. Visible solely to the author.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-cinzel text-[#8f897c] block mb-1">
                      City <span className="text-[10px] lowercase text-[#6e695e]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Austin"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl px-3 py-2 text-xs text-[#f5efeb]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-cinzel text-[#8f897c] block mb-1">
                      State / Province / Region <span className="text-[10px] lowercase text-[#6e695e]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g. Texas"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl px-3 py-2 text-xs text-[#f5efeb]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-cinzel text-[#8f897c] block mb-1">
                      Country <span className="text-[10px] lowercase text-[#6e695e]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full bg-[#161825] border border-[#2e3146] focus:border-[#c5a059] focus:outline-none rounded-xl px-3 py-2 text-xs text-[#f5efeb]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reader Terms & Newsletter */}
            {mode === 'register-reader' && (
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#a8a396] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059] bg-[#161825]"
                  />
                  <span>
                    I agree to the Terms of Service, Privacy Policy, and Community Guidelines.
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
                    Join the author&apos;s newsletter for updates on new books, stories, and releases (includes welcome dispatch).
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
                  ? 'Create Reader Account'
                  : mode === 'forgot-password'
                  ? 'Send Reset Link'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Clean Mode Toggle Links */}
          <div className="pt-4 border-t border-[#1e2130] text-center text-xs text-[#7d786d]">
            {mode === 'sign-in' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register-reader')}
                  className="text-[#c5a059] hover:underline font-semibold cursor-pointer ml-1"
                >
                  Create a Reader Account
                </button>
              </p>
            )}
            {mode === 'register-reader' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('sign-in')}
                  className="text-[#c5a059] hover:underline font-semibold cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
            {mode === 'forgot-password' && (
              <p>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('sign-in')}
                  className="text-[#c5a059] hover:underline font-semibold cursor-pointer ml-1"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
