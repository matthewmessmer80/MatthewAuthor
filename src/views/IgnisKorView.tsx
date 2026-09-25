import React from 'react';
import { Book } from '../types';
import { BOOKS } from '../data/authorData';
import { BookCoverArt } from '../components/BookCoverArt';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Flame, BookOpen, Sparkles, Shield, Bookmark, ArrowRight } from 'lucide-react';

interface IgnisKorViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenPrivacy?: () => void;
  setActiveTab: (tab: string) => void;
}

export const IgnisKorView: React.FC<IgnisKorViewProps> = ({
  onOpenExcerpt,
  onOpenPrivacy,
  setActiveTab,
}) => {
  useSEO('ignis-kor');

  const book = BOOKS.find((b) => b.id === 'ignis-kor') || BOOKS[4];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Lore & Presentation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ea580c]/10 border border-[#ea580c]/30 rounded-full text-xs font-cinzel text-[#ea580c] uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>The Breathwoven Universe Novella</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
              Ignis-Kor: The Heart of Fire
            </h1>
            <p className="text-lg sm:text-xl font-cormorant italic text-[#ea580c] mt-2 font-medium">
              "{book.tagline}"
            </p>
          </div>

          <div className="space-y-4 text-sm text-[#b2aca0] leading-relaxed">
            <p>{book.synopsis}</p>
            <p>
              Before the Great Solstice, the flame-weavers served as guardians of thermal equilibrium. In this standalone novella, author Matthew E. Messmer delves into the molten core of Mount Ignis-Kor, examining how family heritage and stubborn courage survive in the darkest volcanic depths.
            </p>
          </div>

          {/* Quote Block */}
          <blockquote className="border-l-2 border-[#ea580c] pl-4 py-1 italic font-cormorant text-lg text-[#ded8cb]">
            "{book.quote.text}"
            <footer className="text-xs text-[#8f897c] font-cinzel not-italic mt-1">
              — {book.quote.attribution}
            </footer>
          </blockquote>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenExcerpt(book)}
              className="px-6 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-lg shadow-[#ea580c]/20 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Chapter 1 Excerpt</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('breathwoven-cycle');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-3 border border-[#3b3d4f] hover:border-[#ea580c] text-[#d6d0c4] hover:text-[#f5efeb] text-xs font-cinzel tracking-wider uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>The Breathwoven Cycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Book Cover & Physical Artifact Note */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-[#2b2e3f] bg-[#12141d] p-6 space-y-4">
            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden border border-[#36384a]">
              <BookCoverArt book={book} size="lg" />
            </div>

            <div className="space-y-2 text-xs text-[#a39e90]">
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Release Status:</span>
                <span className="text-[#ea580c] font-semibold uppercase">Forthcoming / In-Progress</span>
              </div>
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Format:</span>
                <span>Hardcover, Paperback, Ebook</span>
              </div>
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Publisher:</span>
                <span>Breathwoven Press</span>
              </div>
              {book.woodEngravingNote && (
                <div className="pt-2 text-[11px] text-[#c5a059] italic">
                  ★ Workshop Note: {book.woodEngravingNote}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Excerpt Preview Box */}
      <div className="bg-[#11131c] border border-[#282a3c] rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#212334] pb-4">
          <div>
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#ea580c] font-semibold">
              Preview Reading
            </span>
            <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-0.5">
              {book.excerpt.chapterTitle}
            </h3>
          </div>
          <button
            onClick={() => onOpenExcerpt(book)}
            className="text-xs text-[#ea580c] hover:underline font-cinzel cursor-pointer"
          >
            Launch Fullscreen Reader →
          </button>
        </div>

        <div className="space-y-3 font-serif text-sm sm:text-base text-[#c9c4b7] leading-relaxed max-w-3xl">
          {book.excerpt.text.slice(0, 3).map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </div>

      {/* Dedicated Newsletter for Ignis-Kor */}
      <div className="bg-[#12141f] border border-[#2a2d40] rounded-2xl p-8 max-w-2xl mx-auto">
        <NewsletterSignup
          variant="book_page"
          heading="Join the Forge List"
          text="Receive private advance chapters, preview cover art reveals, and notification when Ignis-Kor limited hardcover editions open."
          buttonText="Register for Ignis-Kor"
          source="ignis_kor_page"
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
