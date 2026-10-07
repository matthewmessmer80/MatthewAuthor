import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService, managedBookToBook, ManagedSeries } from '../services/bookService';
import { BookCard } from '../components/BookCard';
import { BookCoverArt } from '../components/BookCoverArt';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { BookOpen, Sparkles, Filter, ListOrdered, Layers, Grid, Library, Compass, ArrowRight, Clock } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>([]);
  const [booksList, setBooksList] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveCatalog = async () => {
    try {
      const [publicManaged, allSeries] = await Promise.all([
        bookService.getPublicBooks(),
        bookService.getAllSeries(),
      ]);
      setBooksList(publicManaged.map((mb) => managedBookToBook(mb)));
      setSeriesList(allSeries);
    } catch (err) {
      console.warn('Error fetching live book catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCatalog();
    const unsub = bookService.subscribe(fetchLiveCatalog);
    return () => {
      unsub();
    };
  }, []);

  // Helper to determine if a book belongs to a series
  const doesBookBelongToSeries = (book: Book, series: ManagedSeries) => {
    if (book.seriesId && (book.seriesId === series.id || book.seriesId === series.slug)) return true;
    if (series.bookIds && series.bookIds.includes(book.id)) return true;
    if (book.series && book.series.toLowerCase() === series.name.toLowerCase()) return true;
    return false;
  };

  // Sort helper for seriesOrder
  const sortBySeriesOrder = (a: Book, b: Book) => {
    const orderA = a.seriesOrder !== undefined && a.seriesOrder !== null ? Number(a.seriesOrder) : 999;
    const orderB = b.seriesOrder !== undefined && b.seriesOrder !== null ? Number(b.seriesOrder) : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title || '').localeCompare(b.title || '');
  };

  const activeSeries = selectedSeries !== 'all'
    ? seriesList.find((s) => s.id === selectedSeries || s.slug === selectedSeries)
    : null;

  const filteredBooks = booksList.filter((b) => {
    if (selectedSeries === 'all') return true;
    if (selectedSeries === 'standalone') {
      return !seriesList.some((s) => doesBookBelongToSeries(b, s));
    }
    if (activeSeries) {
      return doesBookBelongToSeries(b, activeSeries);
    }
    return b.seriesId === selectedSeries;
  });

  const sortedFilteredBooks = [...filteredBooks].sort(sortBySeriesOrder);

  // Standalone books that do not belong to any known series
  const standaloneBooks = booksList
    .filter((b) => !seriesList.some((s) => doesBookBelongToSeries(b, s)))
    .sort(sortBySeriesOrder);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 w-full">
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

      {/* Dynamic Series Filter Tabs & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#232635] pb-6">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#131520] border border-[#232635] rounded-xl max-w-full">
          <button
            onClick={() => setSelectedSeries('all')}
            className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-lg transition-colors cursor-pointer ${
              selectedSeries === 'all'
                ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            All Works ({booksList.length})
          </button>

          {seriesList.map((s) => {
            const count = booksList.filter((b) => doesBookBelongToSeries(b, s)).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSeries(s.id)}
                className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-lg transition-colors cursor-pointer ${
                  selectedSeries === s.id
                    ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                    : 'text-[#9c9689] hover:text-[#f5efeb]'
                }`}
              >
                {s.name} ({count})
              </button>
            );
          })}

          {standaloneBooks.length > 0 && (
            <button
              onClick={() => setSelectedSeries('standalone')}
              className={`px-4 py-2 text-xs font-cinzel tracking-wider rounded-lg transition-colors cursor-pointer ${
                selectedSeries === 'standalone'
                  ? 'bg-[#c5a059] text-[#0d0e14] font-bold shadow-sm'
                  : 'text-[#9c9689] hover:text-[#f5efeb]'
              }`}
            >
              Standalone ({standaloneBooks.length})
            </button>
          )}
        </div>

        {selectedSeries === 'all' && (
          <div className="inline-flex items-center gap-1 p-1 bg-[#131520] border border-[#232635] rounded-lg">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 text-xs font-cinzel rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grouped' ? 'bg-[#2b2e42] text-[#f5efeb] font-semibold' : 'text-[#8e887a] hover:text-white'
              }`}
              title="Group by series canon"
            >
              <Library className="w-3.5 h-3.5" />
              <span>By Series</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-cinzel rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#2b2e42] text-[#f5efeb] font-semibold' : 'text-[#8e887a] hover:text-white'
              }`}
              title="All books grid"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected Series Banner Display */}
      {activeSeries && (
        <div className="relative overflow-hidden rounded-2xl border border-[#c5a059]/30 p-8 sm:p-12 shadow-xl bg-gradient-to-r from-[#121420] via-[#161828] to-[#10121c]">
          {(activeSeries.bannerImage || activeSeries.artworkUrl) ? (
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={activeSeries.bannerImage || activeSeries.artworkUrl}
                alt={`${activeSeries.name} banner graphic`}
                className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.1]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e15] via-[#0c0e15]/80 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c5a059]/10 via-transparent to-transparent pointer-events-none" />
          )}

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeSeries.status || 'Active Series'} · {sortedFilteredBooks.length} {sortedFilteredBooks.length === 1 ? 'Volume' : 'Volumes'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-cinzel font-bold text-[#f5efeb]">
              {activeSeries.name}
            </h2>
            {activeSeries.shortDescription && (
              <p className="text-base font-cormorant italic text-[#c5a059]">
                "{activeSeries.shortDescription}"
              </p>
            )}
            {activeSeries.description && (
              <p className="text-xs sm:text-sm text-[#d4cfc2] leading-relaxed max-w-2xl">
                {activeSeries.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#11131c]/60 border border-[#232635] animate-pulse" />
          ))}
        </div>
      ) : selectedSeries === 'all' && viewMode === 'grouped' ? (
        /* Dynamic Grouped View: Render Each Series In Order */
        <div className="space-y-16">
          {seriesList.map((series) => {
            const seriesBooks = booksList
              .filter((b) => doesBookBelongToSeries(b, series))
              .sort(sortBySeriesOrder);

            if (seriesBooks.length === 0) return null;

            return (
              <section key={series.id} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#232635] pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Series Canon · {series.status || 'Published'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
                      {series.name}
                    </h2>
                    {series.shortDescription && (
                      <p className="text-xs text-[#a8a396] mt-1 italic font-cormorant text-base">
                        "{series.shortDescription}"
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-[#c5a059] font-cinzel font-semibold">
                    {seriesBooks.length} {seriesBooks.length === 1 ? 'Volume' : 'Volumes'} in Reading Order
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full">
                  {seriesBooks.map((book) => (
                    <div key={book.id} className="flex flex-col">
                      <BookCard
                        book={book}
                        onOpenExcerpt={onOpenExcerpt}
                        onOpenDetails={onOpenBookDetail}
                      />
                      <div className="mt-3 px-3 py-2 bg-[#12141f] rounded-lg border border-[#212433] text-[11px] text-[#9c9688]">
                        <strong className="text-[#c5a059] font-cinzel">Position:</strong> Book #{book.seriesOrder || 1} in {series.name}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {standaloneBooks.length > 0 && (
            <section className="space-y-6">
              <div className="border-b border-[#232635] pb-4">
                <div className="flex items-center gap-2 text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Individual Works</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
                  Standalone Novels & Novellas
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full">
                {standaloneBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpenExcerpt={onOpenExcerpt}
                    onOpenDetails={onOpenBookDetail}
                  />
                ))}
              </div>
            </section>
          )}

          {booksList.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-[#232635] max-w-lg mx-auto space-y-3">
              <Layers className="w-8 h-8 text-[#c5a059] mx-auto opacity-70" />
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">No Books in Catalog</h3>
              <p className="text-xs text-[#8e887a]">
                No books are currently published in the catalog.
              </p>
            </div>
          )}
        </div>
      ) : sortedFilteredBooks.length > 0 ? (
        /* Filtered Series Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full">
          {sortedFilteredBooks.map((book) => (
            <div key={book.id} className="flex flex-col">
              <BookCard
                key={book.id}
                book={book}
                onOpenExcerpt={onOpenExcerpt}
                onOpenDetails={onOpenBookDetail}
              />
              {book.seriesOrder !== undefined && book.seriesOrder > 0 && (
                <div className="mt-3 px-3 py-2 bg-[#12141f] rounded-lg border border-[#212433] text-[11px] text-[#9c9688]">
                  <strong className="text-[#c5a059] font-cinzel">Position:</strong> Book #{book.seriesOrder} in {book.series}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-[#232635] max-w-lg mx-auto space-y-3">
          <Layers className="w-8 h-8 text-[#c5a059] mx-auto opacity-70" />
          <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">No Books in this Selection</h3>
          <p className="text-xs text-[#8e887a]">
            {selectedSeries === 'all'
              ? 'No books are currently published in the catalog.'
              : 'No books are currently assigned to this series.'}
          </p>
          {selectedSeries !== 'all' && (
            <button
              onClick={() => setSelectedSeries('all')}
              className="mt-2 px-4 py-2 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-[#c5a059] text-xs font-cinzel uppercase rounded-lg transition-colors cursor-pointer"
            >
              View All Books
            </button>
          )}
        </div>
      )}

      {/* Suggested Chronology / Reading Order Guide (Completely dynamic based on live series books) */}
      {seriesList.map((series) => {
        const seriesBooks = booksList
          .filter((b) => doesBookBelongToSeries(b, series))
          .sort(sortBySeriesOrder);

        if (seriesBooks.length < 2) return null;

        return (
          <div key={`chronology-${series.id}`} className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <ListOrdered className="w-5 h-5 text-[#c5a059]" />
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                {series.name} · Suggested Reading Chronology
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed max-w-3xl">
              Volumes in this series build consecutively across character journeys and metaphysical lore.
            </p>

            <div className="space-y-3 pt-2">
              {seriesBooks.map((b, idx) => {
                const bookNumber = b.seriesOrder || idx + 1;
                const isPublished = b.status === 'published';
                const isPending = b.status === 'pending';

                return (
                  <div
                    key={b.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#161825] border border-[#2b2e40] hover:border-[#c5a059]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 group"
                  >
                    {/* Left: Number, Cover, Titles */}
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                      <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#1d2032] border border-[#343852] flex items-center justify-center font-cinzel font-bold text-sm sm:text-base text-[#c5a059] shrink-0">
                        {bookNumber}
                      </div>

                      <div
                        onClick={() => onOpenBookDetail(b)}
                        className="w-12 sm:w-14 aspect-[2/3] rounded-md overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 cursor-pointer shadow hover:scale-105 transition-transform"
                        title={`View ${b.title}`}
                      >
                        <BookCoverArt book={b} size="fill" className="w-full h-full" showHoverEffect={false} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            onClick={() => onOpenBookDetail(b)}
                            className="text-sm sm:text-base font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors cursor-pointer truncate"
                          >
                            {bookNumber}. {b.title}
                          </h4>

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

                        <p className="text-xs text-[#8e887a] mt-0.5 font-mono">
                          {series.name} · Volume {bookNumber}
                          {b.releaseYear ? ` · ${b.releaseYear}` : ''}
                        </p>

                        {(b.tagline || b.description) && (
                          <p className="text-xs text-[#a8a396] font-cormorant italic mt-0.5 line-clamp-1 hidden sm:block">
                            &ldquo;{b.tagline || b.description}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#232635] w-full md:w-auto justify-end">
                      <button
                        onClick={() => onOpenExcerpt(b)}
                        className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Read Excerpt</span>
                      </button>
                      <button
                        onClick={() => onOpenBookDetail(b)}
                        className="px-3 py-1.5 bg-[#12141f] hover:bg-[#1a1d2c] text-[#d6d0c4] hover:text-[#f5efeb] border border-[#2e3146] text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 text-[#c5a059]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* INDIVIDUAL BOOK PAGES NEWSLETTER SECTION */}
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
