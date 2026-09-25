import React, { useEffect } from 'react';
import { ManagedBook, bookService } from '../../services/bookService';
import { BookCoverArt } from '../../components/BookCoverArt';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface AdminBookPreviewModalProps {
  book: ManagedBook;
  onBackToEditor: () => void;
  onPublish: (book: ManagedBook) => void;
}

export const AdminBookPreviewModal: React.FC<AdminBookPreviewModalProps> = ({
  book,
  onBackToEditor,
  onPublish,
}) => {
  // Ensure preview is strictly non-indexable
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const originalContent = robotsMeta ? robotsMeta.getAttribute('content') : null;

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (originalContent) {
        robotsMeta?.setAttribute('content', originalContent);
      } else {
        robotsMeta?.remove();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0c0d13] text-[#e8e2d9] animate-in fade-in duration-200">
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-50 bg-[#12141f] border-b border-[#2b2e42] px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEditor}
            className="px-3 py-1.5 bg-[#1a1c29] hover:bg-[#25283a] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-700/40 rounded text-[11px] text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Preview Mode · Non-Indexable</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8e887a] hidden md:inline">
            Status:{' '}
            <strong className="text-[#c5a059] uppercase">{book.publicationState}</strong>
          </span>

          {book.publicationState !== 'PUBLIC' ? (
            <button
              onClick={() => onPublish(book)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Publish Book</span>
            </button>
          ) : (
            <div className="px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded text-xs text-emerald-300 font-cinzel flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Currently Published</span>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Exact Public Book Page */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cover Column */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-[320px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-[#2b2e40]">
              <BookCoverArt
                book={book as any}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059]">
                {book.seriesName} · Book {book.bookNumber || book.seriesOrder}
              </div>
              <h1 className="text-3xl sm:text-4xl font-cinzel font-bold text-[#f5efeb]">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-base text-[#a8a396] font-cormorant italic">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Quick stats pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-[#131520] border border-[#232635] rounded text-[#c5a059]">
                {book.genre || 'Epic Fantasy'}
              </span>
              <span className="px-2.5 py-1 bg-[#131520] border border-[#232635] rounded text-[#8e887a]">
                {book.pageCount ? `${book.pageCount} Pages` : '448 Pages'}
              </span>
              <span className="px-2.5 py-1 bg-[#131520] border border-[#232635] rounded text-[#8e887a]">
                {book.publisher || 'Breathwoven Press'}
              </span>
            </div>

            {/* Purchase CTA */}
            {book.amazonUrl ? (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-[#c5a059]/20"
              >
                <span>Purchase on Amazon</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="inline-block px-4 py-2 bg-[#171924] border border-[#2b2e40] rounded text-xs text-[#8e887a]">
                Purchasing options will appear here once configured.
              </div>
            )}

            {/* Synopsis */}
            <div className="space-y-3 pt-4 border-t border-[#1e202d]">
              <h2 className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold">
                Synopsis
              </h2>
              <div className="text-sm text-[#d4cfc2] leading-relaxed whitespace-pre-line font-cormorant text-base">
                {book.description || 'Synopsis in progress.'}
              </div>
            </div>

            {/* Wood Engraving Note if present */}
            {book.woodEngravingNote && (
              <div className="p-4 bg-[#11131c] border border-[#282a3d] rounded-xl space-y-1">
                <div className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                  Laser-Engraved Hardcover Relief
                </div>
                <p className="text-xs text-[#9d978a] italic">
                  {book.woodEngravingNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Excerpt Section if present */}
        {book.excerpt && (
          <div className="p-8 bg-[#10121a] border border-[#232635] rounded-2xl space-y-4">
            <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
              {book.excerpt.chapterTitle}
            </h3>
            <div className="space-y-3 font-cormorant text-base text-[#d4cfc2] leading-relaxed">
              {book.excerpt.text.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
