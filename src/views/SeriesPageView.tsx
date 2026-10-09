import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ManagedSeries, ManagedBook, bookService, managedBookToBook } from '../services/bookService';
import { Book } from '../types';
import { BookCard } from '../components/BookCard';
import { BookCoverArt } from '../components/BookCoverArt';
import { CompanionSongsSection } from '../components/CompanionSongsSection';
import { useSEO } from '../hooks/useSEO';
import {
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Shield,
  Compass,
  CheckCircle2,
  Lock,
  Calendar,
  Tag,
} from 'lucide-react';

interface SeriesPageViewProps {
  seriesSlugOrId: string;
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail: (book: Book) => void;
  setActiveTab: (tab: string) => void;
  onOpenPrivacy?: () => void;
}

export const SeriesPageView: React.FC<SeriesPageViewProps> = ({
  seriesSlugOrId,
  onOpenExcerpt,
  onOpenBookDetail,
  setActiveTab,
}) => {
  const { isAuthor, isEditor } = useAuth();
  const [series, setSeries] = useState<ManagedSeries | null>(null);
  const [books, setBooks] = useState<ManagedBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  useSEO('books', {
    title: series?.seoTitle || (series ? `${series.name} | Matthew E. Messmer` : 'Series | Matthew E. Messmer'),
    description: series?.metaDescription || series?.shortDescription || series?.description,
  });

  const loadSeries = async () => {
    setLoading(true);
    try {
      const s = await bookService.getSeriesByIdOrSlug(seriesSlugOrId);
      if (s) {
        const seriesBooks = await bookService.getBooksForSeries(s.id, isAuthor || isEditor);
        setSeries(s);
        setBooks(seriesBooks);
      } else {
        setSeries(null);
        setBooks([]);
      }
    } catch (e) {
      console.warn('Failed to load series page:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
    const unsub = bookService.subscribe(loadSeries);
    return () => {
      unsub();
    };
  }, [seriesSlugOrId, isAuthor, isEditor]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center mx-auto animate-pulse">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-xs font-cinzel text-[#8e887a]">Unfolding literary universe...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-cinzel font-bold text-[#f5efeb]">Series Not Found</h2>
        <p className="text-xs text-[#8e887a] max-w-md mx-auto">
          The requested series path does not exist or may currently be in private author drafting.
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

  // Books returned by getBooksForSeries are already filtered and ordered by seriesOrder
  const orderedBooks = books;

  // Reorder books handler for Author / Editor on the public page
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (!series || (!isAuthor && !isEditor)) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= orderedBooks.length) return;

    const list = [...orderedBooks];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    const newBookIds = list.map((b) => b.id);
    await bookService.reorderSeriesBooks(series.id, newBookIds);
    setReorderSuccess('Reading sequence order updated.');
    await loadSeries();
    setTimeout(() => setReorderSuccess(null), 2500);
  };

  // Convert ManagedBook to Book for BookCard
  const toBook = (mb: ManagedBook): Book => {
    return managedBookToBook(mb, series.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Series Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#121420] via-[#161828] to-[#10121c] border border-[#c5a059]/30 p-8 sm:p-14 shadow-2xl">
        {(series.bannerImage || series.artworkUrl) ? (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={series.bannerImage || series.artworkUrl}
              alt={`${series.name} banner graphic`}
              className="w-full h-full object-cover filter brightness-[0.4] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f111a] via-[#0f111a]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c5a059]/10 via-transparent to-transparent" />
        )}

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c5a059]/15 border border-[#c5a059]/30 rounded-full text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Literary Series</span>
            </span>

            <span className="px-2.5 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#181b29] border border-[#2c3046] text-[#c5a059]">
              {series.status}
            </span>

            {(isAuthor || isEditor) && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{series.publicationState}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
            {series.name}
          </h1>

          {series.shortDescription && (
            <p className="text-lg sm:text-xl font-cormorant italic text-[#c5a059]">
              "{series.shortDescription}"
            </p>
          )}

          <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed max-w-2xl">
            {series.description}
          </p>

          {/* Genres */}
          {series.genres && series.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {series.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 bg-[#171926] border border-[#2b2e40] rounded-md text-[11px] font-cinzel text-[#dcd7cb]"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Author/Editor Quick Admin Trigger */}
          {(isAuthor || isEditor) && (
            <div className="pt-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/admin/series');
                  }
                  setActiveTab('/admin/series');
                }}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] border border-[#34384e] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Manage in Series Admin Area</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reorder Toast */}
      {reorderSuccess && (
        <div className="p-3 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reorderSuccess}</span>
        </div>
      )}

      {/* Official Reading Sequence */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#212331] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb]">
              Official Reading Sequence
            </h2>
            <p className="text-xs text-[#8f8a7e] mt-1">
              Explore the volumes in chronological canon reading order.
            </p>
          </div>
          <div className="text-xs text-[#c5a059] font-cinzel font-medium">
            {orderedBooks.length} {orderedBooks.length === 1 ? 'Volume' : 'Volumes'}
          </div>
        </div>

        {orderedBooks.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#11131c] border border-[#232635] rounded-2xl space-y-3">
            <BookOpen className="w-8 h-8 text-[#7d776a] mx-auto" />
            <h3 className="text-base font-cinzel font-semibold text-[#f5efeb]">
              Chronological Canon Being Written
            </h3>
            <p className="text-xs text-[#8e887a] max-w-md mx-auto">
              Titles in this series are currently in creative development. Check back for forthcoming announcements and preview chapters.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orderedBooks.map((mb, idx) => {
              const b = toBook(mb);
              const bookNumber = mb.seriesOrder || idx + 1;
              const isPublished = mb.publicationState === 'PUBLIC' || mb.status === 'published';
              const isPending = mb.publicationState === 'TEASER' || mb.status === 'pending';

              return (
                <div
                  key={mb.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-lg group"
                >
                  {/* Left: Book Number, Cover Thumbnail, Titles & Details */}
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#161826] border border-[#2b2e42] flex items-center justify-center font-cinzel font-bold text-base sm:text-lg text-[#c5a059] shrink-0 shadow-inner">
                      {bookNumber}
                    </div>

                    <div
                      onClick={() => onOpenBookDetail(b)}
                      className="w-14 sm:w-16 aspect-[2/3] rounded-md overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 cursor-pointer shadow-md group-hover:scale-105 transition-transform"
                      title={`View ${b.title}`}
                    >
                      <BookCoverArt book={b} size="fill" className="w-full h-full" showHoverEffect={false} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onOpenBookDetail(b)}
                          className="text-base sm:text-lg font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors cursor-pointer truncate"
                        >
                          {bookNumber}. {b.title}
                        </h3>

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
                            <span>Pending</span>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Unreleased</span>
                            </>
                          )}
                        </span>

                        {mb.publicationState !== 'PUBLIC' && (isAuthor || isEditor) && (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {mb.publicationState}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#8e887a] mt-1 font-mono">
                        {series.name} · Book {bookNumber}
                        {b.releaseYear ? ` · ${b.releaseYear}` : ''}
                        {mb.publisher ? ` · ${mb.publisher}` : ''}
                      </p>

                      {(b.tagline || b.description) && (
                        <p className="text-xs text-[#b5af9f] font-cormorant italic mt-1 line-clamp-1 hidden sm:block">
                          &ldquo;{b.tagline || b.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions & Inline reorder */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#1f2232] w-full md:w-auto justify-end">
                    {(isAuthor || isEditor) && (
                      <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-[#161825] border border-[#2b2e40] rounded-lg">
                        <button
                          onClick={() => handleReorder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-[#25283c] disabled:opacity-20 rounded text-[#d4cfc2] transition-colors cursor-pointer"
                          title="Move up in reading sequence"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(idx, 'down')}
                          disabled={idx === orderedBooks.length - 1}
                          className="p-1 hover:bg-[#25283c] disabled:opacity-20 rounded text-[#d4cfc2] transition-colors cursor-pointer"
                          title="Move down in reading sequence"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenExcerpt(b)}
                      className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Excerpt</span>
                    </button>
                    <button
                      onClick={() => onOpenBookDetail(b)}
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
        )}

        {/* Companion Soundtracks & Music for this Series */}
        <CompanionSongsSection
          seriesId={series.id}
          seriesSlug={series.slug}
          seriesName={series.name}
          className="pt-10 border-t border-[#232635]"
        />
      </div>
    </div>
  );
};
