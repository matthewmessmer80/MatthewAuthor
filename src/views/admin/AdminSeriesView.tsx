import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagedSeries, ManagedBook, bookService, SeriesStatus, AdminPublicationState } from '../../services/bookService';
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
  Trash2,
  Edit,
  ArrowLeft,
  AlertTriangle,
  Globe,
  Lock,
  Eye,
  Search,
  ExternalLink,
  ShieldAlert,
  X,
  Tag,
  Image as ImageIcon,
  Compass,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';

interface AdminSeriesViewProps {
  initialAction?: 'new' | null;
  initialSeries?: ManagedSeries[];
  initialBooks?: ManagedBook[];
  onNavigateToNewBook?: (seriesId?: string) => void;
}

const DEFAULT_GENRE_SUGGESTIONS = [
  'Epic Fantasy',
  'High Fantasy',
  'Maritime Fantasy',
  'Naval Epic',
  'Metaphysical Fantasy',
  'Dark Fantasy',
  'Novella',
  'Mythic Fiction',
  'Sci-Fi Fantasy',
];

export const AdminSeriesView: React.FC<AdminSeriesViewProps> = ({
  initialAction = null,
  initialSeries,
  initialBooks,
  onNavigateToNewBook,
}) => {
  const { user, profile, isAuthor, isEditor } = useAuth();

  const [seriesList, setSeriesList] = useState<ManagedSeries[]>(() => {
    if (initialSeries && initialSeries.length > 0) return initialSeries;
    return bookService.getCachedSeries();
  });
  const [allBooks, setAllBooks] = useState<ManagedBook[]>(() => {
    if (initialBooks && initialBooks.length > 0) return initialBooks;
    return bookService.getCachedBooks();
  });
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() => {
    if (initialSeries && initialSeries.length > 0) return initialSeries[0].id;
    const cached = bookService.getCachedSeries();
    return cached.length > 0 ? cached[0].id : 'breathwoven-cycle';
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialSeries && initialSeries.length > 0) return false;
    return bookService.isSeriesLoading();
  });
  const [error, setError] = useState<string | null>(() => {
    const err = bookService.getSeriesError();
    return err ? 'Unable to load series. Please try again.' : null;
  });
  const [viewMode, setViewMode] = useState<'detail' | 'form'>(
    initialAction === 'new' ? 'form' : 'detail'
  );
  const [isNewSeries, setIsNewSeries] = useState<boolean>(initialAction === 'new');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (initialSeries && initialSeries.length > 0) {
      setSeriesList(initialSeries);
      setLoading(false);
      if (!selectedSeriesId || !initialSeries.some((s) => s.id === selectedSeriesId)) {
        setSelectedSeriesId(initialSeries[0].id);
      }
    }
  }, [initialSeries]);

  useEffect(() => {
    if (initialBooks && initialBooks.length > 0) {
      setAllBooks(initialBooks);
    }
  }, [initialBooks]);

  // Form State
  const [formId, setFormId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formShortDescription, setFormShortDescription] = useState<string>('');
  const [formGenres, setFormGenres] = useState<string[]>([]);
  const [formGenreInput, setFormGenreInput] = useState<string>('');
  const [formArtworkUrl, setFormArtworkUrl] = useState<string>('');
  const [formBannerImage, setFormBannerImage] = useState<string>('');
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<SeriesStatus>('IN DEVELOPMENT');
  const [formPublicationState, setFormPublicationState] = useState<AdminPublicationState>('DRAFT');
  const [formSeoTitle, setFormSeoTitle] = useState<string>('');
  const [formMetaDescription, setFormMetaDescription] = useState<string>('');
  const [formSocialImage, setFormSocialImage] = useState<string>('');

  // Book Assignment Modal & Delete Warning
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedBookToAssign, setSelectedBookToAssign] = useState<string>('');
  const [deletingSeries, setDeletingSeries] = useState<ManagedSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const authorDisplayName = profile?.displayName || user?.displayName || 'Matthew E. Messmer';

  const loadData = async () => {
    try {
      if (seriesList.length === 0) setLoading(true);
      setError(null);
      const [s, b] = await Promise.all([bookService.getAllSeries(), bookService.getAllBooks()]);
      setSeriesList(s);
      setAllBooks(b);
      setLoading(false);
      if ((!selectedSeriesId || !s.some((item) => item.id === selectedSeriesId)) && s.length > 0) {
        setSelectedSeriesId(s[0].id);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AdminSeriesView] Error loading series from Firestore:', err);
      }
      setError('Unable to load series. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchFresh = async () => {
      try {
        const cachedS = bookService.getCachedSeries();
        const cachedB = bookService.getCachedBooks();
        if (isMounted) {
          if (cachedS.length > 0) setSeriesList(cachedS);
          if (cachedB.length > 0) setAllBooks(cachedB);
          setLoading(bookService.isSeriesLoading() && cachedS.length === 0);
          const err = bookService.getSeriesError();
          if (err) setError('Unable to load series. Please try again.');
          else setError(null);
        }

        const [s, b] = await Promise.all([bookService.getAllSeries(), bookService.getAllBooks()]);
        if (isMounted) {
          setSeriesList(s);
          setAllBooks(b);
          setLoading(false);
          setError(null);
          if ((!selectedSeriesId || !s.some((item) => item.id === selectedSeriesId)) && s.length > 0) {
            setSelectedSeriesId(s[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[AdminSeriesView] Error in fetchFresh:', err);
          }
          setError('Unable to load series. Please try again.');
          setLoading(false);
        }
      }
    };

    fetchFresh();

    const unsub = bookService.subscribe(() => {
      if (!isMounted) return;
      const s = bookService.getCachedSeries();
      const b = bookService.getCachedBooks();
      setSeriesList(s);
      setAllBooks(b);
      setLoading(bookService.isSeriesLoading() && s.length === 0);
      const err = bookService.getSeriesError();
      if (err) setError('Unable to load series. Please try again.');
      else setError(null);
      if ((!selectedSeriesId || !s.some((item) => item.id === selectedSeriesId)) && s.length > 0) {
        setSelectedSeriesId(s[0].id);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (initialAction === 'new' && isAuthor) {
      handleStartNewSeries();
    }
  }, [initialAction, isAuthor]);

  const currentSeries = seriesList.find((s) => s.id === selectedSeriesId) || seriesList[0];

  // Books belonging to the current series
  const orderedSeriesBooks = currentSeries
    ? (currentSeries.bookIds || [])
        .map((id) => allBooks.find((b) => b.id === id))
        .filter((b): b is ManagedBook => Boolean(b))
    : [];

  const unlistedBooks = allBooks.filter(
    (b) =>
      b.seriesId === currentSeries?.id &&
      !currentSeries?.bookIds?.includes(b.id)
  );

  const combinedBooks = [...orderedSeriesBooks, ...unlistedBooks];

  // Books not in current series that can be assigned
  const availableBooksToAssign = allBooks.filter(
    (b) => !currentSeries?.bookIds?.includes(b.id) && b.seriesId !== currentSeries?.id
  );

  // Auto-generate slug from name while in new series mode
  const handleNameChange = (name: string) => {
    setFormName(name);
    if (isNewSeries) {
      const generated = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generated);
    }
  };

  const handleStartNewSeries = () => {
    if (!isAuthor) return;
    setIsNewSeries(true);
    setFormId(`series-${Date.now()}`);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormShortDescription('');
    setFormGenres(['Epic Fantasy']);
    setFormArtworkUrl('');
    setFormBannerImage('');
    setFormStatus('IN DEVELOPMENT');
    setFormPublicationState('DRAFT'); // Default to DRAFT per requirements
    setFormSeoTitle('');
    setFormMetaDescription('');
    setFormSocialImage('');
    setViewMode('form');

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/series/new');
    }
  };

  const handleStartEditSeries = (series: ManagedSeries) => {
    setIsNewSeries(false);
    setFormId(series.id);
    setFormName(series.name);
    setFormSlug(series.slug || series.id);
    setFormDescription(series.description || '');
    setFormShortDescription(series.shortDescription || '');
    setFormGenres(series.genres || ['Fantasy']);
    setFormArtworkUrl(series.artworkUrl || series.bannerImage || '');
    setFormBannerImage(series.bannerImage || series.artworkUrl || '');
    setFormStatus(series.status || 'IN DEVELOPMENT');
    setFormPublicationState(series.publicationState || 'DRAFT');
    setFormSeoTitle(series.seoTitle || '');
    setFormMetaDescription(series.metaDescription || '');
    setFormSocialImage(series.socialImage || series.artworkUrl || '');
    setViewMode('form');

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/series`);
    }
  };

  const handleCancelForm = () => {
    setViewMode('detail');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/series');
    }
  };

  const handleAddGenre = (genreToAdd: string) => {
    const trimmed = genreToAdd.trim();
    if (trimmed && !formGenres.includes(trimmed)) {
      setFormGenres([...formGenres, trimmed]);
      setFormGenreInput('');
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setFormGenres(formGenres.filter((g) => g !== genreToRemove));
  };

  const handleBannerFileUpload = async (file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToastMessage({ type: 'error', text: 'Please upload a JPG, PNG, or WEBP image.' });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToastMessage({ type: 'error', text: 'File exceeds 10MB limit. Please compress the banner image.' });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setFormBannerImage(localPreviewUrl);
    setFormArtworkUrl(localPreviewUrl);

    try {
      setBannerUploadProgress(25);
      const sId = formId || (formName ? formName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'series');
      const { downloadUrl } = await bookService.uploadSeriesBanner(sId, file, (progress) => {
        setBannerUploadProgress(progress);
      });
      setFormBannerImage(downloadUrl);
      setFormArtworkUrl(downloadUrl);
      setBannerUploadProgress(100);
      setTimeout(() => setBannerUploadProgress(null), 400);
      setToastMessage({ type: 'success', text: 'Series banner uploaded successfully.' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setBannerUploadProgress(null);
      setToastMessage({ type: 'error', text: `Upload failed: ${err.message || 'Unknown error'}` });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setToastMessage({ type: 'error', text: 'Please enter a series name.' });
      return;
    }

    if (isNewSeries && !isAuthor) {
      setToastMessage({ type: 'error', text: 'Only users with the AUTHOR role may create a new series.' });
      return;
    }

    const effectiveBanner = formBannerImage.trim() || formArtworkUrl.trim();

    const payload: Partial<ManagedSeries> = {
      id: formId,
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      shortDescription: formShortDescription.trim(),
      genres: formGenres,
      bannerImage: effectiveBanner,
      artworkUrl: effectiveBanner,
      status: formStatus,
      publicationState: formPublicationState,
      seoTitle: formSeoTitle.trim() || `${formName} | Matthew E. Messmer`,
      metaDescription: formMetaDescription.trim() || formShortDescription || formDescription.substring(0, 160),
      socialImage: formSocialImage.trim() || effectiveBanner,
    };

    const res = await bookService.saveSeries(payload, isNewSeries, {
      name: authorDisplayName,
      email: user?.email || 'author',
    });

    if (res.success && res.series) {
      setToastMessage({
        type: 'success',
        text: `Series "${res.series.name}" successfully ${isNewSeries ? 'created' : 'updated'}.`,
      });
      setSelectedSeriesId(res.series.id);
      setViewMode('detail');
      await loadData();
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin/series');
      }
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setToastMessage({
        type: 'error',
        text: res.error || 'Failed to save series. Please check the URL slug for duplicates.',
      });
    }
  };

  // Reorder books
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
    setToastMessage({
      type: 'success',
      text: `Reading sequence updated for "${currentSeries.name}".`,
    });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Numerical order direct change
  const handleNumericalOrderChange = async (bookId: string, newPosition: number) => {
    if (!currentSeries) return;
    const targetIdx = Math.max(1, Math.min(newPosition, combinedBooks.length)) - 1;
    const currentIdx = combinedBooks.findIndex((b) => b.id === bookId);
    if (currentIdx === -1 || currentIdx === targetIdx) return;

    const list = [...combinedBooks];
    const [moved] = list.splice(currentIdx, 1);
    list.splice(targetIdx, 0, moved);

    const newBookIds = list.map((b) => b.id);
    await bookService.reorderSeriesBooks(currentSeries.id, newBookIds);
    setToastMessage({
      type: 'success',
      text: `Book sequence position updated to #${targetIdx + 1}.`,
    });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Assign existing book to current series
  const handleAssignBook = async () => {
    if (!currentSeries || !selectedBookToAssign) return;
    await bookService.assignBookToSeries(currentSeries.id, selectedBookToAssign);
    setSelectedBookToAssign('');
    setShowAssignModal(false);
    setToastMessage({
      type: 'success',
      text: 'Book added to series reading order.',
    });
    await loadData();
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Remove book from series (unassigns safely)
  const handleRemoveBook = async (bookId: string, title: string) => {
    if (!currentSeries) return;
    if (
      !confirm(
        `Remove "${title}" from ${currentSeries.name}? The book will remain in your catalog as unassigned.`
      )
    ) {
      return;
    }
    await bookService.removeBookFromSeries(currentSeries.id, bookId);
    setToastMessage({
      type: 'success',
      text: `"${title}" unassigned from series and preserved as a standalone book.`,
    });
    await loadData();
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Delete Series Confirmation
  const handleConfirmDeleteSeries = async () => {
    if (!deletingSeries || !isAuthor) return;
    setIsDeleting(true);

    const res = await bookService.deleteSeries(deletingSeries.id, {
      name: authorDisplayName,
      email: user?.email || 'author',
    });

    setIsDeleting(false);
    setDeletingSeries(null);

    if (res.success) {
      setToastMessage({
        type: 'success',
        text: `Series "${deletingSeries.name}" deleted. ${res.unassignedCount} attached books safely unassigned and kept intact.`,
      });
      await loadData();
      if (seriesList.length > 1) {
        const remaining = seriesList.filter((s) => s.id !== deletingSeries.id);
        setSelectedSeriesId(remaining[0].id);
      }
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Universe & Canon Architecture
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              Author Series Area
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Series Management & Book Sequence
          </h2>
          <p className="text-xs sm:text-sm text-[#8e887a] mt-1">
            Create universes, define reading orders, and customize publication states. Existing series and unreleased titles remain protected.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {viewMode === 'detail' && isAuthor && (
            <button
              onClick={handleStartNewSeries}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#c5a059]/15"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Series</span>
            </button>
          )}

          {viewMode === 'form' && (
            <button
              onClick={handleCancelForm}
              className="px-4 py-2 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Series List</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[#142319] border-emerald-500/40 text-emerald-300'
              : 'bg-[#251518] border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* SERIES CREATION & EDITING FORM */}
      {viewMode === 'form' && (
        <form onSubmit={handleSaveSeries} className="space-y-6">
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#212334] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#c5a059]" />
                  <span>{isNewSeries ? 'Create New Literary Series' : `Edit Series: ${formName}`}</span>
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  Specify canonical name, URL slug, status, artwork, and search engine metadata.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] px-2 py-0.5 rounded">
                Author Controlled
              </span>
            </div>

            {/* Core Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Series Name */}
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold">
                  Series Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., The Breathwoven Cycle"
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold flex items-center justify-between">
                  <span>URL Slug (Canonical Path) *</span>
                  <span className="text-[10px] font-mono text-[#c5a059]">/series/{formSlug || 'slug'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#6e685c] font-mono">/series/</span>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) =>
                      setFormSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/^\/series\//, '')
                          .replace(/[^a-z0-9-]+/g, '-')
                      )
                    }
                    placeholder="the-breathwoven-cycle"
                    className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl pl-20 pr-3.5 py-2.5 text-xs text-[#f5efeb] font-mono"
                  />
                </div>
                <p className="text-[10px] text-[#7d776a] mt-1">
                  Unique identifier used in URLs and public discovery. Duplicate check performed automatically upon save.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold">
                  Production Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SeriesStatus)}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="IN DEVELOPMENT">IN DEVELOPMENT</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ON HIATUS">ON HIATUS</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <p className="text-[10px] text-[#7d776a] mt-1">
                  Indicates current creative and publication pipeline stage.
                </p>
              </div>

              {/* Publication State */}
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold">
                  Publication State (Visibility) *
                </label>
                <select
                  value={formPublicationState}
                  onChange={(e) => setFormPublicationState(e.target.value as AdminPublicationState)}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                >
                  <option value="DRAFT">DRAFT (Author & Editor Only - Default)</option>
                  <option value="PRIVATE">PRIVATE (Strictly Author Vault)</option>
                  <option value="TEASER">TEASER (Public Preview with Forthcoming Status)</option>
                  <option value="PUBLIC">PUBLIC (Fully Visible to All Readers)</option>
                </select>
                <p className="text-[10px] text-[#7d776a] mt-1">
                  Defaults to DRAFT. Protects unreleased working titles from public indexing.
                </p>
              </div>
            </div>

            {/* Description & Short Description */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold">
                  Short Tagline / Teaser
                </label>
                <input
                  type="text"
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  placeholder="e.g., The high fantasy saga of Val-Mora and the Archipelago of Spires."
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5 font-bold">
                  Comprehensive Series Description & Worldbuilding Overview
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the universe lore, thematic threads, and overarching premise..."
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl p-3.5 text-xs text-[#f5efeb] leading-relaxed"
                />
              </div>
            </div>

            {/* Genres & Categories */}
            <div className="space-y-3">
              <label className="text-xs font-cinzel text-[#dcd7cb] block font-bold">
                Genre(s) & Classification
              </label>

              {/* Active Badges */}
              <div className="flex flex-wrap gap-2">
                {formGenres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#181a29] border border-[#303348] rounded-lg text-xs text-[#e8e2d9]"
                  >
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(g)}
                      className="hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Genre input and quick tags */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formGenreInput}
                  onChange={(e) => setFormGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGenre(formGenreInput);
                    }
                  }}
                  placeholder="Type a custom genre and press Add..."
                  className="flex-1 bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#f5efeb]"
                />
                <button
                  type="button"
                  onClick={() => handleAddGenre(formGenreInput)}
                  className="px-4 py-2 bg-[#1b1e2e] hover:bg-[#25283c] border border-[#32364c] text-xs font-cinzel text-[#c5a059] rounded-xl cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#7d776a]">
                <span className="font-cinzel text-[#9c9689]">Suggestions:</span>
                {DEFAULT_GENRE_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddGenre(sug)}
                    className="px-2 py-0.5 rounded bg-[#131520] hover:bg-[#1f2233] text-[#aba598] hover:text-[#f5efeb] border border-[#222536] transition-colors cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Series Banner Image (File Upload & URL) */}
            <div className="p-5 bg-[#141624] border border-[#282b3d] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#212334] pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#c5a059]" />
                  <label className="text-xs font-cinzel font-bold text-[#f5efeb] uppercase tracking-wider">
                    Series Header Banner Image
                  </label>
                </div>
                <span className="text-[10px] text-[#8e887a] font-mono">
                  Recommended: 1600 × 500 px (Landscape)
                </span>
              </div>

              {/* Upload or Link Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* 1. Direct File Upload Button */}
                <div className="space-y-2">
                  <span className="text-xs font-cinzel text-[#dcd7cb] block font-semibold">
                    Upload Image File
                  </span>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2b2e42] hover:border-[#c5a059]/60 rounded-xl bg-[#0e1018] cursor-pointer transition-colors group text-center">
                    <Upload className="w-5 h-5 text-[#c5a059] group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-cinzel font-medium text-[#f5efeb]">
                      Choose Banner File
                    </span>
                    <span className="text-[10px] text-[#7d776a] mt-0.5">
                      JPG, PNG, or WEBP (Max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBannerFileUpload(file);
                      }}
                    />
                  </label>

                  {bannerUploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#c5a059]">
                        <span>Uploading banner...</span>
                        <span>{bannerUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1b1e2c] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c5a059] h-full transition-all duration-300"
                          style={{ width: `${bannerUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Image URL Input */}
                <div className="space-y-2">
                  <span className="text-xs font-cinzel text-[#dcd7cb] block font-semibold">
                    Or Enter Image URL
                  </span>
                  <input
                    type="url"
                    value={formBannerImage || formArtworkUrl}
                    onChange={(e) => {
                      setFormBannerImage(e.target.value);
                      setFormArtworkUrl(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/... or file path"
                    className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-[#f5efeb]"
                  />
                  <p className="text-[10px] text-[#7d776a] leading-relaxed">
                    Paste any public image URL or cloud storage path to display as the series landing page header.
                  </p>

                  {(formBannerImage || formArtworkUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormBannerImage('');
                        setFormArtworkUrl('');
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Banner</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Real-Time Header Preview */}
              {(formBannerImage || formArtworkUrl) ? (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-cinzel text-[#a8a295] block font-semibold">
                    Public Header Banner Preview:
                  </span>
                  <div className="relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden border border-[#c5a059]/40 bg-[#0d0e15] shadow-lg">
                    <img
                      src={formBannerImage || formArtworkUrl}
                      alt="Series banner preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {/* Gradient overlay mimicking public header */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/60 to-transparent flex items-end p-4 sm:p-6">
                      <div>
                        <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] bg-[#c5a059]/15 px-2 py-0.5 rounded-full border border-[#c5a059]/30">
                          {formName || 'Series Title'}
                        </span>
                        <h4 className="text-lg font-cinzel font-bold text-[#f5efeb] mt-1 drop-shadow-md">
                          {formName || 'Series Name'}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0e1018] rounded-xl border border-[#212334] text-[11px] text-[#7d776a] italic">
                  No custom banner image set. The public series page will gracefully display the default styled ambient header.
                </div>
              )}
            </div>

            {/* SEO Panel */}
            <div className="p-5 bg-[#141624] border border-[#282b3d] rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#212334] pb-2">
                <Globe className="w-4 h-4 text-[#c5a059]" />
                <h4 className="text-xs font-cinzel font-bold text-[#f5efeb] uppercase tracking-wider">
                  Search Engine Optimization & Social Sharing (OpenGraph)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formSeoTitle}
                    onChange={(e) => setFormSeoTitle(e.target.value)}
                    placeholder={`${formName || 'Series'} | Matthew E. Messmer`}
                    className="w-full bg-[#161828] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#f5efeb]"
                  />
                </div>

                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Social Sharing Image URL
                  </label>
                  <input
                    type="url"
                    value={formSocialImage}
                    onChange={(e) => setFormSocialImage(e.target.value)}
                    placeholder="Defaults to Series Artwork URL"
                    className="w-full bg-[#161828] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#f5efeb]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={formMetaDescription}
                    onChange={(e) => setFormMetaDescription(e.target.value)}
                    placeholder="Search engine summary (up to 160 characters)..."
                    className="w-full bg-[#161828] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg p-2.5 text-xs text-[#f5efeb]"
                  />
                </div>
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#212334]">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2.5 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#c5a059]/15 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isNewSeries ? 'Create Series' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SERIES DETAIL & BOOK ORDERING VIEW */}
      {viewMode === 'detail' && (
        <div className="space-y-6">
          {/* Loading State */}
          {loading && seriesList.length === 0 && (
            <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin mx-auto" />
              <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">Loading series...</h3>
              <p className="text-xs text-[#7d776a]">Synchronizing series records with Firestore.</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && seriesList.length === 0 && (
            <div className="bg-[#11131c] border border-rose-900/40 rounded-2xl p-14 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="font-cinzel font-bold text-base text-rose-300">{error}</h3>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-[#1e2130] hover:bg-[#282c40] text-[#c5a059] rounded-lg text-xs font-cinzel transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && seriesList.length === 0 && (
            <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-12 text-center space-y-4">
              <Layers className="w-10 h-10 text-[#5c5649] mx-auto" />
              <h3 className="font-cinzel font-bold text-lg text-[#f5efeb]">No series have been added yet.</h3>
              <p className="text-xs text-[#8e887a] max-w-md mx-auto leading-relaxed">
                Organize your literary canon, reading sequence, and universe lore by creating your first series in Firestore.
              </p>
              {isAuthor && (
                <button
                  onClick={handleStartNewSeries}
                  className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c5a059]/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create First Series</span>
                </button>
              )}
            </div>
          )}

          {/* Canonical Series Management Table */}
          {seriesList.length > 0 && (
            <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2231] pb-4">
                <div>
                  <h3 className="font-cinzel font-bold text-base text-[#f5efeb] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c5a059]" />
                    <span>Registered Series & Universes ({seriesList.length})</span>
                  </h3>
                  <p className="text-[11px] text-[#7d776a] mt-0.5">
                    All canonical series documents from Firestore. Click any series to manage its reading order.
                  </p>
                </div>
                {isAuthor && (
                  <button
                    onClick={handleStartNewSeries}
                    className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Series</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#212332] bg-[#0d0e15] text-[#8e887a] font-cinzel uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Series Name</th>
                      <th className="py-3 px-4">Publication State</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Canon Books</th>
                      <th className="py-3 px-4">Genres</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e202d]">
                    {seriesList.map((s) => {
                      const isSelected = selectedSeriesId === s.id;
                      const booksCount =
                        s.id === 'abyssal-current'
                          ? 1
                          : (s.bookIds?.length || 0) > 0
                          ? s.bookIds.length
                          : allBooks.filter((b) => b.seriesId === s.id).length;
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-[#161826] transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#181b29] border-l-2 border-[#c5a059]' : ''
                          }`}
                          onClick={() => setSelectedSeriesId(s.id)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-cinzel font-bold text-sm text-[#f5efeb] flex items-center gap-2">
                              <span>{s.name}</span>
                              {isSelected && (
                                <span className="px-1.5 py-0.5 bg-[#c5a059]/20 text-[#c5a059] text-[9px] font-mono rounded">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7d776a] font-mono mt-0.5">
                              ID: {s.id}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase ${
                                s.publicationState === 'PUBLIC'
                                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                                  : s.publicationState === 'TEASER'
                                  ? 'bg-sky-950/70 text-sky-300 border border-sky-700/50'
                                  : 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                              }`}
                            >
                              {s.publicationState}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-[#c5a059] font-cinzel uppercase font-semibold">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-1 bg-[#121420] text-[#f5efeb] rounded font-mono text-xs border border-[#212435]">
                              {booksCount} {booksCount === 1 ? 'Book' : 'Books'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {(s.genres || ['Epic Fantasy']).slice(0, 2).map((g) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 bg-[#121420] border border-[#212435] text-[#8e887a] rounded text-[10px]"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedSeriesId(s.id)}
                                className={`px-2.5 py-1 text-[11px] font-cinzel rounded transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                                    : 'bg-[#1c1e2b] hover:bg-[#25283c] text-[#c5a059]'
                                }`}
                                title="Manage reading order and books"
                              >
                                Manage Books
                              </button>
                              <button
                                onClick={() => handleStartEditSeries(s)}
                                className="p-1.5 text-[#8e887a] hover:text-[#c5a059] hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                                title="Edit series settings"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {isAuthor && (
                                <button
                                  onClick={() => setDeletingSeries(s)}
                                  className="p-1.5 text-[#8e887a] hover:text-rose-400 hover:bg-[#1f2233] rounded transition-colors cursor-pointer"
                                  title="Delete series"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          )}

          {/* Series Tabs for Quick Switch */}
          {seriesList.length > 0 && (
            <div className="flex border-b border-[#232635] gap-2 overflow-x-auto pb-1">
              {seriesList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeriesId(s.id)}
                  className={`px-4 py-3 text-xs font-cinzel uppercase tracking-wider rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    selectedSeriesId === s.id
                      ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40] font-bold shadow-md'
                      : 'text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{s.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#11131c] text-[#8e887a]">
                    {s.id === 'abyssal-current'
                      ? 1
                      : (s.bookIds?.length || 0) > 0
                      ? s.bookIds.length
                      : allBooks.filter((b) => b.seriesId === s.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {currentSeries && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (8 cols): Book Ordering and Assignment */}
              <div className="lg:col-span-8 bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2231] pb-4">
                  <div>
                    <h3 className="font-cinzel font-bold text-base text-[#f5efeb] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#c5a059]" />
                      <span>Chronological Reading Sequence ({combinedBooks.length} Books)</span>
                    </h3>
                    <p className="text-[11px] text-[#7d776a] mt-0.5">
                      Assign, reorder, or detach books. Reordering automatically updates public series pages.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-3 py-1.5 bg-[#171928] hover:bg-[#23273d] border border-[#2e334e] text-xs font-cinzel text-[#c5a059] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Book</span>
                    </button>

                    {onNavigateToNewBook && isAuthor && (
                      <button
                        onClick={() => onNavigateToNewBook(currentSeries.id)}
                        className="px-3 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 border border-[#c5a059]/40 text-xs font-cinzel text-[#c5a059] font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ New Book</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State */}
                {combinedBooks.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-[#282b3d] rounded-xl space-y-3">
                    <BookOpen className="w-8 h-8 text-[#6d685c] mx-auto" />
                    <h4 className="text-sm font-cinzel font-semibold text-[#f5efeb]">
                      No Books Assigned to this Series Yet
                    </h4>
                    <p className="text-xs text-[#8e887a] max-w-md mx-auto">
                      You can assign existing books or create new books within this series. Books are never required to belong to a series (standalones are fully supported).
                    </p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-4 py-2 bg-[#c5a059] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg cursor-pointer"
                    >
                      Assign Existing Book
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combinedBooks.map((book, idx) => (
                      <div
                        key={book.id}
                        className="p-3.5 bg-[#0d0e15] border border-[#212433] hover:border-[#2f3348] rounded-xl flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Numerical Order / Position Input */}
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[9px] font-cinzel text-[#7d776a] uppercase">Pos</span>
                            <input
                              type="number"
                              min={1}
                              max={combinedBooks.length}
                              value={idx + 1}
                              onChange={(e) =>
                                handleNumericalOrderChange(book.id, parseInt(e.target.value) || 1)
                              }
                              className="w-10 h-7 text-center bg-[#1c1e2b] text-[#c5a059] border border-[#2e3146] rounded text-xs font-cinzel font-bold focus:outline-none focus:border-[#c5a059]"
                              title="Enter numerical sequence position"
                            />
                          </div>

                          {/* Cover Thumbnail */}
                          <div className="w-10 aspect-[2/3] rounded overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 flex items-center justify-center shadow-md">
                            <BookCoverArt book={book as any} className="w-full h-full" showHoverEffect={false} />
                          </div>

                          {/* Book Details */}
                          <div>
                            <div className="font-cinzel font-bold text-xs sm:text-sm text-[#f5efeb] flex items-center gap-2">
                              <span>{book.title}</span>
                              {book.subtitle && (
                                <span className="text-[11px] text-[#7d776a] font-normal hidden sm:inline">
                                  — {book.subtitle}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8e887a]">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                                  book.publicationState === 'PUBLIC'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : book.publicationState === 'TEASER'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {book.publicationState}
                              </span>
                              <span>·</span>
                              <span>Book #{book.seriesOrder || idx + 1}</span>
                              <span>·</span>
                              <span>{(book as any).releaseYear || book.publicationDate || '2024'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls: Up / Down / Remove */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => moveBook(idx, 'up')}
                            disabled={idx === 0}
                            className="p-2 bg-[#1b1e2c] hover:bg-[#25283c] disabled:opacity-20 rounded-lg text-[#d4cfc2] transition-colors cursor-pointer"
                            title="Move up in reading sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveBook(idx, 'down')}
                            disabled={idx === combinedBooks.length - 1}
                            className="p-2 bg-[#1b1e2c] hover:bg-[#25283c] disabled:opacity-20 rounded-lg text-[#d4cfc2] transition-colors cursor-pointer"
                            title="Move down in reading sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveBook(book.id, book.title)}
                            className="p-2 bg-[#1b1e2c] hover:bg-rose-950/40 text-[#8e887a] hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                            title="Unassign from series (does NOT delete book)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (4 cols): Series Properties & Actions */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1f2231] pb-3">
                    <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                      Series Specifications
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditSeries(currentSeries)}
                        className="p-1.5 text-xs text-[#c5a059] hover:bg-[#1a1d2d] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Edit series properties"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="font-cinzel text-[11px]">Edit</span>
                      </button>

                      {isAuthor && (
                        <button
                          onClick={() => setDeletingSeries(currentSeries)}
                          className="p-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete series (books preserved)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Artwork Banner thumbnail */}
                  {currentSeries.artworkUrl && (
                    <div className="h-28 rounded-xl overflow-hidden border border-[#2b2e40] bg-[#0c0d12]">
                      <img
                        src={currentSeries.artworkUrl}
                        alt={currentSeries.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-3 text-xs text-[#aba597]">
                    <div>
                      <strong className="text-[#f5efeb] block mb-0.5">Series Name</strong>
                      <span className="font-cinzel text-[#f5efeb]">{currentSeries.name}</span>
                    </div>

                    <div>
                      <strong className="text-[#f5efeb] block mb-0.5">Canonical Slug</strong>
                      <code className="text-[#c5a059] font-mono text-[11px]">
                        /series/{currentSeries.slug || currentSeries.id}
                      </code>
                    </div>

                    <div>
                      <strong className="text-[#f5efeb] block mb-0.5">Status & Visibility</strong>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-semibold bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
                          {currentSeries.status || 'IN DEVELOPMENT'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                          {currentSeries.publicationState || 'DRAFT'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <strong className="text-[#f5efeb] block mb-0.5">Genre(s)</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(currentSeries.genres || ['Epic Fantasy']).map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 bg-[#171928] border border-[#292c3f] rounded text-[10px] text-[#dcd7cb]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong className="text-[#f5efeb] block mb-0.5">Description</strong>
                      <p className="leading-relaxed text-[#8f897c] text-[11px]">
                        {currentSeries.description || 'No description entered yet.'}
                      </p>
                    </div>

                    {currentSeries.seoTitle && (
                      <div className="pt-2 border-t border-[#1e202d]">
                        <strong className="text-[#f5efeb] block mb-0.5">SEO Title</strong>
                        <span className="text-[11px] text-[#7d776a]">{currentSeries.seoTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Public Series View Link */}
                <div className="p-4 bg-[#141624] border border-[#26293d] rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-cinzel font-bold text-[#f5efeb]">Public Series Hub</span>
                    <p className="text-[11px] text-[#7d776a]">View canonical presentation</p>
                  </div>
                  <a
                    href={
                      currentSeries.id === 'breathwoven-cycle'
                        ? '/the-breathwoven-cycle'
                        : currentSeries.id === 'abyssal-current'
                        ? '/the-abyssal-current'
                        : `/series/${currentSeries.slug || currentSeries.id}`
                    }
                    className="p-2 bg-[#1d2030] hover:bg-[#272b40] text-[#c5a059] rounded-lg transition-colors cursor-pointer"
                    title="Open public series page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASSIGN EXISTING BOOK MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12141e] border border-[#2b2e42] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#c5a059]" />
                <span>Assign Book to {currentSeries?.name}</span>
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-[#8e887a] hover:text-[#f5efeb] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8e887a] leading-relaxed">
              Select an existing book from your catalog. Books do not have to belong to a series; assigning will link it to this universe sequence.
            </p>

            {availableBooksToAssign.length === 0 ? (
              <div className="p-4 bg-[#171926] rounded-xl text-center text-xs text-[#8e887a]">
                All available books are already assigned to this series.
              </div>
            ) : (
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Select Book
                </label>
                <select
                  value={selectedBookToAssign}
                  onChange={(e) => setSelectedBookToAssign(e.target.value)}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-xl px-3 py-2 text-xs text-[#f5efeb]"
                >
                  <option value="">-- Choose a book --</option>
                  {availableBooksToAssign.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} {b.seriesName ? `(Currently in: ${b.seriesName})` : '(Unassigned)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#212334]">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-[#171926] hover:bg-[#222536] text-xs font-cinzel text-[#c5a059] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!selectedBookToAssign}
                onClick={handleAssignBook}
                className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] disabled:opacity-40 text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg cursor-pointer transition-colors"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SERIES CONFIRMATION MODAL (Strictly Author Only) */}
      {deletingSeries && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1a1215] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                  Delete Series: "{deletingSeries.name}"?
                </h3>
                <p className="text-xs text-rose-300 mt-1">
                  Author-only administrative action.
                </p>
              </div>
            </div>

            {/* Crucial Preservation Warning as mandated by User Request */}
            <div className="p-4 bg-[#231418] border border-rose-500/30 rounded-xl text-xs space-y-2 text-[#e2dad8]">
              <div className="font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Book Preservation Guarantee</span>
              </div>
              <p className="leading-relaxed">
                Deleting this series will <strong>NOT</strong> delete any attached books.
              </p>
              <p className="leading-relaxed text-[#aba3a1]">
                All <strong className="text-[#f5efeb]">{deletingSeries.bookIds?.length || 0} attached books</strong> will safely remain in your library catalog as standalone, unassigned titles.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSeries(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#171926] hover:bg-[#222536] text-xs font-cinzel text-[#c5a059] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSeries}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-[#ffffff] text-xs font-cinzel font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete Series (Unassign Books)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
