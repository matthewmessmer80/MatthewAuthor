import React, { useState, useEffect } from 'react';
import { newsService } from '../../services/newsService';
import { NewsArticle, PublicationState } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Tag,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Save,
  Send,
  Loader2,
  FileText,
  User,
} from 'lucide-react';

const CATEGORIES = [
  'Announcement',
  'Writing Progress',
  'Lore & Worldbuilding',
  'Craft & Engraving',
  'Event',
];

const PUBLICATION_STATES: PublicationState[] = ['DRAFT', 'PRIVATE', 'TEASER', 'PUBLIC'];

export const AdminNewsView: React.FC = () => {
  const { isAuthor, isEditor, profile, user } = useAuth();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Preview Modal
  const [viewingArticle, setViewingArticle] = useState<NewsArticle | null>(null);

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Announcement');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formReadTime, setFormReadTime] = useState('4 min read');
  const [formDate, setFormDate] = useState('');
  const [formState, setFormState] = useState<PublicationState>('PUBLIC');
  const [formAuthor, setFormAuthor] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal
  const [deletingArticle, setDeletingArticle] = useState<NewsArticle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsub = newsService.subscribe((list) => {
      setArticles(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openNewArticleModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Announcement');
    setFormCustomCategory('');
    setFormSummary('');
    setFormContent('');
    setFormTags('');
    setFormReadTime('4 min read');
    setFormDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setFormState('PUBLIC');
    setFormAuthor(profile?.displayName || user?.displayName || 'Matthew E. Messmer');
    setFormFeatured(false);
    setFormError(null);
    setIsEditorOpen(true);
  };

  const openEditArticleModal = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormSlug(article.slug || '');
    if (CATEGORIES.includes(article.category)) {
      setFormCategory(article.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('CUSTOM');
      setFormCustomCategory(article.category);
    }
    setFormSummary(article.summary || '');
    setFormContent(Array.isArray(article.content) ? article.content.join('\n\n') : String(article.content || ''));
    setFormTags(article.tags?.join(', ') || '');
    setFormReadTime(article.readTime || '4 min read');
    setFormDate(article.date || '');
    setFormState(article.publicationState || 'PUBLIC');
    setFormAuthor(article.author || profile?.displayName || 'Matthew E. Messmer');
    setFormFeatured(!!article.featured);
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleSave = async (targetState?: PublicationState) => {
    if (!formTitle.trim()) {
      setFormError('Please enter a dispatch title.');
      return;
    }

    const effectiveCategory = formCategory === 'CUSTOM' ? (formCustomCategory.trim() || 'General') : formCategory;
    const finalState = targetState || formState;

    setIsSaving(true);
    setFormError(null);

    const paragraphs = formContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload: Partial<NewsArticle> & { title: string } = {
      id: editingArticle?.id,
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      category: effectiveCategory,
      summary: formSummary.trim(),
      content: paragraphs.length > 0 ? paragraphs : [formSummary.trim() || 'No content provided.'],
      tags: parsedTags,
      readTime: formReadTime.trim() || '4 min read',
      date: formDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      publicationState: finalState,
      featured: formFeatured,
      author: formAuthor.trim() || 'Matthew E. Messmer',
    };

    const res = await newsService.saveArticle(payload, isAuthor, isEditor, {
      name: profile?.displayName || user?.displayName || 'Matthew E. Messmer',
      email: user?.email || undefined,
    });

    setIsSaving(false);

    if (res.success) {
      setIsEditorOpen(false);
      setEditingArticle(null);
    } else {
      setFormError(res.error || 'Failed to save dispatch.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    setIsDeleting(true);

    const res = await newsService.deleteArticle(deletingArticle.id, isAuthor);
    setIsDeleting(false);

    if (res.success) {
      setDeletingArticle(null);
    } else {
      alert(res.error || 'Failed to delete dispatch.');
    }
  };

  // Filter and Search logic
  const filteredArticles = articles.filter((art) => {
    // State filter
    if (selectedState !== 'ALL') {
      const artState = (art.publicationState || 'PUBLIC').toUpperCase();
      if (artState !== selectedState) return false;
    }
    // Category filter
    if (selectedCategory !== 'ALL' && art.category !== selectedCategory) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchCat = art.category.toLowerCase().includes(q);
      const matchTags = (art.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchContent = (art.content || []).some((c) => c.toLowerCase().includes(q)) || (art.summary || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchTags && !matchContent) return false;
    }
    return true;
  });

  // Sorting
  filteredArticles.sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
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
            News & Dispatches Management
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Full authorial control over release announcements, essays, craft updates, and reading logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#171924] rounded-lg text-xs font-cinzel text-[#c5a059] border border-[#2b2e40]">
            {articles.length} Total Dispatches
          </div>

          {(isAuthor || isEditor) && (
            <button
              onClick={openNewArticleModal}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dispatch</span>
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
            placeholder="Search dispatches by title, category, tags, or content..."
            className="w-full pl-9 pr-4 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6b665c] focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Publication State Filter */}
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#a8a396] focus:outline-none focus:border-[#c5a059]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Dispatches List / Management View */}
      {loading ? (
        <div className="p-12 text-center text-[#8e887a] space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#c5a059]" />
          <p className="text-xs font-cinzel">Loading dispatches...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl space-y-3">
          <FileText className="w-8 h-8 text-[#5c584f] mx-auto" />
          <p className="text-sm font-cinzel text-[#f5efeb]">No dispatches found.</p>
          <p className="text-xs text-[#8e887a]">
            {searchQuery || selectedState !== 'ALL' || selectedCategory !== 'ALL'
              ? 'Try adjusting your search query or active filters.'
              : 'Create your first News & Dispatch to share announcements with your readers.'}
          </p>
          {(isAuthor || isEditor) && (
            <button
              onClick={openNewArticleModal}
              className="mt-2 px-4 py-2 bg-[#1b1e2b] hover:bg-[#232738] border border-[#c5a059]/40 text-[#c5a059] text-xs font-cinzel rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Dispatch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const state = article.publicationState || 'PUBLIC';
            return (
              <div
                key={article.id}
                className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Publication State Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold border ${getBadgeStyle(
                        state
                      )}`}
                    >
                      {state}
                    </span>

                    {/* Category */}
                    <span className="px-2 py-0.5 bg-[#1a1d2b] text-[#c5a059] border border-[#2d3147] rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold">
                      {article.category}
                    </span>

                    {/* Dates */}
                    <span className="text-[11px] text-[#7d776a] font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#c5a059]" />
                      Published: {article.date}
                    </span>

                    {article.updatedAt && (
                      <span className="text-[10px] text-[#635f55] font-mono">
                        · Updated: {new Date(article.updatedAt).toLocaleDateString()}
                      </span>
                    )}

                    {/* Author */}
                    <span className="text-[11px] text-[#8e887a] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#7d776a]" />
                      {article.author || 'Author'}
                    </span>
                  </div>

                  <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                    {article.title}
                  </h3>

                  <p className="text-xs text-[#8e887a] line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Tag className="w-3 h-3 text-[#c5a059]" />
                      {article.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] text-[#a39e92] bg-[#161824] px-1.5 py-0.5 rounded border border-[#212435]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => setViewingArticle(article)}
                    className="px-3 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] hover:text-[#f5efeb] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-[#232635]"
                    title="Read / Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {(isAuthor || isEditor) && (
                    <button
                      onClick={() => openEditArticleModal(article)}
                      className="px-3 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-[#c5a059]/30"
                      title="Edit Dispatch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {isAuthor && (
                    <button
                      onClick={() => setDeletingArticle(article)}
                      className="px-3 py-1.5 bg-[#1a1215] hover:bg-[#2d171e] text-xs font-cinzel text-red-400 hover:text-red-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-red-900/40"
                      title="Delete Dispatch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READ / PREVIEW MODAL */}
      {viewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold border ${getBadgeStyle(
                      viewingArticle.publicationState
                    )}`}
                  >
                    {viewingArticle.publicationState || 'PUBLIC'}
                  </span>
                  <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                    {viewingArticle.category} · {viewingArticle.date}
                  </span>
                </div>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                  {viewingArticle.title}
                </h3>
                <p className="text-xs text-[#a8a396] mt-0.5">By {viewingArticle.author || 'Author'}</p>
              </div>

              <button
                onClick={() => setViewingArticle(null)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm text-[#d4cfc2] leading-relaxed">
              {viewingArticle.summary && (
                <div className="p-3 bg-[#161826] border-l-2 border-[#c5a059] rounded text-xs italic text-[#e0dacd]">
                  {viewingArticle.summary}
                </div>
              )}
              {viewingArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="border-t border-[#232635] pt-4 flex items-center justify-between">
              <span className="text-[11px] text-[#7d776a] font-mono">
                {viewingArticle.readTime}
              </span>
              <button
                onClick={() => setViewingArticle(null)}
                className="px-4 py-2 bg-[#171924] hover:bg-[#212433] text-xs font-cinzel text-[#f5efeb] rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                  {editingArticle ? 'Edit News & Dispatch' : 'Add New News & Dispatch'}
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  {editingArticle
                    ? 'Updating existing Firestore document without duplicating document ID.'
                    : 'Create and publish or save as draft.'}
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
              {/* Title & Slug */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#c5a059] block">
                  Dispatch Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!editingArticle) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="e.g., Autumn Update: Weaving the Final Chapters"
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Slug / URL Identifier
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="autumn-update-final-chapters"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#ded8cc] font-mono focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Author Attribution
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Matthew E. Messmer"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#ded8cc] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
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
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Category...</option>
                  </select>
                </div>

                {formCategory === 'CUSTOM' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-cinzel text-[#c5a059] block">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g., Tour Notes"
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
                    Published / Scheduled Date
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g., Oct 14, 2025"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Short Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="A concise overview visible in cards and search results..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Full Content */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#c5a059] block">
                  Article Body (Separate paragraphs with double enter) *
                </label>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write the full content of the dispatch..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] font-sans leading-relaxed focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Tags & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="craft, release, engraving, news"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                    placeholder="e.g., 5 min read"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-news-check"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="rounded bg-[#171924] border-[#2b2e40] text-[#c5a059] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="featured-news-check" className="text-xs text-[#ded8cc] cursor-pointer">
                  Feature this dispatch at the top of the news section
                </label>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="border-t border-[#232635] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#7d776a]">
                Document ID: <span className="font-mono text-[#c5a059]">{editingArticle?.id || '(new)'}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#251e13] hover:bg-[#342b1a] border border-[#c5a059]/40 text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{formState === 'PUBLIC' ? 'Publish Dispatch' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (Mandatory Exact Requirement) */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#11131c] border border-red-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Delete News & Dispatch?
              </h3>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to permanently delete:
            </p>

            <div className="p-3 bg-[#181114] border border-red-900/40 rounded-lg text-sm font-cinzel font-bold text-[#f5efeb]">
              "{deletingArticle.title}"
            </div>

            <p className="text-[11px] text-red-400 font-semibold">
              This action cannot be undone.
            </p>

            <div className="border-t border-[#232635] pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingArticle(null)}
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
