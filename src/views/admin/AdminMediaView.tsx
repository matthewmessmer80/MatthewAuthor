import React, { useState, useEffect, useRef } from 'react';
import { galleryService, DEFAULT_GALLERY_CATEGORIES } from '../../services/galleryService';
import { bookService, ManagedBook, ManagedSeries } from '../../services/bookService';
import { storyService } from '../../services/storyService';
import { characterLoreService } from '../../services/characterLoreService';
import { GalleryItem, PublicationState, Character, Story } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Star,
  Check,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Layers,
  BookOpen,
  Users,
  Feather,
  ExternalLink,
  Copy,
  Eye,
} from 'lucide-react';

const PUBLICATION_STATES: PublicationState[] = ['DRAFT', 'PRIVATE', 'TEASER', 'PUBLIC'];

export const AdminMediaView: React.FC = () => {
  const { isAuthor, isEditor, profile, user } = useAuth();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_GALLERY_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Relational options
  const [books, setBooks] = useState<ManagedBook[]>([]);
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
  const [selectedBook, setSelectedBook] = useState<string>('ALL');

  // Preview & Copy feedback
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAltText, setFormAltText] = useState('');
  const [formCategory, setFormCategory] = useState('Books');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formRelatedBookId, setFormRelatedBookId] = useState('');
  const [formRelatedSeriesId, setFormRelatedSeriesId] = useState('');
  const [formRelatedCharacterId, setFormRelatedCharacterId] = useState('');
  const [formRelatedStoryId, setFormRelatedStoryId] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formState, setFormState] = useState<PublicationState>('PUBLIC');
  const [formMedium, setFormMedium] = useState('');
  const [formDimensions, setFormDimensions] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsub = galleryService.subscribe((list) => {
      setItems(list);
      setCategories(galleryService.getCategories());
      setLoading(false);
    });

    // Load related entities for dropdowns
    Promise.all([
      bookService.getAllBooks(),
      bookService.getAllSeries(),
      storyService.getStories(),
      characterLoreService.getAllCharacters(),
    ]).then(([b, s, st, c]) => {
      setBooks(b);
      setSeriesList(s);
      setStories(st);
      setCharacters(c);
    });

    return () => unsub();
  }, []);

  const openNewItemModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormAltText('');
    setFormCategory('Books');
    setFormCustomCategory('');
    setFormTags('');
    setFormRelatedBookId('');
    setFormRelatedSeriesId('');
    setFormRelatedCharacterId('');
    setFormRelatedStoryId('');
    setFormFeatured(false);
    setFormState('PUBLIC');
    setFormMedium('');
    setFormDimensions('');
    setFormError(null);
    setUploadProgress(0);
    setIsEditorOpen(true);
  };

  const openEditItemModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormImageUrl(item.imageUrl);
    setFormAltText(item.altText || '');
    if (categories.includes(item.category)) {
      setFormCategory(item.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('CUSTOM');
      setFormCustomCategory(item.category);
    }
    setFormTags(item.tags?.join(', ') || '');
    setFormRelatedBookId(item.relatedBookId || '');
    setFormRelatedSeriesId(item.relatedSeriesId || '');
    setFormRelatedCharacterId(item.relatedCharacterId || '');
    setFormRelatedStoryId(item.relatedStoryId || '');
    setFormFeatured(!!item.featured);
    setFormState(item.publicationState || 'PUBLIC');
    setFormMedium(item.medium || '');
    setFormDimensions(item.dimensions || '');
    setFormError(null);
    setUploadProgress(0);
    setIsEditorOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setFormError(null);

    try {
      const url = await galleryService.uploadImage(file, (pct) => {
        setUploadProgress(pct);
      });
      setFormImageUrl(url);
      if (!formAltText.trim() && formTitle.trim()) {
        setFormAltText(`${formTitle.trim()} visual artifact`);
      }
    } catch (err) {
      setFormError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setFormError('Gallery item title is required.');
      return;
    }
    if (!formImageUrl.trim()) {
      setFormError('An image is required. Please upload or provide an image URL.');
      return;
    }

    const effectiveCategory = formCategory === 'CUSTOM' ? (formCustomCategory.trim() || 'General') : formCategory;

    setIsSaving(true);
    setFormError(null);

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload: Partial<GalleryItem> & { title: string; imageUrl: string } = {
      id: editingItem?.id,
      title: formTitle.trim(),
      description: formDescription.trim(),
      imageUrl: formImageUrl.trim(),
      altText: formAltText.trim() || `${formTitle.trim()} artwork`,
      category: effectiveCategory,
      tags: parsedTags,
      relatedBookId: formRelatedBookId || undefined,
      relatedSeriesId: formRelatedSeriesId || undefined,
      relatedCharacterId: formRelatedCharacterId || undefined,
      relatedStoryId: formRelatedStoryId || undefined,
      featured: formFeatured,
      publicationState: formState,
      medium: formMedium.trim() || undefined,
      dimensions: formDimensions.trim() || undefined,
    };

    const res = await galleryService.saveItem(payload, isAuthor, isEditor, {
      name: profile?.displayName || user?.displayName || 'Matthew E. Messmer',
      email: user?.email || undefined,
    });

    setIsSaving(false);

    if (res.success) {
      setIsEditorOpen(false);
      setEditingItem(null);
    } else {
      setFormError(res.error || 'Failed to save gallery item.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    const res = await galleryService.deleteItem(deletingItem.id, isAuthor);
    setIsDeleting(false);

    if (res.success) {
      setDeletingItem(null);
    } else {
      alert(res.error || 'Failed to delete gallery item.');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter & Search logic
  const filteredItems = items.filter((item) => {
    // Category filter
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    // State filter
    if (selectedState !== 'ALL') {
      const state = (item.publicationState || 'PUBLIC').toUpperCase();
      if (state !== selectedState) return false;
    }
    // Series filter
    if (selectedSeries !== 'ALL' && item.relatedSeriesId !== selectedSeries) {
      return false;
    }
    // Book filter
    if (selectedBook !== 'ALL' && item.relatedBookId !== selectedBook) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCat && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const getBadgeStyle = (state?: PublicationState) => {
    switch ((state || 'PUBLIC').toUpperCase()) {
      case 'PUBLIC':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40';
      case 'DRAFT':
        return 'bg-amber-950/60 text-amber-400 border-amber-600/40';
      case 'PRIVATE':
        return 'bg-purple-950/60 text-purple-400 border-purple-600/40';
      case 'TEASER':
        return 'bg-sky-950/60 text-sky-400 border-sky-600/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Gallery & Media Management
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Cloud-managed gallery items, physical craft engravings, book art, and worldbuilding visuals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#171924] rounded-lg text-xs font-cinzel text-[#c5a059] border border-[#2b2e40]">
            {items.length} Gallery Items
          </div>

          {(isAuthor || isEditor) && (
            <button
              onClick={openNewItemModal}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Gallery Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8e887a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery by title, category, tags, or description..."
            className="w-full pl-9 pr-4 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6b665c] focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Publication State */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All States</option>
            <option value="PUBLIC">Public</option>
            <option value="TEASER">Teaser</option>
            <option value="DRAFT">Draft</option>
            <option value="PRIVATE">Private</option>
          </select>

          {/* Related Series Filter */}
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#a8a396] focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Series</option>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Related Book Filter */}
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#a8a396] focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Books</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#8e887a] space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#c5a059]" />
          <p className="text-xs font-cinzel">Loading gallery items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl space-y-3">
          <ImageIcon className="w-8 h-8 text-[#5c584f] mx-auto" />
          <p className="text-sm font-cinzel text-[#f5efeb]">No gallery items match criteria.</p>
          <p className="text-xs text-[#8e887a]">
            {searchQuery || selectedCategory !== 'ALL' || selectedState !== 'ALL'
              ? 'Try clearing filters or search terms.'
              : 'Add your first visual artwork, wood engraving, or book cover.'}
          </p>
          {(isAuthor || isEditor) && (
            <button
              onClick={openNewItemModal}
              className="mt-2 px-4 py-2 bg-[#1b1e2b] hover:bg-[#232738] border border-[#c5a059]/40 text-[#c5a059] text-xs font-cinzel rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Gallery Item</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const state = item.publicationState || 'PUBLIC';
            const relatedBook = books.find((b) => b.id === item.relatedBookId);
            const relatedSer = seriesList.find((s) => s.id === item.relatedSeriesId);
            const relatedChar = characters.find((c) => c.id === item.relatedCharacterId);
            const relatedSt = stories.find((s) => s.id === item.relatedStoryId);

            return (
              <div
                key={item.id}
                className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden hover:border-[#c5a059]/40 transition-colors flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-4/3 bg-[#0a0b10] overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.altText || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold border backdrop-blur-md ${getBadgeStyle(
                          state
                        )}`}
                      >
                        {state}
                      </span>
                      {item.featured && (
                        <span className="px-2 py-0.5 bg-[#c5a059]/90 text-[#0c0d12] rounded text-[10px] font-cinzel font-bold flex items-center gap-1 shadow">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 bg-black/75 text-[#c5a059] border border-[#c5a059]/30 rounded text-[10px] font-cinzel font-semibold backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-cinzel font-bold text-[#f5efeb] line-clamp-1">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-[#8e887a] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata: Dimensions & Medium */}
                    {(item.dimensions || item.medium) && (
                      <div className="text-[10px] text-[#7d776a] font-mono flex items-center gap-2">
                        {item.medium && <span>{item.medium}</span>}
                        {item.dimensions && <span>· {item.dimensions}</span>}
                      </div>
                    )}

                    {/* Related Associations */}
                    <div className="space-y-1 pt-1 text-[11px] text-[#a8a396]">
                      {relatedSer && (
                        <div className="flex items-center gap-1 text-[#c5a059]">
                          <Layers className="w-3 h-3 shrink-0" />
                          <span className="truncate">{relatedSer.name}</span>
                        </div>
                      )}
                      {relatedBook && (
                        <div className="flex items-center gap-1 text-[#ded8cc]">
                          <BookOpen className="w-3 h-3 shrink-0 text-[#c5a059]" />
                          <span className="truncate">{relatedBook.title}</span>
                        </div>
                      )}
                      {relatedChar && (
                        <div className="flex items-center gap-1 text-[#ded8cc]">
                          <Users className="w-3 h-3 shrink-0 text-[#c5a059]" />
                          <span className="truncate">{relatedChar.name}</span>
                        </div>
                      )}
                      {relatedSt && (
                        <div className="flex items-center gap-1 text-[#ded8cc]">
                          <Feather className="w-3 h-3 shrink-0 text-[#c5a059]" />
                          <span className="truncate">{relatedSt.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-[#0d0e16] border-t border-[#1d202e] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingItem(item)}
                      className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] hover:bg-[#1a1c2a] rounded transition-colors"
                      title="Inspect full view"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyUrl(item.imageUrl, item.id)}
                      className="p-1.5 text-[#8e887a] hover:text-[#c5a059] hover:bg-[#1a1c2a] rounded transition-colors"
                      title="Copy Image URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(isAuthor || isEditor) && (
                      <button
                        onClick={() => openEditItemModal(item)}
                        className="px-2.5 py-1 bg-[#171924] hover:bg-[#222536] text-[11px] font-cinzel text-[#c5a059] rounded flex items-center gap-1 border border-[#c5a059]/30 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}

                    {isAuthor && (
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded border border-red-900/40 transition-colors"
                        title="Delete Gallery Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECT / PREVIEW MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="relative aspect-16/9 bg-black">
              <img
                src={viewingItem.imageUrl}
                alt={viewingItem.altText || viewingItem.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setViewingItem(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-[#f5efeb] rounded-full backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold border ${getBadgeStyle(
                    viewingItem.publicationState
                  )}`}
                >
                  {viewingItem.publicationState}
                </span>
                <span className="text-xs font-cinzel text-[#c5a059] font-bold">
                  {viewingItem.category}
                </span>
              </div>

              <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                {viewingItem.title}
              </h3>

              {viewingItem.description && (
                <p className="text-xs text-[#aba597] leading-relaxed">
                  {viewingItem.description}
                </p>
              )}

              <div className="pt-2 border-t border-[#1e2133] grid grid-cols-2 gap-2 text-xs text-[#8e887a]">
                <div>
                  <span className="block text-[10px] font-mono text-[#635f55]">Alt Text:</span>
                  <span className="text-[#ded8cc]">{viewingItem.altText || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-[#635f55]">Tags:</span>
                  <span className="text-[#ded8cc]">
                    {viewingItem.tags?.length ? viewingItem.tags.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0d0e16] border-t border-[#1d202e] flex items-center justify-between">
              <a
                href={viewingItem.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#c5a059] hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open original image asset</span>
              </a>

              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#f5efeb] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                  {editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  {editingItem
                    ? 'Updating existing gallery document without breaking ID or related associations.'
                    : 'Upload to Firebase Storage and register in the Author Gallery.'}
                </p>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* IMAGE UPLOADER / PREVIEW */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#c5a059] block">
                  Gallery Artwork Image *
                </label>

                {formImageUrl ? (
                  <div className="space-y-2">
                    <div className="relative aspect-16/9 max-h-56 bg-black rounded-lg overflow-hidden border border-[#2b2e40] flex items-center justify-center">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => replaceFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-black/80 hover:bg-black text-[#c5a059] border border-[#c5a059]/40 text-xs font-cinzel rounded-md backdrop-blur-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Image</span>
                        </button>
                      </div>
                    </div>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-[#c5a059] bg-[#c5a059]/10'
                        : 'border-[#2b2e40] hover:border-[#c5a059]/50 bg-[#161824]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#c5a059]" />
                        <p className="text-xs font-cinzel text-[#f5efeb]">
                          Uploading to Firebase Storage ({uploadProgress}%)...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-[#c5a059]" />
                        <p className="text-xs font-cinzel font-bold text-[#f5efeb]">
                          Drag & drop an artwork image here, or browse from device
                        </p>
                        <p className="text-[10px] text-[#7d776a]">
                          Supports PNG, JPEG, WebP. High resolution preserved.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Alt Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Artwork Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Royal Crest of Val-Mora (Walnut Relief)"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Accessible Alt Text *
                  </label>
                  <input
                    type="text"
                    value={formAltText}
                    onChange={(e) => setFormAltText(e.target.value)}
                    placeholder="Detailed visual description for screen readers"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Description & Story Significance
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Context, physical materials used, and story relevance..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Category & Publication State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="CUSTOM">+ New Category...</option>
                  </select>
                </div>

                {formCategory === 'CUSTOM' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-cinzel text-[#c5a059] block">
                      New Category Name
                    </label>
                    <input
                      type="text"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g., Maps"
                      className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Publication State *
                  </label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value as PublicationState)}
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    {PUBLICATION_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Medium / Materials
                  </label>
                  <input
                    type="text"
                    value={formMedium}
                    onChange={(e) => setFormMedium(e.target.value)}
                    placeholder="e.g., Laser engraved American Walnut"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Associations (Book, Series, Character, Story) */}
              <div className="p-4 bg-[#141622] border border-[#212435] rounded-xl space-y-3">
                <div className="text-[11px] font-cinzel font-bold text-[#c5a059] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Story & Canon Associations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e887a] block">Related Series</label>
                    <select
                      value={formRelatedSeriesId}
                      onChange={(e) => setFormRelatedSeriesId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171924] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                    >
                      <option value="">None (Independent)</option>
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e887a] block">Related Book</label>
                    <select
                      value={formRelatedBookId}
                      onChange={(e) => setFormRelatedBookId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171924] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                    >
                      <option value="">None</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e887a] block">Related Character</label>
                    <select
                      value={formRelatedCharacterId}
                      onChange={(e) => setFormRelatedCharacterId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171924] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                    >
                      <option value="">None</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8e887a] block">Related Story</label>
                    <select
                      value={formRelatedStoryId}
                      onChange={(e) => setFormRelatedStoryId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#171924] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                    >
                      <option value="">None</option>
                      {stories.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags, Dimensions, and Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="woodwork, crown, laser, artifact"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Physical Dimensions
                  </label>
                  <input
                    type="text"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    placeholder="e.g., 12in × 8in × 0.75in"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-gallery-check"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded bg-[#171924] border-[#2b2e40] text-[#c5a059] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="featured-gallery-check" className="text-xs text-[#ded8cc] cursor-pointer">
                  Feature this item in highlights and public showcase
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-[#232635] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#7d776a]">
                Document ID: <span className="font-mono text-[#c5a059]">{editingItem?.id || '(new)'}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving || uploading}
                  className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || uploading}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Update Gallery Item' : 'Save Gallery Item'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (Mandatory Exact Requirement) */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#11131c] border border-red-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Delete Gallery Item?
              </h3>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to permanently delete:
            </p>

            <div className="p-3 bg-[#181114] border border-red-900/40 rounded-lg text-sm font-cinzel font-bold text-[#f5efeb]">
              "{deletingItem.title}"
            </div>

            <p className="text-[11px] text-red-400 font-semibold">
              This action cannot be undone.
            </p>

            <div className="border-t border-[#232635] pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-950"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
