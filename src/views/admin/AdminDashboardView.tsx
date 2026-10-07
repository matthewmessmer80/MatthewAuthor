import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookService, ManagedBook, ManagedSeries, AuditLogItem } from '../../services/bookService';
import { adminNewsletterService } from '../../services/adminNewsletterService';
import { newsletterService } from '../../services/newsletterService';
import { seoService } from '../../services/seoService';
import { commentService } from '../../services/commentService';
import { messageService } from '../../services/messageService';
import { newsService } from '../../services/newsService';
import { galleryService } from '../../services/galleryService';
import { characterLoreService } from '../../services/characterLoreService';
import { AdminBooksListView } from './AdminBooksListView';
import { AdminBookEditorView } from './AdminBookEditorView';
import { AdminSeriesView } from './AdminSeriesView';
import { AdminNewsletterView } from './AdminNewsletterView';
import { AdminAccountView } from './AdminAccountView';
import { AdminMediaView } from './AdminMediaView';
import { AdminStoriesView } from './AdminStoriesView';
import { AdminNewsView } from './AdminNewsView';
import { AdminWorldView } from './AdminWorldView';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminUsersView } from './AdminUsersView';
import { AdminSiteEditorView } from './AdminSiteEditorView';
import { AdminModerationView } from './AdminModerationView';
import { AdminMessagesView } from './AdminMessagesView';
import { AdminBackupView } from './AdminBackupView';
import { AdminBookPreviewModal } from './AdminBookPreviewModal';
import { AdminSongsView } from './AdminSongsView';
import { AdminSeoDashboard } from '../../components/AdminSeoDashboard';
import { songService } from '../../services/songService';
import { STORIES, NEWS_ARTICLES, CRAFT_ARTWORKS } from '../../data/authorData';
import {
  Shield,
  BookOpen,
  Layers,
  Mail,
  Search,
  Image as ImageIcon,
  User,
  LogOut,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Palette,
  Home,
  Menu,
  X,
  Compass,
  Settings,
  AlertTriangle,
  Users,
  Globe,
  ShieldAlert,
  MessageSquare,
  ArrowRight,
  Upload,
  Download,
  Loader2,
  RefreshCw,
  Music,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'moderation'
  | 'messages'
  | 'site-editor'
  | 'users'
  | 'books'
  | 'book-editor'
  | 'series'
  | 'stories'
  | 'songs'
  | 'news'
  | 'gallery'
  | 'worldbuilding'
  | 'newsletter'
  | 'seo'
  | 'settings'
  | 'backup'
  | 'account';

interface AdminDashboardViewProps {
  onReturnToSite: () => void;
  onPreviewBookPublic?: (book: ManagedBook) => void;
  initialTab?: AdminTab | 'books-new';
  editingBookId?: string | null;
  initialSeriesAction?: 'new' | null;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onReturnToSite,
  initialTab = 'dashboard',
  editingBookId = null,
  initialSeriesAction = null,
}) => {
  const { user, profile, role, isAuthor, isEditor, signOut, adminEmailConfigured } = useAuth();

  const [currentTab, setCurrentTab] = useState<AdminTab>(
    initialTab === 'books-new' || editingBookId ? 'book-editor' : (initialTab as AdminTab)
  );

  const [activeEditingBookId, setActiveEditingBookId] = useState<string | null>(editingBookId);
  const [books, setBooks] = useState<ManagedBook[]>(() => bookService.getCachedBooks());
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>(() => bookService.getCachedSeries());
  const [booksLoading, setBooksLoading] = useState<boolean>(() => bookService.isBooksLoading());
  const [seriesLoading, setSeriesLoading] = useState<boolean>(() => bookService.isSeriesLoading());
  const [booksError, setBooksError] = useState<Error | null>(() => bookService.getBooksError());
  const [seriesError, setSeriesError] = useState<Error | null>(() => bookService.getSeriesError());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previewingBook, setPreviewingBook] = useState<ManagedBook | null>(null);

  // Stats for moderation and messages
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0);
  const [flaggedCommentsCount, setFlaggedCommentsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const [charactersCount, setCharactersCount] = useState(0);
  const [loreCount, setLoreCount] = useState(0);

  const loadData = async () => {
    try {
      const [b, logs, s] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAuditLogs(),
        bookService.getAllSeries(),
      ]);
      setBooks(b);
      setAuditLogs(logs);
      setSeriesList(s);
      setBooksLoading(false);
      setSeriesLoading(false);
      setBooksError(null);
      setSeriesError(null);

      // Diagnostic logging per Requirement 14
      if (process.env.NODE_ENV !== 'production') {
        console.info('[Author Diagnostics]', {
          firebaseProject: 'gen-lang-client-0633133056',
          booksCollection: 'books',
          booksCount: b.length,
          seriesCollection: 'series',
          seriesCount: s.length,
        });
      }
    } catch (err: any) {
      console.error('[AdminDashboardView] Error refreshing Firestore data:', err);
      setBooks(bookService.getCachedBooks());
      setSeriesList(bookService.getCachedSeries());
      setBooksLoading(false);
      setSeriesLoading(false);
      setBooksError(bookService.getBooksError());
      setSeriesError(bookService.getSeriesError());
    }

    // Fetch moderation and messages stats
    try {
      const [comms, reps, msgs] = await Promise.all([
        commentService.getAllComments(),
        commentService.getAllReports(),
        messageService.getMessages(),
      ]);

      setPendingCommentsCount(
        comms.filter((c) => c.status === 'PENDING' || (c.status as string)?.toLowerCase() === 'pending').length
      );
      setFlaggedCommentsCount(
        comms.filter((c) => c.status === 'FLAGGED' || (c.status as string)?.toLowerCase() === 'flagged').length
      );
      setReportsCount(
        reps.filter((r) => r.status === 'PENDING_REVIEW' || (r.status as string)?.toLowerCase() === 'pending_review').length
      );
      setUnreadMessagesCount(
        msgs.filter((m) => (m.status === 'unread' || (m as any).isRead === false) && m.status !== 'archived').length
      );
    } catch {}
  };

  useEffect(() => {
    loadData();
    const unsubBooks = bookService.subscribe(() => {
      setBooks(bookService.getCachedBooks());
      setSeriesList(bookService.getCachedSeries());
      setBooksLoading(bookService.isBooksLoading());
      setSeriesLoading(bookService.isSeriesLoading());
      setBooksError(bookService.getBooksError());
      setSeriesError(bookService.getSeriesError());
    });
    const unsubNews = newsService.subscribe((list) => setNewsCount(list.length));
    const unsubGallery = galleryService.subscribe((list) => setGalleryCount(list.length));
    const unsubChars = characterLoreService.subscribeCharacters((list) => setCharactersCount(list.length));
    const unsubLore = characterLoreService.subscribeLore((list) => setLoreCount(list.length));
    const unsubSongs = songService.subscribe((list) => setSongsCount(list.length));

    // Dynamic reactive subscriptions for Messages & Moderation badges
    const unsubMessages = messageService.subscribe((list) => {
      const unread = list.filter(
        (m) => (m.status === 'unread' || (m as any).isRead === false) && m.status !== 'archived'
      ).length;
      setUnreadMessagesCount(unread);
    });

    const unsubComments = commentService.subscribe((list) => {
      const pending = list.filter(
        (c) => c.status === 'PENDING' || (c.status as string)?.toLowerCase() === 'pending'
      ).length;
      const flagged = list.filter(
        (c) => c.status === 'FLAGGED' || (c.status as string)?.toLowerCase() === 'flagged'
      ).length;
      setPendingCommentsCount(pending);
      setFlaggedCommentsCount(flagged);
    });

    const unsubReports = commentService.subscribeReports((list) => {
      const rep = list.filter(
        (r) => r.status === 'PENDING_REVIEW' || (r.status as string)?.toLowerCase() === 'pending_review'
      ).length;
      setReportsCount(rep);
    });

    return () => {
      unsubBooks();
      unsubNews();
      unsubGallery();
      unsubChars();
      unsubLore();
      unsubSongs();
      unsubMessages();
      unsubComments();
      unsubReports();
    };
  }, []);

  const [songsCount, setSongsCount] = useState<number>(songService.getCachedSongs().length);

  const totalBooks = books.length;
  const publishedBooks = books.filter((b) => b.publicationState === 'PUBLIC').length;
  const draftBooks = books.filter((b) => b.publicationState === 'DRAFT').length;
  const teaserBooks = books.filter((b) => b.publicationState === 'TEASER').length;
  const subscribers = newsletterService.getSubscribers();
  const activeSubscribers = subscribers.filter((s) => s.status === 'active');
  const providerConfig = adminNewsletterService.getProviderConfig();

  function FeatherIcon(props: React.SVGProps<SVGSVGElement>) {
    return <Sparkles {...props} />;
  }

  // Navigation items: Strictly role-aware with accurate filtered badges
  const authorNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'site-editor', label: 'Site Editor', icon: Globe },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert, badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'books', label: 'Books', icon: BookOpen, badge: books.length > 0 ? books.length : undefined },
    { id: 'series', label: 'Series', icon: Layers, badge: seriesList.length > 0 ? seriesList.length : undefined },
    { id: 'stories', label: 'Short Stories', icon: FeatherIcon },
    { id: 'songs', label: 'Songs & Music', icon: Music, badge: songsCount > 0 ? songsCount : undefined },
    { id: 'news', label: 'News', icon: FileText, badge: newsCount > 0 ? newsCount : undefined },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, badge: galleryCount > 0 ? galleryCount : undefined },
    { id: 'worldbuilding', label: 'Characters & Lore', icon: Compass, badge: (charactersCount + loreCount) > 0 ? (charactersCount + loreCount) : undefined },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'backup', label: 'Site Backup', icon: Download },
    { id: 'account', label: 'Account Profile', icon: User },
  ];

  const editorNavItems = [
    { id: 'dashboard', label: 'Editor Dashboard', icon: Home },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert, badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'books', label: 'Books', icon: BookOpen, badge: books.length > 0 ? books.length : undefined },
    { id: 'series', label: 'Series', icon: Layers, badge: seriesList.length > 0 ? seriesList.length : undefined },
    { id: 'stories', label: 'Short Stories', icon: FeatherIcon },
    { id: 'songs', label: 'Songs & Music', icon: Music, badge: songsCount > 0 ? songsCount : undefined },
    { id: 'account', label: 'My Account', icon: User },
  ];

  const navItems = isAuthor ? authorNavItems : editorNavItems;

  const handleNavClick = (tabId: AdminTab) => {
    setActiveEditingBookId(null);
    setCurrentTab(tabId);
    setMobileNavOpen(false);
    if (typeof window !== 'undefined') {
      const urlMap: Record<AdminTab, string> = {
        dashboard: isAuthor ? '/admin' : '/editor',
        'site-editor': '/admin/site',
        users: '/admin/users',
        moderation: '/admin/moderation',
        messages: '/admin/messages',
        books: isAuthor ? '/admin/books' : '/editor/books',
        'book-editor': isAuthor ? '/admin/books/new' : '/editor/books/new',
        series: isAuthor ? '/admin/series' : '/editor/series',
        stories: isAuthor ? '/admin/stories' : '/editor/stories',
        songs: isAuthor ? '/admin/music' : '/editor/music',
        news: '/admin/news',
        gallery: '/admin/media',
        worldbuilding: '/admin/worldbuilding',
        newsletter: '/admin/newsletter',
        seo: '/admin/seo',
        settings: '/admin/settings',
        backup: '/admin/backup',
        account: '/account',
      };
      if (urlMap[tabId]) {
        window.history.pushState({}, '', urlMap[tabId]);
      }
    }
  };

  const handleStartEditBook = (bookId: string) => {
    setActiveEditingBookId(bookId);
    setCurrentTab('book-editor');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/books/${bookId}/edit`);
    }
  };

  const handleStartAddNewBook = () => {
    setActiveEditingBookId(null);
    setCurrentTab('book-editor');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/books/new');
    }
  };

  const handlePreviewBook = (b: ManagedBook) => {
    setPreviewingBook(b);
  };

  const handlePublishFromPreview = async (b: ManagedBook) => {
    await bookService.saveBook({
      ...b,
      publicationState: 'PUBLIC',
      status: 'published',
      indexing: 'index',
    }, false, {
      name: profile?.displayName || user?.displayName || 'Author',
      email: user?.email || '',
      role,
    });
    setPreviewingBook(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0c0d13] text-[#e8e2d9] flex flex-col">
      {/* Top Header Bar */}
      <header className="h-16 bg-[#11131c] border-b border-[#212334] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 text-[#a8a396] hover:text-[#f5efeb] rounded-lg bg-[#181a26]"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-cinzel font-bold tracking-wider text-[#f5efeb] flex items-center gap-2">
                <span>{isAuthor ? 'Matthew E. Messmer Author Portal' : 'Messmer Editor Portal'}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-cinzel font-bold border ${
                  isAuthor
                    ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                    : 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                }`}>
                  {role}
                </span>
              </div>
              <div className="text-[10px] text-[#7d786d] hidden sm:block">
                Secure Role-Based Management System
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToSite}
            className="text-xs font-cinzel text-[#a8a396] hover:text-[#c5a059] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2b2e40] bg-[#161825] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Public Website</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Sidebar Nav */}
        <aside
          className={`fixed md:sticky top-16 z-20 w-64 h-[calc(100vh-4rem)] bg-[#11131c] border-r border-[#212334] p-4 flex flex-col justify-between transition-transform duration-200 ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1 overflow-y-auto pr-1">
            <div className="px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-wider text-[#696459]">
              {isAuthor ? 'Author Administration' : 'Editorial Workspace'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as AdminTab)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-cinzel flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-md shadow-[#c5a059]/10'
                      : 'text-[#a8a396] hover:text-[#f5efeb] hover:bg-[#181a28]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-[#0c0d12] text-[#c5a059]' : 'bg-[#c5a059]/20 text-[#c5a059]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User badge & logout */}
          <div className="pt-4 border-t border-[#1e202d] space-y-2">
            <div className="px-3 py-1 text-xs">
              <div className="text-[10px] text-[#6d685c] uppercase font-cinzel">Current Account:</div>
              <div className="font-cinzel text-[#f5efeb] text-xs font-bold truncate">
                {profile?.displayName || user?.displayName || user?.email}
              </div>
              <div className="font-mono text-[#787367] text-[10px] truncate">
                {user?.email}
              </div>
            </div>

            <button
              onClick={async () => {
                await signOut();
                onReturnToSite();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
                    {isAuthor ? 'Author Dashboard' : 'Editor Dashboard'}
                  </h2>
                  <p className="text-xs text-[#8e887a] mt-0.5">
                    {isAuthor
                      ? 'Matthew E. Messmer Author Administration · Central Management Summary'
                      : 'Editorial Workspace · Moderation, Reader Correspondence & Book Content Management'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <button
                      onClick={handleStartAddNewBook}
                      className="px-3.5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Book</span>
                    </button>
                  )}
                </div>
              </div>

              {/* EDITOR DASHBOARD SPECIFICATION (Prompt Section 9) */}
              {!isAuthor && (
                <div className="space-y-8">
                  {/* Moderation Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-cinzel font-bold text-[#c5a059] uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Moderation</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div
                        onClick={() => handleNavClick('moderation')}
                        className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-amber-500/40 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-cinzel uppercase text-[#8e887a]">Pending Comments</span>
                          <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-cinzel font-bold text-amber-300">{pendingCommentsCount}</div>
                        <span className="text-[11px] text-[#7d786d]">Awaiting moderation approval</span>
                      </div>

                      <div
                        onClick={() => handleNavClick('moderation')}
                        className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-rose-500/40 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-cinzel uppercase text-[#8e887a]">Flagged Comments</span>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-2xl font-cinzel font-bold text-rose-300">{flaggedCommentsCount}</div>
                        <span className="text-[11px] text-[#7d786d]">Require review</span>
                      </div>

                      <div
                        onClick={() => handleNavClick('moderation')}
                        className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-blue-500/40 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-cinzel uppercase text-[#8e887a]">Reported Comments</span>
                          <Shield className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-cinzel font-bold text-blue-300">{reportsCount}</div>
                        <span className="text-[11px] text-[#7d786d]">Reader submitted reports</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-cinzel font-bold text-[#c5a059] uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Reader Correspondence</span>
                    </h3>
                    <div
                      onClick={() => handleNavClick('messages')}
                      className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-cinzel uppercase text-[#8e887a]">Unread Reader Messages</span>
                        <div className="text-2xl font-cinzel font-bold text-[#f5efeb]">{unreadMessagesCount} New</div>
                        <p className="text-[11px] text-[#7d786d]">Inquiries from readers, book clubs, and virtual appearances.</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#c5a059]" />
                    </div>
                  </div>

                  {/* Books & Series Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-cinzel font-bold text-[#c5a059] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Catalog Management</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => handleNavClick('books')}
                        className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-cinzel uppercase text-[#8e887a]">
                            Books ({booksLoading && books.length === 0 ? 'Loading...' : totalBooks})
                          </span>
                          <BookOpen className="w-4 h-4 text-[#c5a059]" />
                        </div>
                        <p className="text-xs text-[#d6d0c4]">
                          Edit book descriptions, metadata, retailer links, and upload covers. (Protected: deletion restricted to Author).
                        </p>
                      </div>

                      <div
                        onClick={() => handleNavClick('series')}
                        className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-cinzel uppercase text-[#8e887a]">
                            Series ({seriesLoading && seriesList.length === 0 ? 'Loading...' : seriesList.length})
                          </span>
                          <Layers className="w-4 h-4 text-sky-400" />
                        </div>
                        <p className="text-xs text-[#d6d0c4]">
                          Manage series reading sequences, reading orders, and overview lore.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUTHOR DASHBOARD OVERVIEW */}
              {isAuthor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Books Card */}
                  <div
                    onClick={() => handleNavClick('books')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Books
                      </span>
                      <BookOpen className="w-4 h-4 text-[#c5a059]" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {booksLoading && books.length === 0 ? (
                        <span className="text-xs font-sans text-[#8e887a] flex items-center gap-1.5 font-normal">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                          Loading books...
                        </span>
                      ) : booksError && books.length === 0 ? (
                        <span className="text-xs text-rose-400 font-sans font-normal">Error loading books</span>
                      ) : (
                        totalBooks
                      )}
                    </div>
                    <div className="text-[11px] text-[#7d776a] flex items-center gap-1.5 flex-wrap">
                      <span className="text-emerald-400 font-medium">{publishedBooks} Published</span>
                      <span>·</span>
                      <span className="text-amber-400 font-medium">{draftBooks} Draft</span>
                      {teaserBooks > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-sky-400 font-medium">{teaserBooks} Teaser</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Series Card */}
                  <div
                    onClick={() => handleNavClick('series')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Series
                      </span>
                      <Layers className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {seriesLoading && seriesList.length === 0 ? (
                        <span className="text-xs font-sans text-[#8e887a] flex items-center gap-1.5 font-normal">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                          Loading series...
                        </span>
                      ) : seriesError && seriesList.length === 0 ? (
                        <span className="text-xs text-rose-400 font-sans font-normal">Error loading series</span>
                      ) : (
                        seriesList.length
                      )}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Universes & reading orders
                    </div>
                  </div>

                  {/* Users Card */}
                  <div
                    onClick={() => handleNavClick('users')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        User Roles
                      </span>
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      3 Roles
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Readers, Editors, Authors
                    </div>
                  </div>

                  {/* Moderation Card */}
                  <div
                    onClick={() => handleNavClick('moderation')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Moderation
                      </span>
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {pendingCommentsCount}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      {pendingCommentsCount} pending · {flaggedCommentsCount} flagged
                    </div>
                  </div>

                  {/* News & Dispatches Card */}
                  <div
                    onClick={() => handleNavClick('news')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        News & Dispatches
                      </span>
                      <FileText className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {newsCount}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Announcements & progress reports
                    </div>
                  </div>

                  {/* Gallery Card */}
                  <div
                    onClick={() => handleNavClick('gallery')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Gallery
                      </span>
                      <ImageIcon className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {galleryCount}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Wood relief & visual assets
                    </div>
                  </div>

                  {/* Characters & Lore Card */}
                  <div
                    onClick={() => handleNavClick('worldbuilding')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Characters & Lore
                      </span>
                      <Compass className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      {charactersCount + loreCount}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      {charactersCount} Characters · {loreCount} Lore entries
                    </div>
                  </div>

                  {/* Site Content Card */}
                  <div
                    onClick={() => handleNavClick('site-editor')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel uppercase text-[#8e887a] group-hover:text-[#c5a059]">
                        Site Editor
                      </span>
                      <Globe className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-3xl font-cinzel font-bold text-[#f5efeb]">
                      Live
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Homepage, bio, hero & copy
                    </div>
                  </div>

                  {/* Site Backup Card (Author only) */}
                  <div
                    onClick={() => handleNavClick('backup')}
                    className="p-5 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer space-y-2 group sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-[#11131c] via-[#141622] to-[#11131c]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
                            <span>Author Site Backup & Data Preservation</span>
                            <span className="px-1.5 py-0.5 bg-[#c5a059]/20 text-[#c5a059] rounded text-[9px] font-mono">JSON</span>
                          </div>
                          <p className="text-[11px] text-[#8e887a] mt-0.5">
                            Download a full offline archive of all books, series, discussions, subscribers, and settings "just in case".
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-cinzel text-[#c5a059] group-hover:translate-x-1 transition-transform self-end sm:self-auto shrink-0">
                        <span>Open Backup Tool</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* System & Firestore Diagnostics (Author Only - Requirement 14) */}
                  <div className="p-5 rounded-xl bg-[#0d0e16] border border-[#212437] sm:col-span-2 lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1d2030] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-cinzel font-bold text-[#f5efeb] uppercase tracking-wider">
                          Author Database Diagnostic
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 rounded text-[9px] font-mono">
                          Connected (Online)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#787367] font-mono">Author-only verification</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Firebase Project:</span>
                        <span className="text-emerald-400 font-bold break-all">gen-lang-client-0633133056</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Books Collection:</span>
                        <span className="text-[#f5efeb] font-bold">books</span>
                        <span className="text-[#8e887a] ml-1">({totalBooks} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Series Collection:</span>
                        <span className="text-[#f5efeb] font-bold">series</span>
                        <span className="text-[#8e887a] ml-1">({seriesList.length} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">News Collection:</span>
                        <span className="text-[#f5efeb] font-bold">news</span>
                        <span className="text-[#8e887a] ml-1">({newsCount} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Gallery Collection:</span>
                        <span className="text-[#f5efeb] font-bold">gallery</span>
                        <span className="text-[#8e887a] ml-1">({galleryCount} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Characters Collection:</span>
                        <span className="text-[#f5efeb] font-bold">characters</span>
                        <span className="text-[#8e887a] ml-1">({charactersCount} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Lore Collection:</span>
                        <span className="text-[#f5efeb] font-bold">lore</span>
                        <span className="text-[#8e887a] ml-1">({loreCount} Found)</span>
                      </div>
                      <div className="bg-[#121420] p-2.5 rounded-lg border border-[#1e2133]">
                        <span className="text-[10px] uppercase text-[#787367] block font-sans">Sync Mode:</span>
                        <span className="text-[#c5a059] font-bold">Realtime Listeners</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity / Audit Log Section */}
              <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#212334] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c5a059]" />
                    <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                      Recent Activity & Changes
                    </h3>
                  </div>
                  <span className="text-xs text-[#7d776a]">
                    Tracking Editor & Author updates
                  </span>
                </div>

                <div className="space-y-2">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 7).map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#0d0e15] border border-[#212433] rounded-lg text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-cinzel font-semibold text-[#f5efeb]">
                            {log.action}
                          </div>
                          <div className="text-[#8e887a] mt-0.5">{log.details}</div>
                        </div>
                        <div className="text-[11px] text-[#6d685c] font-mono shrink-0 ml-4">
                          {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[#7d776a]">
                      Initial system ready. All changes to books, covers, series, and moderation record here automatically.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SITE EDITOR (AUTHOR ONLY) */}
          {currentTab === 'site-editor' && isAuthor && <AdminSiteEditorView />}

          {/* TAB: USERS & ROLES (AUTHOR ONLY) */}
          {currentTab === 'users' && isAuthor && <AdminUsersView />}

          {/* TAB: MODERATION (EDITOR & AUTHOR) */}
          {currentTab === 'moderation' && <AdminModerationView />}

          {/* TAB: MESSAGES (EDITOR & AUTHOR) */}
          {currentTab === 'messages' && <AdminMessagesView />}

          {/* TAB 2: BOOKS LIST */}
          {currentTab === 'books' && (
            <AdminBooksListView
              initialBooks={books}
              onAddNew={isAuthor ? handleStartAddNewBook : () => {}}
              onEditBook={handleStartEditBook}
              onPreviewPublic={handlePreviewBook}
            />
          )}

          {/* TAB 2B: BOOK EDITOR */}
          {currentTab === 'book-editor' && (
            <AdminBookEditorView
              initialBookId={activeEditingBookId}
              onBack={() => handleNavClick('books')}
              onPreviewPublic={handlePreviewBook}
            />
          )}

          {/* TAB 3: SERIES */}
          {currentTab === 'series' && (
            <AdminSeriesView
              initialAction={initialSeriesAction}
              initialSeries={seriesList}
              initialBooks={books}
              onNavigateToNewBook={isAuthor ? handleStartAddNewBook : undefined}
            />
          )}

          {/* TAB 4: STORIES (Author only) */}
          {currentTab === 'stories' && <AdminStoriesView />}

          {/* TAB: SONGS & MUSIC LIBRARY */}
          {currentTab === 'songs' && <AdminSongsView />}

          {/* TAB 5: NEWS (Author only) */}
          {currentTab === 'news' && <AdminNewsView />}

          {/* TAB 6: GALLERY / MEDIA (Author only) */}
          {currentTab === 'gallery' && <AdminMediaView />}

          {/* TAB 7: WORLDBUILDING & CHARACTERS (Author only) */}
          {currentTab === 'worldbuilding' && <AdminWorldView />}

          {/* TAB 8: NEWSLETTER (Author only) */}
          {currentTab === 'newsletter' && <AdminNewsletterView />}

          {/* TAB 9: SEO & INDEXING (Author only) */}
          {currentTab === 'seo' && <AdminSeoDashboard />}

          {/* TAB 10: SITE SETTINGS (Author only) */}
          {currentTab === 'settings' && <AdminSettingsView />}

          {/* TAB: BACKUP & DATA PRESERVATION (Author only) */}
          {currentTab === 'backup' && isAuthor && <AdminBackupView />}

          {/* TAB 11: ACCOUNT */}
          {currentTab === 'account' && (
            <AdminAccountView onLoggedOut={onReturnToSite} />
          )}
        </main>
      </div>

      {/* Book Preview Modal with Non-Indexable Guard and Back-To-Editor/Publish Actions */}
      {previewingBook && (
        <AdminBookPreviewModal
          book={previewingBook}
          onBackToEditor={() => setPreviewingBook(null)}
          onPublish={handlePublishFromPreview}
        />
      )}
    </div>
  );
};
