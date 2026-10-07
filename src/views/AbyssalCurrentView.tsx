import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService, managedBookToBook, ManagedSeries } from '../services/bookService';
import { BookCoverArt } from '../components/BookCoverArt';
import { BookCard } from '../components/BookCard';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Waves, Compass, Anchor, BookOpen, Clock, Shield, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface AbyssalCurrentViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail?: (book: Book) => void;
  onOpenPrivacy?: () => void;
}

export const AbyssalCurrentView: React.FC<AbyssalCurrentViewProps> = ({
  onOpenExcerpt,
  onOpenBookDetail,
  onOpenPrivacy,
}) => {
  useSEO('abyssal');

  const [seriesInfo, setSeriesInfo] = useState<ManagedSeries | null>(null);
  const [seriesBooks, setSeriesBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveSeriesData = async () => {
    try {
      const series = await bookService.getSeriesByIdOrSlug('abyssal-current');
      if (series) {
        setSeriesInfo(series);
      }
      const sId = series?.id || 'abyssal-current';
      const managedBooks = await bookService.getBooksForSeries(sId);
      setSeriesBooks(managedBooks.map((mb) => managedBookToBook(mb)));
    } catch (err) {
      console.warn('Error fetching live series books for Abyssal Current:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSeriesData();
    const unsub = bookService.subscribe(fetchLiveSeriesData);
    return () => {
      unsub();
    };
  }, []);

  const bannerGraphic = seriesInfo?.bannerImage || seriesInfo?.artworkUrl;
  const primaryBook = seriesBooks.length > 0 ? seriesBooks[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Banner / Header Graphic Display */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#081b22] via-[#051318] to-[#020a0d] border border-teal-900/60 p-8 sm:p-14 shadow-2xl">
        {bannerGraphic ? (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={bannerGraphic}
              alt="The Abyssal Current series banner"
              className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.15]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030e13] via-[#030e13]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020a0d] via-transparent to-transparent" />
          </div>
        ) : (
          /* Subtle decorative bathymetric curves fallback */
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg viewBox="0 0 800 600" className="w-full h-full stroke-teal-400" fill="none">
              <path d="M0 100 C 200 80, 600 140, 800 100" strokeWidth="1" />
              <path d="M0 200 C 300 240, 500 160, 800 220" strokeWidth="1" />
              <path d="M0 300 C 250 360, 650 280, 800 340" strokeWidth="1" />
              <path d="M0 400 C 400 450, 450 380, 800 420" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="700" cy="150" r="80" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-2 text-xs text-teal-400 font-cinzel font-semibold uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Epic Fantasy & Sci-Fi Universe · {seriesInfo?.status || 'In Development'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-cinzel font-bold text-[#f0fdfa] tracking-tight leading-tight">
              {seriesInfo?.name || 'The Abyssal Current'}
            </h1>

            <p className="text-lg sm:text-xl font-cormorant italic text-teal-200">
              "{seriesInfo?.shortDescription || 'The ocean does not hide secrets because it is cruel; it hides them because eternity is too heavy for the sun.'}"
            </p>

            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-2xl">
              {seriesInfo?.description ||
                'Deep beneath the charted seas, time flows not forward, but down. Drawing from Matthew E. Messmer\'s years as a Navy Master-at-Arms and a lifelong fascination with maritime physics, naval lore, and oceanic isolation, The Abyssal Current marks the dawn of an exhilarating new fantasy epic.'}
            </p>

            {primaryBook && (
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onOpenExcerpt(primaryBook)}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-teal-950 text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-teal-950/40 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Chapter Teaser: {primaryBook.title}</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex justify-center">
            {primaryBook ? (
              <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-[#2b2e3f] bg-[#12141d] p-6">
                <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-[#36384a]">
                  <BookCoverArt book={primaryBook} className="w-full h-full" />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm rounded-xl border border-teal-900/50 bg-[#09151c]/80 p-8 text-center space-y-3">
                <Compass className="w-10 h-10 text-teal-400 mx-auto" />
                <h4 className="text-sm font-cinzel font-bold text-[#f0fdfa]">Chronicle in Development</h4>
                <p className="text-xs text-teal-200/70">
                  Author Matthew E. Messmer is charting the maiden volumes of this series.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC SERIES VOLUMES SECTION - Reflects actual database books */}
      {seriesBooks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-teal-900/40 pb-4">
            <div>
              <p className="text-xs uppercase font-cinzel tracking-widest text-teal-400 font-semibold">
                Series Reading Order
              </p>
              <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f0fdfa] mt-1">
                Books in {seriesInfo?.name || 'The Abyssal Current'} ({seriesBooks.length})
              </h2>
            </div>
          </div>

          <div className="space-y-3.5">
            {seriesBooks.map((book, idx) => {
              const bookNumber = book.seriesOrder || idx + 1;
              const isPublished = book.status === 'published';
              const isPending = book.status === 'pending';

              return (
                <div
                  key={book.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#09151d] border border-teal-900/40 hover:border-teal-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-lg group"
                >
                  {/* Left: Reading Order Number, Cover Thumbnail, Titles & Details */}
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#0c1e28] border border-teal-800/50 flex items-center justify-center font-cinzel font-bold text-base sm:text-lg text-teal-400 shrink-0 shadow-inner">
                      {bookNumber}
                    </div>

                    <div
                      onClick={() => onOpenBookDetail?.(book)}
                      className="w-14 sm:w-16 aspect-[2/3] rounded-md overflow-hidden border border-teal-900/60 bg-[#040c10] shrink-0 cursor-pointer shadow-md group-hover:scale-105 transition-transform"
                      title={`View ${book.title}`}
                    >
                      <BookCoverArt book={book} size="fill" className="w-full h-full" showHoverEffect={false} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onOpenBookDetail?.(book)}
                          className="text-base sm:text-lg font-cinzel font-bold text-[#f0fdfa] group-hover:text-teal-400 transition-colors cursor-pointer truncate"
                        >
                          {bookNumber}. {book.title}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase tracking-wider border ${
                            isPublished
                              ? 'bg-teal-950/80 text-teal-300 border-teal-500/40'
                              : isPending
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800/80 text-slate-300 border-slate-600/40'
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
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

                      <p className="text-xs text-teal-100/60 mt-1 font-mono">
                        {seriesInfo?.name || 'The Abyssal Current'} · Book {bookNumber}
                        {book.releaseYear ? ` · ${book.releaseYear}` : ''}
                        {book.publisher ? ` · ${book.publisher}` : ''}
                      </p>

                      {(book.tagline || book.description) && (
                        <p className="text-xs text-teal-100/70 font-cormorant italic mt-1 line-clamp-1 hidden sm:block">
                          &ldquo;{book.tagline || book.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-teal-900/40 w-full md:w-auto justify-end">
                    <button
                      onClick={() => onOpenExcerpt(book)}
                      className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-[#021016] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Excerpt</span>
                    </button>
                    {onOpenBookDetail && (
                      <button
                        onClick={() => onOpenBookDetail(book)}
                        className="px-3.5 py-1.5 bg-[#0e212b] hover:bg-[#152e3c] text-teal-200 hover:text-white border border-teal-800/60 text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Edition Details</span>
                        <ArrowRight className="w-3 h-3 text-teal-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Naval Precision & Worldbuilding Roots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Anchor className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Naval Watch & Steel Hulls
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            Rooted in the authentic operational reality of shipboard watchstanding, steam piping, bulkhead groans, and the psychological weight of isolation miles from dry land.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Temporal Bathymetry
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            In the Mariana Rift, depth is chronological. At 2,000 fathoms you cross the century of iron; at 4,000 fathoms, time solidifies into navigable oceanic currents.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Physical Laser Engraved Charts
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            Every trench depth and magnetic declination is being personally prototyped and cut in layered birch wood in Matthew's Texas laser workshop.
          </p>
        </div>
      </div>

      {/* SPECIAL THE ABYSSAL CURRENT NEWSLETTER CTA */}
      <div className="max-w-3xl mx-auto pt-4">
        <NewsletterSignup
          variant="abyssal_current"
          heading="Want to Know What Comes Next?"
          text="The Abyssal Current is only beginning. Join the newsletter for future reveals, announcements, and updates as the series takes shape."
          buttonText="Follow the Current"
          source="abyssal_current_page"
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
