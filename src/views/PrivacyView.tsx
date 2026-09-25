import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { Shield, Lock, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

interface PrivacyViewProps {
  onBackToHome?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBackToHome }) => {
  useSEO('privacy');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      )}

      {/* Header */}
      <div className="space-y-3 border-b border-[#232635] pb-6">
        <div className="flex items-center gap-2 text-[#c5a059] text-xs font-cinzel uppercase tracking-widest font-semibold">
          <Shield className="w-4 h-4" />
          <span>Official Reader Protection Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-cinzel font-bold text-[#f5efeb]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#8f897c]">
          Last Updated: September 2026 · Official Website of Matthew E. Messmer
        </p>
      </div>

      {/* Core Pledge Card */}
      <div className="p-6 rounded-xl bg-[#131622] border border-[#2b2f42] space-y-3">
        <h2 className="text-base font-cinzel font-bold text-[#c5a059] flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Our Unwavering Commitment to Readers</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#c4bfae] leading-relaxed">
          As an author, veteran, and father, Matthew E. Messmer treats reader privacy with the highest degree of respect and discipline. We will never sell, rent, monetize, or trade your personal email address or contact details to data brokers, advertising networks, or any third parties.
        </p>
      </div>

      {/* Structured Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-[#b2aca0] leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
            1. Information We Collect
          </h3>
          <p>
            We collect only the minimal information necessary to deliver literary updates and respond to reader communications:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9d978a]">
            <li>
              <strong>Email Address & First Name:</strong> Provided voluntarily when signing up for the reader newsletter or requesting book release notices.
            </li>
            <li>
              <strong>Contact Correspondence:</strong> Information you include in direct notes sent via the Contact page.
            </li>
            <li>
              <strong>Anonymous Aggregate Analytics:</strong> Basic page view counts to monitor site health without identifying individual readers or storing tracking cookies across other websites.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
            2. How Your Information Is Used
          </h3>
          <p>
            Your email is used solely to send occasional author dispatches:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9d978a]">
            <li>Announcements regarding new book releases and pre-orders</li>
            <li>Advance reading chapters and exclusive lore side-stories</li>
            <li>Workshop updates on limited-edition laser-engraved bookmarks and bookplates</li>
            <li>Direct responses to inquiries submitted through the contact form</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
            3. Instant & Easy Unsubscribe
          </h3>
          <p>
            Every single email communication includes a clear, immediate 1-click unsubscribe link at the footer. You can also contact us directly at any time to request immediate deletion of your data from our subscriber records.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
            4. Data Security & Technical Hygiene
          </h3>
          <p>
            Approaching technology with the disciplined standards of Information Technology, subscriber data is transmitted through encrypted TLS/HTTPS protocols and stored with industry-standard security.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
            5. Contact Information
          </h3>
          <p>
            If you have questions regarding this Privacy Policy or wish to modify or remove your information, please reach out through our Contact page.
          </p>
        </section>
      </div>
    </div>
  );
};
