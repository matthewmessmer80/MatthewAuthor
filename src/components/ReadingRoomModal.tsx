import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { X, BookOpen, Sun, Moon, Type, Bookmark, ArrowRight, Share2, Check } from 'lucide-react';

interface ReadingRoomModalProps {
  book: Book | null;
  onClose: () => void;
  onOpenBookDetail?: (book: Book) => void;
}

export const ReadingRoomModal: React.FC<ReadingRoomModalProps> = ({
  book,
  onClose,
  onOpenBookDetail,
}) => {
  const [theme, setTheme] = useState<'parchment' | 'dark' | 'sepia'>('dark');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copiedQuote, setCopiedQuote] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!book) return null;

  const fontClasses = {
    normal: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    large: 'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    xlarge: 'text-xl sm:text-2xl leading-loose',
  }[fontSize];

  const themeStyles = {
    dark: 'bg-[#0f1118] text-[#e3ded4] border-[#25283a]',
    parchment: 'bg-[#f6f2ea] text-[#24211d] border-[#ded7c8]',
    sepia: 'bg-[#eee4d3] text-[#2b241c] border-[#cfc1aa]',
  }[theme];

  const accentColor = book.accentColor || '#c5a059';

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${book.quote.text}" — ${book.title} by Matthew E. Messmer`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading Room: ${book.title}`}
    >
      <div
        className={`relative w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden transition-colors flex flex-col my-auto max-h-[92vh] ${themeStyles}`}
      >
        {/* Top Control Bar */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b text-xs transition-colors shrink-0 ${
            theme === 'dark'
              ? 'bg-[#0b0c12] border-[#222436] text-[#9b9588]'
              : theme === 'parchment'
              ? 'bg-[#ece6dc] border-[#ded5c5] text-[#6b6456]'
              : 'bg-[#e2d5c0] border-[#cbbca3] text-[#5e5342]'
          }`}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <BookOpen className="w-4 h-4 text-[#c5a059] shrink-0" />
            <span className="font-cinzel font-semibold tracking-wide truncate">
              {book.title}
            </span>
            <span className="hidden sm:inline text-opacity-60">·</span>
            <span className="hidden sm:inline text-opacity-80 truncate">
              {book.series}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Font size control */}
            <div className="flex items-center gap-1 border border-current/20 rounded p-0.5">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                  fontSize === 'normal' ? 'bg-current/15' : 'hover:bg-current/10'
                }`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-1.5 py-0.5 text-sm font-bold rounded ${
                  fontSize === 'large' ? 'bg-current/15' : 'hover:bg-current/10'
                }`}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex items-center gap-1 border border-current/20 rounded p-0.5">
              <button
                onClick={() => setTheme('dark')}
                className={`p-1 rounded ${theme === 'dark' ? 'bg-white/20' : 'hover:bg-current/10'}`}
                title="Charcoal Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('parchment')}
                className={`p-1 rounded ${theme === 'parchment' ? 'bg-black/15' : 'hover:bg-current/10'}`}
                title="Alabaster Parchment Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1 hover:bg-current/15 rounded-md transition-colors"
              aria-label="Close reading room"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reading Canvas */}
        <div className="overflow-y-auto px-6 sm:px-12 py-8 sm:py-12 space-y-6">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto pb-6 border-b border-current/10">
            <p className="text-xs uppercase tracking-widest font-sans font-semibold mb-2 opacity-70">
              The Breathwoven Reading Room
            </p>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold tracking-tight mb-2">
              {book.title}
            </h2>
            <p className="text-sm font-serif italic opacity-80">
              By Matthew E. Messmer
            </p>
            <div className="mt-4 inline-block px-3 py-1 text-xs font-serif uppercase tracking-wider border border-current/20 rounded-full opacity-75">
              {book.excerpt.chapterTitle}
            </div>
          </div>

          {/* Pull quote highlight */}
          <div
            className={`p-4 sm:p-5 rounded-lg border-l-4 my-6 italic font-cormorant text-lg sm:text-xl transition-colors ${
              theme === 'dark'
                ? 'bg-[#151823] border-[#c5a059]'
                : theme === 'parchment'
                ? 'bg-[#ede7dc] border-[#b08b3e]'
                : 'bg-[#e5d8c3] border-[#9e7629]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>"{book.quote.text}"</p>
              <button
                onClick={handleCopyQuote}
                title="Copy quote"
                className="opacity-60 hover:opacity-100 p-1 shrink-0 transition-opacity"
              >
                {copiedQuote ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs not-italic font-sans font-medium uppercase tracking-wider mt-2 opacity-70">
              — {book.quote.attribution}
            </p>
          </div>

          {/* Chapter Text */}
          <div className={`font-reading ${fontClasses} max-w-2xl mx-auto space-y-5`}>
            {book.excerpt.text.map((paragraph, idx) => {
              if (idx === 0) {
                return (
                  <p key={idx} className="drop-cap-lead">
                    {paragraph}
                  </p>
                );
              }
              return (
                <p key={idx} className="opacity-95">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* End of Excerpt Ornament */}
          <div className="pt-10 text-center">
            <div className="inline-flex items-center justify-center gap-3 text-current/40 mb-6">
              <span className="w-12 h-[1px] bg-current" />
              <span className="font-cinzel text-xs tracking-widest">❦</span>
              <span className="w-12 h-[1px] bg-current" />
            </div>

            <p className="text-sm font-serif italic opacity-85 mb-4">
              End of Chapter Preview
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {book.buyLinks && book.buyLinks.length > 0 && (
                <a
                  href={book.buyLinks[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-semibold tracking-wider uppercase rounded-md transition-colors shadow-md flex items-center gap-2"
                >
                  <span>Purchase Full Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}

              {onOpenBookDetail && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBookDetail(book);
                  }}
                  className="px-4 py-2 border border-current/30 hover:bg-current/10 text-xs font-cinzel tracking-wider uppercase rounded-md transition-colors"
                >
                  View Book Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
