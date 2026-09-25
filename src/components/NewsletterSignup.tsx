import React, { useState } from 'react';
import { newsletterService } from '../services/newsletterService';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'homepage' | 'footer' | 'about' | 'book_page' | 'news' | 'abyssal_current' | 'compact' | 'modal';
  heading?: string;
  text?: string;
  buttonText?: string;
  source: string;
  showFirstName?: boolean;
  showConsent?: boolean;
  onOpenPrivacy?: () => void;
  onSuccess?: () => void;
  className?: string;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'homepage',
  heading,
  text,
  buttonText,
  source,
  showFirstName = true,
  showConsent = true,
  onOpenPrivacy,
  onSuccess,
  className = '',
}) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'error' | 'disabled'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusTitle, setStatusTitle] = useState<string>('');

  // Default copy by variant
  const defaultHeadings: Record<string, string> = {
    homepage: 'Join the Story',
    footer: 'Stay Connected',
    about: 'Follow the Journey',
    book_page: 'Want to know what\'s next?',
    news: 'Dispatches from the Loom',
    abyssal_current: 'Want to Know What Comes Next?',
    compact: 'Stay Connected',
    modal: 'Join the Journey',
  };

  const defaultTexts: Record<string, string> = {
    homepage: 'Be the first to hear about new books, new worlds, and what\'s happening behind the pages.',
    footer: 'Get occasional updates from Matthew E. Messmer.',
    about: 'New stories are always taking shape. Join the newsletter and be among the first to hear when something new emerges.',
    book_page: 'Join the newsletter for updates about upcoming books, behind-the-scenes worldbuilding, and release dates.',
    news: 'Receive essays on craft, chapter previews, and updates on physical woodcraft creations straight to your inbox.',
    abyssal_current: 'The Abyssal Current is only beginning. Join the newsletter for future reveals, announcements, and updates as the series takes shape.',
    compact: 'Get occasional updates from Matthew E. Messmer.',
    modal: 'Receive occasional updates on new releases, book club materials, and woodcraft projects.',
  };

  const defaultButtons: Record<string, string> = {
    homepage: 'Join the Journey',
    footer: 'Subscribe',
    about: 'Join the Journey',
    book_page: 'Join the Journey',
    news: 'Subscribe',
    abyssal_current: 'Follow the Current',
    compact: 'Subscribe',
    modal: 'Join the Journey',
  };

  const displayHeading = heading || defaultHeadings[variant] || 'Join the Journey';
  const displayText = text || defaultTexts[variant] || 'Get occasional updates from Matthew E. Messmer.';
  const displayButtonText = buttonText || defaultButtons[variant] || 'Subscribe';

  const validateForm = (): boolean => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    if (showConsent && !consent) {
      setValidationError('Please check the consent box to receive updates.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const result = await newsletterService.subscribe({
        firstName,
        email,
        source,
        consent,
      });

      setStatus(result.status);
      setStatusTitle(result.title);
      setStatusMessage(result.message);

      if (result.status === 'success') {
        if (onSuccess) onSuccess();
      }
    } catch {
      setStatus('error');
      setStatusTitle('Something went wrong.');
      setStatusMessage("We couldn't complete your subscription right now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setValidationError(null);
  };

  // Compact footer style
  if (variant === 'footer' || variant === 'compact') {
    return (
      <div className={`w-full ${className}`}>
        <h4 className="text-base font-cinzel font-semibold text-[#f5efeb] tracking-wide mb-1.5">
          {displayHeading}
        </h4>
        <p className="text-xs text-[#a39e93] mb-3 leading-relaxed">
          {displayText}
        </p>

        {status === 'success' ? (
          <div className="p-3 bg-[#17201c] border border-emerald-800/40 rounded-lg text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">You're In!</p>
              <p className="text-emerald-300/80 mt-0.5">Welcome to the journey. You'll hear from Matthew when there's something worth sharing.</p>
            </div>
          </div>
        ) : status === 'duplicate' ? (
          <div className="p-3 bg-[#1e1c15] border border-amber-800/40 rounded-lg text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">{statusTitle}</p>
              <p className="text-amber-300/80 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter your email address"
                  className="w-full bg-[#12141c] border border-[#2b2d3d] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-xs text-[#f5efeb] placeholder-[#6e6a60] rounded-md px-3 py-2 outline-none transition-all"
                  aria-label="Email address"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#c5a059] hover:bg-[#d4b069] text-[#0d0e14] font-medium text-xs px-4 py-2 rounded-md transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  displayButtonText
                )}
              </button>
            </div>

            {validationError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1" role="alert">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {validationError}
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] text-[#787369]">
              <span>Occasional updates only · No spam</span>
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="underline hover:text-[#c5a059] cursor-pointer"
                >
                  Privacy Policy
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    );
  }

  // Full Rich Variant (Homepage, About, Book Pages, News, Abyssal Current)
  const isAbyssal = variant === 'abyssal_current';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        isAbyssal
          ? 'bg-gradient-to-b from-[#0b171e] via-[#091118] to-[#070d14] border-teal-900/40 shadow-xl shadow-teal-950/20'
          : 'bg-gradient-to-b from-[#151722] via-[#11131c] to-[#0d0f17] border-[#292c3f]/70 shadow-2xl'
      } p-6 sm:p-8 md:p-10 ${className}`}
    >
      {/* Decorative subtle woven thread line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c5a059]/60 to-transparent" />
      
      {/* Background ambient water/weave watermark SVG pattern */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.03] pointer-events-none text-current">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M50 5 L50 95 M5 50 L95 50" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-2xl mx-auto text-center">
        {/* Subtle Category Kicker */}
        <p className="text-xs uppercase tracking-widest text-[#c5a059] font-medium mb-2">
          {isAbyssal ? 'The Abyssal Dispatch' : 'Reader Community'}
        </p>

        <h3 className="text-2xl sm:text-3xl font-cinzel font-semibold text-[#f7f3ee] tracking-tight mb-3">
          {displayHeading}
        </h3>

        <p className="text-sm sm:text-base text-[#b0a99c] font-cormorant text-lg sm:text-xl italic leading-relaxed mb-6">
          "{displayText}"
        </p>

        {/* Status: SUCCESS */}
        {status === 'success' && (
          <div
            className="p-6 bg-[#13221b] border border-emerald-700/50 rounded-lg text-emerald-200 text-center animate-in fade-in zoom-in-95 duration-200"
            role="status"
            aria-live="polite"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-cinzel font-semibold text-emerald-100 mb-1">
              You're In!
            </h4>
            <p className="text-sm text-emerald-300/90 max-w-md mx-auto leading-relaxed">
              {statusMessage || "Welcome to the journey. You'll hear from Matthew when there's something worth sharing."}
            </p>
            <p className="text-xs text-emerald-400/60 mt-3 font-cormorant italic">
              Until then, there's always another story being woven.
            </p>
          </div>
        )}

        {/* Status: DUPLICATE */}
        {status === 'duplicate' && (
          <div
            className="p-6 bg-[#211d13] border border-amber-700/50 rounded-lg text-amber-200 text-center animate-in fade-in duration-200"
            role="status"
            aria-live="polite"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-cinzel font-semibold text-amber-100 mb-1">
              You're already part of the journey.
            </h4>
            <p className="text-sm text-amber-300/90 max-w-md mx-auto leading-relaxed mb-4">
              {statusMessage || "That email is already subscribed to Matthew's newsletter."}
            </p>
            <button
              onClick={handleRetry}
              className="text-xs font-medium text-amber-400 hover:text-amber-200 underline cursor-pointer"
            >
              Enter a different email address
            </button>
          </div>
        )}

        {/* Status: ERROR */}
        {status === 'error' && (
          <div
            className="p-6 bg-[#241316] border border-rose-800/60 rounded-lg text-rose-200 text-center animate-in fade-in duration-200"
            role="alert"
            aria-live="assertive"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-cinzel font-semibold text-rose-100 mb-1">
              Something went wrong.
            </h4>
            <p className="text-sm text-rose-300/90 max-w-md mx-auto leading-relaxed mb-4">
              We couldn't complete your subscription right now. Please try again in a moment.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* FORM */}
        {(status === 'idle' || status === 'disabled') && (
          <form onSubmit={handleSubmit} noValidate className="text-left space-y-4 max-w-lg mx-auto">
            <div className={`grid ${showFirstName ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {showFirstName && (
                <div>
                  <label htmlFor={`firstName-${source}`} className="block text-xs font-medium text-[#b3ada2] mb-1">
                    First Name
                  </label>
                  <input
                    id={`firstName-${source}`}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Matthew"
                    className="w-full bg-[#0d0e14] border border-[#2b2d3d] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-sm text-[#f5efeb] placeholder-[#57534a] rounded-lg px-3.5 py-2.5 outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label htmlFor={`email-${source}`} className="block text-xs font-medium text-[#b3ada2] mb-1">
                  Email Address <span className="text-[#c5a059]">*</span>
                </label>
                <div className="relative">
                  <input
                    id={`email-${source}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="reader@example.com"
                    className={`w-full bg-[#0d0e14] border ${
                      validationError ? 'border-rose-500' : 'border-[#2b2d3d]'
                    } focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-sm text-[#f5efeb] placeholder-[#57534a] rounded-lg px-3.5 py-2.5 pl-9 outline-none transition-all`}
                    required
                    disabled={isSubmitting}
                  />
                  <Mail className="w-4 h-4 text-[#757065] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            {showConsent && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#9c9689] select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (validationError) setValidationError(null);
                    }}
                    className="mt-0.5 rounded border-[#383a4f] bg-[#0d0e14] text-[#c5a059] focus:ring-[#c5a059] focus:ring-offset-0 w-4 h-4"
                  />
                  <span>
                    I agree to receive occasional news and updates from Matthew E. Messmer. (No spam, unsubscribe anytime).
                  </span>
                </label>
              </div>
            )}

            {/* Validation Message */}
            {validationError && (
              <div
                className="p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-md text-rose-300 text-xs flex items-center gap-2"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto sm:min-w-[200px] mx-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all cursor-pointer shadow-lg ${
                  isAbyssal
                    ? 'bg-teal-600 hover:bg-teal-500 text-teal-950 shadow-teal-900/30'
                    : 'bg-[#c5a059] hover:bg-[#d4b069] text-[#0d0e14] shadow-[#c5a059]/20'
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to the Journey...</span>
                  </>
                ) : (
                  <>
                    <span>{displayButtonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Privacy & Trust note */}
            <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-[#7a7468]">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#c5a059]" /> Privacy respected
              </span>
              <span>·</span>
              <span>Only first name & email collected</span>
              <span>·</span>
              {onOpenPrivacy ? (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="underline hover:text-[#c5a059] cursor-pointer"
                >
                  Privacy Policy
                </button>
              ) : (
                <span className="underline">Privacy Policy</span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
