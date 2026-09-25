import React, { useState } from 'react';
import { Book } from '../types';
import { BOOKS } from '../data/authorData';
import { BookCard } from '../components/BookCard';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { BookOpen, Sparkles, Filter, ListOrdered } from 'lucide-react';

interface BooksViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail: (book: Book) => void;
  onOpenPrivacy?: () => void;
}

export const BooksView: React.FC<BooksViewProps> = ({
  onOpenExcerpt,
  onOpenBookDetail,
  onOpenPrivacy,
}) => {
  useSEO('books');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  const filteredBooks = BOOKS.filter((b) => {
    if (selectedSeries === 'all') return true;
    return b.series === selectedSeries;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          The Literary Bibliography
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          The Books & Universes
        </h1>
        <p className="text-sm sm:text-base text-[#a8a396] font-cormorant italic text-xl leading-relaxed">
          "His stories explore the threads that connect people across time—family, identity, sacrifice, love, courage, and the choices that shape who we become."
        </p>
      </div>

      {/* Series Filter Tabs (Clean segmented control per Constitution) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1 p-1 bg-[#131520] border border-[#232635] rounded-lg">
          <button
            onClick={() => setSelectedSeries('all')}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-md transition-colors cursor-pointer ${
              selectedSeries === 'all'
                ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            All Works ({BOOKS.length})
          </button>
          <button
            onClick={() => setSelectedSeries('The Breathwoven Cycle')}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-md transition-colors cursor-pointer ${
              selectedSeries === 'The Breathwoven Cycle'
                ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            The Breathwoven Cycle
          </button>
          <button
            onClick={() => setSelectedSeries('The Abyssal Current')}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-md transition-colors cursor-pointer ${
              selectedSeries === 'The Abyssal Current'
                ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            The Abyssal Current
          </button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onOpenExcerpt={onOpenExcerpt}
            onOpenDetails={onOpenBookDetail}
          />
        ))}
      </div>

      {/* Suggested Chronology / Reading Order Guide */}
      <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5">
          <ListOrdered className="w-5 h-5 text-[#c5a059]" />
          <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
            Suggested Reading Chronology
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed max-w-3xl">
          While each novel functions as a complete dramatic arc, the metaphysical laws of the weave and celestial currents build consecutively.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#161825] border border-[#2b2e40] space-y-2">
            <span className="text-xs font-cinzel font-bold text-[#c5a059]">01. Begin Here</span>
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">The King's Severance</h4>
            <p className="text-xs text-[#8e887a]">
              The foundation of the realm. Introduces Donald, the snapping of the Sovereign Thread, and the mechanics of the cosmic loom.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161825] border border-[#2b2e40] space-y-2">
            <span className="text-xs font-cinzel font-bold text-[#5c8df6]">02. The Aftermath</span>
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">The Blue Moon Child</h4>
            <p className="text-xs text-[#8e887a]">
              Explores the celestial tides, memory displacement, and the rise of children born with quicksilver irises across the Archipelago.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161825] border border-[#2b2e40] space-y-2">
            <span className="text-xs font-cinzel font-bold text-[#d97706]">03. The Climax</span>
            <h4 className="text-sm font-cinzel font-bold text-[#f5efeb]">The Weaver's Lullaby</h4>
            <p className="text-xs text-[#8e887a]">
              The sunken city of Oros-Thal, the awakening of the ancient petrified weavers, and the enduring song of sacrifice.
            </p>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL BOOK PAGES NEWSLETTER SECTION */}
      {/*
        "Individual Book Pages:
         Add a signup section below the book information.
         Example:
         Want to know what's next?
         Join the newsletter for updates about upcoming books and stories."
      */}
      <div className="max-w-3xl mx-auto pt-6">
        <NewsletterSignup
          variant="book_page"
          heading="Want to know what's next?"
          text="Join the newsletter for updates about upcoming books and stories."
          buttonText="Join the Journey"
          source="books_catalog_page"
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
