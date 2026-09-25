import React from 'react';
import { Book } from '../types';
import { BookCoverArt } from './BookCoverArt';
import { BookOpen, ExternalLink, Sparkles, Feather } from 'lucide-react';

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
  const isUpcoming = book.status === 'upcoming';

  return (
    <div className="group relative bg-[#12141d]/90 border border-[#232635] hover:border-[#c5a059]/50 rounded-xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-[#c5a059]/5">
      <div>
        {/* Cover and header block */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div
            onClick={() => onOpenDetails(book)}
            className="cursor-pointer shrink-0 mx-auto sm:mx-0"
          >
            <BookCoverArt book={book} size="md" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Series kicker with zero-pill discipline */}
            <div className="flex items-center gap-2 text-xs text-[#a39e93] mb-1.5 flex-wrap">
              <span className="text-[#c5a059] font-medium">{book.series}</span>
              <span aria-hidden="true">·</span>
              <span>Book {book.seriesOrder}</span>
              <span aria-hidden="true">·</span>
              <span>{book.releaseYear}</span>
            </div>

            <h3
              onClick={() => onOpenDetails(book)}
              className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors cursor-pointer leading-tight mb-1"
            >
              {book.title}
            </h3>

            {book.subtitle && (
              <p className="text-[11px] uppercase tracking-wider text-[#a8a395] font-cinzel font-semibold mb-2">
                {book.subtitle}
              </p>
            )}

            <p className="text-xs sm:text-sm font-cormorant italic text-[#d4cdbf] leading-relaxed mb-3 line-clamp-2">
              "{book.tagline}"
            </p>

            <p className="text-xs text-[#9d978a] leading-relaxed line-clamp-3 mb-4">
              {book.synopsis}
            </p>

            {/* Formats list (unboxed clean text) */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#787368] flex-wrap mb-4">
              <span className="font-semibold text-[#a8a396]">Formats:</span>
              {book.format.map((fmt, idx) => (
                <React.Fragment key={fmt}>
                  <span>{fmt}</span>
                  {idx < book.format.length - 1 && <span aria-hidden="true">·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-[#1e202c] mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenExcerpt(book)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cinzel font-semibold tracking-wider uppercase text-[#f5efeb] bg-[#1a1d29] hover:bg-[#25293a] border border-[#303348] rounded-md transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Read Excerpt</span>
          </button>

          <button
            onClick={() => onOpenDetails(book)}
            className="text-xs text-[#b8b2a3] hover:text-[#f5efeb] underline cursor-pointer px-2 py-1"
          >
            Full Details & Lore
          </button>
        </div>

        {book.buyLinks && book.buyLinks.length > 0 && !isUpcoming && (
          <a
            href={book.buyLinks[0].url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#c5a059] hover:text-[#e0bb6c] cursor-pointer"
          >
            <span>Order</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {isUpcoming && (
          <span className="text-[11px] font-medium text-teal-400/90 tracking-wide uppercase font-cinzel">
            In Development
          </span>
        )}
      </div>
    </div>
  );
};
