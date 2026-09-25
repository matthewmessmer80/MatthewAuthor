import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagedBook, bookService } from '../../services/bookService';
import { BookCoverArt } from '../../components/BookCoverArt';
import {
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Trash2,
  ExternalLink,
  Shield,
  Sparkles,
  Layers,
} from 'lucide-react';

interface AdminBookEditorViewProps {
  initialBookId?: string | null;
  onBack: () => void;
  onPreviewPublic: (book: ManagedBook) => void;
}

export const AdminBookEditorView: React.FC<AdminBookEditorViewProps> = ({
  initialBookId,
  onBack,
  onPreviewPublic,
}) => {
  const { user, profile, role, isAuthor } = useAuth();
  const [book, setBook] = useState<Partial<ManagedBook>>({
    title: '',
    subtitle: '',
    seriesId: 'breathwoven-cycle',
    seriesName: 'The Breathwoven Cycle',
    seriesOrder: 1,
    bookNumber: 1,
    shortDescription: '',
    description: '',
    genre: 'Epic Fantasy',
    status: 'published',
    publicationState: 'PUBLIC',
    featured: false,
    author: 'Matthew E. Messmer',
    language: 'English',
    publisher: 'Breathwoven Press',
    publicationDate: new Date().getFullYear().toString(),
    indexing: 'index',
    amazonUrl: '',
    woodEngravingNote: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'cover' | 'metadata' | 'excerpt' | 'seo'>('basic');

  useEffect(() => {
    async function loadBook() {
      if (initialBookId) {
        const found = await bookService.getBookById(initialBookId);
        if (found) {
          setBook(found);
        }
      }
      setIsLoading(false);
    }
    loadBook();
  }, [initialBookId]);

  // Prompt before unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateField = (field: keyof ManagedBook, value: any) => {
    setIsDirty(true);
    setBook((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-update SEO and slug if title changes and user hasn't explicitly customized
      if (field === 'title' && typeof value === 'string') {
        if (!prev.slug || prev.slug.startsWith('untitled')) {
          updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (!prev.seoTitle || prev.seoTitle.includes('Matthew E. Messmer')) {
          updated.seoTitle = `${value} | Matthew E. Messmer`;
        }
        if (!prev.coverImageAlt) {
          updated.coverImageAlt = `${value} book cover by Matthew E. Messmer`;
        }
      }
      return updated;
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorToast('Invalid file format. Please upload JPG, PNG, or WEBP.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorToast('File exceeds 10MB limit. Please compress the cover image.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    try {
      setUploadProgress(10);
      const bookId = book.id || `book-${Date.now()}`;
      const { downloadUrl, storagePath } = await bookService.uploadBookCover(
        bookId,
        file,
        (progress) => setUploadProgress(progress)
      );

      setBook((prev) => ({
        ...prev,
        id: bookId,
        coverImage: downloadUrl,
        coverStoragePath: storagePath,
      }));
      setIsDirty(true);
      setUploadProgress(null);
      setSaveToast('Cover image successfully uploaded and staged.');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setUploadProgress(null);
      setErrorToast(`Cover upload error: ${err.message || 'Unknown error'}`);
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  const handleSave = async (forcePublish?: boolean) => {
    if (!book.title || !book.title.trim()) {
      setErrorToast('Book title is required.');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    const payload: Partial<ManagedBook> = { ...book };
    if (forcePublish !== undefined) {
      payload.publicationState = forcePublish ? 'PUBLIC' : 'DRAFT';
      payload.status = forcePublish ? 'published' : 'in-progress';
      payload.indexing = forcePublish ? 'index' : 'noindex';
    }

    try {
      const updaterInfo = {
        name: profile?.displayName || user?.displayName || 'Editor',
        email: user?.email || '',
        role,
      };
      const saved = await bookService.saveBook(payload, !initialBookId, updaterInfo);
      setBook(saved);
      setIsDirty(false);
      setSaveToast(`Book "${saved.title}" saved successfully (${saved.publicationState}).`);
      setTimeout(() => setSaveToast(null), 3500);
    } catch (e: any) {
      setErrorToast(`Failed to save book: ${e.message || 'Database error'}`);
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  const handleBackWithCheck = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard changes and return?')) {
        return;
      }
    }
    onBack();
  };

  if (isLoading) {
    return <div className="p-12 text-center text-[#8e887a] font-cinzel">Loading book record...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackWithCheck}
            className="p-2 text-[#8e887a] hover:text-[#f5efeb] hover:bg-[#1a1c28] rounded-lg transition-colors cursor-pointer"
            title="Back to Books List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
              {initialBookId ? `Edit Book: ${book.title}` : 'Add New Book'}
            </h2>
            <div className="text-xs text-[#8e887a] flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Status: <strong className="text-[#c5a059] uppercase">{book.publicationState || 'DRAFT'}</strong></span>
              {book.updatedBy && <span>· Updated by <strong className="text-[#e2ded5] font-cinzel">{book.updatedBy}</strong></span>}
              {isDirty && <span className="text-amber-400 font-medium">● Unsaved Changes</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPreviewPublic(book as ManagedBook)}
            className="px-3.5 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Public View</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-3.5 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Publish Book</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-600/50 rounded-lg text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#232635] text-xs font-cinzel uppercase tracking-wider gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'basic' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Basic Information
        </button>
        <button
          onClick={() => setActiveTab('cover')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cover' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Book Cover & Artwork</span>
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'metadata' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Purchase & Specs
        </button>
        <button
          onClick={() => setActiveTab('excerpt')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'excerpt' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Excerpt & Quote
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'seo' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          SEO & Indexing
        </button>
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === 'basic' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={book.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="E.g. The King's Severance"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Subtitle
              </label>
              <input
                type="text"
                value={book.subtitle || ''}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder="E.g. Book One of The Breathwoven Cycle"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Series
              </label>
              <select
                value={book.seriesId || 'breathwoven-cycle'}
                onChange={(e) => {
                  const sId = e.target.value;
                  const sName = sId === 'breathwoven-cycle' ? 'The Breathwoven Cycle' : 'The Abyssal Current';
                  updateField('seriesId', sId);
                  updateField('seriesName', sName);
                }}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              >
                <option value="breathwoven-cycle">The Breathwoven Cycle</option>
                <option value="abyssal-current">The Abyssal Current</option>
                <option value="standalone">Standalone Fantasy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Book Number in Series
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={book.seriesOrder || 1}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10) || 1;
                  updateField('seriesOrder', num);
                  updateField('bookNumber', num);
                }}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Publication State
              </label>
              <select
                value={book.publicationState || 'PUBLIC'}
                onChange={(e) => updateField('publicationState', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              >
                <option value="PUBLIC">PUBLIC — Visible to readers, indexed in sitemap</option>
                <option value="TEASER">TEASER — Preview visible, forthcoming announcements</option>
                <option value="DRAFT">DRAFT — Private to admin, not indexed</option>
                <option value="PRIVATE">PRIVATE — Hidden completely</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Genre
              </label>
              <input
                type="text"
                value={book.genre || 'Epic Fantasy'}
                onChange={(e) => updateField('genre', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Short Description / Tagline
              </label>
              <input
                type="text"
                value={book.shortDescription || ''}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                placeholder="When the golden thread of royalty snaps, an empire unravels into song and blade."
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Full Book Synopsis / Description
              </label>
              <textarea
                rows={5}
                value={book.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Write the full public book synopsis..."
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059] leading-relaxed"
              />
            </div>

            <div className="md:col-span-2 p-4 bg-[#161825] border border-[#272a3b] rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-cinzel font-semibold text-[#f5efeb]">
                  Featured Book on Homepage
                </div>
                <div className="text-[11px] text-[#8e887a]">
                  Spotlights this title in the primary hero banner on the public author website.
                </div>
              </div>
              <input
                type="checkbox"
                checked={book.featured || false}
                onChange={(e) => updateField('featured', e.target.checked)}
                className="w-4 h-4 accent-[#c5a059] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COVER UPLOAD & ART */}
      {activeTab === 'cover' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Drag & Drop Uploader */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Book Cover Artwork
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  Stored securely in Firebase Cloud Storage (<code className="text-[#c5a059]">/books/{'{bookId}'}/cover/</code>).
                </p>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[#36394e] hover:border-[#c5a059] rounded-xl p-8 text-center bg-[#0a0b10] transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#1b1e2c] text-[#c5a059] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-cinzel font-bold text-[#f5efeb] uppercase tracking-wider">
                  Drag and drop cover image here
                </p>
                <p className="text-[11px] text-[#8e887a] mt-1">
                  Supports JPG, PNG, and WEBP up to 10MB
                </p>
                <label className="mt-4 inline-block px-4 py-2 bg-[#1f2233] hover:bg-[#2b2f44] text-xs font-cinzel text-[#f5efeb] rounded-lg cursor-pointer transition-colors">
                  <span>Browse Device Files</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#a8a396]">
                    <span>Uploading to Cloud Storage...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#1b1e2c] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#c5a059] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Alt Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Cover Image Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  value={book.coverImageAlt || ''}
                  onChange={(e) => updateField('coverImageAlt', e.target.value)}
                  placeholder="The King's Severance book cover by Matthew E. Messmer"
                  className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {book.coverImage && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('coverImage', undefined)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Custom Cover</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-xs font-cinzel text-[#8e887a] mb-2 uppercase tracking-wider">
                Live Public Rendering Preview
              </span>
              <div className="w-56 aspect-[3/4] rounded-lg overflow-hidden border border-[#2b2e40] shadow-2xl relative bg-[#0c0d12]">
                <BookCoverArt book={book as any} size="lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: METADATA & PURCHASE */}
      {activeTab === 'metadata' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Amazon Product URL
              </label>
              <input
                type="url"
                value={book.amazonUrl || ''}
                onChange={(e) => updateField('amazonUrl', e.target.value)}
                placeholder="https://www.amazon.com/gp/product/B0GZFDD4VG"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                ISBN
              </label>
              <input
                type="text"
                value={book.isbn || ''}
                onChange={(e) => updateField('isbn', e.target.value)}
                placeholder="978-1-962450-01-8"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Page Count
              </label>
              <input
                type="number"
                value={book.pageCount || ''}
                onChange={(e) => updateField('pageCount', parseInt(e.target.value, 10) || undefined)}
                placeholder="448"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Publisher
              </label>
              <input
                type="text"
                value={book.publisher || 'Breathwoven Press'}
                onChange={(e) => updateField('publisher', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Publication Year / Release Date
              </label>
              <input
                type="text"
                value={book.publicationDate || ''}
                onChange={(e) => updateField('publicationDate', e.target.value)}
                placeholder="2024"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Physical Workshop Artifact / Engraving Note
              </label>
              <input
                type="text"
                value={book.woodEngravingNote || ''}
                onChange={(e) => updateField('woodEngravingNote', e.target.value)}
                placeholder="First edition features a laser-engraved cherry wood bookplate..."
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXCERPT & QUOTE */}
      {activeTab === 'excerpt' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
              Chapter 1 Excerpt (For Reading Room)
            </h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Chapter Title
              </label>
              <input
                type="text"
                value={book.excerpt?.chapterTitle || ''}
                onChange={(e) => {
                  setIsDirty(true);
                  setBook((prev) => ({
                    ...prev,
                    excerpt: {
                      chapterTitle: e.target.value,
                      text: prev.excerpt?.text || [],
                    },
                  }));
                }}
                placeholder="Chapter I: The Snap in the Dark"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Excerpt Paragraphs (Separate paragraphs with double enter)
              </label>
              <textarea
                rows={6}
                value={book.excerpt?.text ? book.excerpt.text.join('\n\n') : ''}
                onChange={(e) => {
                  setIsDirty(true);
                  const paragraphs = e.target.value.split('\n\n').filter(Boolean);
                  setBook((prev) => ({
                    ...prev,
                    excerpt: {
                      chapterTitle: prev.excerpt?.chapterTitle || 'Chapter I',
                      text: paragraphs,
                    },
                  }));
                }}
                placeholder="Paste the opening excerpt paragraphs..."
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059] font-serif leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#232635] space-y-4">
            <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
              Memorable Pull Quote
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Quote Text
                </label>
                <input
                  type="text"
                  value={book.quote?.text || ''}
                  onChange={(e) => {
                    setIsDirty(true);
                    setBook((prev) => ({
                      ...prev,
                      quote: {
                        text: e.target.value,
                        attribution: prev.quote?.attribution || book.title || '',
                      },
                    }));
                  }}
                  placeholder="A crown is merely cold metal until it is woven with the lives of those who bear its weight."
                  className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Attribution
                </label>
                <input
                  type="text"
                  value={book.quote?.attribution || ''}
                  onChange={(e) => {
                    setIsDirty(true);
                    setBook((prev) => ({
                      ...prev,
                      quote: {
                        text: prev.quote?.text || '',
                        attribution: e.target.value,
                      },
                    }));
                  }}
                  placeholder="Chapter VII, The King's Severance"
                  className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEO & INDEXING */}
      {activeTab === 'seo' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Page Title Tag (&lt;title&gt;)
              </label>
              <input
                type="text"
                value={book.seoTitle || ''}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="The King's Severance | Matthew E. Messmer"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Meta Description (120 - 160 characters recommended)
              </label>
              <textarea
                rows={2}
                value={book.metaDescription || ''}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
              <div className="text-[11px] text-[#8e887a] flex justify-end">
                {book.metaDescription?.length || 0} / 160 chars
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Canonical URL Path
              </label>
              <input
                type="text"
                value={book.canonicalUrl || ''}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder="/the-kings-severance"
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Search Engine Indexing
              </label>
              <select
                value={book.indexing || 'index'}
                onChange={(e) => updateField('indexing', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              >
                <option value="index">Index — Allow Google and search engines to index</option>
                <option value="noindex">Noindex — Exclude from search index and sitemap</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
