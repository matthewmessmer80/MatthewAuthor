import React, { useState, useEffect, useRef } from 'react';
import { bookService, ManagedBook, ManagedSeries } from '../services/bookService';
import { storyService } from '../services/storyService';
import { discussionService } from '../services/discussionService';
import { newsService } from '../services/newsService';
import { galleryService } from '../services/galleryService';
import { characterLoreService } from '../services/characterLoreService';
import { BookCoverArt } from './BookCoverArt';
import { Story, DiscussionThread, NewsArticle, GalleryItem, Character, LoreEntry } from '../types';
import {
  Search,
  X,
  Layers,
  BookOpen,
  Feather,
  MessageSquare,
  ArrowRight,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Users,
  Compass,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, path?: string) => void;
}

type SearchResultItem =
  | { type: 'series'; item: ManagedSeries; title: string; subtitle: string; route: string }
  | { type: 'book'; item: ManagedBook; title: string; subtitle: string; route: string }
  | { type: 'story'; item: Story; title: string; subtitle: string; route: string }
  | { type: 'discussion'; item: DiscussionThread; title: string; subtitle: string; route: string }
  | { type: 'news'; item: NewsArticle; title: string; subtitle: string; route: string }
  | { type: 'gallery'; item: GalleryItem; title: string; subtitle: string; route: string }
  | { type: 'character'; item: Character; title: string; subtitle: string; route: string }
  | { type: 'lore'; item: LoreEntry; title: string; subtitle: string; route: string };

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>([]);
  const [booksList, setBooksList] = useState<ManagedBook[]>([]);
  const [storiesList, setStoriesList] = useState<Story[]>([]);
  const [discussionsList, setDiscussionsList] = useState<DiscussionThread[]>([]);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [charactersList, setCharactersList] = useState<Character[]>([]);
  const [loreEntriesList, setLoreEntriesList] = useState<LoreEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      Promise.all([
        bookService.getSeries(),
        bookService.getPublicBooks(),
        storyService.getStories(),
        discussionService.getDiscussions(),
        newsService.getPublicArticles(),
        galleryService.getPublicItems(),
        characterLoreService.getPublicCharacters(),
        characterLoreService.getPublicLore(),
      ]).then(([s, b, st, d, nw, gl, ch, lr]) => {
        setSeriesList(s);
        setBooksList(b);
        setStoriesList(st);
        setDiscussionsList(d);
        setNewsList(nw);
        setGalleryList(gl);
        setCharactersList(ch);
        setLoreEntriesList(lr);
      });
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results: SearchResultItem[] = [];

  if (q.length > 0) {
    // 1. Search Series
    seriesList.forEach((s) => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchGenres = (s.genres || []).some((g) => g.toLowerCase().includes(q));
      if (matchName || matchDesc || matchGenres) {
        const route =
          s.id === 'breathwoven-cycle' || s.slug === 'the-breathwoven-cycle'
            ? 'breathwoven-cycle'
            : s.id === 'abyssal-current' || s.slug?.includes('abyssal') || s.name.toLowerCase().includes('abyssal') || s.name.toLowerCase().includes('abyssmal')
            ? 'abyssal'
            : `/series/${s.slug || s.id}`;
        results.push({
          type: 'series',
          item: s,
          title: s.name,
          subtitle: s.shortDescription || s.genres?.join(', ') || 'Literary Series',
          route,
        });
      }
    });

    // 2. Search Books
    booksList.forEach((b) => {
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchSynopsis = (b.description || '').toLowerCase().includes(q);
      const matchSeries = (b.seriesName || '').toLowerCase().includes(q);
      if (matchTitle || matchSynopsis || matchSeries) {
        results.push({
          type: 'book',
          item: b,
          title: b.title,
          subtitle: b.subtitle || (b.seriesName ? `Book in ${b.seriesName}` : 'Standalone Book'),
          route: b.id,
        });
      }
    });

    // 3. Search Short Stories
    storiesList.forEach((st) => {
      const matchTitle = st.title.toLowerCase().includes(q);
      const matchSummary = (st.summary || '').toLowerCase().includes(q);
      const matchUniverse = (st.universe || '').toLowerCase().includes(q);
      if (matchTitle || matchSummary || matchUniverse) {
        results.push({
          type: 'story',
          item: st,
          title: st.title,
          subtitle: `${st.universe} · ${st.readTime || 'Short Story'}`,
          route: 'stories',
        });
      }
    });

    // 4. Search Discussions
    discussionsList.forEach((d) => {
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchContent = (d.content || '').toLowerCase().includes(q);
      const matchCategory = (d.category || '').toLowerCase().includes(q);
      if (matchTitle || matchContent || matchCategory) {
        results.push({
          type: 'discussion',
          item: d,
          title: d.title,
          subtitle: `${d.category} · by ${d.authorName}`,
          route: 'discussions',
        });
      }
    });

    // 5. Search News & Dispatches
    newsList.forEach((n) => {
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchCategory = (n.category || '').toLowerCase().includes(q);
      const matchTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchSummary = (n.summary || '').toLowerCase().includes(q);
      if (matchTitle || matchCategory || matchTags || matchSummary) {
        results.push({
          type: 'news',
          item: n,
          title: n.title,
          subtitle: `Dispatch · ${n.category} · ${n.date}`,
          route: 'news',
        });
      }
    });

    // 6. Search Gallery
    galleryList.forEach((g) => {
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchCat = (g.category || '').toLowerCase().includes(q);
      const matchDesc = (g.description || '').toLowerCase().includes(q);
      const matchTags = (g.tags || []).some((t) => t.toLowerCase().includes(q));
      if (matchTitle || matchCat || matchDesc || matchTags) {
        results.push({
          type: 'gallery',
          item: g,
          title: g.title,
          subtitle: `Gallery · ${g.category}${g.medium ? ` · ${g.medium}` : ''}`,
          route: 'craft',
        });
      }
    });

    // 7. Search Characters
    charactersList.forEach((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchRole = (c.role || c.title || '').toLowerCase().includes(q);
      const matchTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchDesc = (c.shortDescription || '').toLowerCase().includes(q);
      if (matchName || matchRole || matchTags || matchDesc) {
        results.push({
          type: 'character',
          item: c,
          title: c.name,
          subtitle: `Character · ${c.role || c.title || 'Dramatis Persona'}`,
          route: c.seriesId === 'abyssal-current' ? 'abyssal' : 'breathwoven-cycle',
        });
      }
    });

    // 8. Search Lore
    loreEntriesList.forEach((l) => {
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchCat = (l.category || '').toLowerCase().includes(q);
      const matchDesc = (l.description || '').toLowerCase().includes(q);
      const matchTags = (l.tags || []).some((t) => t.toLowerCase().includes(q));
      if (matchTitle || matchCat || matchDesc || matchTags) {
        results.push({
          type: 'lore',
          item: l,
          title: l.title,
          subtitle: `World Lore · ${l.category}`,
          route: l.relatedSeriesId === 'abyssal-current' ? 'abyssal' : 'breathwoven-cycle',
        });
      }
    });
  }

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'series') {
      const path =
        item.item.id === 'breathwoven-cycle'
          ? '/the-breathwoven-cycle'
          : item.item.id === 'abyssal-current'
          ? '/the-abyssal-current'
          : `/series/${item.item.slug || item.item.id}`;
      onNavigate(item.route, path);
    } else if (item.type === 'book') {
      onNavigate(item.route, `/${item.item.slug || item.route}`);
    } else if (item.type === 'story') {
      onNavigate('stories', '/stories');
    } else if (item.type === 'discussion') {
      onNavigate('discussions', '/discussions');
    } else if (item.type === 'news') {
      onNavigate('news', '/news');
    } else if (item.type === 'gallery') {
      onNavigate('craft', '/gallery');
    } else if (item.type === 'character' || item.type === 'lore') {
      onNavigate(item.route);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-200">
      <div className="bg-[#12141f] border border-[#2b2e44] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#232638] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#c5a059] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search series, books, short stories, discussions..."
            className="w-full bg-transparent text-sm sm:text-base text-[#f5efeb] placeholder-[#7d786d] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#7d786d] hover:text-[#f5efeb] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-[#1a1d2d] text-[#8e887a] hover:text-[#f5efeb] rounded text-xs font-mono cursor-pointer shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-3">
          {q.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#c5a059] mx-auto opacity-70" />
              <div className="font-cinzel text-sm text-[#f5efeb]">Explore Matthew E. Messmer's Canon</div>
              <p className="text-xs text-[#7d786d] max-w-sm mx-auto">
                Type a title, genre, series name (e.g., "Breathwoven", "Abyssal"), or discussion topic.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8e887a]">
              No matching series, books, stories, or discussions found for "{query}".
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] font-cinzel text-[#c5a059] px-2 font-bold uppercase tracking-wider">
                Search Results ({results.length})
              </div>

              {results.map((res, idx) => (
                <div
                  key={`${res.type}-${idx}`}
                  onClick={() => handleSelectResult(res)}
                  className="p-3 bg-[#161827] hover:bg-[#202338] border border-[#26293f] hover:border-[#c5a059]/40 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {res.type === 'book' ? (
                      <div className="w-8 aspect-[2/3] rounded overflow-hidden border border-[#2b2e40] bg-[#0c0d12] shrink-0 shadow">
                        <BookCoverArt book={res.item} className="w-full h-full" showHoverEffect={false} />
                      </div>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          res.type === 'series'
                            ? 'bg-[#c5a059]/15 text-[#c5a059]'
                            : res.type === 'story'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : res.type === 'news'
                            ? 'bg-amber-500/15 text-amber-400'
                            : res.type === 'gallery'
                            ? 'bg-teal-500/15 text-teal-400'
                            : res.type === 'character'
                            ? 'bg-rose-500/15 text-rose-400'
                            : res.type === 'lore'
                            ? 'bg-cyan-500/15 text-cyan-400'
                            : 'bg-purple-500/15 text-purple-400'
                        }`}
                      >
                        {res.type === 'series' && <Layers className="w-4 h-4" />}
                        {res.type === 'story' && <Feather className="w-4 h-4" />}
                        {res.type === 'news' && <FileText className="w-4 h-4" />}
                        {res.type === 'gallery' && <ImageIcon className="w-4 h-4" />}
                        {res.type === 'character' && <Users className="w-4 h-4" />}
                        {res.type === 'lore' && <Compass className="w-4 h-4" />}
                        {res.type === 'discussion' && <MessageSquare className="w-4 h-4" />}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel font-bold text-xs sm:text-sm text-[#f5efeb] group-hover:text-[#c5a059] transition-colors">
                          {res.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-cinzel uppercase font-semibold border ${
                            res.type === 'series'
                              ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30'
                              : res.type === 'book'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : res.type === 'story'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {res.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e887a] truncate max-w-md mt-0.5">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#6e695e] group-hover:text-[#c5a059] group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
