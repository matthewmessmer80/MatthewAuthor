import React, { useEffect } from 'react';
import { X, Shield, Lock, Check } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Privacy Policy"
    >
      <div className="relative w-full max-w-2xl bg-[#0f111a] border border-[#2b2e40] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232635] bg-[#0c0d14]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#c5a059]" />
            <h2 className="text-base font-cinzel font-bold text-[#f5efeb]">
              Privacy & Reader Protection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#858074] hover:text-[#f5efeb] hover:bg-[#1c1f2e] rounded-md transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5 text-xs text-[#b8b2a4] leading-relaxed">
          <p className="text-sm font-semibold text-[#f5efeb]">
            Last updated: September 2026
          </p>

          <p>
            This website is the official author home of <strong>Matthew E. Messmer</strong>. We value your trust and are committed to protecting your privacy. We believe in clear, honest communication without hidden data brokers or deceptive marketing tactics.
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">
              1. What Information We Collect
            </h4>
            <p>
              We deliberately minimize data collection. When you voluntarily sign up for the author newsletter, we collect only:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#d8d2c5]">
              <li><strong>First Name</strong>: Used solely to personalize occasional author letters (optional).</li>
              <li><strong>Email Address</strong>: The direct channel through which you receive announcements regarding new books, worldbuilding dispatches, and woodcraft projects.</li>
            </ul>
            <p>
              We do not collect physical street addresses, phone numbers, payment details, or track you across other websites.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">
              2. How Your Email Is Used
            </h4>
            <p>
              Your email will only be used to send you news and announcements from Matthew E. Messmer. We do not engage in spam, high-frequency promotional blasts, or unrelated third-party marketing.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">
              3. We Never Sell or Share Your Information
            </h4>
            <p>
              We will never sell, rent, monetize, or trade your personal email address with third parties, advertisers, or data syndicates. Period.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">
              4. Unsubscribing Anytime
            </h4>
            <p>
              Every single newsletter email sent includes an instantaneous, single-click unsubscribe link at the footer. You may also contact us directly at any time to have your email address permanently expunged from our records.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">
              5. Local Storage & Development Mode
            </h4>
            <p>
              In local demonstration environments, test subscriptions are stored within your browser's private localStorage and can be wiped or exported via the Author Admin portal at any moment.
            </p>
          </div>

          <div className="pt-4 border-t border-[#232635] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
