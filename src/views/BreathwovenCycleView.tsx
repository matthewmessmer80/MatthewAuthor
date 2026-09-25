import React from 'react';
import { Book } from '../types';
import { BOOKS } from '../data/authorData';
import { BookCard } from '../components/BookCard';
import { useSEO } from '../hooks/useSEO';
import { BookOpen, Sparkles, Feather, Shield, Compass, Flame } from 'lucide-react';

interface BreathwovenCycleViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail: (book: Book) => void;
  onOpenPrivacy?: () => void;
  setActiveTab: (tab: string) => void;
}

export const BreathwovenCycleView: React.FC<BreathwovenCycleViewProps> = ({
  onOpenExcerpt,
  onOpenBookDetail,
  setActiveTab,
}) => {
  useSEO('breathwoven-cycle');

  const cycleBooks = BOOKS.filter(
    (b) => b.series === 'The Breathwoven Cycle' || b.id === 'ignis-kor'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/25 rounded-full text-xs font-cinzel text-[#c5a059] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Sovereign Saga</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          The Breathwoven Cycle
        </h1>
        <p className="text-lg sm:text-xl font-cormorant italic text-[#c5a059] max-w-2xl mx-auto">
          "When the golden thread of royalty snaps, an empire unravels into song and blade."
        </p>
        <p className="text-sm text-[#b2aca0] leading-relaxed max-w-2xl mx-auto">
          Welcome to the world of Val-Mora and the Archipelago of Spires. In this expanding fantasy universe created by Matthew E. Messmer, reality itself is spun across an ancient cosmic loom, and every choice leaves a thread that must either be tied, mended, or severed.
        </p>
      </div>

      {/* Lore Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#12141d] border border-[#232635] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#c5a059]/15 flex items-center justify-center text-[#c5a059]">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">The Sovereign Loom</h3>
          <p className="text-xs text-[#a39e90] leading-relaxed">
            The foundation of kingdom stability. For nine centuries, high kings ruled not by absolute decree, but by spiritual tether to the earth itself.
          </p>
        </div>

        <div className="bg-[#12141d] border border-[#232635] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#5c8df6]/15 flex items-center justify-center text-[#5c8df6]">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">The Celestial Tide</h3>
          <p className="text-xs text-[#a39e90] leading-relaxed">
            When the sky turned oxidized copper, the ocean's depth became memory. Children born beneath the blue moon hear the singing fibers of time.
          </p>
        </div>

        <div className="bg-[#12141d] border border-[#232635] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#ea580c]/15 flex items-center justify-center text-[#ea580c]">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">The Mantle of Ignis-Kor</h3>
          <p className="text-xs text-[#a39e90] leading-relaxed">
            Deep beneath the frozen peaks, volcanic forges keep the sovereign threads from snapping in the bitter cold of winter.
          </p>
        </div>
      </div>

      {/* Reading Order & Books */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#212331] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb]">
              Official Reading Order
            </h2>
            <p className="text-xs text-[#8f8a7e] mt-1">
              Begin with Book I or explore the companion prequel novella.
            </p>
          </div>
          <div className="text-xs text-[#c5a059] font-cinzel font-medium">
            Arc I: The Severance & The Mending
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cycleBooks.map((book) => (
            <div key={book.id} className="flex flex-col">
              <BookCard
                book={book}
                onOpenExcerpt={onOpenExcerpt}
                onOpenDetails={onOpenBookDetail}
              />
              <div className="mt-3 px-3 py-2 bg-[#12141f] rounded-lg border border-[#212433] text-[11px] text-[#9c9688]">
                <strong className="text-[#c5a059] font-cinzel">Position:</strong>{' '}
                {book.id === 'ignis-kor' ? 'Companion Novella' : `Book ${book.seriesOrder} of the Trilogy`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Universe Timeline Callout */}
      <div className="bg-[#11131c] border border-[#262838] p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="text-2xl font-cinzel font-bold text-[#f5efeb]">
            Want to Explore the Abyssal Current?
          </h3>
          <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
            While <em>The Breathwoven Cycle</em> weaves across sky and stone, Matthew E. Messmer's upcoming epic <em>The Abyssal Current</em> journeys deep into the uncharted oceanic abyss, blending naval military lore with temporal fantasy.
          </p>
          <button
            onClick={() => {
              setActiveTab('abyssal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-[#14b8a6] hover:bg-[#1bb2a1] text-[#0a1114] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Explore The Abyssal Current →
          </button>
        </div>
      </div>
    </div>
  );
};
