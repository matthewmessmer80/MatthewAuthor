import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService, managedBookToBook } from '../services/bookService';
import { BookCoverArt } from '../components/BookCoverArt';
import { CompanionSongsSection } from '../components/CompanionSongsSection';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Flame, BookOpen, Sparkles, Shield, Bookmark, ArrowRight, Layers } from 'lucide-react';

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

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const found = await bookService.getBookById('ignis-kor');
        if (found) {
          setBook(managedBookToBook(found));
        } else {
          setBook(null);
        }
      } catch (err) {
        console.warn('Error loading ignis-kor from database:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBook();
    const unsub = bookService.subscribe(loadBook);
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 border border-[#ea580c]/30 text-[#ea580c] flex items-center justify-center mx-auto animate-pulse">
          <Flame className="w-6 h-6" />
        </div>
        <p className="text-xs font-cinzel text-[#8e887a]">Opening chronicle...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-[#ea580c]/10 border border-[#ea580c]/30 text-[#ea580c] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-cinzel font-bold text-[#f5efeb]">Novella Not Available</h2>
        <p className="text-xs text-[#8e887a] max-w-md mx-auto">
          This volume may have been archived or removed from the catalog.
        </p>
        <button
          onClick={() => setActiveTab('books')}
          className="px-5 py-2.5 bg-[#c5a059] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded-lg cursor-pointer"
        >
          Return to Books Catalog
        </button>
      </div>
    );
  }

  const quote = book.quote || { text: 'Where embers refuse to die, an ancient forge reawakens.', attribution: 'Ignis-Kor' };
  const excerpt = book.excerpt || { chapterTitle: 'Prologue', text: ['Excerpt coming soon.'] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Lore & Presentation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ea580c]/10 border border-[#ea580c]/30 rounded-full text-xs font-cinzel text-[#ea580c] uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>{book.series || 'The Breathwoven Universe'} · Novella</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
              {book.title}
            </h1>
            <p className="text-lg sm:text-xl font-cormorant italic text-[#ea580c] mt-2 font-medium">
              "{book.tagline || book.subtitle || 'Where embers refuse to die, an ancient forge reawakens.'}"
            </p>
          </div>

          <div className="space-y-4 text-sm text-[#b2aca0] leading-relaxed">
            <p>{book.synopsis || book.description}</p>
            <p>
              Before the Great Solstice, the flame-weavers served as guardians of thermal equilibrium. In this novella, author Matthew E. Messmer delves into the molten core of Mount Ignis-Kor, examining how family heritage and stubborn courage survive in the darkest volcanic depths.
            </p>
          </div>

          {/* Quote Block */}
          <blockquote className="border-l-2 border-[#ea580c] pl-4 py-1 italic font-cormorant text-lg text-[#ded8cb]">
            "{quote.text}"
            <footer className="text-xs text-[#8f897c] font-cinzel not-italic mt-1">
              — {quote.attribution}
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

        {/* Right: Book Cover */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-[#3b2a24] bg-[#140f0c] p-6 relative group">
            <div className="absolute inset-0 bg-[#ea580c]/10 blur-xl rounded-lg group-hover:bg-[#ea580c]/20 transition-all pointer-events-none" />
            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-[#523326] relative z-10">
              <BookCoverArt book={book} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Worldbuilding & Craft Lore Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#14100e] border border-[#38261e] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#ea580c]/15 flex items-center justify-center text-[#ea580c]">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">Pyric Weaving</h3>
          <p className="text-xs text-[#a69992] leading-relaxed">
            Unlike the gold threads of the high realm, pyric weaving utilizes incandescent obsidian fibers that hold heat even beneath crushing ice.
          </p>
        </div>

        <div className="bg-[#14100e] border border-[#38261e] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#c5a059]/15 flex items-center justify-center text-[#c5a059]">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">The Hearthkeep</h3>
          <p className="text-xs text-[#a69992] leading-relaxed">
            The subterranean bastion where refugees sheltered during the initial severance, guarded by four families bound in blood and oath.
          </p>
        </div>

        <div className="bg-[#14100e] border border-[#38261e] p-6 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6]">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel font-bold text-[#f5efeb] text-base">Woodcut Artifacts</h3>
          <p className="text-xs text-[#a69992] leading-relaxed">
            Inspired by Matthew's physical laser engraving work, every seal and map of Mount Ignis-Kor has been laser-cut in layered Texas birch.
          </p>
        </div>
      </div>

      {/* Excerpt Section */}
      <div className="bg-[#120f0d] border border-[#36261e] rounded-2xl p-8 sm:p-12 space-y-6 max-w-4xl mx-auto">
        <div className="text-center pb-4 border-b border-[#36261e]">
          <p className="text-xs uppercase font-cinzel tracking-widest text-[#ea580c] font-semibold mb-1">
            Opening Passage
          </p>
          <h3 className="text-2xl font-cinzel font-bold text-[#f5efeb]">
            {excerpt.chapterTitle}
          </h3>
        </div>

        <div className="font-reading text-sm sm:text-base text-[#d1c7c0] leading-relaxed space-y-4">
          {excerpt.text.map((para, i) => (
            <p key={i} className={i === 0 ? 'drop-cap-lead' : ''}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Companion Soundtracks for Ignis-Kor */}
      {book && (
        <CompanionSongsSection
          bookId={book.id}
          bookTitle={book.title}
          seriesId={book.seriesId}
          seriesName={book.seriesName || book.series}
        />
      )}

      {/* Newsletter Section */}
      <div className="max-w-3xl mx-auto pt-6">
        <NewsletterSignup
          variant="book_page"
          heading="Want to Follow the Fire?"
          text="Join the newsletter for future dispatches, woodcut reveals, and lore updates from Ignis-Kor and The Breathwoven Universe."
          buttonText="Join the Hearth"
          source="ignis_kor_page"
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
