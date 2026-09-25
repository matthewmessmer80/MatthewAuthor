/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { BooksView } from './views/BooksView';
import { BreathwovenCycleView } from './views/BreathwovenCycleView';
import { AbyssalCurrentView } from './views/AbyssalCurrentView';
import { IgnisKorView } from './views/IgnisKorView';
import { BookPageView } from './views/BookPageView';
import { StoriesView } from './views/StoriesView';
import { CraftView } from './views/CraftView';
import { AboutView } from './views/AboutView';
import { NewsView } from './views/NewsView';
import { ContactView } from './views/ContactView';
import { PrivacyView } from './views/PrivacyView';
import { AccountView } from './views/AccountView';
import { ReadingRoomModal } from './components/ReadingRoomModal';
import { BookDetailModal } from './components/BookDetailModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ExitIntentModal } from './components/ExitIntentModal';
import { NewsletterSignup } from './components/NewsletterSignup';
import { AdminLoginView } from './views/admin/AdminLoginView';
import { AdminDashboardView, AdminTab } from './views/admin/AdminDashboardView';
import { bookService } from './services/bookService';
import { BOOKS } from './data/authorData';
import { Book, normalizeRole, UserRole } from './types';
import { X, Shield, Loader2, User, ArrowLeft, AlertCircle } from 'lucide-react';

const ROUTE_PATH_MAP: Record<string, string> = {
  home: '/',
  books: '/books',
  'breathwoven-cycle': '/the-breathwoven-cycle',
  abyssal: '/the-abyssal-current',
  'ignis-kor': '/ignis-kor',
  'kings-severance': '/the-kings-severance',
  'blue-moon-child': '/the-blue-moon-child',
  'weavers-lullaby': '/the-weavers-lullaby',
  stories: '/stories',
  craft: '/gallery',
  about: '/about',
  news: '/news',
  contact: '/contact',
  privacy: '/privacy',
  account: '/account',
  login: '/admin/login',
  register: '/register',
};

function getTabFromPathname(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/login' || clean === '/signin' || clean.startsWith('/admin/login')) {
    return '/admin/login';
  }
  if (clean === '/register' || clean === '/join') {
    return '/register';
  }
  if (clean.startsWith('/admin') || clean.startsWith('/editor')) {
    return clean;
  }
  if (clean === '/account') {
    return '/account';
  }
  for (const [tab, path] of Object.entries(ROUTE_PATH_MAP)) {
    if (clean === path) return tab;
  }
  if (clean.includes('breathwoven')) return 'breathwoven-cycle';
  if (clean.includes('abyssal')) return 'abyssal';
  if (clean.includes('ignis')) return 'ignis-kor';
  if (clean.includes('severance')) return 'kings-severance';
  if (clean.includes('blue-moon')) return 'blue-moon-child';
  if (clean.includes('weavers-lullaby') || clean.includes('lullaby')) return 'weavers-lullaby';
  if (clean.includes('stories')) return 'stories';
  if (clean.includes('craft') || clean.includes('gallery')) return 'craft';
  if (clean.includes('about')) return 'about';
  if (clean.includes('news') || clean.includes('dispatches')) return 'news';
  if (clean.includes('contact')) return 'contact';
  if (clean.includes('privacy')) return 'privacy';
  if (clean.includes('account')) return '/account';
  if (clean.includes('books')) return 'books';
  return 'home';
}

