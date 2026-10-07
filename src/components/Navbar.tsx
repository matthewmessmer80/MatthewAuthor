import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  Shield,
  BookOpen,
  Compass,
  Feather,
  Hammer,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  Globe,
  Users,
  ShieldAlert,
  Search,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onJoinJourneyClick: () => void;
  onOpenAdmin: () => void;
  onOpenSearch?: () => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onJoinJourneyClick,
  onOpenAdmin,
  onOpenSearch,
}) => {
  const { user, profile, role, isAuthor, isEditor, canEditSite, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'books', label: 'Books' },
    { id: 'breathwoven-cycle', label: 'The Breathwoven Cycle' },
    { id: 'abyssal', label: 'The Abyssal Current' },
    { id: 'stories', label: 'Short Stories' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'audio-hub', label: 'Audio Vault' },
    { id: 'craft', label: 'Gallery' },
    { id: 'about', label: 'About' },
    { id: 'news', label: 'Dispatches' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAccountNav = (targetPath: string) => {
    setActiveTab(targetPath);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c0d13]/90 backdrop-blur-md border-b border-[#232635]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark - Strictly on one line */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left group cursor-pointer shrink-0 whitespace-nowrap"
          aria-label="Matthew E. Messmer - Home"
        >
          <span className="text-lg sm:text-xl lg:text-2xl font-cinzel font-bold tracking-wider text-[#f5efeb] group-hover:text-[#c5a059] transition-colors whitespace-nowrap inline-block">
            Matthew&nbsp;E.&nbsp;Messmer
          </span>
        </button>

        {/* Zone 2: clean text navigation links - Responsive single line without awkward wrapping */}
        <nav className="hidden 2xl:flex items-center gap-3 3xl:gap-4 text-[13px] font-medium text-[#b5af9f] shrink-0 whitespace-nowrap">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`transition-colors py-1 cursor-pointer whitespace-nowrap relative shrink-0 ${
                  isActive
                    ? 'text-[#f5efeb] font-semibold'
                    : 'hover:text-[#f5efeb]'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c5a059] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: primary actions */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* User Account / Sign In Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="px-3 py-1.5 text-xs font-cinzel rounded-lg border border-[#2b2e42] bg-[#12141f] hover:bg-[#191b29] text-[#e5dfd3] flex items-center gap-2 transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#c5a059] flex items-center justify-center font-bold text-[10px]">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (profile?.displayName || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="max-w-[120px] truncate">{profile?.displayName || user.email?.split('@')[0]}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${
                  role === 'AUTHOR'
                    ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                    : role === 'EDITOR'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7a7467]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#11131c] border border-[#2a2d40] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in space-y-1 text-xs font-cinzel"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-[#212334] text-[11px] text-[#7d786d]">
                    <div className="font-bold text-[#f5efeb] truncate">{profile?.displayName || user.email}</div>
                    <div className="text-[10px] text-[#c5a059] font-mono">{role} Account</div>
                  </div>

                  <button
                    onClick={() => handleAccountNav('/account')}
                    className="w-full text-left px-3 py-2 text-[#d6d0c4] hover:bg-[#1a1d2d] hover:text-[#c5a059] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Account (/account)</span>
                  </button>

                  {isAuthor && (
                    <>
                      <button
                        onClick={() => handleAccountNav('/admin')}
                        className="w-full text-left px-3 py-2 text-[#d6d0c4] hover:bg-[#1a1d2d] hover:text-[#c5a059] flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Author Portal (/admin)</span>
                      </button>
                      <button
                        onClick={() => handleAccountNav('/admin/site')}
                        className="w-full text-left px-3 py-2 text-[#d6d0c4] hover:bg-[#1a1d2d] hover:text-[#c5a059] flex items-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Site Editor (/admin/site)</span>
                      </button>
                      <button
                        onClick={() => handleAccountNav('/admin/users')}
                        className="w-full text-left px-3 py-2 text-[#d6d0c4] hover:bg-[#1a1d2d] hover:text-[#c5a059] flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>User Management (/admin/users)</span>
                      </button>
                    </>
                  )}

                  {!isAuthor && isEditor && (
                    <button
                      onClick={() => handleAccountNav('/editor')}
                      className="w-full text-left px-3 py-2 text-[#d6d0c4] hover:bg-[#1a1d2d] hover:text-[#c5a059] flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editor Dashboard (/editor)</span>
                    </button>
                  )}

                  <div className="pt-1 border-t border-[#212334]">
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleAccountNav('/admin/login')}
              className="px-3 py-1.5 text-xs font-cinzel rounded-lg border border-[#2b2e40] bg-[#12141e] hover:bg-[#1a1d2b] text-[#9e978a] hover:text-[#f5efeb] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Sign In / Join</span>
            </button>
          )}

          {/* Global Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-[#9e978a] hover:text-[#c5a059] bg-[#12141e] hover:bg-[#1a1d2b] border border-[#292c3f] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-cinzel"
              title="Search series, books, stories (Ctrl+K)"
              aria-label="Global Search"
            >
              <Search className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="hidden md:inline text-[11px]">Search</span>
            </button>
          )}

          {/* Edit Site link - ONLY rendered for authorized users (Author or authorized Editor) */}
          {canEditSite && (
            <button
              onClick={onOpenAdmin}
              title={isAuthor ? "Author Portal & Site Content Management" : "Editor Portal"}
              className="px-3 py-1.5 text-xs font-cinzel rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-[#141e17] border-emerald-600/50 text-emerald-300 hover:border-emerald-400"
              aria-label={isAuthor ? "Edit Site" : "Editor Portal"}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAuthor ? 'Edit Site' : 'Editor Portal'}</span>
            </button>
          )}

          {/* Join Journey CTA */}
          <button
            onClick={onJoinJourneyClick}
            className="px-4 py-2 text-xs font-cinzel tracking-wider uppercase font-semibold text-[#0c0d12] bg-[#c5a059] hover:bg-[#d6b169] rounded-md transition-all shadow-md shadow-[#c5a059]/10 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Join the Journey
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 2xl:hidden shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              title="Search Canon"
              className="p-1.5 text-[#9e978a] hover:text-[#c5a059] border border-[#2b2e40] rounded-md bg-[#12141e]"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-[#c5a059]" />
            </button>
          )}
          {canEditSite && (
            <button
              onClick={onOpenAdmin}
              title={isAuthor ? "Author Portal" : "Editor Portal"}
              className="px-2 py-1.5 text-[#9e978a] hover:text-[#c5a059] flex items-center gap-1 text-xs border border-[#2b2e40] rounded-md bg-[#12141e]"
              aria-label="Edit Site"
            >
              <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="font-cinzel text-[11px]">{isAuthor ? 'Edit Site' : 'Editor'}</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#b5af9f] hover:text-[#f5efeb] rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="2xl:hidden bg-[#0e1017] border-b border-[#232635] px-4 pt-3 pb-6 space-y-2">
          {user && (
            <div className="px-3 py-2 bg-[#151724] border border-[#232636] rounded-lg mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-cinzel font-bold text-[#f5efeb]">{profile?.displayName || user.email}</div>
                <div className="text-[10px] text-[#c5a059] font-mono">{role} Account</div>
              </div>
              <button
                onClick={() => handleAccountNav('/account')}
                className="text-xs font-cinzel text-[#c5a059] hover:underline"
              >
                Profile →
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === link.id
                  ? 'bg-[#1b1e2b] text-[#c5a059] font-semibold'
                  : 'text-[#c2bcb0] hover:bg-[#151722]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#232635] space-y-2">
            {!user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAccountNav('/admin/login');
                }}
                className="w-full py-2.5 px-3 text-left text-xs font-cinzel tracking-wider uppercase font-semibold text-[#f5efeb] bg-[#161822] hover:bg-[#1d202e] border border-[#2b2e40] rounded-md transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c5a059]" />
                  <span>Sign In / Reader Registration</span>
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAccountNav('/account');
                }}
                className="w-full py-2.5 px-3 text-left text-xs font-cinzel tracking-wider uppercase font-semibold text-[#f5efeb] bg-[#161822] hover:bg-[#1d202e] border border-[#2b2e40] rounded-md transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c5a059]" />
                  <span>My Profile & Comment History</span>
                </span>
              </button>
            )}

            {canEditSite && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2.5 px-3 text-left text-xs font-cinzel tracking-wider uppercase font-semibold text-[#f5efeb] bg-[#161822] hover:bg-[#1d202e] border border-[#2b2e40] rounded-md transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#c5a059]" />
                  <span>{isAuthor ? 'Edit Site' : 'Editor Dashboard'}</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-sans">{role}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onJoinJourneyClick();
              }}
              className="w-full py-2.5 text-center text-xs font-cinzel uppercase tracking-wider font-semibold text-[#0c0d12] bg-[#c5a059] hover:bg-[#d6b169] rounded-md transition-colors"
            >
              Join the Journey (Newsletter)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
