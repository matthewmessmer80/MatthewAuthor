import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagedBook, bookService } from '../../services/bookService';
import { BookCoverArt } from '../../components/BookCoverArt';
import {
  Plus,
  Edit,
  Eye,
  Copy,
  Archive,
  RotateCcw,
  Star,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Filter,
  Trash2,
} from 'lucide-react';

interface AdminBooksListViewProps {
  onAddNew: () => void;
  onEditBook: (bookId: string) => void;
  onPreviewPublic: (book: ManagedBook) => void;
}

export const AdminBooksListView: React.FC<AdminBooksListViewProps> = ({
  onAddNew,
  onEditBook,
  onPreviewPublic,
}) => {
  const { isAuthor, role } = useAuth();
  const [books, setBooks] = useState<ManagedBook[]>([]);
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmArchiveBook, setConfirmArchiveBook] = useState<ManagedBook | null>(null);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState<ManagedBook | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const loadBooks = async () => {
    const list = await bookService.getBooks();
    setBooks(list);
  };

  useEffect(() => {
    loadBooks();
    const unsub = bookService.subscribe(loadBooks);
    return () => unsub();
  }, []);

  const handleTogglePublish = async (book: ManagedBook) => {
    const isCurrentlyPublic = book.publicationState === 'PUBLIC';
    const nextState = isCurrentlyPublic ? 'DRAFT' : 'PUBLIC';
    await bookService.saveBook({
      ...book,
      publicationState: nextState,
      status: nextState === 'PUBLIC' ? 'published' : 'in-progress',
      indexing: nextState === 'PUBLIC' ? 'index' : 'noindex',
    });
    setActionToast(`Book "${book.title}" changed to ${nextState}.`);
    setTimeout(() => setActionToast(null), 3000);
    loadBooks();
  };

  const handleToggleFeatured = async (book: ManagedBook) => {
    await bookService.saveBook({
      ...book,
      featured: !book.featured,
    });
    setActionToast(`Book "${book.title}" ${!book.featured ? 'set as Primary Featured' : 'unmarked as Featured'}.`);
    setTimeout(() => setActionToast(null), 3000);
    loadBooks();
  };

  const handleDuplicate = async (book: ManagedBook) => {
    const copy = await bookService.duplicateBook(book.id);
    setActionToast(`Created draft duplicate: "${copy.title}"`);
    setTimeout(() => setActionToast(null), 3000);
    loadBooks();
  };

  const handleArchiveConfirm = async () => {
    if (!confirmArchiveBook) return;
    await bookService.archiveBook(confirmArchiveBook.id);
    setActionToast(`Book "${confirmArchiveBook.title}" archived and removed from public site.`);
    setConfirmArchiveBook(null);
    setTimeout(() => setActionToast(null), 3500);
    loadBooks();
  };

  const handleDeletePermanentlyConfirm = async () => {
    if (!confirmDeleteBook) return;
    try {
      await bookService.deleteBookPermanently(confirmDeleteBook.id, role);
      setActionToast(`Book "${confirmDeleteBook.title}" permanently deleted from database.`);
    } catch (err: any) {
      setActionToast(err.message || 'Deletion failed.');
    }
    setConfirmDeleteBook(null);
    setTimeout(() => setActionToast(null), 3500);
    loadBooks();
  };

  const handleRestore = async (book: ManagedBook) => {
    await bookService.restoreBook(book.id);
    setActionToast(`Book "${book.title}" restored.`);
    setTimeout(() => setActionToast(null), 3000);
    loadBooks();
  };

  const filteredBooks = books.filter((b) => {
    if (seriesFilter !== 'all' && b.seriesId !== seriesFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'archived' && b.status !== 'archived') return false;
      if (statusFilter !== 'archived' && b.publicationState !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Book Management
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Manage titles, covers, series order, publication states, and Amazon links without code redeployment.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Notifications */}
      {actionToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-[#11131c] border border-[#212433] rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-[#8e887a] font-cinzel">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="px-3 py-1.5 bg-[#0b0c12] border border-[#2b2e40] rounded text-[#d5cfc2] focus:outline-none"
        >
          <option value="all">All Series</option>
          <option value="breathwoven-cycle">The Breathwoven Cycle</option>
          <option value="abyssal-current">The Abyssal Current</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-[#0b0c12] border border-[#2b2e40] rounded text-[#d5cfc2] focus:outline-none"
        >
          <option value="all">All States</option>
          <option value="PUBLIC">PUBLIC</option>
          <option value="TEASER">TEASER</option>
          <option value="DRAFT">DRAFT</option>
          <option value="archived">Archived</option>
        </select>

        <div className="ml-auto text-[11px] text-[#7d776a]">
          Showing {filteredBooks.length} of {books.length} Books
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#212332] bg-[#0d0e15] text-[#8e887a] font-cinzel uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cover</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Series & Order</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e202d]">
              {filteredBooks.map((book) => {
                const isArchived = book.status === 'archived';
                return (
                  <tr
                    key={book.id}
                    className={`hover:bg-[#161826] transition-colors ${
                      isArchived ? 'opacity-50 bg-[#0d0e15]/50' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <td className="py-3 px-4 w-16">
                      <div className="w-12 h-16 rounded overflow-hidden border border-[#2b2e40] bg-[#0c0d12] flex items-center justify-center">
                        <BookCoverArt book={book as any} size="sm" />
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-cinzel font-bold text-sm text-[#f5efeb] flex items-center gap-1.5">
                        <span>{book.title}</span>
                      </div>
                      {book.subtitle && (
                        <div className="text-[11px] font-cormorant italic text-[#a8a396]">
                          {book.subtitle}
                        </div>
                      )}
                      <div className="text-[11px] text-[#6d685c] font-mono mt-0.5">
                        {book.canonicalUrl || `/${book.slug}`}
                      </div>
                      {book.updatedBy && (
                        <div className="text-[10px] text-[#c5a059] font-cinzel mt-1">
                          {book.updatedBy}
                        </div>
                      )}
                    </td>

                    {/* Series */}
                    <td className="py-3 px-4">
                      <div className="text-[#dcd7cb] font-medium">{book.seriesName}</div>
                      <div className="text-[11px] text-[#8e887a]">Book {book.seriesOrder}</div>
                    </td>

                    {/* Publication State */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[10px] font-cinzel font-bold tracking-wider uppercase ${
                          book.publicationState === 'PUBLIC'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                            : book.publicationState === 'TEASER'
                            ? 'bg-teal-950/70 text-teal-300 border border-teal-700/50'
                            : book.publicationState === 'DRAFT'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {book.publicationState}
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleFeatured(book)}
                        disabled={isArchived}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          book.featured
                            ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/60'
                            : 'text-[#5d594f] hover:text-amber-400'
                        }`}
                        title={book.featured ? 'Featured on Homepage' : 'Set as Featured'}
                      >
                        <Star className={`w-4 h-4 ${book.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onPreviewPublic(book)}
                          title="Preview public presentation"
                          className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditBook(book.id)}
                          title="Edit book details & cover"
                          className="p-1.5 text-[#8e887a] hover:text-[#c5a059] hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(book)}
                          title="Duplicate as new draft"
                          className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {!isArchived ? (
                          <>
                            <button
                              onClick={() => handleTogglePublish(book)}
                              title={book.publicationState === 'PUBLIC' ? 'Unpublish to draft' : 'Publish publicly'}
                              className="px-2 py-1 text-[11px] font-cinzel rounded bg-[#1c1e2b] hover:bg-[#25283c] text-[#c5a059] transition-colors cursor-pointer"
                            >
                              {book.publicationState === 'PUBLIC' ? 'Unpublish' : 'Publish'}
                            </button>

                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => setConfirmArchiveBook(book)}
                                  title="Archive book (soft delete)"
                                  className="p-1.5 text-[#8e887a] hover:text-amber-400 hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setConfirmDeleteBook(book)}
                                  title="Delete book permanently (Author only)"
                                  className="p-1.5 text-[#8e887a] hover:text-rose-400 hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(book)}
                            title="Restore archived book"
                            className="px-2 py-1 text-[11px] font-cinzel rounded bg-[#1c1e2b] hover:bg-[#25283c] text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Archiving */}
      {confirmArchiveBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#11131c] border border-rose-800/40 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-700/50 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                Archive "{confirmArchiveBook.title}"?
              </h3>
              <p className="text-xs text-[#a8a396] leading-relaxed">
                This will remove the book from the public website, disable indexing, and remove its entry from the sitemap. The record will be preserved in your archives and can be restored at any time.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmArchiveBook(null)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Archive Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Permanent Deletion (AUTHOR ONLY) */}
      {confirmDeleteBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#11131c] border border-rose-600/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                Permanently Delete "{confirmDeleteBook.title}"?
              </h3>
              <p className="text-xs text-rose-300/90 leading-relaxed font-semibold">
                WARNING: This action is irreversible. The book record and its association will be deleted from the database. Only Authors have deletion privileges.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteBook(null)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePermanentlyConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
