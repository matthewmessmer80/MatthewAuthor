import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { BookCoverArt } from './BookCoverArt';
import { NewsletterSignup } from './NewsletterSignup';
import { coverImageService } from '../services/coverImageService';
import { useSEO } from '../hooks/useSEO';
import {
  X,
  BookOpen,
  ExternalLink,
  Bookmark,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Upload,
  RotateCcw,
  CheckCircle2,
  Palette,
} from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onOpenExcerpt: (book: Book) => void;
  onOpenPrivacy?: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onOpenExcerpt,
  onOpenPrivacy,
}) => {
  useSEO(book ? book.id : '');
  const [hasCustomCover, setHasCustomCover] = useState(
    book ? !!coverImageService.getCover(book.id) : false
  );
  const [coverToast, setCoverToast] = useState<string | null>(null);

  useEffect(() => {
    if (book) {
      setHasCustomCover(!!coverImageService.getCover(book.id));
    }
  }, [book]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!book) return null;

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        coverImageService.setCover(book.id, dataUrl);
        setHasCustomCover(true);
        setCoverToast('Cover updated!');
        setTimeout(() => setCoverToast(null), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetCover = () => {
    coverImageService.removeCover(book.id);
    setHasCustomCover(false);
    setCoverToast('Reset to default art');
    setTimeout(() => setCoverToast(null), 2500);
  };

  const discussionQuestions = [
    `How does the concept of "the weave" reflect personal choices, duty, and consequence throughout ${book.title}?`,
    "In what ways do the bonds between characters mirror the resilience and camaraderie found in military or family life?",
    "How does the setting itself function as a living character in the progression of the narrative?",
    "What did the central sacrifice signify to you by the final chapters of the story?",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${book.title}`}
    >
      <div className="relative w-full max-w-4xl bg-[#0f111a] border border-[#2a2d40] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232635] bg-[#0c0d14]">
          <div className="flex items-center gap-2 text-xs text-[#a39e93]">
            <span className="text-[#c5a059] font-semibold">{book.series}</span>
            <span aria-hidden="true">·</span>
            <span>Book {book.seriesOrder}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8477] hover:text-[#f5efeb] hover:bg-[#1c1f2e] rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="overflow-y-auto p-6 sm:p-8 md:p-10 space-y-10">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="mx-auto md:mx-0 shrink-0 flex flex-col items-center gap-2">
              <BookCoverArt book={book} size="lg" />

              <div className="flex items-center gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171926] hover:bg-[#222536] border border-[#34384e] text-[11px] font-medium text-[#c5a059] rounded-md cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3 h-3" />
                  <span>{hasCustomCover ? 'Replace Image' : 'Upload Cover File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>

                {hasCustomCover && (
                  <button
                    onClick={handleResetCover}
                    title="Reset to default digital art"
                    className="p-1.5 text-[#888] hover:text-[#f5efeb] hover:bg-[#1c1f2f] rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {coverToast && (
                <span className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
                  {coverToast}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
                  {book.title}
                </h2>
                {book.subtitle && (
                  <p className="text-xs uppercase font-cinzel tracking-wider text-[#a8a395] mt-1 font-semibold">
                    {book.subtitle}
                  </p>
                )}
                <p className="text-base sm:text-lg font-cormorant italic text-[#c5a059] mt-1">
                  "{book.tagline}"
                </p>
              </div>

              {/* Cover Art & Lore Box */}
              {book.coverArtDescription && (
                <div className="p-3.5 rounded-lg bg-[#141724] border border-[#282b3d] text-xs text-[#aba597] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#c5a059] font-cinzel font-semibold text-xs">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Official Cover Lore & Composition</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    {book.coverArtDescription}
                  </p>
                </div>
              )}

              {/* Publication specs table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#202334] text-xs">
                <div>
                  <span className="text-[#736e63] block">Release</span>
                  <span className="font-semibold text-[#ded8cb]">{book.releaseYear}</span>
                </div>
                <div>
                  <span className="text-[#736e63] block">Publisher</span>
                  <span className="font-semibold text-[#ded8cb]">{book.publisher}</span>
                </div>
                <div>
                  <span className="text-[#736e63] block">Length</span>
                  <span className="font-semibold text-[#ded8cb]">{book.pageCount} pages</span>
                </div>
                <div>
                  <span className="text-[#736e63] block">ISBN</span>
                  <span className="font-semibold text-[#ded8cb]">{book.isbn}</span>
                </div>
              </div>

              {/* Synopsis */}
              <div className="text-sm text-[#c4beaf] leading-relaxed space-y-3">
                <p>{book.synopsis}</p>
              </div>

              {/* Excerpt launcher & quick buy */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenExcerpt(book);
                  }}
                  className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c5a059]/10"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Chapter 1 Excerpt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bookstore Purchase Links */}
          <div className="bg-[#141724] border border-[#26293d] rounded-xl p-5 sm:p-6">
            <h4 className="text-xs uppercase font-cinzel tracking-widest text-[#d5cfc2] font-semibold mb-4">
              Where to Order {book.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {book.buyLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0e1018] border border-[#2b2e40] hover:border-[#c5a059] transition-all group"
                >
                  <div className="text-xs">
                    <span className="text-[#f5efeb] font-medium group-hover:text-[#c5a059] block">
                      {link.name}
                    </span>
                    {link.badge && (
                      <span className="text-[10px] text-[#c5a059]">{link.badge}</span>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#736e63] group-hover:text-[#c5a059]" />
                </a>
              ))}
            </div>
          </div>

          {/* Physical Craftmanship & Wood Engraving Note */}
          {book.woodEngravingNote && (
            <div className="p-5 rounded-xl bg-[#191612] border border-[#c5a059]/30 text-xs text-[#dcd4c5] flex items-start gap-4">
              <Bookmark className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-cinzel font-semibold text-[#f5efeb] text-sm mb-1">
                  Laser-Carved Physical Collector Artifact
                </h5>
                <p className="text-[#b5af9f] leading-relaxed">
                  {book.woodEngravingNote} Matthew personally designs and laser-carves these tactile artifacts in his Texas workshop, turning concepts from the page into physical wood and brass keepsakes.
                </p>
              </div>
            </div>
          )}

          {/* Reader & Book Club Discussion Guide */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#c5a059]" />
              <h4 className="text-sm uppercase font-cinzel tracking-wider text-[#f5efeb] font-semibold">
                Reader & Book Club Discussion Topics
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#a8a396]">
              {discussionQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 bg-[#12141e] border border-[#222535] rounded-lg">
                  <span className="text-[#c5a059] font-cinzel font-bold mr-2">0{idx + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Book Pages Newsletter Signup Section (Mandatory from spec) */}
          <div className="pt-4 border-t border-[#202333]">
            <NewsletterSignup
              variant="book_page"
              heading="Want to know what's next?"
              text="Join the newsletter for updates about upcoming books and stories."
              buttonText="Join the Journey"
              source={`book_modal_${book.id}`}
              onOpenPrivacy={onOpenPrivacy}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
