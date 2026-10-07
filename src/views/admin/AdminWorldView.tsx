import React, { useState, useEffect, useRef } from 'react';
import { characterLoreService, DEFAULT_LORE_CATEGORIES } from '../../services/characterLoreService';
import { bookService, ManagedBook, ManagedSeries } from '../../services/bookService';
import { Character, LoreEntry, PublicationState } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Layers,
  BookOpen,
  Calendar,
  Tag,
  AlertTriangle,
  X,
  Upload,
  Loader2,
  Check,
  Eye,
  FileText,
  MapPin,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';

const PUBLICATION_STATES: PublicationState[] = ['DRAFT', 'PRIVATE', 'TEASER', 'PUBLIC'];

export const AdminWorldView: React.FC = () => {
  const { isAuthor, isEditor, profile, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'characters' | 'lore'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loreList, setLoreList] = useState<LoreEntry[]>([]);
  const [loreCategories, setLoreCategories] = useState<string[]>(DEFAULT_LORE_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Books and Series data
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>([]);
  const [books, setBooks] = useState<ManagedBook[]>([]);

  // Search & Filters
  const [charSearch, setCharSearch] = useState('');
  const [charSeriesFilter, setCharSeriesFilter] = useState('ALL');
  const [charStateFilter, setCharStateFilter] = useState('ALL');

  const [loreSearch, setLoreSearch] = useState('');
  const [loreCategoryFilter, setLoreCategoryFilter] = useState('ALL');
  const [loreSeriesFilter, setLoreSeriesFilter] = useState('ALL');
  const [loreStateFilter, setLoreStateFilter] = useState('ALL');

  // Preview Modal
  const [previewChar, setPreviewChar] = useState<Character | null>(null);
  const [previewLore, setPreviewLore] = useState<LoreEntry | null>(null);

  // Character Editor State
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [charName, setCharName] = useState('');
  const [charTitle, setCharTitle] = useState('');
  const [charShortDesc, setCharShortDesc] = useState('');
  const [charBiography, setCharBiography] = useState('');
  const [charAppearance, setCharAppearance] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charAbilities, setCharAbilities] = useState('');
  const [charAffiliations, setCharAffiliations] = useState('');
  const [charImageUrl, setCharImageUrl] = useState('');
  const [charImageAlt, setCharImageAlt] = useState('');
  const [charSeriesId, setCharSeriesId] = useState('');
  const [charBookIds, setCharBookIds] = useState<string[]>([]);
  const [charTags, setCharTags] = useState('');
  const [charState, setCharState] = useState<PublicationState>('PUBLIC');
  const [charSlug, setCharSlug] = useState('');
  const [charError, setCharError] = useState<string | null>(null);
  const [isCharSaving, setIsCharSaving] = useState(false);
  const [isCharUploading, setIsCharUploading] = useState(false);
  const charFileInputRef = useRef<HTMLInputElement>(null);

  // Lore Editor State
  const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);
  const [editingLore, setEditingLore] = useState<LoreEntry | null>(null);
  const [loreTitle, setLoreTitle] = useState('');
  const [loreCategory, setLoreCategory] = useState('Locations');
  const [loreCustomCategory, setLoreCustomCategory] = useState('');
  const [loreDesc, setLoreDesc] = useState('');
  const [loreContent, setLoreContent] = useState('');
  const [loreSeriesId, setLoreSeriesId] = useState('');
  const [loreBookIds, setLoreBookIds] = useState<string[]>([]);
  const [loreCharacterIds, setLoreCharacterIds] = useState<string[]>([]);
  const [loreTags, setLoreTags] = useState('');
  const [loreImageUrl, setLoreImageUrl] = useState('');
  const [loreState, setLoreState] = useState<PublicationState>('PUBLIC');
  const [loreSlug, setLoreSlug] = useState('');
  const [loreError, setLoreError] = useState<string | null>(null);
  const [isLoreSaving, setIsLoreSaving] = useState(false);
  const [isLoreUploading, setIsLoreUploading] = useState(false);
  const loreFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deletingChar, setDeletingChar] = useState<Character | null>(null);
  const [deletingLore, setDeletingLore] = useState<LoreEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubChars = characterLoreService.subscribeCharacters((list) => {
      setCharacters(list);
      setLoading(false);
    });
    const unsubLore = characterLoreService.subscribeLore((list) => {
      setLoreList(list);
      setLoreCategories(characterLoreService.getLoreCategories());
    });

    Promise.all([bookService.getAllBooks(), bookService.getAllSeries()]).then(([b, s]) => {
      setBooks(b);
      setSeriesList(s);
    });

    return () => {
      unsubChars();
      unsubLore();
    };
  }, []);

  // Character Handlers
  const openNewCharacter = () => {
    setEditingChar(null);
    setCharName('');
    setCharTitle('');
    setCharShortDesc('');
    setCharBiography('');
    setCharAppearance('');
    setCharPersonality('');
    setCharAbilities('');
    setCharAffiliations('');
    setCharImageUrl('');
    setCharImageAlt('');
    setCharSeriesId('');
    setCharBookIds([]);
    setCharTags('');
    setCharState('PUBLIC');
    setCharSlug('');
    setCharError(null);
    setIsCharModalOpen(true);
  };

  const openEditCharacter = (char: Character) => {
    setEditingChar(char);
    setCharName(char.name);
    setCharTitle(char.title || char.role || '');
    setCharShortDesc(char.shortDescription || '');
    setCharBiography(char.biography || '');
    setCharAppearance(char.appearance || '');
    setCharPersonality(char.personality || '');
    setCharAbilities(char.abilities || '');
    setCharAffiliations(char.affiliations || '');
    setCharImageUrl(char.imageUrl || '');
    setCharImageAlt(char.imageAltText || '');
    setCharSeriesId(char.seriesId || '');
    setCharBookIds(char.bookIds || []);
    setCharTags(char.tags?.join(', ') || '');
    setCharState(char.publicationState || 'PUBLIC');
    setCharSlug(char.slug || '');
    setCharError(null);
    setIsCharModalOpen(true);
  };

  const handleCharImageUpload = async (file: File) => {
    setIsCharUploading(true);
    setCharError(null);
    try {
      const url = await characterLoreService.uploadImage(file);
      setCharImageUrl(url);
      if (!charImageAlt && charName) {
        setCharImageAlt(`Portrait of ${charName}`);
      }
    } catch {
      setCharError('Failed to upload character image.');
    } finally {
      setIsCharUploading(false);
    }
  };

  const handleSaveCharacter = async () => {
    if (!charName.trim()) {
      setCharError('Character name is required.');
      return;
    }
    if (!charShortDesc.trim()) {
      setCharError('A short description is required.');
      return;
    }

    setIsCharSaving(true);
    setCharError(null);

    const parsedTags = charTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload: Partial<Character> & { name: string } = {
      id: editingChar?.id,
      name: charName.trim(),
      title: charTitle.trim(),
      role: charTitle.trim(),
      shortDescription: charShortDesc.trim(),
      biography: charBiography.trim(),
      appearance: charAppearance.trim(),
      personality: charPersonality.trim(),
      abilities: charAbilities.trim(),
      affiliations: charAffiliations.trim(),
      imageUrl: charImageUrl.trim() || undefined,
      imageAltText: charImageAlt.trim() || undefined,
      seriesId: charSeriesId || undefined,
      bookIds: charBookIds,
      tags: parsedTags,
      publicationState: charState,
      slug: charSlug.trim() || undefined,
    };

    const res = await characterLoreService.saveCharacter(payload, isAuthor, isEditor, {
      name: profile?.displayName || user?.displayName || 'Matthew E. Messmer',
      email: user?.email || undefined,
    });

    setIsCharSaving(false);

    if (res.success) {
      setIsCharModalOpen(false);
      setEditingChar(null);
    } else {
      setCharError(res.error || 'Failed to save character.');
    }
  };

  const handleConfirmDeleteCharacter = async () => {
    if (!deletingChar) return;
    setIsDeleting(true);

    const res = await characterLoreService.deleteCharacter(deletingChar.id, isAuthor);
    setIsDeleting(false);

    if (res.success) {
      setDeletingChar(null);
    } else {
      alert(res.error || 'Failed to delete character.');
    }
  };

  // Lore Handlers
  const openNewLore = () => {
    setEditingLore(null);
    setLoreTitle('');
    setLoreCategory('Locations');
    setLoreCustomCategory('');
    setLoreDesc('');
    setLoreContent('');
    setLoreSeriesId('');
    setLoreBookIds([]);
    setLoreCharacterIds([]);
    setLoreTags('');
    setLoreImageUrl('');
    setLoreState('PUBLIC');
    setLoreSlug('');
    setLoreError(null);
    setIsLoreModalOpen(true);
  };

  const openEditLore = (lore: LoreEntry) => {
    setEditingLore(lore);
    setLoreTitle(lore.title);
    if (loreCategories.includes(lore.category)) {
      setLoreCategory(lore.category);
      setLoreCustomCategory('');
    } else {
      setLoreCategory('CUSTOM');
      setLoreCustomCategory(lore.category);
    }
    setLoreDesc(lore.description || '');
    setLoreContent(typeof lore.content === 'string' ? lore.content : Array.isArray(lore.content) ? lore.content.join('\n\n') : '');
    setLoreSeriesId(lore.relatedSeriesId || '');
    setLoreBookIds(lore.relatedBookIds || []);
    setLoreCharacterIds(lore.relatedCharacterIds || []);
    setLoreTags(lore.tags?.join(', ') || '');
    setLoreImageUrl(lore.imageUrl || '');
    setLoreState(lore.publicationState || 'PUBLIC');
    setLoreSlug(lore.slug || '');
    setLoreError(null);
    setIsLoreModalOpen(true);
  };

  const handleLoreImageUpload = async (file: File) => {
    setIsLoreUploading(true);
    setLoreError(null);
    try {
      const url = await characterLoreService.uploadImage(file);
      setLoreImageUrl(url);
    } catch {
      setLoreError('Failed to upload lore image.');
    } finally {
      setIsLoreUploading(false);
    }
  };

  const handleSaveLore = async () => {
    if (!loreTitle.trim()) {
      setLoreError('Lore title is required.');
      return;
    }

    const effectiveCategory = loreCategory === 'CUSTOM' ? (loreCustomCategory.trim() || 'Other') : loreCategory;

    setIsLoreSaving(true);
    setLoreError(null);

    const parsedTags = loreTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload: Partial<LoreEntry> & { title: string } = {
      id: editingLore?.id,
      title: loreTitle.trim(),
      category: effectiveCategory,
      description: loreDesc.trim(),
      content: loreContent.trim(),
      relatedSeriesId: loreSeriesId || undefined,
      relatedBookIds: loreBookIds,
      relatedCharacterIds: loreCharacterIds,
      tags: parsedTags,
      imageUrl: loreImageUrl.trim() || undefined,
      publicationState: loreState,
      slug: loreSlug.trim() || undefined,
    };

    const res = await characterLoreService.saveLore(payload, isAuthor, isEditor, {
      name: profile?.displayName || user?.displayName || 'Matthew E. Messmer',
      email: user?.email || undefined,
    });

    setIsLoreSaving(false);

    if (res.success) {
      setIsLoreModalOpen(false);
      setEditingLore(null);
    } else {
      setLoreError(res.error || 'Failed to save lore entry.');
    }
  };

  const handleConfirmDeleteLore = async () => {
    if (!deletingLore) return;
    setIsDeleting(true);

    const res = await characterLoreService.deleteLore(deletingLore.id, isAuthor);
    setIsDeleting(false);

    if (res.success) {
      setDeletingLore(null);
    } else {
      alert(res.error || 'Failed to delete lore entry.');
    }
  };

  // Filtered lists
  const filteredCharacters = characters.filter((c) => {
    if (charSeriesFilter !== 'ALL' && c.seriesId !== charSeriesFilter) return false;
    if (charStateFilter !== 'ALL' && (c.publicationState || 'PUBLIC') !== charStateFilter) return false;
    if (charSearch.trim()) {
      const q = charSearch.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchRole = (c.role || c.title || '').toLowerCase().includes(q);
      const matchTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchDesc = (c.shortDescription || '').toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchTags && !matchDesc) return false;
    }
    return true;
  });

  const filteredLore = loreList.filter((l) => {
    if (loreCategoryFilter !== 'ALL' && l.category !== loreCategoryFilter) return false;
    if (loreSeriesFilter !== 'ALL' && l.relatedSeriesId !== loreSeriesFilter) return false;
    if (loreStateFilter !== 'ALL' && (l.publicationState || 'PUBLIC') !== loreStateFilter) return false;
    if (loreSearch.trim()) {
      const q = loreSearch.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchCat = l.category.toLowerCase().includes(q);
      const matchDesc = (l.description || '').toLowerCase().includes(q);
      const matchTags = (l.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchContent = typeof l.content === 'string' ? l.content.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchCat && !matchDesc && !matchTags && !matchContent) return false;
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
            Characters & Worldbuilding Lore
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Canon database for the Val-Mora Archipelago, The Abyssal Current universe, and dramatis personae.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isAuthor || isEditor) && (
            <>
              <button
                onClick={openNewCharacter}
                className="px-3.5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Character</span>
              </button>

              <button
                onClick={openNewLore}
                className="px-3.5 py-2 bg-[#1b1e2b] hover:bg-[#232738] border border-[#c5a059]/40 text-[#c5a059] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Lore</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Section Tabs: Characters vs Lore */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1 p-1 bg-[#10121a] border border-[#232635] rounded-xl">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-lg text-xs font-cinzel tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'characters'
                ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow'
                : 'text-[#8e887a] hover:text-[#f5efeb]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Characters ({characters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lore')}
            className={`px-4 py-2 rounded-lg text-xs font-cinzel tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'lore'
                ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow'
                : 'text-[#8e887a] hover:text-[#f5efeb]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>World Lore ({loreList.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHARACTERS TAB CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8e887a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                placeholder="Search characters by name, role, tags, or description..."
                className="w-full pl-9 pr-4 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6b665c] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={charSeriesFilter}
                onChange={(e) => setCharSeriesFilter(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
              >
                <option value="ALL">All Series</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={charStateFilter}
                onChange={(e) => setCharStateFilter(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
              >
                <option value="ALL">All States</option>
                <option value="PUBLIC">Public</option>
                <option value="TEASER">Teaser</option>
                <option value="DRAFT">Draft</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          {/* Characters Cards */}
          {loading ? (
            <div className="p-12 text-center text-[#8e887a] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#c5a059]" />
              <p className="text-xs font-cinzel">Loading characters...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl space-y-3">
              <Users className="w-8 h-8 text-[#5c584f] mx-auto" />
              <p className="text-sm font-cinzel text-[#f5efeb]">No characters found.</p>
              <p className="text-xs text-[#8e887a]">
                {charSearch || charSeriesFilter !== 'ALL' || charStateFilter !== 'ALL'
                  ? 'Try clearing active filters.'
                  : 'Add canon characters and historical figures.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCharacters.map((char) => {
                const charSer = seriesList.find((s) => s.id === char.seriesId);
                const state = char.publicationState || 'PUBLIC';

                return (
                  <div
                    key={char.id}
                    className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] px-2 py-0.5 bg-[#c5a059]/10 rounded border border-[#c5a059]/20 truncate">
                          {charSer?.name || char.seriesId || 'Standalone'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold border ${getBadgeStyle(
                            state
                          )}`}
                        >
                          {state}
                        </span>
                      </div>

                      {char.imageUrl && (
                        <div className="w-full aspect-16/9 rounded-lg overflow-hidden bg-black/40 border border-[#242738]">
                          <img
                            src={char.imageUrl}
                            alt={char.imageAltText || char.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                          {char.name}
                        </h3>
                        {(char.title || char.role) && (
                          <div className="text-xs text-[#c5a059] font-medium mt-0.5">
                            {char.title || char.role}
                          </div>
                        )}
                        {char.affiliations && (
                          <div className="text-[11px] text-[#7d776a]">{char.affiliations}</div>
                        )}
                      </div>

                      <p className="text-xs text-[#8e887a] leading-relaxed line-clamp-3">
                        {char.shortDescription}
                      </p>

                      {char.tags && char.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {char.tags.map((t) => (
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

                    <div className="pt-3 border-t border-[#1e202e] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#7d776a] font-mono">
                        {char.updatedAt ? new Date(char.updatedAt).toLocaleDateString() : 'Updated'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewChar(char)}
                          className="px-2 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded border border-[#232635]"
                        >
                          <Eye className="w-3 h-3" />
                        </button>

                        {(isAuthor || isEditor) && (
                          <button
                            onClick={() => openEditCharacter(char)}
                            className="px-2.5 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded flex items-center gap-1 border border-[#c5a059]/30"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        {isAuthor && (
                          <button
                            onClick={() => setDeletingChar(char)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded border border-red-900/40"
                            title="Delete Character"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LORE TAB CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'lore' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8e887a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={loreSearch}
                onChange={(e) => setLoreSearch(e.target.value)}
                placeholder="Search lore entries by title, category, tags, or content..."
                className="w-full pl-9 pr-4 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6b665c] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={loreCategoryFilter}
                onChange={(e) => setLoreCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
              >
                <option value="ALL">All Categories</option>
                {loreCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={loreSeriesFilter}
                onChange={(e) => setLoreSeriesFilter(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
              >
                <option value="ALL">All Series</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={loreStateFilter}
                onChange={(e) => setLoreStateFilter(e.target.value)}
                className="px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#c5a059] font-cinzel focus:outline-none focus:border-[#c5a059]"
              >
                <option value="ALL">All States</option>
                <option value="PUBLIC">Public</option>
                <option value="TEASER">Teaser</option>
                <option value="DRAFT">Draft</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          {/* Lore Grid */}
          {loading ? (
            <div className="p-12 text-center text-[#8e887a] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#c5a059]" />
              <p className="text-xs font-cinzel">Loading world lore...</p>
            </div>
          ) : filteredLore.length === 0 ? (
            <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl space-y-3">
              <Compass className="w-8 h-8 text-[#5c584f] mx-auto" />
              <p className="text-sm font-cinzel text-[#f5efeb]">No lore entries found.</p>
              <p className="text-xs text-[#8e887a]">
                {loreSearch || loreCategoryFilter !== 'ALL' || loreSeriesFilter !== 'ALL'
                  ? 'Try clearing active filters.'
                  : 'Document your world’s magic systems, geography, technology, and ancient history.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredLore.map((lore) => {
                const loreSer = seriesList.find((s) => s.id === lore.relatedSeriesId);
                const state = lore.publicationState || 'PUBLIC';

                return (
                  <div
                    key={lore.id}
                    className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 rounded text-[10px] font-cinzel uppercase font-semibold">
                            {lore.category}
                          </span>
                          {loreSer && (
                            <span className="text-[10px] font-cinzel text-[#8e887a]">
                              · {loreSer.name}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold border ${getBadgeStyle(
                            state
                          )}`}
                        >
                          {state}
                        </span>
                      </div>

                      <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                        {lore.title}
                      </h3>

                      <p className="text-xs text-[#8e887a] leading-relaxed line-clamp-3">
                        {lore.description || (typeof lore.content === 'string' ? lore.content : '')}
                      </p>

                      {lore.tags && lore.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {lore.tags.map((t) => (
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

                    <div className="pt-3 border-t border-[#1e202e] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#7d776a] font-mono">
                        {lore.updatedAt ? new Date(lore.updatedAt).toLocaleDateString() : 'Updated'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewLore(lore)}
                          className="px-2 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded border border-[#232635]"
                        >
                          <Eye className="w-3 h-3" />
                        </button>

                        {(isAuthor || isEditor) && (
                          <button
                            onClick={() => openEditLore(lore)}
                            className="px-2.5 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded flex items-center gap-1 border border-[#c5a059]/30"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        {isAuthor && (
                          <button
                            onClick={() => setDeletingLore(lore)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded border border-red-900/40"
                            title="Delete Lore Entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHARACTER MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isCharModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                  {editingChar ? 'Edit Character' : 'Add New Canon Character'}
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  {editingChar
                    ? 'Updating existing document without creating duplicates.'
                    : 'Add a new dramatis persona to your canonical database.'}
                </p>
              </div>

              <button
                onClick={() => setIsCharModalOpen(false)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {charError && (
              <div className="mt-3 p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{charError}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => {
                      setCharName(e.target.value);
                      if (!editingChar) {
                        setCharSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g., Lysander Vane"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Role / Honorific Title
                  </label>
                  <input
                    type="text"
                    value={charTitle}
                    onChange={(e) => setCharTitle(e.target.value)}
                    placeholder="e.g., Crown Sentinel / Threadbearer"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Series & Publication State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Series Association
                  </label>
                  <select
                    value={charSeriesId}
                    onChange={(e) => setCharSeriesId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="">None / Standalone</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Publication State *
                  </label>
                  <select
                    value={charState}
                    onChange={(e) => setCharState(e.target.value as PublicationState)}
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
                    Slug / URL identifier
                  </label>
                  <input
                    type="text"
                    value={charSlug}
                    onChange={(e) => setCharSlug(e.target.value)}
                    placeholder="lysander-vane"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#ded8cc] font-mono focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Character Portrait Image (Upload or URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={charImageUrl}
                    onChange={(e) => setCharImageUrl(e.target.value)}
                    placeholder="https://... or upload below"
                    className="flex-1 px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                  <input
                    ref={charFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCharImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => charFileInputRef.current?.click()}
                    disabled={isCharUploading}
                    className="px-3 py-2 bg-[#202334] hover:bg-[#2b3047] text-[#c5a059] border border-[#c5a059]/30 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCharUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#c5a059] block">
                  Short Description (Dramatis Personae entry) *
                </label>
                <textarea
                  rows={2}
                  value={charShortDesc}
                  onChange={(e) => setCharShortDesc(e.target.value)}
                  placeholder="Concise overview of who they are and their core struggle..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Biography */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Extended Biography & Backstory
                </label>
                <textarea
                  rows={4}
                  value={charBiography}
                  onChange={(e) => setCharBiography(e.target.value)}
                  placeholder="Complete history, formative events, and canon developments..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Appearance & Personality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Physical Appearance
                  </label>
                  <textarea
                    rows={2}
                    value={charAppearance}
                    onChange={(e) => setCharAppearance(e.target.value)}
                    placeholder="Attire, eye color, scars, posture, distinctive traits..."
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Personality & Moral Temperament
                  </label>
                  <textarea
                    rows={2}
                    value={charPersonality}
                    onChange={(e) => setCharPersonality(e.target.value)}
                    placeholder="Temperament, internal conflicts, loyalties, vices..."
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Abilities & Affiliations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Abilities & Metaphysical Gifts
                  </label>
                  <input
                    type="text"
                    value={charAbilities}
                    onChange={(e) => setCharAbilities(e.target.value)}
                    placeholder="e.g., Thread attunement, temporal resonance"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#8e887a] block">
                    Affiliations & Guilds
                  </label>
                  <input
                    type="text"
                    value={charAffiliations}
                    onChange={(e) => setCharAffiliations(e.target.value)}
                    placeholder="e.g., High Spire of Val-Mora, Crown Guard"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Book Associations */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Associated Books
                </label>
                <div className="p-3 bg-[#171924] border border-[#2b2e40] rounded-lg flex flex-wrap gap-2">
                  {books.map((b) => {
                    const isSelected = charBookIds.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          if (isSelected) {
                            setCharBookIds(charBookIds.filter((id) => id !== b.id));
                          } else {
                            setCharBookIds([...charBookIds, b.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                            : 'bg-[#10121a] text-[#8e887a] border border-[#242738] hover:text-[#f5efeb]'
                        }`}
                      >
                        {b.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={charTags}
                  onChange={(e) => setCharTags(e.target.value)}
                  placeholder="Protagonist, Val-Mora, Sentinel"
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-[#232635] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#7d776a]">
                Document ID: <span className="font-mono text-[#c5a059]">{editingChar?.id || '(new)'}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCharModalOpen(false)}
                  disabled={isCharSaving}
                  className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCharacter}
                  disabled={isCharSaving}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                >
                  {isCharSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingChar ? 'Update Character' : 'Save Character'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LORE MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isLoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                  {editingLore ? 'Edit Worldbuilding Lore' : 'Add New Lore Entry'}
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  {editingLore
                    ? 'Updating existing lore document without duplicating ID.'
                    : 'Add a new location, culture, historical event, or technology.'}
                </p>
              </div>

              <button
                onClick={() => setIsLoreModalOpen(false)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loreError && (
              <div className="mt-3 p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loreError}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Lore Entry Title *
                  </label>
                  <input
                    type="text"
                    value={loreTitle}
                    onChange={(e) => {
                      setLoreTitle(e.target.value);
                      if (!editingLore) {
                        setLoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g., Archipelago of Spires"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Taxonomy Category *
                  </label>
                  <select
                    value={loreCategory}
                    onChange={(e) => setLoreCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    {loreCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="CUSTOM">+ New Category...</option>
                  </select>
                </div>
              </div>

              {loreCategory === 'CUSTOM' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    value={loreCustomCategory}
                    onChange={(e) => setLoreCustomCategory(e.target.value)}
                    placeholder="e.g., Flora & Fauna"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              )}

              {/* Series & Publication State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Series Association
                  </label>
                  <select
                    value={loreSeriesId}
                    onChange={(e) => setLoreSeriesId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="">Global / Independent</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-cinzel text-[#c5a059] block">
                    Publication State *
                  </label>
                  <select
                    value={loreState}
                    onChange={(e) => setLoreState(e.target.value as PublicationState)}
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
                    Slug / URL identifier
                  </label>
                  <input
                    type="text"
                    value={loreSlug}
                    onChange={(e) => setLoreSlug(e.target.value)}
                    placeholder="archipelago-of-spires"
                    className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#ded8cc] font-mono focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Short Summary Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Short Summary
                </label>
                <textarea
                  rows={2}
                  value={loreDesc}
                  onChange={(e) => setLoreDesc(e.target.value)}
                  placeholder="One or two sentences summarizing this world feature..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Full Content */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#c5a059] block">
                  Full Lore Content *
                </label>
                <textarea
                  rows={6}
                  value={loreContent}
                  onChange={(e) => setLoreContent(e.target.value)}
                  placeholder="Detailed canon encyclopedia entry, rules, cultural practices, geography..."
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] font-sans leading-relaxed focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Illustrative Reference Image (Upload or URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loreImageUrl}
                    onChange={(e) => setLoreImageUrl(e.target.value)}
                    placeholder="https://... or upload below"
                    className="flex-1 px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                  <input
                    ref={loreFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLoreImageUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => loreFileInputRef.current?.click()}
                    disabled={isLoreUploading}
                    className="px-3 py-2 bg-[#202334] hover:bg-[#2b3047] text-[#c5a059] border border-[#c5a059]/30 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {isLoreUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[11px] font-cinzel text-[#8e887a] block">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={loreTags}
                  onChange={(e) => setLoreTags(e.target.value)}
                  placeholder="Geography, Spire, Val-Mora"
                  className="w-full px-3 py-2 bg-[#171924] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-[#232635] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#7d776a]">
                Document ID: <span className="font-mono text-[#c5a059]">{editingLore?.id || '(new)'}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsLoreModalOpen(false)}
                  disabled={isLoreSaving}
                  className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveLore}
                  disabled={isLoreSaving}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
                >
                  {isLoreSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingLore ? 'Update Lore Entry' : 'Save Lore Entry'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODALS */}
      {/* ========================================================================= */}
      {previewChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-start justify-between">
              <div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold border ${getBadgeStyle(
                    previewChar.publicationState
                  )}`}
                >
                  {previewChar.publicationState || 'PUBLIC'}
                </span>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                  {previewChar.name}
                </h3>
                <div className="text-xs text-[#c5a059]">{previewChar.title || previewChar.role}</div>
              </div>
              <button
                onClick={() => setPreviewChar(null)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs text-[#ded8cc] leading-relaxed">
              {previewChar.imageUrl && (
                <img
                  src={previewChar.imageUrl}
                  alt={previewChar.name}
                  className="w-full aspect-16/9 object-cover rounded-lg border border-[#242738]"
                />
              )}
              <div className="p-3 bg-[#161826] border-l-2 border-[#c5a059] rounded text-xs text-[#e0dacd]">
                {previewChar.shortDescription}
              </div>
              {previewChar.biography && (
                <div>
                  <h4 className="font-cinzel font-bold text-[#c5a059] mb-1">Biography</h4>
                  <p>{previewChar.biography}</p>
                </div>
              )}
              {previewChar.appearance && (
                <div>
                  <h4 className="font-cinzel font-bold text-[#c5a059] mb-1">Appearance</h4>
                  <p>{previewChar.appearance}</p>
                </div>
              )}
              {previewChar.personality && (
                <div>
                  <h4 className="font-cinzel font-bold text-[#c5a059] mb-1">Personality</h4>
                  <p>{previewChar.personality}</p>
                </div>
              )}
            </div>

            <div className="border-t border-[#232635] pt-4 flex justify-end">
              <button
                onClick={() => setPreviewChar(null)}
                className="px-4 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#f5efeb] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {previewLore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold border ${getBadgeStyle(
                      previewLore.publicationState
                    )}`}
                  >
                    {previewLore.publicationState || 'PUBLIC'}
                  </span>
                  <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                    {previewLore.category}
                  </span>
                </div>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                  {previewLore.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewLore(null)}
                className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs text-[#ded8cc] leading-relaxed">
              {previewLore.imageUrl && (
                <img
                  src={previewLore.imageUrl}
                  alt={previewLore.title}
                  className="w-full aspect-16/9 object-cover rounded-lg border border-[#242738]"
                />
              )}
              {previewLore.description && (
                <div className="p-3 bg-[#161826] border-l-2 border-[#c5a059] rounded text-xs italic text-[#e0dacd]">
                  {previewLore.description}
                </div>
              )}
              <div className="whitespace-pre-line leading-relaxed">
                {typeof previewLore.content === 'string'
                  ? previewLore.content
                  : Array.isArray(previewLore.content)
                  ? previewLore.content.join('\n\n')
                  : ''}
              </div>
            </div>

            <div className="border-t border-[#232635] pt-4 flex justify-end">
              <button
                onClick={() => setPreviewLore(null)}
                className="px-4 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#f5efeb] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG (Mandatory Exact Requirement) */}
      {/* ========================================================================= */}
      {deletingChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#11131c] border border-red-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Delete Character?
              </h3>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to permanently delete:
            </p>

            <div className="p-3 bg-[#181114] border border-red-900/40 rounded-lg text-sm font-cinzel font-bold text-[#f5efeb]">
              "{deletingChar.name}"
            </div>

            <p className="text-[11px] text-red-400 font-semibold">
              This action cannot be undone.
            </p>

            <div className="border-t border-[#232635] pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingChar(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteCharacter}
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

      {deletingLore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#11131c] border border-red-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Delete Lore Entry?
              </h3>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to permanently delete:
            </p>

            <div className="p-3 bg-[#181114] border border-red-900/40 rounded-lg text-sm font-cinzel font-bold text-[#f5efeb]">
              "{deletingLore.title}"
            </div>

            <p className="text-[11px] text-red-400 font-semibold">
              This action cannot be undone.
            </p>

            <div className="border-t border-[#232635] pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingLore(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteLore}
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
