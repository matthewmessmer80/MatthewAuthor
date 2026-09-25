import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { siteContentService, DEFAULT_HOMEPAGE_CONTENT } from '../../services/siteContentService';
import { bookService, ManagedBook } from '../../services/bookService';
import { HomepageContent } from '../../types';
import {
  Globe,
  Save,
  RotateCcw,
  Sparkles,
  Layout,
  Type,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminSiteEditorView: React.FC = () => {
  const { isAuthor } = useAuth();
  const [content, setContent] = useState<HomepageContent>(siteContentService.getContent());
  const [books, setBooks] = useState<ManagedBook[]>([]);
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'author' | 'footer'>('hero');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    bookService.getBooks().then(setBooks);
    const unsub = siteContentService.subscribe((newContent) => {
      setContent(newContent);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await siteContentService.updateHomepageContent(content);
    setSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all site copy and layout configurations back to initial defaults?')) {
      await siteContentService.resetToDefaults();
      setContent(DEFAULT_HOMEPAGE_CONTENT);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Content Management System
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Author Only
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Author Site & Homepage Editor
          </h2>
          <p className="text-xs sm:text-sm text-[#8f897c] mt-1">
            Edit live website copy, hero headers, featured volumes, call-to-action buttons, and section visibility without redeploying code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-[#a8a396] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Site content updated! Changes are now live across all public visitor views.</span>
        </div>
      )}

      {/* Editor Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#212334] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Hero & Featured Work</span>
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sections'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Homepage Sections</span>
        </button>
        <button
          onClick={() => setActiveTab('author')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'author'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Author Bio & Quotes</span>
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'footer'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Newsletter & Footer</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Tab 1: Hero & Featured */}
        {activeTab === 'hero' && (
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2 border-b border-[#212334] pb-3">
              <Globe className="w-4 h-4 text-[#c5a059]" />
              <span>Homepage Hero Banner Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Hero Main Heading
                </label>
                <input
                  type="text"
                  value={content.heroHeading}
                  onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  value={content.heroSubtitle}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Hero Synopsis & Overview
              </label>
              <textarea
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                rows={3}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#f5efeb] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Primary CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.primaryCtaLabel}
                  onChange={(e) => setContent({ ...content, primaryCtaLabel: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Primary CTA Destination Link
                </label>
                <input
                  type="text"
                  value={content.primaryCtaLink}
                  onChange={(e) => setContent({ ...content, primaryCtaLink: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Featured Book Focus
                </label>
                <select
                  value={content.featuredBookId}
                  onChange={(e) => setContent({ ...content, featuredBookId: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                >
                  <option value="kings-severance">The King's Severance</option>
                  <option value="blue-moon-child">The Blue Moon Child</option>
                  <option value="weavers-lullaby">The Weaver's Lullaby</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Hero Background Image URL
                </label>
                <input
                  type="url"
                  value={content.heroImage}
                  onChange={(e) => setContent({ ...content, heroImage: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sections Visibility */}
        {activeTab === 'sections' && (
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2 border-b border-[#212334] pb-3">
              <Sliders className="w-4 h-4 text-[#c5a059]" />
              <span>Homepage Section Visibility Toggles</span>
            </h3>

            <div className="space-y-4">
              {[
                { key: 'showFeaturedSeries', label: 'Featured Series Teaser (The Breathwoven Cycle)', desc: 'Displays series overview and high-concept worldbuilding block.' },
                { key: 'showBooksGrid', label: 'Books Catalog Highlights', desc: 'Displays the published, upcoming, and reading order book cards.' },
                { key: 'showStories', label: 'Short Stories & Lore Section', desc: 'Highlights side-stories, flash fiction, and universe expansions.' },
                { key: 'showNews', label: 'Latest Dispatches & Announcements', desc: 'Shows recent author release reports and progress notes.' },
                { key: 'showCraft', label: 'Workshop Woodcraft & Laser Engravings', desc: 'Highlights handcrafted physical artifacts and presentation items.' },
                { key: 'showNewsletter', label: 'Bottom Newsletter Signup Form', desc: 'Primary email journey capture before the footer.' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-4 p-4 bg-[#141624] border border-[#26283b] rounded-xl hover:border-[#c5a059]/40 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={content.sections[item.key as keyof typeof content.sections]}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        sections: {
                          ...content.sections,
                          [item.key]: e.target.checked,
                        },
                      })
                    }
                    className="mt-1 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059] bg-[#1a1d2d]"
                  />
                  <div>
                    <span className="text-xs font-cinzel font-bold text-[#f5efeb] block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[#8a8476] block mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Author Bio & Quotes */}
        {activeTab === 'author' && (
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2 border-b border-[#212334] pb-3">
              <Sparkles className="w-4 h-4 text-[#c5a059]" />
              <span>Author Introduction & Philosophy</span>
            </h3>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Author Introduction Heading
              </label>
              <input
                type="text"
                value={content.authorIntroHeading}
                onChange={(e) => setContent({ ...content, authorIntroHeading: e.target.value })}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
              />
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Author Introduction Biography
              </label>
              <textarea
                value={content.authorIntroBio}
                onChange={(e) => setContent({ ...content, authorIntroBio: e.target.value })}
                rows={4}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#f5efeb] resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Featured Epigraph / Author Quote
              </label>
              <textarea
                value={content.authorIntroQuote}
                onChange={(e) => setContent({ ...content, authorIntroQuote: e.target.value })}
                rows={2}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#f5efeb] resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Newsletter & Footer */}
        {activeTab === 'footer' && (
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2 border-b border-[#212334] pb-3">
              <Mail className="w-4 h-4 text-[#c5a059]" />
              <span>Newsletter Messaging & Footer Copy</span>
            </h3>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Newsletter Section Heading
              </label>
              <input
                type="text"
                value={content.newsletterHeading}
                onChange={(e) => setContent({ ...content, newsletterHeading: e.target.value })}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
              />
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                Newsletter Invitation Copy
              </label>
              <textarea
                value={content.newsletterText}
                onChange={(e) => setContent({ ...content, newsletterText: e.target.value })}
                rows={2}
                className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#f5efeb] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#1f2231]">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Footer Note / Tagline
                </label>
                <input
                  type="text"
                  value={content.footerNote}
                  onChange={(e) => setContent({ ...content, footerNote: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1.5">
                  Footer Legal Copyright Notice
                </label>
                <input
                  type="text"
                  value={content.footerCopyright}
                  onChange={(e) => setContent({ ...content, footerCopyright: e.target.value })}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#212334]">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-xl transition-all shadow-xl shadow-[#c5a059]/15 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Site Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
