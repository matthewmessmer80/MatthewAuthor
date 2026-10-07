import React from 'react';
import { Book } from '../types';
import { BookCoverArt } from './BookCoverArt';
import { BookOpen, ExternalLink, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onOpenExcerpt: (book: Book) => void;
  onOpenDetails: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenExcerpt,
  onOpenDetails,
}) => {
  const status: 'published' | 'pending' | 'unreleased' = (() => {
    const s = String(book.status || '').toLowerCase();
    if (s === 'pending' || s === 'upcoming') return 'pending';
    if (s === 'unreleased' || s === 'in-progress' || s === 'draft') return 'unreleased';
    return 'published';
  })();

  const isPublished = status === 'published';

  // Find direct Amazon link if present in buyLinks
  const amazonLink =
    book.buyLinks?.find(
      (link) =>
        link.name.toLowerCase().includes('amazon') ||
        link.url.toLowerCase().includes('amazon')
    ) ||
    (book.buyLinks && book.buyLinks.length > 0 ? book.buyLinks[0] : null);

  const displayQuote = book.quote?.text || book.tagline;

  return (
    <article className="group relative bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col h-full shadow-xl hover:shadow-2xl hover:shadow-[#c5a059]/10">
      {/* 1. BOOK COVER - Visually dominant, centered at top with portrait 2:3 ratio */}
      <div
        onClick={() => onOpenDetails(book)}
        className="w-full max-w-[280px] aspect-[2/3] mx-auto mb-5 cursor-pointer rounded-lg overflow-hidden shadow-2xl relative group-hover:scale-[1.02] transition-transform duration-300 shrink-0 bg-[#090b10] border border-[#2b2e40]/70"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenDetails(book);
        }}
        aria-label={`View full details for ${book.title}`}
      >
        <BookCoverArt book={book} size="fill" className="w-full h-full" showHoverEffect={false} />
      </div>

      {/* 2. FULL-WIDTH TEXT & METADATA CONTENT AREA (underneath cover) */}
      <div className="flex-1 flex flex-col w-full text-left">
        {/* Series & Status Badge Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[#c5a059] font-cinzel text-xs font-semibold tracking-wider uppercase">
              {book.series}
            </p>
            <p className="text-[11px] text-[#8e887a] font-mono mt-0.5">
              Book {book.seriesOrder}{book.releaseYear ? ` · ${book.releaseYear}` : ''}
            </p>
          </div>

          {/* Conditional Status Badges */}
          {status === 'published' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Published</span>
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/30 shrink-0 shadow-sm">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              <span>Pending</span>
            </span>
          )}
          {status === 'unreleased' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-600/40 shrink-0 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Unreleased</span>
            </span>
          )}
        </div>

        {/* Book Title - prominent, full width, responsive wrapping */}
        <h3
          onClick={() => onOpenDetails(book)}
          className="text-lg sm:text-xl font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors cursor-pointer leading-snug tracking-normal mb-1 uppercase"
        >
          {book.title}
        </h3>

        {/* Subtitle */}
        {book.subtitle && (
          <p className="text-xs text-[#a8a395] font-cinzel mb-3 leading-relaxed">
            {book.subtitle}
          </p>
        )}

        {/* Quote / Excerpt Block (subtle italicized block) */}
        {displayQuote && (
          <div className="mb-3.5 pl-3 border-l-2 border-[#c5a059]/40 bg-[#161825]/40 rounded-r py-1.5 pr-2">
            <p className="text-xs sm:text-[13px] font-cormorant italic text-[#d4cdbf] leading-relaxed line-clamp-2">
              "{displayQuote}"
            </p>
          </div>
        )}

        {/* Book Description - full width with comfortable line height */}
        <p className="text-xs text-[#9d978a] leading-relaxed line-clamp-4 mb-4">
          {book.synopsis}
        </p>

        {/* Formats List (unboxed clean inline typography on one/two lines) */}
        {book.format && book.format.length > 0 && (
          <div className="text-xs text-[#8e887a] mb-5">
            <span className="font-semibold text-[#a8a396] font-cinzel text-[11px] uppercase tracking-wider mr-1.5">
              Formats:
            </span>
            <span className="text-[#c7c1b5]">
              {book.format.join(' · ')}
            </span>
          </div>
        )}

        {/* 3. ACTION BUTTONS (Pinned to bottom of card) */}
        <div className="mt-auto pt-4 border-t border-[#1e202c] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onOpenDetails(book)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-cinzel font-semibold tracking-wider uppercase text-[#f5efeb] bg-[#1a1d29] hover:bg-[#25293a] border border-[#303348] hover:border-[#c5a059]/50 rounded-lg transition-colors cursor-pointer shadow-sm text-center"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
            <span className="whitespace-nowrap">View Book</span>
          </button>

          {/* Conditional Purchase / Availability Button */}
          {isPublished && amazonLink ? (
            <a
              href={amazonLink.url}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-cinzel font-bold tracking-wider uppercase text-[#0d0e14] bg-[#c5a059] hover:bg-[#d6b066] rounded-lg transition-colors cursor-pointer shadow-md shadow-[#c5a059]/10 text-center"
            >
              <span className="whitespace-nowrap">Buy on Amazon</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          ) : isPublished && book.purchaseLink && !book.purchaseLink.startsWith('#') ? (
            <a
              href={book.purchaseLink}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-cinzel font-bold tracking-wider uppercase text-[#0d0e14] bg-[#c5a059] hover:bg-[#d6b066] rounded-lg transition-colors cursor-pointer shadow-md shadow-[#c5a059]/10 text-center"
            >
              <span className="whitespace-nowrap">Purchase Book</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          ) : status === 'pending' ? (
            <div className="w-full py-2.5 px-3 text-[11px] font-cinzel font-semibold text-amber-300 tracking-wider uppercase bg-amber-500/10 rounded-lg border border-amber-500/25 text-center flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Release date TBA</span>
            </div>
          ) : (
            <div className="w-full py-2.5 px-3 text-[11px] font-cinzel font-semibold text-slate-300 tracking-wider uppercase bg-slate-800/60 rounded-lg border border-slate-700/60 text-center flex items-center justify-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Release date TBA</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
