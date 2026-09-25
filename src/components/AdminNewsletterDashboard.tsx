import React, { useState, useEffect } from 'react';
import { newsletterService } from '../services/newsletterService';
import { coverImageService } from '../services/coverImageService';
import { BOOKS } from '../data/authorData';
import { BookCoverArt } from './BookCoverArt';
import { AdminSeoDashboard } from './AdminSeoDashboard';
import { NewsletterSettings, NewsletterSubscriber } from '../types';
import {
  Shield,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Download,
  Eye,
  EyeOff,
  Trash2,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Server,
  Mail,
  Send,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Search,
} from 'lucide-react';

interface AdminNewsletterDashboardProps {
  onClose: () => void;
}

export const AdminNewsletterDashboard: React.FC<AdminNewsletterDashboardProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<NewsletterSettings>(newsletterService.getSettings());
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(newsletterService.getSubscribers());
  const [maskEmails, setMaskEmails] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'covers' | 'seo' | 'settings' | 'campaigns'>('overview');
  const [savedToast, setSavedToast] = useState(false);
  const [filterSource, setFilterSource] = useState('all');
  const [coverToast, setCoverToast] = useState<string | null>(null);

  const stats = newsletterService.getStats();

  const handleFileUpload = (bookId: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        coverImageService.setCover(bookId, dataUrl);
        setCoverToast(`Successfully updated cover for "${BOOKS.find((b) => b.id === bookId)?.title}"`);
        setTimeout(() => setCoverToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetCover = (bookId: string) => {
    coverImageService.removeCover(bookId);
    setCoverToast(`Reset cover for "${BOOKS.find((b) => b.id === bookId)?.title}" to default art`);
    setTimeout(() => setCoverToast(null), 3500);
  };

  const handleToggleEnabled = () => {
    const updated = newsletterService.updateSettings({ newsletterEnabled: !settings.newsletterEnabled });
    setSettings(updated);
  };

  const handleToggleExitIntent = () => {
    const updated = newsletterService.updateSettings({ exitIntentEnabled: !settings.exitIntentEnabled });
    setSettings(updated);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = newsletterService.updateSettings(settings);
    setSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleDeleteSubscriber = (id: string) => {
    newsletterService.deleteSubscriber(id);
    setSubscribers(newsletterService.getSubscribers());
  };

  const handleAddTestSubscriber = async () => {
    const testNames = ['Aria', 'Eamon', 'Cassian', 'Lyra', 'Thorne'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomEmail = `${randomName.toLowerCase()}.${Math.floor(Math.random() * 900 + 100)}@reader-test.org`;
    await newsletterService.subscribe({
      firstName: randomName,
      email: randomEmail,
      source: 'admin_test_generator',
      consent: true,
    });
    setSubscribers(newsletterService.getSubscribers());
  };

  const handleExportCSV = () => {
    const csv = newsletterService.exportSubscribersCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `matthew_messmer_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maskEmailAddress = (emailStr: string): string => {
    if (!maskEmails) return emailStr;
    const [local, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    if (filterSource === 'all') return true;
    return sub.source.includes(filterSource);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Author Newsletter Administration"
    >
      <div className="relative w-full max-w-5xl bg-[#0f111a] border border-[#2b2e40] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232635] bg-[#0c0d14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-cinzel font-bold text-[#f5efeb]">
                Author Platform Console
              </h2>
              <p className="text-[11px] text-[#8e887a]">
                Admin → Newsletter & Subscriptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Tag */}
            <div className="px-3 py-1 bg-amber-950/40 border border-amber-700/50 rounded-full text-amber-300 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Newsletter Provider: Development Mode</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#858074] hover:text-[#f5efeb] hover:bg-[#1c1f2e] rounded-md transition-colors"
              aria-label="Close admin dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#232635] bg-[#0f111a] text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subscribers'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            <span>Subscribers</span>
            <span className="px-1.5 py-0.2 bg-[#25283a] rounded text-[10px] text-[#d4cdbf]">
              {subscribers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('covers')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'covers'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Book Covers & Art</span>
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'seo'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Google SEO & Discoverability</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            Provider Settings & Adapters
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-[#1a1c28] text-[#c5a059] border-t border-x border-[#2b2e40]'
                : 'text-[#9c9689] hover:text-[#f5efeb]'
            }`}
          >
            Future Campaigns Mockup
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {savedToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Newsletter configuration successfully updated and saved.</span>
            </div>
          )}

          {/* TAB: SEO & DISCOVERABILITY */}
          {activeTab === 'seo' && <AdminSeoDashboard />}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#141622] border border-[#26283b]">
                  <p className="text-xs text-[#8e887a] mb-1 font-medium">Provider Architecture</p>
                  <p className="text-lg font-cinzel font-bold text-[#f5efeb] capitalize">
                    {settings.newsletterProvider}
                  </p>
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    Local mock adapter active
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141622] border border-[#26283b]">
                  <p className="text-xs text-[#8e887a] mb-1 font-medium">Connection Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-lg font-cinzel font-bold text-[#f5efeb]">Connected</p>
                  </div>
                  <p className="text-[11px] text-[#8e887a] mt-1">
                    Frontend abstraction operational
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141622] border border-[#26283b]">
                  <p className="text-xs text-[#8e887a] mb-1 font-medium">Active Subscribers</p>
                  <p className="text-2xl font-cinzel font-bold text-[#c5a059] tabular-nums">
                    {stats.activeSubscribers}
                  </p>
                  <p className="text-[11px] text-[#8e887a] mt-1">
                    {stats.totalSubscribers} total registered
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141622] border border-[#26283b]">
                  <p className="text-xs text-[#8e887a] mb-1 font-medium">Last Subscription</p>
                  <p className="text-xs font-semibold text-[#f5efeb] truncate">
                    {stats.lastSubscription ? new Date(stats.lastSubscription).toLocaleDateString() : 'None yet'}
                  </p>
                  <p className="text-[11px] text-[#8e887a] mt-1">
                    {stats.lastSubscription ? new Date(stats.lastSubscription).toLocaleTimeString() : 'Awaiting signups'}
                  </p>
                </div>
              </div>

              {/* Toggles row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#131520] border border-[#242738] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#f5efeb]">
                      Newsletter Subscription Acceptance
                    </h4>
                    <p className="text-xs text-[#8e887a] mt-0.5">
                      Enable or disable reader subscriptions across all site locations.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleEnabled}
                    className="p-1 text-[#c5a059] cursor-pointer"
                  >
                    {settings.newsletterEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-[#131520] border border-[#242738] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#f5efeb]">
                      Exit-Intent Newsletter Prompt
                    </h4>
                    <p className="text-xs text-[#8e887a] mt-0.5">
                      Show gentle "Before you go..." overlay once per visitor session (default: off).
                    </p>
                  </div>
                  <button
                    onClick={handleToggleExitIntent}
                    className="p-1 cursor-pointer"
                  >
                    {settings.exitIntentEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Architectural Notice */}
              <div className="p-5 rounded-xl bg-[#11131c] border border-[#2b2e40] text-xs text-[#a6a092] space-y-2">
                <div className="flex items-center gap-2 text-[#c5a059] font-cinzel font-semibold">
                  <Server className="w-4 h-4" />
                  <span>Adapter Architecture & Security</span>
                </div>
                <p>
                  The newsletter frontend interacts solely through <code className="text-[#c5a059]">newsletterService</code>. API keys are strictly forbidden from client bundle exposure.
                  When you are ready to connect a live provider (Kit, Mailchimp, Brevo, Buttondown), configure environment credentials on your server proxy, switch the provider dropdown in Settings, and real subscriber synchronization takes over seamlessly.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIBERS */}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#232635]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#8e887a]">Filter Source:</span>
                    <select
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="bg-[#141622] border border-[#2b2e40] rounded px-2 py-1 text-xs text-[#e8e2d9]"
                    >
                      <option value="all">All Sources ({subscribers.length})</option>
                      <option value="homepage">Homepage</option>
                      <option value="footer">Footer</option>
                      <option value="abyssal">The Abyssal Current</option>
                      <option value="book">Book Modal</option>
                      <option value="about">About Page</option>
                      <option value="admin">Admin Generator</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setMaskEmails(!maskEmails)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#b0a99c] hover:text-[#f5efeb] px-2.5 py-1 rounded bg-[#161825] border border-[#2a2c3d] cursor-pointer"
                  >
                    {maskEmails ? <Eye className="w-3.5 h-3.5 text-[#c5a059]" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{maskEmails ? 'Reveal Emails' : 'Mask Emails (Privacy)'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddTestSubscriber}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1e2b] hover:bg-[#25293a] text-xs font-medium text-[#c5a059] border border-[#373a4f] rounded-md transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Generate Test Subscriber</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#d4b069] text-xs font-semibold text-[#0d0e14] rounded-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-[#242738] rounded-xl bg-[#12141e]">
                <table className="w-full text-left text-xs text-[#c4beaf]">
                  <thead className="bg-[#0b0c12] text-[#8e887a] uppercase text-[10px] tracking-wider border-b border-[#242738]">
                    <tr>
                      <th className="px-4 py-3">First Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Subscribed Date</th>
                      <th className="px-4 py-3">Source Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2030]">
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#736e63]">
                          No subscribers found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#181a28] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#f5efeb]">
                            {sub.firstName || 'Reader'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#ded8cb]">
                            {maskEmailAddress(sub.email)}
                          </td>
                          <td className="px-4 py-3 text-[#948f83]">
                            {new Date(sub.dateSubscribed).toLocaleDateString()} · {new Date(sub.dateSubscribed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] text-[#a8a295]">
                              {sub.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                sub.status === 'active'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1 text-[#787366] hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BOOK COVERS & ARTWORK */}
          {activeTab === 'covers' && (
            <div className="space-y-6">
              {coverToast && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{coverToast}</span>
                </div>
              )}

              <div className="p-5 rounded-xl bg-[#141724] border border-[#2b2e40] space-y-2 text-xs text-[#b8b2a3]">
                <div className="flex items-center gap-2 text-[#c5a059] font-cinzel font-semibold text-sm">
                  <ImageIcon className="w-4 h-4" />
                  <span>Official Cover Artwork Management</span>
                </div>
                <p>
                  The author website features bespoke digital artwork modeled after Matthew E. Messmer's real books. You can upload or replace any book with your original high-resolution graphic files (PNG, JPG, or WEBP) at any time. Changes take effect across the entire website immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BOOKS.map((book) => {
                  const hasCustom = !!coverImageService.getCover(book.id);
                  return (
                    <div
                      key={book.id}
                      className="p-5 rounded-xl bg-[#12141e] border border-[#242738] flex flex-col sm:flex-row gap-5 items-start justify-between"
                    >
                      <div className="shrink-0 mx-auto sm:mx-0">
                        <BookCoverArt book={book} size="md" showHoverEffect={false} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#c5a059] font-semibold">
                            {book.series} · Book {book.seriesOrder}
                          </span>
                          <h4 className="text-base font-cinzel font-bold text-[#f5efeb] leading-snug">
                            {book.title}
                          </h4>
                          {book.subtitle && (
                            <p className="text-xs text-[#9d978a] italic">
                              {book.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-[#8e887a] leading-relaxed">
                          <span className="font-semibold text-[#b5af9f]">Cover Elements: </span>
                          <span>{book.coverArtDescription || book.tagline}</span>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#c5a059] hover:bg-[#d6b169] text-[#0d0e14] text-xs font-cinzel font-bold tracking-wider uppercase rounded-md transition-colors cursor-pointer text-center">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{hasCustom ? 'Replace Image File' : 'Upload Cover File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(book.id, file);
                              }}
                            />
                          </label>

                          {hasCustom && (
                            <button
                              onClick={() => handleResetCover(book.id)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-[#373a4f] hover:bg-[#1b1e2c] text-[#a39e92] hover:text-[#f5efeb] text-[11px] rounded-md transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset to Default Art</span>
                            </button>
                          )}

                          <div className="text-[10px] text-center text-[#736e63]">
                            {hasCustom ? (
                              <span className="text-emerald-400 font-medium">● Custom image active</span>
                            ) : (
                              <span>Default digital art active</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                    Newsletter Provider Adapter
                  </label>
                  <select
                    value={settings.newsletterProvider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        newsletterProvider: e.target.value as NewsletterSettings['newsletterProvider'],
                      })
                    }
                    className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                  >
                    <option value="development">Development Mode (Local Storage Mock)</option>
                    <option value="kit">Kit (ConvertKit API)</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="buttondown">Buttondown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                    Audience / List ID
                  </label>
                  <input
                    type="text"
                    value={settings.newsletterListId}
                    onChange={(e) => setSettings({ ...settings, newsletterListId: e.target.value })}
                    className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.newsletterFromName}
                    onChange={(e) => setSettings({ ...settings, newsletterFromName: e.target.value })}
                    className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                    Reply-To Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.newsletterReplyTo}
                    onChange={(e) => setSettings({ ...settings, newsletterReplyTo: e.target.value })}
                    className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                  Consent Checkbox Prose
                </label>
                <input
                  type="text"
                  value={settings.newsletterConsentText}
                  onChange={(e) => setSettings({ ...settings, newsletterConsentText: e.target.value })}
                  className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b0a99c] mb-1">
                  Reader Success Message
                </label>
                <textarea
                  rows={2}
                  value={settings.newsletterSuccessMessage}
                  onChange={(e) => setSettings({ ...settings, newsletterSuccessMessage: e.target.value })}
                  className="w-full bg-[#131520] border border-[#2b2e40] text-xs text-[#f5efeb] rounded-lg px-3 py-2 outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b169] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer shadow-lg"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CAMPAIGNS MOCKUP (Per spec: Structure the system so the admin dashboard can eventually support drafts/scheduled/sent, without actually sending until real email provider is configured) */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="p-4 bg-[#141724] border border-[#2b2e40] rounded-xl text-xs text-[#b8b2a3]">
                <p className="font-semibold text-[#f5efeb] mb-1">
                  Campaign Composer Architecture (Draft Stage)
                </p>
                <p>
                  In accordance with the author platform specifications, sending live email blasts requires a connected production email provider (such as Kit or Mailchimp). Below is the staged structure for drafting announcements, subject line testing, and segment previews.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#11131c] border border-[#26283b] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                      Draft · Segment: All Breathwoven Readers
                    </span>
                    <h4 className="text-sm font-cinzel font-bold text-[#f5efeb] mt-0.5">
                      The Abyssal Current: First Map Engravings Revealed
                    </h4>
                    <p className="text-xs text-[#8e887a] mt-1">
                      Subject: "Carving 4,000 Fathoms into Walnut: A Texas Workshop Dispatch"
                    </p>
                  </div>
                  <span className="text-xs text-[#8e887a] bg-[#1a1c28] px-3 py-1 rounded">
                    Ready for Review
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131c] border border-[#26283b] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                      Scheduled · September 30, 2026
                    </span>
                    <h4 className="text-sm font-cinzel font-bold text-[#f5efeb] mt-0.5">
                      Autumn Book Club Guide: The King's Severance Discussion Prompts
                    </h4>
                    <p className="text-xs text-[#8e887a] mt-1">
                      Subject: "4 Questions to ask your reading circle about King Alden's oath"
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400/80 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-800/30">
                    Staged
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
