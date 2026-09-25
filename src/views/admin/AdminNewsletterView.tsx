import React, { useState, useEffect } from 'react';
import {
  ManagedNewsletter,
  NewsletterBlock,
  NewsletterProviderConfig,
  adminNewsletterService,
} from '../../services/adminNewsletterService';
import { bookService, ManagedBook } from '../../services/bookService';
import { newsletterService } from '../../services/newsletterService';
import {
  Mail,
  Plus,
  Send,
  Save,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  Trash2,
  Copy,
  Smartphone,
  Monitor,
  Settings,
  BookOpen,
  Image as ImageIcon,
  Type,
  Quote,
  Megaphone,
  Minus,
  Check,
  RotateCcw,
} from 'lucide-react';

export const AdminNewsletterView: React.FC = () => {
  const [subTab, setSubTab] = useState<'overview' | 'create' | 'drafts' | 'sent' | 'subscribers' | 'settings'>('overview');
  const [newsletters, setNewsletters] = useState<ManagedNewsletter[]>([]);
  const [allBooks, setAllBooks] = useState<ManagedBook[]>([]);
  const [currentNewsletter, setCurrentNewsletter] = useState<Partial<ManagedNewsletter>>({
    title: 'New Dispatch',
    subject: '',
    previewText: '',
    blocks: [
      { id: 'b1', type: 'heading', content: 'Greetings, reader.', level: 2 },
      { id: 'b2', type: 'text', content: 'Writing to share what is taking shape across the weave...' },
    ],
    status: 'DRAFT',
  });

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendConsent, setSendConsent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('mmessmer80@gmail.com');
  const [testSentToast, setTestSentToast] = useState<string | null>(null);

  const providerConfig = adminNewsletterService.getProviderConfig();
  const subscribers = newsletterService.getSubscribers();
  const activeSubscribers = subscribers.filter((s) => s.status === 'active');

  const loadData = async () => {
    const list = await adminNewsletterService.getNewsletters();
    const books = await bookService.getBooks();
    setNewsletters(list);
    setAllBooks(books);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    async function updatePreview() {
      const html = await adminNewsletterService.generateEmailHtml(currentNewsletter as ManagedNewsletter);
      setPreviewHtml(html);
    }
    updatePreview();
  }, [currentNewsletter]);

  const addBlock = (type: NewsletterBlock['type']) => {
    const newBlock: NewsletterBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'heading' ? 'Section Heading' : type === 'quote' ? 'Memorable quote...' : '',
      level: 2,
    };
    if (type === 'button') {
      newBlock.buttonText = 'Explore the Story';
      newBlock.url = 'https://matthewemessmer.com/books';
    }
    if (type === 'book' && allBooks.length > 0) {
      newBlock.bookId = allBooks[0].id;
    }

    setCurrentNewsletter((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock],
    }));
  };

  const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
    setCurrentNewsletter((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const removeBlock = (id: string) => {
    setCurrentNewsletter((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((b) => b.id !== id),
    }));
  };

  const handleSaveDraft = async () => {
    const saved = await adminNewsletterService.saveNewsletter(currentNewsletter);
    setToastMessage(`Draft "${saved.title}" saved.`);
    setTimeout(() => setToastMessage(null), 3000);
    loadData();
  };

  const handleSendTest = async () => {
    if (!testEmailAddress.trim()) return;
    const res = await adminNewsletterService.sendTestEmail(currentNewsletter.id || 'draft-temp', testEmailAddress);
    setTestSentToast(res.message);
    setTimeout(() => setTestSentToast(null), 4000);
  };

  const handleConfirmSend = async () => {
    if (!sendConsent || !currentNewsletter.id) return;
    setIsSending(true);
    try {
      // Save current changes first
      await adminNewsletterService.saveNewsletter(currentNewsletter);
      const res = await adminNewsletterService.sendCampaign(currentNewsletter.id);
      setIsSending(false);
      setShowSendModal(false);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 5000);
      loadData();
      setSubTab('sent');
    } catch (err: any) {
      setIsSending(false);
      alert(`Send Error: ${err.message}`);
    }
  };

  const drafts = newsletters.filter((n) => n.status === 'DRAFT');
  const sentList = newsletters.filter((n) => n.status === 'SENT');

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Author Newsletter & Campaign Dispatch
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Create literary dispatches, preview email client layouts, and send campaigns to active readers.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentNewsletter({
              title: `Dispatch #${newsletters.length + 1}`,
              subject: '',
              previewText: '',
              blocks: [
                { id: 'b1', type: 'heading', content: 'Greetings, reader.', level: 2 },
                { id: 'b2', type: 'text', content: 'Writing to share what is taking shape across the weave...' },
              ],
              status: 'DRAFT',
            });
            setSubTab('create');
          }}
          className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
        >
          <Plus className="w-4 h-4" />
          <span>Create Newsletter</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub navigation */}
      <div className="flex border-b border-[#232635] gap-1 text-xs font-cinzel uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            subTab === 'overview' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSubTab('create')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            subTab === 'create' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Editor & Preview
        </button>
        <button
          onClick={() => setSubTab('drafts')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            subTab === 'drafts' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          <span>Drafts</span>
          <span className="px-1.5 py-0.2 bg-[#25283a] rounded text-[10px] text-[#d4cdbf]">
            {drafts.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab('sent')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            subTab === 'sent' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          <span>Sent Dispatches</span>
          <span className="px-1.5 py-0.2 bg-[#25283a] rounded text-[10px] text-[#d4cdbf]">
            {sentList.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab('subscribers')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            subTab === 'subscribers' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          <span>Subscribers</span>
          <span className="px-1.5 py-0.2 bg-[#25283a] rounded text-[10px] text-[#d4cdbf]">
            {activeSubscribers.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab('settings')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
            subTab === 'settings' ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]' : 'text-[#8e887a] hover:text-[#f5efeb]'
          }`}
        >
          Provider Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Total Subscribers</div>
              <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
                {subscribers.length}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {activeSubscribers.length} Active Recipients
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Draft Newsletters</div>
              <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
                {drafts.length}
              </div>
              <div className="text-[11px] text-[#8e887a] mt-1">
                Ready for editing
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Newsletters Sent</div>
              <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
                {sentList.length}
              </div>
              <div className="text-[11px] text-[#8e887a] mt-1">
                Delivered to readers
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Sending Mode</div>
              <div className="text-lg font-cinzel font-bold text-[#c5a059] mt-1 uppercase">
                {providerConfig.sendingMode}
              </div>
              <div className="text-[11px] text-[#8e887a] mt-1">
                Provider: {providerConfig.provider}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-[#11131c] border border-[#232635] space-y-3">
            <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
              Recent Campaigns & Drafts
            </h3>
            <div className="space-y-2">
              {newsletters.slice(0, 4).map((nl) => (
                <div
                  key={nl.id}
                  className="p-3 bg-[#0d0e15] border border-[#212433] rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-cinzel font-bold text-xs text-[#f5efeb]">
                      {nl.subject || nl.title}
                    </div>
                    <div className="text-[11px] text-[#7d776a]">
                      Status: <strong className="text-[#c5a059]">{nl.status}</strong> · Updated {new Date(nl.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentNewsletter(nl);
                      setSubTab('create');
                    }}
                    className="px-3 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors cursor-pointer"
                  >
                    Open Editor
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / EDIT NEWSLETTER */}
      {subTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Content Block Editor */}
          <div className="lg:col-span-6 bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-6">
            <div className="space-y-4 border-b border-[#212334] pb-4">
              <div className="space-y-1">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={currentNewsletter.subject || ''}
                  onChange={(e) => setCurrentNewsletter((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Something New Is Being Woven"
                  className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Preview Text (Snippet in email clients)
                </label>
                <input
                  type="text"
                  value={currentNewsletter.previewText || ''}
                  onChange={(e) => setCurrentNewsletter((prev) => ({ ...prev, previewText: e.target.value }))}
                  placeholder="A look at what's happening behind the pages."
                  className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Block list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-semibold uppercase tracking-wider text-[#c5a059]">
                  Content Blocks ({currentNewsletter.blocks?.length || 0})
                </span>
              </div>

              <div className="space-y-3">
                {currentNewsletter.blocks?.map((block, idx) => (
                  <div
                    key={block.id}
                    className="p-4 bg-[#0a0b10] border border-[#212332] rounded-lg space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between text-xs text-[#8e887a] border-b border-[#1b1d2a] pb-2">
                      <span className="font-cinzel uppercase font-semibold text-[#c5a059]">
                        {idx + 1}. {block.type} Block
                      </span>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="text-[#6d685c] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Remove Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {block.type === 'heading' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.content || ''}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Heading text..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-sm text-[#f5efeb] focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'text' && (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={block.content || ''}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Enter paragraph text (separate with double enter)..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-sm text-[#f5efeb] focus:outline-none leading-relaxed font-serif"
                        />
                      </div>
                    )}

                    {block.type === 'button' && (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={block.buttonText || ''}
                          onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                          placeholder="Button label..."
                          className="px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        />
                        <input
                          type="url"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none font-mono"
                        />
                      </div>
                    )}

                    {block.type === 'quote' && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={block.content || ''}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Memorable quote text..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-sm text-[#f5efeb] focus:outline-none font-serif italic"
                        />
                        <input
                          type="text"
                          value={block.quoteAttribution || ''}
                          onChange={(e) => updateBlock(block.id, { quoteAttribution: e.target.value })}
                          placeholder="Attribution (e.g. Chapter VII, The King's Severance)"
                          className="w-full px-3 py-1.5 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#8e887a] focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'book' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] text-[#8e887a]">Select Book from Catalog</label>
                        <select
                          value={block.bookId || ''}
                          onChange={(e) => updateBlock(block.id, { bookId: e.target.value })}
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        >
                          {allBooks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title} ({b.seriesName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Block Toolbar */}
              <div className="pt-2 border-t border-[#212334] space-y-2">
                <span className="text-[11px] text-[#7d776a] uppercase font-cinzel block">
                  Add Content Block
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addBlock('heading')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#c5a059] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <Type className="w-3 h-3" />
                    <span>Heading</span>
                  </button>
                  <button
                    onClick={() => addBlock('text')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#d4cfc2] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Paragraph</span>
                  </button>
                  <button
                    onClick={() => addBlock('book')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#d4cfc2] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-[#c5a059]" />
                    <span>Book Feature</span>
                  </button>
                  <button
                    onClick={() => addBlock('quote')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#d4cfc2] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <Quote className="w-3 h-3" />
                    <span>Quote</span>
                  </button>
                  <button
                    onClick={() => addBlock('button')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#d4cfc2] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Button Link</span>
                  </button>
                  <button
                    onClick={() => addBlock('divider')}
                    className="px-2.5 py-1.5 bg-[#171926] hover:bg-[#23263a] text-xs text-[#d4cfc2] rounded border border-[#26283b] flex items-center gap-1 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                    <span>Divider</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#212334] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSendModal(true)}
                className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c5a059]/15"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Subscribers</span>
              </button>
            </div>
          </div>

          {/* Right: Live Email Client Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between bg-[#11131c] border border-[#232635] p-3 rounded-xl">
              <span className="text-xs font-cinzel text-[#c5a059] uppercase tracking-wider font-semibold">
                Live Email Client Preview
              </span>
              <div className="flex items-center gap-1 bg-[#0a0b10] p-1 rounded-lg border border-[#212332]">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-[#1e202d] text-[#f5efeb]' : 'text-[#7d776a]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Test Email Toolbar */}
            <div className="p-3 bg-[#11131c] border border-[#232635] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[#8e887a] font-cinzel shrink-0">Send Test:</span>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="admin@example.com"
                  className="px-2.5 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-xs text-[#f5efeb] flex-1 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSendTest}
                className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors cursor-pointer shrink-0"
              >
                Send Test
              </button>
            </div>

            {testSentToast && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/40 rounded text-emerald-200 text-xs">
                {testSentToast}
              </div>
            )}

            {/* Preview Frame */}
            <div
              className={`border border-[#32364a] rounded-xl overflow-hidden shadow-2xl bg-[#0c0d13] mx-auto transition-all ${
                previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
              }`}
            >
              <div className="p-2 bg-[#1a1c28] border-b border-[#2b2e40] text-[11px] text-[#8e887a] flex items-center justify-between">
                <span>From: {providerConfig.fromName} &lt;{providerConfig.fromEmail}&gt;</span>
                <span className="text-emerald-400 font-medium">Responsive HTML</span>
              </div>
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                className="w-full h-[600px] border-none bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DRAFTS */}
      {subTab === 'drafts' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
            Saved Draft Campaigns ({drafts.length})
          </h3>
          <div className="space-y-3">
            {drafts.map((nl) => (
              <div
                key={nl.id}
                className="p-4 bg-[#0d0e15] border border-[#212433] rounded-lg flex items-center justify-between"
              >
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                    {nl.subject || nl.title}
                  </h4>
                  <p className="text-xs text-[#8e887a] mt-0.5">{nl.previewText}</p>
                  <div className="text-[11px] text-[#6d685c] mt-1">
                    Last modified: {new Date(nl.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentNewsletter(nl);
                      setSubTab('create');
                    }}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded transition-colors cursor-pointer"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={async () => {
                      await adminNewsletterService.duplicateNewsletter(nl.id);
                      loadData();
                    }}
                    className="p-1.5 text-[#8e887a] hover:text-[#f5efeb] rounded"
                    title="Duplicate Draft"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SENT DISPATCHES */}
      {subTab === 'sent' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
            Campaign Dispatch History
          </h3>
          <div className="space-y-3">
            {sentList.map((nl) => (
              <div
                key={nl.id}
                className="p-4 bg-[#0d0e15] border border-[#212433] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 text-[10px] font-cinzel font-bold uppercase">
                      Delivered
                    </span>
                    <h4 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                      {nl.subject}
                    </h4>
                  </div>
                  <div className="text-xs text-[#8e887a] mt-1">
                    Dispatched on {nl.sentAt ? new Date(nl.sentAt).toLocaleString() : 'Recent'} · {nl.recipientCount || 0} Recipients
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#dcd7cb]">
                  <div>Delivered: <strong className="text-emerald-400">{nl.deliveredCount || nl.recipientCount}</strong></div>
                  <div>Opened: <strong className="text-[#c5a059]">{nl.openedCount || 0}</strong></div>
                  <button
                    onClick={() => {
                      setCurrentNewsletter(nl);
                      setSubTab('create');
                    }}
                    className="px-3 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded"
                  >
                    View Layout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIBERS */}
      {subTab === 'subscribers' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#212332] pb-3">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                Subscriber List Management
              </h3>
              <p className="text-[11px] text-[#7d776a]">
                Subscriber information is strictly protected and never exposed publicly.
              </p>
            </div>
            <div className="text-xs font-cinzel font-semibold text-emerald-400">
              {activeSubscribers.length} Active Readers
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#212332] text-[#8e887a] font-cinzel uppercase text-[11px]">
                  <th className="py-2.5 px-3">First Name</th>
                  <th className="py-2.5 px-3">Email (Privacy Masked)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Consent Date</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1e2c]">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#151724]">
                    <td className="py-2.5 px-3 text-[#f5efeb]">{s.firstName || 'Reader'}</td>
                    <td className="py-2.5 px-3 font-mono text-[#a8a396]">
                      {s.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[10px] font-cinzel uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#7d776a]">
                      {s.dateSubscribed || 'Recent'}
                    </td>
                    <td className="py-2.5 px-3 text-[#7d776a] font-mono text-[11px]">
                      {s.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {subTab === 'settings' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 sm:p-8 space-y-6">
          <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
            Newsletter Sending & Provider Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Newsletter Provider
              </label>
              <select
                value={providerConfig.provider}
                onChange={(e) =>
                  adminNewsletterService.updateProviderConfig({
                    provider: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none"
              >
                <option value="development">Development Mode (Local Simulator)</option>
                <option value="kit">Kit (formerly ConvertKit)</option>
                <option value="mailchimp">Mailchimp</option>
                <option value="brevo">Brevo (Sendinblue)</option>
                <option value="buttondown">Buttondown</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Sending Mode
              </label>
              <select
                value={providerConfig.sendingMode}
                onChange={(e) =>
                  adminNewsletterService.updateProviderConfig({
                    sendingMode: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none"
              >
                <option value="development">Development Mode (Safe simulation)</option>
                <option value="production">Production Mode (Requires verified sender)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                From Name
              </label>
              <input
                type="text"
                value={providerConfig.fromName}
                onChange={(e) => adminNewsletterService.updateProviderConfig({ fromName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                From Email Address
              </label>
              <input
                type="email"
                value={providerConfig.fromEmail}
                onChange={(e) => adminNewsletterService.updateProviderConfig({ fromEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Author Time Zone
              </label>
              <input
                type="text"
                value={providerConfig.siteTimeZone}
                onChange={(e) => adminNewsletterService.updateProviderConfig({ siteTimeZone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none"
              />
              <p className="text-[11px] text-[#7d776a]">E.g. America/Chicago (Central Time)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                List / Audience Identifier
              </label>
              <input
                type="text"
                value={providerConfig.listId}
                onChange={(e) => adminNewsletterService.updateProviderConfig({ listId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#11131c] border border-[#c5a059]/40 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                Confirm Campaign Dispatch
              </h3>
              <p className="text-xs text-[#a8a396]">
                You are preparing to send <strong className="text-[#f5efeb]">"{currentNewsletter.subject}"</strong> to all verified active readers.
              </p>
            </div>

            <div className="p-4 bg-[#0a0b10] border border-[#212332] rounded-xl text-xs space-y-2 text-[#b5af9f]">
              <div className="flex justify-between">
                <span>Active Recipients:</span>
                <strong className="text-emerald-400 font-mono">{activeSubscribers.length} subscribers</strong>
              </div>
              <div className="flex justify-between">
                <span>Sender:</span>
                <span>{providerConfig.fromName} &lt;{providerConfig.fromEmail}&gt;</span>
              </div>
              <div className="flex justify-between">
                <span>Sending Engine:</span>
                <span className="text-[#c5a059] uppercase">{providerConfig.provider} ({providerConfig.sendingMode})</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#161825] border border-[#26293a] text-xs text-[#dcd7cb] cursor-pointer">
              <input
                type="checkbox"
                checked={sendConsent}
                onChange={(e) => setSendConsent(e.target.checked)}
                className="mt-0.5 accent-[#c5a059] cursor-pointer"
              />
              <span>
                I understand this newsletter will be submitted for dispatch to all {activeSubscribers.length} active subscribers.
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSendModal(false);
                  setSendConsent(false);
                }}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!sendConsent || isSending}
                onClick={handleConfirmSend}
                className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                {isSending ? 'Dispatching...' : 'Confirm & Send Newsletter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
