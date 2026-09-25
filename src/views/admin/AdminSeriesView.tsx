import React, { useState, useEffect } from 'react';
import { ManagedSeries, ManagedBook, bookService } from '../../services/bookService';
import { BookCoverArt } from '../../components/BookCoverArt';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  Plus,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const AdminSeriesView: React.FC = () => {
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>([]);
  const [allBooks, setAllBooks] = useState<ManagedBook[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('breathwoven-cycle');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const loadData = async () => {
    const s = await bookService.getSeries();
    const b = await bookService.getBooks();
    setSeriesList(s);
    setAllBooks(b);
  };

  useEffect(() => {
    loadData();
    const unsub = bookService.subscribe(loadData);
    return () => unsub();
  }, []);

  const currentSeries = seriesList.find((s) => s.id === selectedSeriesId) || seriesList[0];

  // Books belonging to current series, ordered by series.bookIds or seriesOrder
  const seriesBooks = currentSeries
    ? (currentSeries.bookIds || [])
        .map((id) => allBooks.find((b) => b.id === id))
        .filter((b): b is ManagedBook => Boolean(b))
    : [];

  // Any books with this seriesId not yet in bookIds
  const unlistedBooks = allBooks.filter(
    (b) => b.seriesId === selectedSeriesId && !currentSeries?.bookIds?.includes(b.id)
  );

  const combinedBooks = [...seriesBooks, ...unlistedBooks];

  const moveBook = async (index: number, direction: 'up' | 'down') => {
    if (!currentSeries) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= combinedBooks.length) return;

    const list = [...combinedBooks];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    const newBookIds = list.map((b) => b.id);
    await bookService.reorderSeriesBooks(currentSeries.id, newBookIds);
    setSaveToast(`Book sequence updated for "${currentSeries.name}".`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Series Architecture & Book Ordering
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Configure universe series order. Reordering books here automatically updates public series pages and reading lists.
          </p>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Series Selector */}
      <div className="flex border-b border-[#232635] gap-2">
        {seriesList.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSeriesId(s.id)}
            className={`px-4 py-2.5 text-xs font-cinzel uppercase tracking-wider rounded-t-lg transition-colors cursor-pointer ${
              selectedSeriesId === s.id
                ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40] font-bold'
                : 'text-[#8e887a] hover:text-[#f5efeb]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Series Details & Book Sequence */}
      {currentSeries && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Ordered Book Sequence */}
          <div className="lg:col-span-8 bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2231] pb-3">
              <div>
                <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                  Sequence Order ({combinedBooks.length} Books)
                </h3>
                <p className="text-[11px] text-[#7d776a]">
                  Use the arrows to reorder books in the reading hierarchy.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {combinedBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className="p-3 bg-[#0d0e15] border border-[#212433] rounded-lg flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-[#1c1e2b] text-[#c5a059] font-cinzel font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="w-10 h-14 rounded overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 flex items-center justify-center">
                      <BookCoverArt book={book as any} size="sm" />
                    </div>
                    <div>
                      <div className="font-cinzel font-bold text-xs text-[#f5efeb]">
                        {book.title}
                      </div>
                      <div className="text-[11px] text-[#8e887a]">
                        {book.publicationState} · {(book as any).releaseYear || book.publicationDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBook(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#1b1e2c] hover:bg-[#25283c] disabled:opacity-30 rounded text-[#d4cfc2] transition-colors cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveBook(idx, 'down')}
                      disabled={idx === combinedBooks.length - 1}
                      className="p-1.5 bg-[#1b1e2c] hover:bg-[#25283c] disabled:opacity-30 rounded text-[#d4cfc2] transition-colors cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Series Meta info */}
          <div className="lg:col-span-4 bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
            <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
              Series Information
            </h3>
            <div className="space-y-3 text-xs text-[#aba597]">
              <div>
                <strong className="text-[#f5efeb] block">Name</strong>
                <span>{currentSeries.name}</span>
              </div>
              <div>
                <strong className="text-[#f5efeb] block">Description</strong>
                <p className="leading-relaxed text-[#8f897c]">{currentSeries.description}</p>
              </div>
              <div>
                <strong className="text-[#f5efeb] block">Publication State</strong>
                <span className="text-[#c5a059] uppercase font-cinzel font-semibold">
                  {currentSeries.publicationState}
                </span>
              </div>
              <div className="pt-2 border-t border-[#1e202d] text-[11px] text-[#6d685c]">
                The Abyssal Current has Ignis-Kor: The Heart of Fire as the current finalized book. Future books can be added once titles are finalized.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
