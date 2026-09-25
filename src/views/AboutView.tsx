import React from 'react';
import { AUTHOR_INFO } from '../data/authorData';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Anchor, Users, Cpu, Hammer, Feather, Sparkles } from 'lucide-react';

interface AboutViewProps {
  onOpenPrivacy?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onOpenPrivacy }) => {
  useSEO('about');
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Author Biography
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          Matthew E. Messmer
        </h1>
        <p className="text-base sm:text-lg font-cormorant italic text-[#c5a059]">
          "Because every story begins with a single thread."
        </p>
      </div>

      {/* Official Biography (Rendered with editorial elegance) */}
      <article className="prose prose-invert max-w-none space-y-6 text-[#ded8cc] text-base sm:text-lg leading-relaxed sm:leading-loose font-reading">
        {AUTHOR_INFO.officialBio.map((paragraph, idx) => {
          if (idx === 0) {
            return (
              <p key={idx} className="drop-cap-lead text-lg sm:text-xl font-normal text-[#f5efeb]">
                {paragraph}
              </p>
            );
          }
          if (idx === AUTHOR_INFO.officialBio.length - 1) {
            return (
              <p
                key={idx}
                className="text-xl sm:text-2xl font-cinzel font-semibold text-[#c5a059] pt-4 text-center border-t border-[#232635]"
              >
                {paragraph}
              </p>
            );
          }
          return <p key={idx}>{paragraph}</p>;
        })}
      </article>

      {/* Authenticity & Life Pillars (Clean unboxed presentation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#222536]">
        <div className="p-4 rounded-xl bg-[#12141e] border border-[#232635] text-center space-y-1.5">
          <Anchor className="w-5 h-5 text-[#c5a059] mx-auto" />
          <h4 className="text-xs font-cinzel font-bold text-[#f5efeb]">Navy Veteran</h4>
          <p className="text-[11px] text-[#8e887a]">Former MA3 Master-at-Arms</p>
        </div>

        <div className="p-4 rounded-xl bg-[#12141e] border border-[#232635] text-center space-y-1.5">
          <Users className="w-5 h-5 text-[#c5a059] mx-auto" />
          <h4 className="text-xs font-cinzel font-bold text-[#f5efeb]">Father & Family</h4>
          <p className="text-[11px] text-[#8e887a]">4 Kids, 2 Dogs, 3 Cats in Texas</p>
        </div>

        <div className="p-4 rounded-xl bg-[#12141e] border border-[#232635] text-center space-y-1.5">
          <Cpu className="w-5 h-5 text-[#c5a059] mx-auto" />
          <h4 className="text-xs font-cinzel font-bold text-[#f5efeb]">IT Professional</h4>
          <p className="text-[11px] text-[#8e887a]">B.S. in Information Tech Student</p>
        </div>

        <div className="p-4 rounded-xl bg-[#12141e] border border-[#232635] text-center space-y-1.5">
          <Hammer className="w-5 h-5 text-[#c5a059] mx-auto" />
          <h4 className="text-xs font-cinzel font-bold text-[#f5efeb]">Laser Engraving</h4>
          <p className="text-[11px] text-[#8e887a]">Handcrafted Wood Keepsakes</p>
        </div>
      </div>

      {/* MANDATORY ABOUT PAGE NEWSLETTER SECTION */}
      {/*
        Heading: Follow the Journey
        Text: New stories are always taking shape. Join the newsletter and be among the first to hear when something new emerges.
        Button: Join the Journey
      */}
      <div className="pt-6">
        <NewsletterSignup
          variant="about"
          heading="Follow the Journey"
          text="New stories are always taking shape. Join the newsletter and be among the first to hear when something new emerges."
          buttonText="Join the Journey"
          source="about_page"
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
