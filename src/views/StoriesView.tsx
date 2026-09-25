import React, { useState } from 'react';
import { STORIES } from '../data/authorData';
import { Story } from '../types';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { BookOpen, Clock, Calendar, Sparkles, Feather, ChevronRight, Share2 } from 'lucide-react';

interface StoriesViewProps {
  onOpenPrivacy?: () => void;
}

export const StoriesView: React.FC<StoriesViewProps> = ({ onOpenPrivacy }) => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useSEO(selectedStory ? `stories/${selectedStory.slug}` : 'stories');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Short Fiction & Companion Lore
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          Stories
        </h1>
        <p className="text-sm sm:text-base text-[#a8a396] font-cormorant italic text-xl leading-relaxed">
          "Every story begins with a single thread."
        </p>
        <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
          Standalone short stories, world lore chronicles, and quiet character moments written by Matthew E. Messmer between full-length novels.
        </p>
      </div>

      {/* Story Reader or Story Cards */}
      {selectedStory ? (
        <article className="max-w-3xl mx-auto bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-10 space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#212332] pb-4">
            <button
              onClick={() => setSelectedStory(null)}
              className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Back to All Stories
            </button>
            <div className="text-xs text-[#7e796e] flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {selectedStory.readTime}
              </span>
              <span className="px-2 py-0.5 bg-[#1b1e2c] rounded text-[#b3ad9f]">
                {selectedStory.universe}
              </span>
            </div>
          </div>

          <header className="space-y-2 text-center">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb]">
              {selectedStory.title}
            </h2>
            {selectedStory.subtitle && (
              <p className="text-sm font-cormorant italic text-[#c5a059]">
                {selectedStory.subtitle}
              </p>
            )}
            <p className="text-xs text-[#8f897c] pt-1">
              By Matthew E. Messmer
            </p>
          </header>

          <div className="space-y-4 font-serif text-sm sm:text-base text-[#c9c4b7] leading-relaxed">
            {selectedStory.content.map((paragraph, idx) => (
              <p key={idx} className={idx === 0 ? 'first-letter:text-4xl first-letter:font-cinzel first-letter:text-[#c5a059] first-letter:float-left first-letter:mr-2' : ''}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="pt-6 border-t border-[#212332] flex items-center justify-between">
            <span className="text-xs text-[#7e796e] italic">
              From the universe of {selectedStory.universe}
            </span>
            <button
              onClick={() => setSelectedStory(null)}
              className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283b] text-xs font-cinzel text-[#f5efeb] rounded-md transition-colors cursor-pointer"
            >
              Close Reader
            </button>
          </div>
        </article>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORIES.map((story) => (
            <div
              key={story.id}
              className="bg-[#12141e] border border-[#232635] hover:border-[#c5a059]/40 rounded-xl p-6 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#827d72]">
                  <span className="px-2 py-0.5 bg-[#1b1e2c] rounded text-[#c5a059] text-[11px] font-cinzel">
                    {story.universe}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {story.readTime}
                  </span>
                </div>

                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors">
                  {story.title}
                </h3>

                {story.subtitle && (
                  <p className="text-xs font-cormorant italic text-[#b5b0a3]">
                    {story.subtitle}
                  </p>
                )}

                <p className="text-xs text-[#9d978a] leading-relaxed line-clamp-3">
                  {story.summary}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[#1c1e2b] flex items-center justify-between">
                <button
                  onClick={() => setSelectedStory(story)}
                  className="text-xs font-cinzel font-semibold uppercase tracking-wider text-[#c5a059] hover:text-[#e0bc74] flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Story</span>
                </button>
                <ChevronRight className="w-4 h-4 text-[#5e5a52] group-hover:text-[#c5a059] transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Newsletter callout */}
      <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-8 max-w-2xl mx-auto">
        <NewsletterSignup
          variant="news"
          heading="Receive New Stories by Email"
          text="Occasional fiction dispatches, lore drops, and first-look drafts delivered straight to your inbox."
          buttonText="Subscribe for Stories"
          source="stories_page"
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