function MainAppContent() {
  const { user, profile, role, isAdmin, isAuthor, isEditor, isReader, loading } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPathname(window.location.pathname);
    }
    return 'home';
  });

  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);

  // Seed books on initial app boot
  useEffect(() => {
    bookService.seedInitialBooksIfEmpty();
  }, []);

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPathname(window.location.pathname);
      setCurrentRoute(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: string, targetPath?: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const path = targetPath || ROUTE_PATH_MAP[route] || route;
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenExcerpt = (book: Book) => {
    setReadingBook(book);
  };

  const handleOpenBookDetail = (book: Book) => {
    setDetailBook(book);
  };

  const handleJoinJourneyClick = () => {
    const bottomNewsletter = document.getElementById('homepage_bottom');
    if (currentRoute === 'home' && bottomNewsletter) {
      bottomNewsletter.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsJoinModalOpen(true);
    }
  };

  const bookKingsSeverance = BOOKS.find((b) => b.id === 'kings-severance') || BOOKS[0];
  const bookBlueMoon = BOOKS.find((b) => b.id === 'blue-moon-child') || BOOKS[1];
  const bookWeavers = BOOKS.find((b) => b.id === 'weavers-lullaby') || BOOKS[2];

  const handleAuthSuccess = (targetRole?: UserRole) => {
    const norm = normalizeRole(targetRole || role);
    if (norm === 'author') {
      navigateTo('/admin', '/admin');
    } else if (norm === 'editor') {
      navigateTo('/editor', '/editor');
    } else {
      navigateTo('/account', '/account');
    }
  };

  // Route: /register
  if (currentRoute === '/register') {
    if (user) {
      handleAuthSuccess(role);
      return null;
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#0c0d13] text-[#e8e2d9] bg-woven-pattern selection:bg-[#c5a059]/30 selection:text-[#fff9f0]">
        <Navbar
          activeTab={currentRoute}
          setActiveTab={(tab) => navigateTo(tab)}
          onJoinJourneyClick={handleJoinJourneyClick}
          isAdmin={isEditor}
          onOpenAdmin={() => {
            if (isAuthor) navigateTo('/admin', '/admin');
            else if (isEditor) navigateTo('/editor', '/editor');
            else navigateTo('/admin/login', '/admin/login');
          }}
        />
        <main className="flex-1">
          <AdminLoginView
            initialMode="register-reader"
            onSuccess={handleAuthSuccess}
            onBackToSite={() => navigateTo('home', '/')}
          />
        </main>
        <Footer
          setActiveTab={(tab) => navigateTo(tab)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAdmin={() => {
            if (isAuthor) navigateTo('/admin', '/admin');
            else if (isEditor) navigateTo('/editor', '/editor');
            else navigateTo('/admin/login', '/admin/login');
          }}
        />
      </div>
    );
  }

  // Route: /account
  if (currentRoute === '/account') {
    return (
      <div className="min-h-screen flex flex-col bg-[#0c0d13] text-[#e8e2d9] bg-woven-pattern selection:bg-[#c5a059]/30 selection:text-[#fff9f0]">
        <Navbar
          activeTab={currentRoute}
          setActiveTab={(tab) => navigateTo(tab)}
          onJoinJourneyClick={handleJoinJourneyClick}
          isAdmin={isEditor}
          onOpenAdmin={() => {
            if (isAuthor) navigateTo('/admin', '/admin');
            else if (isEditor) navigateTo('/editor', '/editor');
            else navigateTo('/admin/login', '/admin/login');
          }}
        />
        <main className="flex-1">
          <AccountView
            onBackToSite={() => navigateTo('home', '/')}
            onNavigateToBook={(slug) => navigateTo(slug, `/${slug}`)}
          />
        </main>
        <Footer
          setActiveTab={(tab) => navigateTo(tab)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAdmin={() => {
            if (isAuthor) navigateTo('/admin', '/admin');
            else if (isEditor) navigateTo('/editor', '/editor');
            else navigateTo('/admin/login', '/admin/login');
          }}
        />
      </div>
    );
  }

  // Check if current route is an admin or editor route
  const isAdminOrEditorRoute = currentRoute.startsWith('/admin') || currentRoute.startsWith('/editor');

  // Handle Admin / Editor Routing
  if (isAdminOrEditorRoute) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#0c0d13] flex flex-col items-center justify-center text-[#e8e2d9] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-xs font-cinzel text-[#a8a396]">
            <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
            <span>Verifying authorization...</span>
          </div>
        </div>
      );
    }

    // Login Route
    if (currentRoute === '/admin/login') {
      if (isAuthor) {
        navigateTo('/admin', '/admin');
        return null;
      }
      if (isEditor) {
        navigateTo('/editor', '/editor');
        return null;
      }
      if (isReader && user) {
        // Authenticated reader accessing login -> send to account
        navigateTo('/account', '/account');
        return null;
      }
      return (
        <AdminLoginView
          initialMode="sign-in"
          onSuccess={handleAuthSuccess}
          onBackToSite={() => navigateTo('home', '/')}
        />
      );
    }

    // If not authenticated at all -> show login view
    if (!user) {
      return (
        <AdminLoginView
          onSuccess={handleAuthSuccess}
          onBackToSite={() => navigateTo('home', '/')}
        />
      );
    }

    // If authenticated as READER only (not Editor or Author) attempting to access /admin or /editor:
    if (!isEditor) {
      return (
        <div className="min-h-screen bg-[#0c0d13] text-[#e8e2d9] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Shield className="w-8 h-8" />
          </div>
          <div className="text-center max-w-md space-y-2">
            <h2 className="text-2xl font-cinzel font-bold text-[#f5efeb]">Editorial Authorization Required</h2>
            <p className="text-xs sm:text-sm text-[#a8a396] leading-relaxed">
              You are signed in as <strong className="text-[#f5efeb]">{user.email}</strong> with a <span className="text-emerald-400 font-cinzel font-semibold">READER</span> account. Reader accounts can participate in book discussions and manage profiles, but do not have editorial or administration dashboard access.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/account', '/account')}
              className="px-5 py-2.5 bg-[#c5a059] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded-lg hover:bg-[#d6b066] transition-colors"
            >
              Go to My Reader Account
            </button>
            <button
              onClick={() => navigateTo('home', '/')}
              className="px-5 py-2.5 bg-[#171926] text-[#a8a396] hover:text-white border border-[#2c2f42] text-xs font-cinzel rounded-lg transition-colors"
            >
              Back to Website
            </button>
          </div>
        </div>
      );
    }

    // Parse sub-tab from path
    let initialTab: AdminTab = 'dashboard';
    let editingBookId: string | null = null;

    if (currentRoute.includes('/admin/site')) {
      initialTab = 'site-editor';
    } else if (currentRoute.includes('/admin/users')) {
      initialTab = 'users';
    } else if (currentRoute.includes('moderation')) {
      initialTab = 'moderation';
    } else if (currentRoute.includes('messages')) {
      initialTab = 'messages';
    } else if (currentRoute.includes('/books/new')) {
      initialTab = 'book-editor';
    } else if (currentRoute.includes('/books/') && currentRoute.includes('/edit')) {
      initialTab = 'book-editor';
      const parts = currentRoute.split('/');
      editingBookId = parts[3] || null;
    } else if (currentRoute.includes('books')) {
      initialTab = 'books';
    } else if (currentRoute.includes('series')) {
      initialTab = 'series';
    } else if (currentRoute.includes('stories')) {
      initialTab = 'stories';
    } else if (currentRoute.includes('news')) {
      initialTab = 'news';
    } else if (currentRoute.includes('media') || currentRoute.includes('gallery')) {
      initialTab = 'gallery';
    } else if (currentRoute.includes('worldbuilding')) {
      initialTab = 'worldbuilding';
    } else if (currentRoute.includes('newsletter')) {
      initialTab = 'newsletter';
    } else if (currentRoute.includes('seo')) {
      initialTab = 'seo';
    } else if (currentRoute.includes('settings')) {
      initialTab = 'settings';
    } else if (currentRoute.includes('backup') || currentRoute.includes('export')) {
      initialTab = 'backup';
    } else if (currentRoute.includes('account')) {
      initialTab = 'account';
    }

    return (
      <AdminDashboardView
        initialTab={initialTab}
        editingBookId={editingBookId}
        onReturnToSite={() => navigateTo('home', '/')}
      />
    );
  }

  // Public Author Website
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d13] text-[#e8e2d9] bg-woven-pattern selection:bg-[#c5a059]/30 selection:text-[#fff9f0]">
      {/* Top Navbar adhering strictly to Top Bar Contract */}
      <Navbar
        activeTab={currentRoute}
        setActiveTab={(tab) => navigateTo(tab)}
        onJoinJourneyClick={handleJoinJourneyClick}
        isAdmin={isEditor}
        onOpenAdmin={() => {
          if (isAuthor) {
            navigateTo('/admin', '/admin');
          } else if (isEditor) {
            navigateTo('/editor', '/editor');
          } else {
            navigateTo('/admin/login', '/admin/login');
          }
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomeView
            onOpenExcerpt={handleOpenExcerpt}
            onOpenBookDetail={handleOpenBookDetail}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {currentRoute === 'books' && (
          <BooksView
            onOpenExcerpt={handleOpenExcerpt}
            onOpenBookDetail={handleOpenBookDetail}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {currentRoute === 'breathwoven-cycle' && (
          <BreathwovenCycleView
            onOpenExcerpt={handleOpenExcerpt}
            onOpenBookDetail={handleOpenBookDetail}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {currentRoute === 'abyssal' && (
          <AbyssalCurrentView
            onOpenExcerpt={handleOpenExcerpt}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {currentRoute === 'ignis-kor' && (
          <IgnisKorView
            onOpenExcerpt={handleOpenExcerpt}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {currentRoute === 'kings-severance' && (
          <BookPageView
            book={bookKingsSeverance}
            onOpenExcerpt={handleOpenExcerpt}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenAuthModal={() => navigateTo('/admin/login', '/admin/login')}
          />
        )}

        {currentRoute === 'blue-moon-child' && (
          <BookPageView
            book={bookBlueMoon}
            onOpenExcerpt={handleOpenExcerpt}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenAuthModal={() => navigateTo('/admin/login', '/admin/login')}
          />
        )}

        {currentRoute === 'weavers-lullaby' && (
          <BookPageView
            book={bookWeavers}
            onOpenExcerpt={handleOpenExcerpt}
            setActiveTab={(tab) => navigateTo(tab)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenAuthModal={() => navigateTo('/admin/login', '/admin/login')}
          />
        )}

        {currentRoute === 'stories' && (
          <StoriesView onOpenPrivacy={() => setIsPrivacyOpen(true)} />
        )}

        {currentRoute === 'craft' && <CraftView />}

        {currentRoute === 'about' && (
          <AboutView onOpenPrivacy={() => setIsPrivacyOpen(true)} />
        )}

        {currentRoute === 'news' && (
          <NewsView onOpenPrivacy={() => setIsPrivacyOpen(true)} />
        )}

        {currentRoute === 'contact' && (
          <ContactView onOpenPrivacy={() => setIsPrivacyOpen(true)} />
        )}

        {currentRoute === 'privacy' && (
          <PrivacyView onBackToHome={() => navigateTo('home', '/')} />
        )}
      </main>

      {/* Footer with comprehensive discovery links & newsletter */}
      <Footer
        setActiveTab={(tab) => navigateTo(tab)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAdmin={() => {
          if (isAuthor) {
            navigateTo('/admin', '/admin');
          } else if (isEditor) {
            navigateTo('/editor', '/editor');
          } else {
            navigateTo('/admin/login', '/admin/login');
          }
        }}
      />

      {/* Interactive Excerpt Reading Room Modal */}
      {readingBook && (
        <ReadingRoomModal
          book={readingBook}
          onClose={() => setReadingBook(null)}
          onOpenBookDetail={handleOpenBookDetail}
        />
      )}

      {/* Book Detail Modal with Book Page Newsletter Section */}
      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onOpenExcerpt={handleOpenExcerpt}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />
      )}

      {/* Optional Exit-Intent Prompt */}
      <ExitIntentModal onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* Quick Join Journey Modal */}
      {isJoinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Join the Journey Newsletter"
        >
          <div className="relative w-full max-w-lg bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#807b70] hover:text-[#f5efeb] hover:bg-[#1b1e2c] rounded-md transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <NewsletterSignup
              variant="modal"
              heading="Join the Journey"
              text="Be the first to hear about new books, new worlds, and what's happening behind the pages."
              buttonText="Join the Journey"
              source="header_modal"
              showFirstName={true}
              showConsent={true}
              onOpenPrivacy={() => {
                setIsJoinModalOpen(false);
                setIsPrivacyOpen(true);
              }}
              onSuccess={() => {
                // Keep open to let visitor read welcome text
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
