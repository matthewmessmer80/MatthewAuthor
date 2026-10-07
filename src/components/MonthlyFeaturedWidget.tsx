import React, { useState, useEffect } from 'react';
import { featuredService, FeaturedItemResult } from '../services/featuredService';
import { bookService } from '../services/bookService';
import { Book, Story } from '../types';
import { BookCoverArt } from './BookCoverArt';
import {
  Sparkles,
  Calendar,
  BookOpen,
  ArrowRight,
  Pin,
  Clock,
  Compass,
  Star,
} from 'lucide-react';

interface MonthlyFeaturedWidgetProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail: (book: Book) => void;
  onOpenStory?: (story: Story) => void;
  setActiveTab: (tab: string) => void;
}

export const MonthlyFeaturedWidget: React.FC<MonthlyFeaturedWidgetProps> = ({
  onOpenExcerpt,
  onOpenBookDetail,
  onOpenStory,
  setActiveTab,
}) => {
  const [featuredData, setFeaturedData] = useState<FeaturedItemResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFeature = async () => {
      try {
        const res = await featuredService.getCurrentFeaturedItem();
        if (mounted) {
          setFeaturedData(res);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };

    fetchFeature();
    const unsub = bookService.subscribe(fetchFeature);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="h-44 rounded-2xl bg-[#11131c]/60 border border-[#232635] animate-pulse" />
      </div>
    );
  }

  if (!featuredData) {
    return null;
  }

  const isBook = featuredData.type === 'book';
  const book = isBook ? (featuredData.item as Book) : null;
  const story = !isBook ? (featuredData.item as Story) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121420] via-[#161828] to-[#10121c] border border-[#c5a059]/30 p-6 sm:p-8 shadow-2xl transition-all">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#c5a059]/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Left: Metadata & Information */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-cinzel uppercase font-bold tracking-widest bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1.5 shadow-sm">
                <Calendar className="w-3 h-3" />
                <span>Monthly Spotlight · {featuredData.monthName} {featuredData.year}</span>
              </span>

              {featuredData.isOverride ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" />
                  <span>Author's Handpicked Feature</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#1d2030] text-[#a8a396] border border-[#2e3146] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#c5a059]" />
                  <span>Automatic Monthly Rotation</span>
                </span>
              )}

              <span className="text-[11px] font-cinzel text-[#8f897c]">
                {isBook ? `Book Spotlight` : `Short Story Spotlight`}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-cinzel font-bold text-[#f5efeb] leading-tight">
                {isBook ? book?.title : story?.title}
              </h2>
              <p className="text-xs sm:text-sm font-cormorant italic text-[#c5a059] mt-1 font-medium text-base">
                {isBook
                  ? book?.subtitle || `${book?.series} · Book ${book?.seriesOrder}`
                  : story?.subtitle || `From the universe of ${story?.universe}`}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#b5af9f] line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl">
              {isBook ? book?.synopsis : story?.summary}
            </p>

            {featuredData.note && (
              <p className="text-[11px] text-[#787367] italic font-cormorant text-sm">
                — {featuredData.note}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {isBook && book ? (
                <>
                  <button
                    onClick={() => onOpenExcerpt(book)}
                    className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#c5a059]/15 flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Excerpt</span>
                  </button>
                  <button
                    onClick={() => onOpenBookDetail(book)}
                    className="px-4 py-2 bg-[#171926] hover:bg-[#222536] text-[#d6d0c4] hover:text-[#f5efeb] border border-[#2e3146] text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Edition Details</span>
                    <ArrowRight className="w-3 h-3 text-[#c5a059]" />
                  </button>
                </>
              ) : story ? (
                <button
                  onClick={() => {
                    if (onOpenStory) {
                      onOpenStory(story);
                    } else {
                      setActiveTab('stories');
                    }
                  }}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#c5a059]/15 flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Short Story</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Right: Graphic thumbnail */}
          <div className="shrink-0 flex items-center justify-center">
            {isBook && book ? (
              <div
                onClick={() => onOpenBookDetail(book)}
                className="w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden border border-[#c5a059]/40 shadow-xl cursor-pointer hover:scale-105 transition-transform"
              >
                <BookCoverArt book={book} className="w-full h-full" />
              </div>
            ) : story ? (
              <div
                onClick={() => {
                  if (onOpenStory) onOpenStory(story);
                  else setActiveTab('stories');
                }}
                className="w-24 sm:w-28 aspect-[3/4] rounded-lg bg-[#181a28] border border-[#c5a059]/40 shadow-xl p-3 flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform text-center"
              >
                <div className="text-[9px] font-cinzel uppercase text-[#c5a059] truncate">
                  {story.universe}
                </div>
                <BookOpen className="w-8 h-8 text-[#c5a059] mx-auto opacity-70" />
                <div className="text-[10px] text-[#7d786d] flex items-center justify-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{story.readTime}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
