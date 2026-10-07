import React, { useState, useEffect } from 'react';
import { Book, CraftArtwork, NewsArticle } from '../types';
import { AUTHOR_INFO, CRAFT_ARTWORKS, NEWS_ARTICLES } from '../data/authorData';
import { bookService, managedBookToBook } from '../services/bookService';
import { siteContentService } from '../services/siteContentService';
import { BookCard } from '../components/BookCard';
import { BookCoverArt } from '../components/BookCoverArt';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { MonthlyFeaturedWidget } from '../components/MonthlyFeaturedWidget';
import { AudioHubSection } from '../components/AudioHubSection';
import { useSEO } from '../hooks/useSEO';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Compass,
  Hammer,
  Shield,
  Feather,
  ExternalLink,
  Waves,
} from 'lucide-react';

interface HomeViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenBookDetail: (book: Book) => void;
  setActiveTab: (tab: string) => void;
  onOpenPrivacy?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenExcerpt,
  onOpenBookDetail,
  setActiveTab,
  onOpenPrivacy,
}) => {
  useSEO('home');
  const [siteContent, setSiteContent] = useState(siteContentService.getContent());
  const [allPublicBooks, setAllPublicBooks] = useState<Book[]>([]);
  const [breathwovenBooks, setBreathwovenBooks] = useState<Book[]>([]);
  const [abyssalBooks, setAbyssalBooks] = useState<Book[]>([]);

  useEffect(() => {
    const unsubContent = siteContentService.subscribe(setSiteContent);
    const loadLiveBooks = async () => {
      try {
        const [publicMb, bwMb, abMb] = await Promise.all([
          bookService.getPublicBooks(),
          bookService.getBooksForSeries('breathwoven-cycle'),
          bookService.getBooksForSeries('abyssal-current'),
        ]);
        setAllPublicBooks(publicMb.map((mb) => managedBookToBook(mb)));
        setBreathwovenBooks(bwMb.map((mb) => managedBookToBook(mb)));
        setAbyssalBooks(abMb.map((mb) => managedBookToBook(mb)));
      } catch (err) {
        console.warn('Error loading live books for HomeView:', err);
      }
    };
    loadLiveBooks();
    const unsubBooks = bookService.subscribe(loadLiveBooks);
    return () => {
      unsubContent();
      unsubBooks();
    };
  }, []);

  const featuredBook =
    allPublicBooks.find((b) => b.id === siteContent.featuredBookId) ||
    allPublicBooks[0] ||
    null;
  const abyssalBook = abyssalBooks[0] || null;

  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      {/* DYNAMIC MONTHLY FEATURED ITEM ROTATION WIDGET */}
      <MonthlyFeaturedWidget
        onOpenExcerpt={onOpenExcerpt}
        onOpenBookDetail={onOpenBookDetail}
        onOpenStory={(story) => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', `/stories/${story.slug}`);
          }
          setActiveTab('stories');
        }}
        setActiveTab={setActiveTab}
      />

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-[#1f2230]">
        {/* Subtle radial golden glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#c5a059]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Author Brand & Call to Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Unboxed clean editorial metadata */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-[#a8a295]">
                <span className="text-[#c5a059] font-semibold tracking-wider uppercase font-cinzel">
                  Official Author Platform
                </span>
                <span aria-hidden="true">·</span>
                <span>The Breathwoven Cycle</span>
                <span aria-hidden="true">·</span>
                <span>The Abyssal Current</span>
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-bold text-[#f7f3ee] tracking-tight leading-[1.1]">
                  {siteContent.heroHeading || 'Matthew E. Messmer'}
                </h1>
                <p className="text-xl sm:text-2xl font-cormorant italic text-[#c5a059] mt-3 font-medium">
                  {siteContent.heroSubtitle || AUTHOR_INFO.tagline}
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#b8b2a3] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {siteContent.heroDescription ||
                  'Author, storyteller, Navy veteran, and physical woodcraft creator. Crafting expansive fantasy worlds where metaphysical threads bind human memory, courage, and family across the fabric of time.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                {featuredBook && (
                  <button
                    onClick={() => onOpenExcerpt(featuredBook)}
                    className="px-6 py-3 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-xl shadow-[#c5a059]/15 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{siteContent.primaryCtaLabel || 'Read Chapter 1 Excerpt'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('books');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-3 border border-[#373a4f] hover:border-[#c5a059] text-xs font-cinzel tracking-wider uppercase text-[#e5dfd3] hover:text-[#f5efeb] rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{siteContent.secondaryCtaLabel || 'Explore All Books'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Author Dimensions Snapshot (Unboxed text with separators, strictly zero-pill) */}
              <div className="pt-6 border-t border-[#1f2232] flex items-center justify-center lg:justify-start gap-3 text-xs text-[#8c8678] flex-wrap">
                <span>U.S. Navy Veteran (MA3)</span>
                <span aria-hidden="true">·</span>
                <span>Father of Four</span>
                <span aria-hidden="true">·</span>
                <span>IT Specialist</span>
                <span aria-hidden="true">·</span>
                <span>Laser Engraving Artisan</span>
              </div>
            </div>

            {/* Right Column: Featured Book Display */}
            {featuredBook && (
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => onOpenBookDetail(featuredBook)}>
                  {/* Book glow backdrop */}
                  <div className="absolute inset-0 bg-[#c5a059]/20 blur-2xl rounded-lg group-hover:bg-[#c5a059]/30 transition-all" />
                  <BookCoverArt book={featuredBook} size="xl" />
                </div>

                <div className="text-center mt-6 space-y-1">
                  <p className="text-xs uppercase tracking-widest text-[#c5a059] font-cinzel font-semibold">
                    {featuredBook.series ? `${featuredBook.series} · Book ${featuredBook.seriesOrder}` : 'Featured Volume'}
                  </p>
                  <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                    {featuredBook.title}
                  </h3>
                  <p className="text-xs text-[#9d978a] italic font-cormorant text-base">
                    "{featuredBook.tagline || featuredBook.subtitle || featuredBook.description}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE BRAND PILLARS (Anti-Slop Clean Editorial Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold mb-2">
            The World of Matthew E. Messmer
          </p>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
            Craft, Duty, & Imagination
          </h2>
          <p className="text-sm text-[#9c9689] mt-2 font-cormorant italic text-lg">
            "A story can live on a page, a digital screen, or even be carved into wood."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AUTHOR_INFO.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-cinzel font-bold text-[#c5a059] block mb-2">
                  0{idx + 1}.
                </span>
                <h3 className="text-base font-cinzel font-bold text-[#f5efeb] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#a6a092] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THE BREATHWOVEN CYCLE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#202334]">
          <div>
            <p className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold">
              The Flagship Universe
            </p>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] tracking-tight mt-1">
              The Breathwoven Cycle
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveTab('books');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-cinzel tracking-wider uppercase text-[#c5a059] hover:text-[#d6b169] flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Full Chronology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {breathwovenBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpenExcerpt={onOpenExcerpt}
              onOpenDetails={onOpenBookDetail}
            />
          ))}
        </div>
      </section>

      {/* THE ABYSSAL CURRENT TEASER BANNER */}
      {abyssalBook && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#06181d] via-[#082027] to-[#041014] border border-teal-900/50 p-8 sm:p-12 shadow-2xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none">
              <svg viewBox="0 0 400 400" className="w-full h-full stroke-teal-400" fill="none">
                <circle cx="200" cy="200" r="180" strokeWidth="1" strokeDasharray="4,4" />
                <circle cx="200" cy="200" r="120" strokeWidth="1" />
                <path d="M0 200 Q 200 150 400 200 T 400 250" />
              </svg>
            </div>

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs text-teal-400 font-cinzel font-semibold uppercase tracking-wider">
                <Waves className="w-4 h-4" />
                <span>Next Horizon · The Abyssal Current</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f0fdfa]">
                Deep Beneath the Charted Seas, Time Flows Down.
              </h3>

              <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed font-cormorant text-lg italic">
                Drawing from Matthew's years as a Navy Master-at-Arms, maritime physics, and deep oceanic mystery. An ironclad deep-sea exploration crew discovers the seabed is compressed time itself.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    setActiveTab('abyssal');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-teal-950/40"
                >
                  Explore The Abyssal Current
                </button>

                <button
                  onClick={() => onOpenExcerpt(abyssalBook)}
                  className="px-4 py-2.5 border border-teal-800 text-teal-200 hover:text-white hover:border-teal-400 text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Read Depth 4,000 Fathoms Teaser
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHYSICAL CRAFT & LASER ENGRAVING SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold">
              From Imagination into Wood
            </p>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
              Laser Engraving & Tactile Keepsakes
            </h2>
            <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
              One of Matthew's favorite hobbies is laser engraving, turning fictional seals, maps, and bookplates into physical artwork and keepsakes in his Texas workshop.
            </p>
            <p className="text-xs text-[#8e887a] italic font-cormorant text-base">
              "For Matthew, creativity isn't limited to one medium. A story can live on a page, a digital screen, or even be carved into wood."
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setActiveTab('craft');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-cinzel font-bold tracking-wider uppercase text-[#c5a059] hover:text-[#d6b169] cursor-pointer"
              >
                <span>View Workshop Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CRAFT_ARTWORKS.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-[#131520] border border-[#26283b] hover:border-[#c5a059]/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-[10px] text-[#c5a059] font-cinzel tracking-wider uppercase mb-2">
                  <Hammer className="w-3.5 h-3.5" />
                  <span>{item.medium}</span>
                </div>
                <h4 className="text-sm font-cinzel font-bold text-[#f5efeb] mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-[#9d978a] leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEDICATED AUDIO & SOUNDTRACK VAULT SECTION */}
      <AudioHubSection />

      {/* DISPATCHES & ARTICLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#202334]">
          <div>
            <p className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-semibold">
              From the Desk
            </p>
            <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
              Recent Dispatches
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveTab('news');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:text-[#d6b169] flex items-center gap-1 cursor-pointer"
          >
            <span>All Dispatches</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEWS_ARTICLES.slice(0, 3).map((article) => (
            <div
              key={article.id}
              onClick={() => {
                setActiveTab('news');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-6 rounded-xl bg-[#12141e] border border-[#232635] hover:border-[#c5a059]/40 transition-colors cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-[11px] text-[#8e887a] mb-2">
                  <span className="text-[#c5a059]">{article.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="text-base font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors leading-snug mb-2">
                  {article.title}
                </h3>
                <p className="text-xs text-[#9d978a] leading-relaxed line-clamp-3">
                  {article.summary}
                </p>
              </div>
              <div className="pt-4 border-t border-[#1d202e] mt-4 flex items-center justify-between text-xs text-[#736e63]">
                <span>{article.readTime}</span>
                <span className="text-[#c5a059] group-hover:translate-x-1 transition-transform">
                  Read →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEDICATED HOMEPAGE NEWSLETTER SECTION (As specified in prompt) */}
      {/*
        Heading: Join the Story
        Supporting text: Be the first to hear about new books, new worlds, and what's happening behind the pages.
        Fields: First Name, Email Address
        Button: Join the Journey
      */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <NewsletterSignup
          variant="homepage"
          heading="Join the Story"
          text="Be the first to hear about new books, new worlds, and what's happening behind the pages."
          buttonText="Join the Journey"
          source="homepage_bottom"
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </section>
    </div>
  );
};
