import React from 'react';
import { AudioHubSection } from '../components/AudioHubSection';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Disc, Sparkles } from 'lucide-react';

interface AudioHubViewProps {
  onOpenPrivacy?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const AudioHubView: React.FC<AudioHubViewProps> = ({ onOpenPrivacy, setActiveTab }) => {
  useSEO('home');

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Header */}
      <section className="relative pt-12 sm:pt-16 pb-10 overflow-hidden border-b border-[#1f2230]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#c5a059]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full text-xs font-cinzel text-[#c5a059] uppercase tracking-wider">
            <Disc className="w-3.5 h-3.5" />
            <span>Companion Discography & Dedications</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
            Audio & Soundtrack Vault
          </h1>

          <p className="text-base sm:text-lg text-[#aba597] font-cormorant italic max-w-2xl mx-auto">
            "Stories woven through time, melody, and memory."
          </p>
        </div>
      </section>

      {/* Main Audio Section */}
      <AudioHubSection isStandalonePage={true} />

      {/* Newsletter Signup */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewsletterSignup source="audio_hub" onOpenPrivacy={onOpenPrivacy} />
      </section>
    </div>
  );
};

export default AudioHubView;
