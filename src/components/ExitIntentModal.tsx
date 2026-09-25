import React, { useEffect, useState } from 'react';
import { newsletterService } from '../services/newsletterService';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface ExitIntentModalProps {
  onOpenPrivacy?: () => void;
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ onOpenPrivacy }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const settings = newsletterService.getSettings();
    if (!settings.exitIntentEnabled) return;

    // Check if shown in this session
    const hasBeenShown = sessionStorage.getItem('mem_exit_intent_shown');
    if (hasBeenShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves out through the top of the browser viewport
      if (e.clientY <= 10) {
        setIsOpen(true);
        sessionStorage.setItem('mem_exit_intent_shown', 'true');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await newsletterService.subscribe({
        firstName,
        email: cleanEmail,
        source: 'exit_intent',
        consent: true,
      });

      if (res.status === 'success') {
        setStatus('success');
      } else if (res.status === 'duplicate') {
        setStatus('duplicate');
      } else {
        setStatus('error');
        setErrorMessage(res.message);
      }
    } catch {
      setStatus('error');
      setErrorMessage("We couldn't complete your subscription right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Exit newsletter invitation"
    >
      <div className="relative w-full max-w-md bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative thread line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent" />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-[#827d72] hover:text-[#f5efeb] hover:bg-[#1a1d28] rounded-md transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-2">
          <p className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold mb-1">
            Before you go...
          </p>
          <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] tracking-tight mb-2">
            Want to know when the next story begins?
          </h3>
          <p className="text-xs text-[#9d978a] leading-relaxed mb-6 font-cormorant text-base italic">
            "Get occasional letters from Matthew E. Messmer on new releases, worldbuilding dispatches, and handcrafted wood engravings."
          </p>

          {status === 'success' ? (
            <div className="p-4 bg-[#14231b] border border-emerald-700/50 rounded-xl text-emerald-200 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              <p className="font-semibold text-emerald-100 text-sm">You're In!</p>
              <p className="mt-1 text-emerald-300/80">
                Welcome to the journey. You'll hear from Matthew when there's something worth sharing.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-md font-medium text-xs transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          ) : status === 'duplicate' ? (
            <div className="p-4 bg-[#231e13] border border-amber-700/50 rounded-xl text-amber-200 text-xs">
              <p className="font-semibold text-amber-100 text-sm">Already part of the journey!</p>
              <p className="mt-1 text-amber-300/80">That email is already subscribed to Matthew's newsletter.</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded-md font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-medium text-[#a39d91] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="reader@example.com"
                  className="w-full bg-[#090b10] border border-[#2b2e40] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] text-xs text-[#f5efeb] placeholder-[#57534a] rounded-lg px-3.5 py-2.5 outline-none"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#c5a059] hover:bg-[#d4b069] text-[#0d0e14] font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#c5a059]/10"
              >
                <span>Join the Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between text-[10px] text-[#6d685c] pt-2">
                <span>Occasional updates only</span>
                {onOpenPrivacy && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenPrivacy();
                    }}
                    className="underline hover:text-[#c5a059] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
