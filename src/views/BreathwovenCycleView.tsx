import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService, managedBookToBook, ManagedSeries } from '../services/bookService';
import { BookCard } from '../components/BookCard';
import { BookCoverArt } from '../components/BookCoverArt';
import { useSEO } from '../hooks/useSEO';
import { BookOpen, Sparkles, Feather, Shield, Compass, Flame, Layers, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

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

  const [seriesInfo, setSeriesInfo] = useState<ManagedSeries | null>(null);
  const [cycleBooks, setCycleBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveBooks = async () => {
    try {
      const series = await bookService.getSeriesByIdOrSlug('breathwoven-cycle');
      if (series) {
        setSeriesInfo(series);
      }
      const sId = series?.id || 'breathwoven-cycle';
      const matching = await bookService.getBooksForSeries(sId);
      setCycleBooks(matching.map((mb) => managedBookToBook(mb)));
    } catch (err) {
      console.warn('Error fetching Breathwoven Cycle books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBooks();
    const unsub = bookService.subscribe(fetchLiveBooks);
    return () => {
      unsub();
    };
  }, []);

  const bannerGraphic = seriesInfo?.bannerImage || seriesInfo?.artworkUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Banner / Header Graphic Display */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c5a059]/30 shadow-2xl bg-[#0e1017] p-8 sm:p-14 lg:p-16">
        {bannerGraphic ? (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={bannerGraphic}
              alt="The Breathwoven Cycle series banner"
              className="w-full h-full object-cover filter brightness-[0.4] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e15] via-[#0c0e15]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e15] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c5a059]/15 via-transparent to-transparent" />
        )}

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c5a059]/20 border border-[#c5a059]/40 rounded-full text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Sovereign Saga</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-bold text-[#f5efeb] tracking-tight drop-shadow-md">
            {seriesInfo?.name || 'The Breathwoven Cycle'}
          </h1>
          <p className="text-lg sm:text-xl font-cormorant italic text-[#c5a059] max-w-2xl drop-shadow">
            "{seriesInfo?.shortDescription || 'When the golden thread of royalty snaps, an empire unravels into song and blade.'}"
          </p>
          <p className="text-sm text-[#d4cfc2] leading-relaxed max-w-2xl drop-shadow">
            {seriesInfo?.description ||
              'Welcome to the world of Val-Mora and the Archipelago of Spires. In this expanding fantasy universe created by Matthew E. Messmer, reality itself is spun across an ancient cosmic loom, and every choice leaves a thread that must either be tied, mended, or severed.'}
          </p>
        </div>
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

      {/* Reading Order & Books (Strictly Dynamic from Firestore) */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#212331] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb]">
              Official Reading Order
            </h2>
            <p className="text-xs text-[#8f8a7e] mt-1">
              Volumes organized by series chronology configured in author management.
            </p>
          </div>
          <div className="text-xs text-[#c5a059] font-cinzel font-medium">
            {cycleBooks.length} {cycleBooks.length === 1 ? 'Volume' : 'Volumes'} Cataloged
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-xl bg-[#12141f] border border-[#212433] animate-pulse" />
            ))}
          </div>
        ) : cycleBooks.length > 0 ? (
          <div className="space-y-3.5">
            {cycleBooks.map((book, idx) => {
              const bookNumber = book.seriesOrder || idx + 1;
              const isPublished = book.status === 'published';
              const isPending = book.status === 'pending';

              return (
                <div
                  key={book.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-lg group"
                >
                  {/* Left: Book Number, Cover Thumbnail, Titles & Details */}
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    {/* Reading Order Number Indicator */}
                    <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#161826] border border-[#2b2e42] flex items-center justify-center font-cinzel font-bold text-base sm:text-lg text-[#c5a059] shrink-0 shadow-inner">
                      {bookNumber}
                    </div>

                    {/* Authoritative Cover Thumbnail */}
                    <div
                      onClick={() => onOpenBookDetail(book)}
                      className="w-14 sm:w-16 aspect-[2/3] rounded-md overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 cursor-pointer shadow-md group-hover:scale-105 transition-transform"
                      title={`View ${book.title}`}
                    >
                      <BookCoverArt book={book} size="fill" className="w-full h-full" showHoverEffect={false} />
                    </div>

                    {/* Book Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onOpenBookDetail(book)}
                          className="text-base sm:text-lg font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors cursor-pointer truncate"
                        >
                          {bookNumber}. {book.title}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800/80 text-slate-300 border-slate-600/40'
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Published</span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              <span>Pending</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Unreleased</span>
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-[#8e887a] mt-1 font-mono">
                        {book.series || 'The Breathwoven Cycle'} · Book {bookNumber}
                        {book.releaseYear ? ` · ${book.releaseYear}` : ''}
                        {book.publisher ? ` · ${book.publisher}` : ''}
                      </p>

                      {(book.tagline || book.description) && (
                        <p className="text-xs text-[#b5af9f] font-cormorant italic mt-1 line-clamp-1 hidden sm:block">
                          &ldquo;{book.tagline || book.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#1f2232] w-full md:w-auto justify-end">
                    <button
                      onClick={() => onOpenExcerpt(book)}
                      className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Excerpt</span>
                    </button>
                    <button
                      onClick={() => onOpenBookDetail(book)}
                      className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#222536] text-[#d6d0c4] hover:text-[#f5efeb] border border-[#2b2e40] text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Edition Details</span>
                      <ArrowRight className="w-3 h-3 text-[#c5a059]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-[#232635] max-w-lg mx-auto space-y-3">
            <Layers className="w-8 h-8 text-[#c5a059] mx-auto opacity-70" />
            <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">No Volumes in Cycle</h3>
            <p className="text-xs text-[#8e887a]">
              Books added or assigned to The Breathwoven Cycle in Author management will dynamically appear here.
            </p>
          </div>
        )}
      </div>

      {/* Universe Timeline Callout */}
      <div className="bg-[#11131c] border border-[#262838] p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="text-2xl font-cinzel font-bold text-[#f5efeb]">
            Want to Explore the Abyssal Current?
          </h3>
          <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
            While <em>The Breathwoven Cycle</em> weaves across sky and stone, Matthew E. Messmer's epic <em>The Abyssal Current</em> journeys deep into the uncharted oceanic abyss, blending naval military lore with temporal fantasy.
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
