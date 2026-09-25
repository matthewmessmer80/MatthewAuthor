import React, { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { messageService } from '../services/messageService';
import { Mail, Send, CheckCircle, BookOpen, MessageSquare, Shield, Sparkles } from 'lucide-react';

interface ContactViewProps {
  onOpenPrivacy?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onOpenPrivacy }) => {
  useSEO('contact');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'reader',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await messageService.sendMessage({
      name: formData.name,
      email: formData.email,
      inquiryType: formData.inquiryType,
      subject: formData.subject,
      message: formData.message,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Correspondence & Inquiries
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          Contact Matthew E. Messmer
        </h1>
        <p className="text-sm sm:text-base text-[#a8a396] font-cormorant italic text-xl leading-relaxed">
          "Every story begins with a single thread—let's connect."
        </p>
        <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
          For reader correspondence, book club appearances, signed bookplate inquiries, rights and media requests, or custom laser engraving commissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
        {/* Left: Contact Info & Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
            <h3 className="font-cinzel font-bold text-base text-[#f5efeb] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#c5a059]" />
              <span>Inquiry Channels</span>
            </h3>

            <div className="space-y-3 text-xs text-[#a8a396]">
              <div>
                <strong className="text-[#f5efeb] block">Reader Correspondence</strong>
                <span>Matthew reads every reader message. Feel free to share your thoughts on The Breathwoven Cycle.</span>
              </div>
              <div className="pt-2 border-t border-[#1e202d]">
                <strong className="text-[#f5efeb] block">Book Clubs & Events</strong>
                <span>Available for virtual Q&A sessions with book clubs reading The King's Severance.</span>
              </div>
              <div className="pt-2 border-t border-[#1e202d]">
                <strong className="text-[#f5efeb] block">Rights & Media</strong>
                <span>For translation, audio, film, or licensing inquiries regarding published and upcoming works.</span>
              </div>
              <div className="pt-2 border-t border-[#1e202d]">
                <strong className="text-[#f5efeb] block">Laser Engraving Keepsakes</strong>
                <span>Limited custom woodcraft bookplates and presentation plaques from the Texas workshop.</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121420] border border-[#26283b] rounded-xl p-6 text-xs text-[#8f897c] space-y-2">
            <div className="flex items-center gap-2 text-[#c5a059] font-cinzel font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Response Time</span>
            </div>
            <p className="leading-relaxed">
              Between writing, technology studies, and family life in Texas with four kids, Matthew typically responds within 3 to 5 business days.
            </p>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                Message Sent Across the Weave
              </h3>
              <p className="text-xs sm:text-sm text-[#a8a396] max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out, {formData.name}. Your note has been delivered to Matthew's desk.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', inquiryType: 'reader', subject: '', message: '' });
                }}
                className="mt-4 px-4 py-2 bg-[#1c1e2b] hover:bg-[#252838] text-xs font-cinzel text-[#c5a059] rounded-md transition-colors cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="name" className="block text-xs font-medium text-[#b5af9f]">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. Elena Vance"
                    className="w-full px-3.5 py-2.5 bg-[#0c0d12] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] placeholder-[#6e685a] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-medium text-[#b5af9f]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="elena@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#0c0d12] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] placeholder-[#6e685a] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="inquiryType" className="block text-xs font-medium text-[#b5af9f]">
                  Inquiry Topic
                </label>
                <select
                  id="inquiryType"
                  value={formData.inquiryType}
                  onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0c0d12] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="reader">Reader Note / Fan Mail</option>
                  <option value="bookclub">Book Club Appearance / Discussion</option>
                  <option value="signed">Signed Hardcover / Bookplate Request</option>
                  <option value="laser">Laser Engraving Workshop Inquiry</option>
                  <option value="rights">Publishing, Audio & Rights</option>
                  <option value="other">General Inquiries</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="subject" className="block text-xs font-medium text-[#b5af9f]">
                  Subject Line *
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Regarding The King's Severance"
                  className="w-full px-3.5 py-2.5 bg-[#0c0d12] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] placeholder-[#6e685a] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="message" className="block text-xs font-medium text-[#b5af9f]">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your note to Matthew here..."
                  className="w-full px-3.5 py-2.5 bg-[#0c0d12] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] placeholder-[#6e685a] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-[#6d685c]">
                  Your email is strictly kept confidential.{' '}
                  {onOpenPrivacy && (
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="text-[#c5a059] underline cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  )}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d4ad62] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
