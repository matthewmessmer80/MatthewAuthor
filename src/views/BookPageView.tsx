import React from 'react';
import { Book } from '../types';
import { BookCoverArt } from '../components/BookCoverArt';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { ReaderComments } from '../components/ReaderComments';
import { useSEO } from '../hooks/useSEO';
import {
  BookOpen,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  ArrowLeft,
  Calendar,
  BookCopy,
} from 'lucide-react';

interface BookPageViewProps {
  book: Book;
  onOpenExcerpt: (book: Book) => void;
  onOpenPrivacy?: () => void;
  setActiveTab: (tab: string) => void;
  onOpenAuthModal?: () => void;
}

export const BookPageView: React.FC<BookPageViewProps> = ({
  book,
  onOpenExcerpt,
  onOpenPrivacy,
  setActiveTab,
  onOpenAuthModal,
}) => {
  useSEO(book.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Back button */}
      <button
        onClick={() => {
          setActiveTab('books');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Books</span>
      </button>

      {/* Main Book Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Presentation & Synopsis */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 text-xs text-[#a39e90]">
            <span className="text-[#c5a059] font-cinzel font-semibold uppercase tracking-wider">
              {book.series}
            </span>
            <span aria-hidden="true">·</span>
            <span>Book {book.seriesOrder}</span>
            <span aria-hidden="true">·</span>
            <span>{book.releaseYear}</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-lg sm:text-xl font-cormorant italic text-[#c5a059] mt-2 font-medium">
                {book.subtitle}
              </p>
            )}
            <p className="text-sm font-cinzel text-[#8f897c] mt-1">
              By Matthew E. Messmer
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#b2aca0] leading-relaxed">
            {book.synopsis}
          </p>

          {/* Quote Block */}
          {book.quote && (
            <blockquote className="border-l-2 border-[#c5a059] pl-4 py-1 italic font-cormorant text-lg text-[#ded8cb]">
              "{book.quote.text}"
              <footer className="text-xs text-[#8f897c] font-cinzel not-italic mt-1">
                — {book.quote.attribution}
              </footer>
            </blockquote>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenExcerpt(book)}
              className="px-6 py-3 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-xl shadow-[#c5a059]/15 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Chapter 1 Excerpt</span>
            </button>

            {book.series === 'The Breathwoven Cycle' && (
              <button
                onClick={() => {
                  setActiveTab('breathwoven-cycle');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-3 border border-[#3b3d4f] hover:border-[#c5a059] text-[#d6d0c4] hover:text-[#f5efeb] text-xs font-cinzel tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
              >
                The Breathwoven Cycle
              </button>
            )}
          </div>

          {/* Buy & Retailer Links */}
          {book.buyLinks && book.buyLinks.length > 0 && (
            <div className="pt-4 border-t border-[#212332] space-y-2">
              <span className="text-xs font-cinzel uppercase tracking-wider text-[#a8a396] font-semibold block">
                Available Retailers & Formats:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {book.buyLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#12141e] hover:bg-[#1c1e2c] border border-[#2b2e40] hover:border-[#c5a059]/40 rounded-lg text-xs font-medium text-[#e2ded5] transition-colors flex items-center gap-1.5"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="w-3 h-3 text-[#7f7a6f]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Cover Presentation & Bibliographic Specs */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-[#2b2e3f] bg-[#12141d] p-6 space-y-4">
            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-[#36384a]">
              <BookCoverArt book={book} className="w-full h-full" />
            </div>

            <div className="space-y-2 text-xs text-[#a39e90]">
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>ISBN:</span>
                <span className="font-mono text-[#dcd7cb]">{book.isbn || '978-1-962450-XX-X'}</span>
              </div>
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Length:</span>
                <span>{book.pageCount ? `${book.pageCount} Pages` : 'Epic Length'}</span>
              </div>
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Formats:</span>
                <span>{(book.format || ['Hardcover', 'Paperback', 'E-Book']).join(', ')}</span>
              </div>
              <div className="flex justify-between border-b border-[#212332] pb-1">
                <span>Publisher:</span>
                <span>{book.publisher || 'Breathwoven Press'}</span>
              </div>
              {book.woodEngravingNote && (
                <div className="pt-2 text-[11px] text-[#c5a059] italic">
                  ★ Workshop Artifact: {book.woodEngravingNote}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Excerpt Section */}
      {(() => {
        const excerpt = book.excerpt || { chapterTitle: 'First Chapter Reading', text: ['Excerpt coming soon.'] };
        return (
          <div className="bg-[#11131c] border border-[#282a3c] rounded-2xl p-6 sm:p-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#212334] pb-4">
              <div>
                <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
                  First Chapter Reading
                </span>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-0.5">
                  {excerpt.chapterTitle}
                </h3>
              </div>
              <button
                onClick={() => onOpenExcerpt(book)}
                className="text-xs text-[#c5a059] hover:underline font-cinzel cursor-pointer"
              >
                Launch Fullscreen Reading Room →
              </button>
            </div>

            <div className="space-y-4 font-serif text-sm sm:text-base text-[#c9c4b7] leading-relaxed max-w-3xl">
              {excerpt.text.map((para, idx) => (
                <p key={idx} className={idx === 0 ? 'first-letter:text-4xl first-letter:font-cinzel first-letter:text-[#c5a059] first-letter:float-left first-letter:mr-2' : ''}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Reader Discussion / Comments Section (Prompt Section 5) */}
      <ReaderComments
        bookId={book.id}
        bookTitle={book.title}
        bookSlug={book.slug}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Newsletter */}
      <div className="bg-[#12141f] border border-[#2a2d40] rounded-2xl p-8 max-w-2xl mx-auto">
        <NewsletterSignup
          variant="book_page"
          heading={`Follow the Story of ${book.title}`}
          text="Get notifications about signed hardcover editions, upcoming sequels, and exclusive lore side-stories."
          buttonText="Join the Journey"
          source={`book_page_${book.id}`}
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
