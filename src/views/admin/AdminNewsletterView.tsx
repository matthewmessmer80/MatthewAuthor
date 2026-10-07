import React, { useState, useEffect } from 'react';
import {
  ManagedNewsletter,
  NewsletterBlock,
  NewsletterProviderConfig,
  adminNewsletterService,
} from '../../services/adminNewsletterService';
import { bookService, ManagedBook } from '../../services/bookService';
import { newsletterService } from '../../services/newsletterService';
import { welcomeEmailService, validateTemplateVariables } from '../../services/welcomeEmailService';
import {
  NewsletterSubscriber,
  EmailEvent,
  WelcomeEmailType,
  WelcomeEmailTemplate,
  WelcomeTemplateVersion,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
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
  RotateCw,
  Search,
  Download,
  X,
  Shield,
  User,
  Sparkles,
  Inbox,
  ExternalLink,
  Edit3,
  FileText,
  CheckCheck,
  Code,
  Info,
  History,
} from 'lucide-react';

export const AdminNewsletterView: React.FC = () => {
  const { isAuthor, user, profile } = useAuth();
  const [subTab, setSubTab] = useState<
    'overview' | 'create' | 'drafts' | 'sent' | 'subscribers' | 'welcome-logs' | 'settings'
  >('overview');
  const [newsletters, setNewsletters] = useState<ManagedNewsletter[]>([]);
  const [allBooks, setAllBooks] = useState<ManagedBook[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(newsletterService.getSubscribers());
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // Author-managed welcome email templates state
  const [welcomeTemplates, setWelcomeTemplates] = useState<
    Record<WelcomeEmailType, WelcomeEmailTemplate>
  >(welcomeEmailService.getTemplates());
  const [selectedTemplateType, setSelectedTemplateType] =
    useState<WelcomeEmailType>('NEWSLETTER_WELCOME');
  const [editingSubject, setEditingSubject] = useState(
    welcomeEmailService.getTemplate('NEWSLETTER_WELCOME').subject
  );
  const [editingBody, setEditingBody] = useState(
    welcomeEmailService.getTemplate('NEWSLETTER_WELCOME').body
  );
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isRestoringTemplate, setIsRestoringTemplate] = useState(false);
  const [templateSaveToast, setTemplateSaveToast] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');

  // Version history state
  const [templateVersions, setTemplateVersions] = useState<
    Record<WelcomeEmailType, WelcomeTemplateVersion[]>
  >({
    NEWSLETTER_WELCOME: welcomeEmailService.getVersions('NEWSLETTER_WELCOME'),
    ACCOUNT_AND_NEWSLETTER_WELCOME: welcomeEmailService.getVersions('ACCOUNT_AND_NEWSLETTER_WELCOME'),
  });
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<WelcomeTemplateVersion | null>(null);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);

  // Unsaved changes confirmation modal
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);
  const [pendingTemplateChange, setPendingTemplateChange] = useState<WelcomeEmailType | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

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

  // Deletion modals state
  const [draftToDelete, setDraftToDelete] = useState<ManagedNewsletter | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);
  const [isDeletingSubscriber, setIsDeletingSubscriber] = useState(false);

  // Subscriber details modal state
  const [subscriberDetails, setSubscriberDetails] = useState<NewsletterSubscriber | null>(null);

  // Welcome email events state
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>(welcomeEmailService.getCachedEvents());
  const [welcomeSearch, setWelcomeSearch] = useState('');
  const [welcomeTemplatePreview, setWelcomeTemplatePreview] = useState<WelcomeEmailType | null>(null);
  const [testWelcomeEmail, setTestWelcomeEmail] = useState('mmessmer80@gmail.com');
  const [testWelcomeType, setTestWelcomeType] = useState<WelcomeEmailType>('ACCOUNT_AND_NEWSLETTER_WELCOME');
  const [isSendingTestWelcome, setIsSendingTestWelcome] = useState(false);
  const [testWelcomeResult, setTestWelcomeResult] = useState<string | null>(null);
  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);

  const providerConfig = adminNewsletterService.getProviderConfig();
  const activeSubscribers = subscribers.filter((s) => s.status === 'active');

  const loadData = async () => {
    const list = await adminNewsletterService.getNewsletters();
    const books = await bookService.getBooks();
    setNewsletters(list);
    setAllBooks(books);
    setSubscribers(newsletterService.getSubscribers());
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime subscriber updates
    const unsubSubs = newsletterService.subscribeListener((list) => {
      setSubscribers(list);
    });

    // Subscribe to realtime email event updates
    const unsubEvents = welcomeEmailService.subscribeEvents((events) => {
      setEmailEvents(events);
    });

    // Subscribe to realtime welcome template updates
    const unsubTemplates = welcomeEmailService.subscribeTemplates((tmpls) => {
      setWelcomeTemplates(tmpls);
    });

    // Subscribe to template versions updates
    const unsubVersions = welcomeEmailService.subscribeVersions((vers) => {
      setTemplateVersions(vers);
    });

    return () => {
      unsubSubs();
      unsubEvents();
      unsubTemplates();
      unsubVersions();
    };
  }, []);

  // Compute whether the current template has unsaved changes
  const activeTemplate = welcomeTemplates[selectedTemplateType];
  const hasUnsavedChanges = Boolean(
    activeTemplate &&
      (editingSubject !== activeTemplate.subject || editingBody !== activeTemplate.body)
  );

  // Synchronize editor inputs when selected template type changes or loads
  useEffect(() => {
    const cur = welcomeTemplates[selectedTemplateType];
    if (cur) {
      setEditingSubject(cur.subject);
      setEditingBody(cur.body);
    }
  }, [selectedTemplateType, welcomeTemplates]);

  // Window beforeunload listener for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Leave without saving?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSaveTemplate = async () => {
    if (!isAuthor) {
      alert('Only the Author is authorized to save welcome email templates.');
      return;
    }
    if (!editingSubject.trim()) {
      alert('Email subject line cannot be empty.');
      return;
    }
    if (!editingBody.trim()) {
      alert('Email message body cannot be empty.');
      return;
    }

    // Variable validation check
    const subjectVarValidation = validateTemplateVariables(editingSubject);
    const bodyVarValidation = validateTemplateVariables(editingBody);
    const unknownVars = [
      ...subjectVarValidation.unknownVariables,
      ...bodyVarValidation.unknownVariables.filter(
        (v) => !subjectVarValidation.unknownVariables.includes(v)
      ),
    ];

    if (unknownVars.length > 0) {
      const confirmSaveWithWarning = window.confirm(
        `⚠️ Unknown personalization variable(s) detected: ${unknownVars.map((v) => `{{${v}}}`).join(', ')}.\n\nThese variables are not recognized by the delivery engine and will remain unreplaced in dispatches.\n\nDo you want to save anyway?`
      );
      if (!confirmSaveWithWarning) {
        return;
      }
    }

    setIsSavingTemplate(true);
    try {
      const authorUid = user?.uid || 'author_admin';
      const authorName =
        profile?.displayName ||
        (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null) ||
        'Matthew E. Messmer';

      const saved = await welcomeEmailService.saveTemplate(
        {
          type: selectedTemplateType,
          subject: editingSubject,
          body: editingBody,
        },
        authorUid,
        authorName
      );

      setTemplateSaveToast(
        `Template "${saved.title}" saved successfully to authoritative storage. All future welcome emails will use this version.`
      );
      setTimeout(() => setTemplateSaveToast(null), 5000);
    } catch (err: any) {
      alert(`Failed to save template: ${err.message}`);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleRestoreTemplate = async () => {
    if (!isAuthor) return;
    setIsRestoringTemplate(true);
    try {
      const authorUid = user?.uid || 'author_admin';
      const authorName =
        profile?.displayName ||
        (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null) ||
        'Matthew E. Messmer';

      const restored = await welcomeEmailService.restoreDefaultTemplate(
        selectedTemplateType,
        authorUid,
        authorName
      );

      setEditingSubject(restored.subject);
      setEditingBody(restored.body);
      setShowRestoreModal(false);
      setTemplateSaveToast(
        `Default author template restored for "${restored.title}". Future emails will use original defaults.`
      );
      setTimeout(() => setTemplateSaveToast(null), 5000);
    } catch (err: any) {
      alert(`Failed to restore template: ${err.message}`);
    } finally {
      setIsRestoringTemplate(false);
    }
  };

  const handleRestoreVersion = async (version: WelcomeTemplateVersion) => {
    if (!isAuthor) return;
    setIsRestoringVersion(true);
    try {
      const authorUid = user?.uid || 'author_admin';
      const authorName =
        profile?.displayName ||
        (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null) ||
        'Matthew E. Messmer';

      const restored = await welcomeEmailService.restoreVersion(version, authorUid, authorName);
      setEditingSubject(restored.subject);
      setEditingBody(restored.body);
      setShowVersionHistoryModal(false);
      setVersionToRestore(null);
      setTemplateSaveToast(
        `Restored template version from ${new Date(version.savedAt).toLocaleDateString()}. All future welcome emails will use this version.`
      );
      setTimeout(() => setTemplateSaveToast(null), 5000);
    } catch (err: any) {
      alert(`Failed to restore version: ${err.message}`);
    } finally {
      setIsRestoringVersion(false);
    }
  };

  const insertVariable = (varName: string) => {
    setEditingBody((prev) => `${prev} {{${varName}}}`);
  };

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

  // Draft deletion handler
  const handleConfirmDeleteDraft = async () => {
    if (!draftToDelete) return;
    setIsDeletingDraft(true);
    try {
      await adminNewsletterService.deleteNewsletter(draftToDelete.id);
      if (currentNewsletter.id === draftToDelete.id) {
        setCurrentNewsletter({
          title: 'New Dispatch',
          subject: '',
          previewText: '',
          blocks: [
            { id: 'b1', type: 'heading', content: 'Greetings, reader.', level: 2 },
            { id: 'b2', type: 'text', content: 'Writing to share what is taking shape across the weave...' },
          ],
          status: 'DRAFT',
        });
      }
      setToastMessage(`Draft "${draftToDelete.subject || draftToDelete.title}" permanently deleted.`);
      setTimeout(() => setToastMessage(null), 3500);
      setDraftToDelete(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to delete draft: ${err.message}`);
    } finally {
      setIsDeletingDraft(false);
    }
  };

  // Subscriber deletion handler
  const handleConfirmDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;
    setIsDeletingSubscriber(true);
    try {
      await newsletterService.deleteSubscriber(subscriberToDelete.id);
      setToastMessage(`Subscriber "${subscriberToDelete.email}" permanently removed.`);
      setTimeout(() => setToastMessage(null), 3500);
      if (subscriberDetails?.id === subscriberToDelete.id) {
        setSubscriberDetails(null);
      }
      setSubscriberToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete subscriber: ${err.message}`);
    } finally {
      setIsDeletingSubscriber(false);
    }
  };

  const drafts = newsletters.filter((n) => n.status === 'DRAFT');
  const sentList = newsletters.filter((n) => n.status === 'SENT');

  // Filtered subscribers list
  const filteredSubscribers = subscribers.filter((s) => {
    const q = subscriberSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.source.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Author Newsletter & Campaign Dispatch
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Create literary dispatches, manage subscribers, and oversee verified broadcast campaigns.
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
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'create', label: 'Editor & Preview' },
            { id: 'drafts', label: 'Drafts', badge: drafts.length },
            { id: 'sent', label: 'Sent Dispatches', badge: sentList.length },
            { id: 'subscribers', label: 'Subscribers', badge: activeSubscribers.length },
            { id: 'welcome-logs', label: 'Welcome Dispatches', icon: true, badge: emailEvents.length },
            { id: 'settings', label: 'Provider Settings' },
          ] as const
        ).map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (subTab === 'welcome-logs' && tab.id !== 'welcome-logs' && hasUnsavedChanges) {
                  setPendingTabChange(tab.id);
                  setShowUnsavedModal(true);
                } else {
                  setSubTab(tab.id as any);
                }
              }}
              className={`px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1b1e2c] text-[#c5a059] border-t border-x border-[#2b2e40]'
                  : 'text-[#8e887a] hover:text-[#f5efeb]'
              }`}
            >
              {'icon' in tab && tab.icon && <Inbox className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {'badge' in tab && (
                <span className="px-1.5 py-0.2 bg-[#25283a] rounded text-[10px] text-[#d4cdbf]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Total Subscribers</div>
              <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">{subscribers.length}</div>
              <div className="text-[11px] text-[#6d685c] mt-1">Verified audience records</div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-emerald-400 font-cinzel">Active Subscribers</div>
              <div className="text-2xl font-cinzel font-bold text-emerald-300 mt-1">{activeSubscribers.length}</div>
              <div className="text-[11px] text-[#6d685c] mt-1">Eligible campaign recipients</div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Draft Newsletters</div>
              <div className="text-2xl font-cinzel font-bold text-[#c5a059] mt-1">{drafts.length}</div>
              <div className="text-[11px] text-[#6d685c] mt-1">Saved dispatches in progress</div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#8e887a] font-cinzel">Newsletters Sent</div>
              <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">{sentList.length}</div>
              <div className="text-[11px] text-[#6d685c] mt-1">Total completed broadcasts</div>
            </div>

            <div className="p-5 rounded-xl bg-[#11131c] border border-[#232635]">
              <div className="text-xs text-[#c5a059] font-cinzel">Welcome Dispatches</div>
              <div className="text-2xl font-cinzel font-bold text-[#c5a059] mt-1">
                {emailEvents.filter((e) => e.deliveryStatus === 'SENT').length}
              </div>
              <div className="text-[11px] text-[#6d685c] mt-1">Automated welcome emails</div>
            </div>
          </div>

          {/* Quick Actions & Recent Drafts */}
          <div className="p-6 rounded-xl bg-[#11131c] border border-[#232635] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                Recent Campaigns & Drafts ({newsletters.length})
              </h3>
              <button
                onClick={() => setSubTab('drafts')}
                className="text-xs font-cinzel text-[#c5a059] hover:underline cursor-pointer"
              >
                View All Drafts →
              </button>
            </div>

            {newsletters.length === 0 ? (
              <p className="text-xs text-[#7d776a] py-3">No newsletters or drafts available.</p>
            ) : (
              <div className="space-y-2.5">
                {newsletters.slice(0, 4).map((nl) => (
                  <div
                    key={nl.id}
                    className="p-3.5 bg-[#0d0e15] border border-[#212433] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-cinzel font-bold text-xs text-[#f5efeb]">
                        {nl.subject || nl.title}
                      </div>
                      <div className="text-[11px] text-[#7d776a] mt-0.5">
                        Status: <strong className="text-[#c5a059]">{nl.status}</strong> · Updated {new Date(nl.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentNewsletter(nl);
                          setSubTab('create');
                        }}
                        className="px-3 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors cursor-pointer"
                      >
                        Open Editor
                      </button>
                      {isAuthor && nl.status === 'DRAFT' && (
                        <button
                          onClick={() => setDraftToDelete(nl)}
                          className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-cinzel rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                          placeholder="Paragraph text..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs font-serif text-[#f5efeb] leading-relaxed focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'quote' && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={block.content || ''}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Quote content..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs italic text-[#f5efeb] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={block.quoteAttribution || ''}
                          onChange={(e) => updateBlock(block.id, { quoteAttribution: e.target.value })}
                          placeholder="Attribution (e.g. The King's Severance)..."
                          className="w-full px-3 py-1.5 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#a8a396] focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'button' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.buttonText || ''}
                          onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                          placeholder="Button label..."
                          className="w-full px-3 py-1.5 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        />
                        <input
                          type="url"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="Destination URL..."
                          className="w-full px-3 py-1.5 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'book' && (
                      <div className="space-y-2">
                        <label className="text-[11px] text-[#8e887a] block">Select Featured Book:</label>
                        <select
                          value={block.bookId || ''}
                          onChange={(e) => updateBlock(block.id, { bookId: e.target.value })}
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        >
                          {allBooks.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title} ({b.seriesName || 'Standalone'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {block.type === 'announcement' && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={block.content || ''}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Announcement copy..."
                          className="w-full px-3 py-2 bg-[#12141f] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Block Toolbar */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock('heading')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Type className="w-3 h-3" />
                    <span>Heading</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('text')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('quote')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Quote className="w-3 h-3" />
                    <span>Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('book')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Book Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('button')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Megaphone className="w-3 h-3" />
                    <span>CTA Button</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('divider')}
                    className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                    <span>Divider</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions with Clearly Labeled Delete Draft */}
            <div className="pt-4 border-t border-[#212334] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                {isAuthor && currentNewsletter.id && (
                  <button
                    type="button"
                    onClick={() => setDraftToDelete(currentNewsletter as ManagedNewsletter)}
                    className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-cinzel rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Draft</span>
                  </button>
                )}
              </div>

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
          <div className="flex items-center justify-between border-b border-[#212334] pb-3">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                Saved Draft Campaigns ({drafts.length})
              </h3>
              <p className="text-xs text-[#8e887a] mt-0.5">
                Drafts are saved in the authoritative database and can be edited, duplicated, or permanently deleted.
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
              className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Draft</span>
            </button>
          </div>

          {drafts.length === 0 ? (
            <div className="py-12 text-center text-[#7d776a] space-y-2">
              <Mail className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No draft campaigns currently saved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((nl) => (
                <div
                  key={nl.id}
                  className="p-4 bg-[#0d0e15] border border-[#212433] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                    {isAuthor && (
                      <button
                        onClick={() => setDraftToDelete(nl)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-cinzel rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Draft</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SENT DISPATCHES */}
      {subTab === 'sent' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
            Campaign Dispatch History
          </h3>
          {sentList.length === 0 ? (
            <p className="text-xs text-[#7d776a] py-6 text-center">No delivered campaigns recorded yet.</p>
          ) : (
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
                      className="px-3 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded cursor-pointer"
                    >
                      View Layout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUBSCRIBERS */}
      {subTab === 'subscribers' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212332] pb-4">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-[#f5efeb]">
                Subscriber List Management
              </h3>
              <p className="text-[11px] text-[#7d776a]">
                Authoritative reader registry. Authors have permissions to inspect details or delete subscribers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-cinzel font-semibold text-emerald-400">
                {activeSubscribers.length} Active Readers
              </span>
              <button
                onClick={() => {
                  const csv = newsletterService.exportSubscribersCSV();
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#7d776a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={subscriberSearch}
              onChange={(e) => setSubscriberSearch(e.target.value)}
              placeholder="Search by reader name or email..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#212332] text-[#8e887a] font-cinzel uppercase text-[11px] bg-[#0c0d12]">
                  <th className="py-2.5 px-3">First Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Welcome Dispatch</th>
                  <th className="py-2.5 px-3">Consent Date</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1e2c]">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7d776a]">
                      No subscribers matched your search query.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#151724] transition-colors">
                      <td className="py-2.5 px-3 text-[#f5efeb] font-medium">{s.firstName || 'Reader'}</td>
                      <td className="py-2.5 px-3 font-mono text-[#a8a396]">
                        {isAuthor ? s.email : s.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                            s.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold inline-flex items-center gap-1 ${
                            s.welcomeEmailStatus === 'SENT'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : s.welcomeEmailStatus === 'FAILED'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {s.welcomeEmailStatus === 'SENT' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Sent</span>
                            </>
                          ) : s.welcomeEmailStatus === 'FAILED' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Failed</span>
                            </>
                          ) : (
                            <span>{s.welcomeEmailStatus || 'Sent'}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#7d776a]">
                        {s.dateSubscribed ? new Date(s.dateSubscribed).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-2.5 px-3 text-[#7d776a] font-mono text-[11px]">
                        {s.source}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSubscriberDetails(s)}
                            className="px-2.5 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded cursor-pointer"
                          >
                            Details
                          </button>
                          {isAuthor && (
                            <button
                              onClick={() => setSubscriberToDelete(s)}
                              className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-cinzel rounded transition-colors flex items-center gap-1 cursor-pointer"
                              title="Delete Subscriber"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: WELCOME DISPATCHES */}
      {subTab === 'welcome-logs' && (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#212332] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Automatic Welcome Dispatches
                </h3>
              </div>
              <p className="text-xs text-[#8e887a] mt-1 max-w-2xl">
                Authoritative dispatch registry for automated welcome emails. Enforces strict idempotency and duplicate prevention for newsletter signups and reader registrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setWelcomeTemplatePreview('ACCOUNT_AND_NEWSLETTER_WELCOME')}
                className="px-3.5 py-2 bg-[#1b1e2c] hover:bg-[#25283c] border border-[#2e3146] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Templates</span>
              </button>
              <button
                type="button"
                onClick={() => setWelcomeTemplatePreview('SEND_TEST' as any)}
                className="px-3.5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Welcome</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0d0e15] border border-[#212433]">
              <div className="text-[11px] font-cinzel text-[#8e887a] uppercase tracking-wider">Total Dispatched</div>
              <div className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">{emailEvents.length}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                {emailEvents.filter((e) => e.deliveryStatus === 'SENT').length} Delivered
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e15] border border-[#212433]">
              <div className="text-[11px] font-cinzel text-[#8e887a] uppercase tracking-wider">Account + Newsletter</div>
              <div className="text-xl font-cinzel font-bold text-[#c5a059] mt-1">
                {emailEvents.filter((e) => e.emailType === 'ACCOUNT_AND_NEWSLETTER_WELCOME').length}
              </div>
              <div className="text-[11px] text-[#6e685c] mt-0.5">Combined reader registration emails</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e15] border border-[#212433]">
              <div className="text-[11px] font-cinzel text-[#8e887a] uppercase tracking-wider">Newsletter Only</div>
              <div className="text-xl font-cinzel font-bold text-[#d4cfc2] mt-1">
                {emailEvents.filter((e) => e.emailType === 'NEWSLETTER_WELCOME').length}
              </div>
              <div className="text-[11px] text-[#6e685c] mt-0.5">Public form subscriber welcomes</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0e15] border border-[#212433]">
              <div className="text-[11px] font-cinzel text-[#8e887a] uppercase tracking-wider">Idempotency Guarantee</div>
              <div className="text-xl font-cinzel font-bold text-emerald-400 mt-1">100% Active</div>
              <div className="text-[11px] text-[#6e685c] mt-0.5">Duplicates strictly suppressed</div>
            </div>
          </div>

          {/* AUTHOR-MANAGED WELCOME EMAIL TEMPLATES SECTION */}
          <div className="p-6 bg-[#0d0e15] border border-[#c5a059]/40 rounded-2xl space-y-6 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212433] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-base text-[#f5efeb] flex items-center gap-2 flex-wrap">
                    <span>Author-Managed Welcome Email Templates</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-cinzel font-bold bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30">
                      Authoritative Storage
                    </span>
                  </h4>
                  <p className="text-xs text-[#8e887a] mt-0.5">
                    Edit the live subject and message body. Saved templates are stored authoritatively in Firestore and immediately power all future welcome dispatches.
                  </p>
                </div>
              </div>

              {templateSaveToast && (
                <div className="px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{templateSaveToast}</span>
                </div>
              )}
            </div>

            {/* Template Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(
                [
                  {
                    type: 'NEWSLETTER_WELCOME' as WelcomeEmailType,
                    num: '1',
                    title: 'Newsletter Welcome',
                    subtitle: 'Triggered when a visitor signs up via newsletter form',
                  },
                  {
                    type: 'ACCOUNT_AND_NEWSLETTER_WELCOME' as WelcomeEmailType,
                    num: '2',
                    title: 'Account + Newsletter Welcome',
                    subtitle: 'Triggered when a reader creates a new website account',
                  },
                ] as const
              ).map((tab) => {
                const tmpl = welcomeTemplates[tab.type];
                const isSelected = selectedTemplateType === tab.type;
                const formattedDate = tmpl?.updatedAt
                  ? new Date(tmpl.updatedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }) +
                    ' at ' +
                    new Date(tmpl.updatedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'Default Template';

                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges && selectedTemplateType !== tab.type) {
                        setPendingTemplateChange(tab.type);
                        setShowUnsavedModal(true);
                      } else {
                        setSelectedTemplateType(tab.type);
                      }
                    }}
                    className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#151724] border-[#c5a059] shadow-lg shadow-[#c5a059]/10'
                        : 'bg-[#0a0b10] border-[#212433] hover:border-[#2e3146] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-cinzel font-bold text-[#f5efeb]">
                          {tab.num}. {tab.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold ${
                            tmpl?.isCustomized
                              ? 'bg-amber-950/70 border border-amber-700/50 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {tmpl?.isCustomized ? 'Status: Customized' : 'Status: Default'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7d776a] mt-1 leading-relaxed">
                        {tab.subtitle}
                      </p>
                    </div>

                    <div className="text-[10px] text-[#6d685c] pt-2 border-t border-[#1a1c2b] flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span>Last updated: {formattedDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8e887a]">
                        <span>Updated by: <strong className="text-[#aba597]">{tmpl?.updatedByName || 'Matthew E. Messmer'}</strong></span>
                        <span className="font-mono text-[#c5a059]">
                          {tmpl?.isCustomized ? 'Customized' : 'Default'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Template Editor Form */}
            <div className="p-5 bg-[#0a0b10] border border-[#212433] rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1b1d2a]">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#c5a059]" />
                  <span className="text-xs font-cinzel font-bold text-[#f5efeb]">
                    Editing: {welcomeTemplates[selectedTemplateType].title}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold bg-amber-950/80 border border-amber-600/60 text-amber-300 animate-pulse">
                      Unsaved Draft
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[11px] text-[#7d776a]">
                    Last modified{' '}
                    {new Date(welcomeTemplates[selectedTemplateType].updatedAt).toLocaleString()} by{' '}
                    <strong className="text-[#aba597]">
                      {welcomeTemplates[selectedTemplateType].updatedByName}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVersionHistoryModal(true)}
                    className="px-2.5 py-1 bg-[#161826] hover:bg-[#222538] border border-[#2b2e40] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="View version history and recover past drafts"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Version History ({(templateVersions[selectedTemplateType] || []).length})</span>
                  </button>
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-cinzel text-[#d4cfc2]">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  value={editingSubject}
                  onChange={(e) => setEditingSubject(e.target.value)}
                  placeholder="e.g. Welcome to Stories Woven Through Time"
                  className="w-full px-3.5 py-2.5 bg-[#12141f] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Personalization Variables Toolbar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-cinzel text-[#c5a059] flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>Personalization Variables (Click to insert into message):</span>
                  </label>
                  <span className="text-[10px] text-[#7d776a]">
                    Dynamically substituted with recipient details
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { tag: 'firstName', desc: "Reader's First Name" },
                    { tag: 'lastName', desc: "Reader's Last Name" },
                    { tag: 'username', desc: "Reader's Username" },
                    { tag: 'email', desc: 'Recipient Email' },
                    { tag: 'accountUrl', desc: 'Account Profile Link' },
                    { tag: 'unsubscribeUrl', desc: 'One-Click Unsubscribe Link' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="px-2.5 py-1 bg-[#161826] hover:bg-[#202336] border border-[#2d3148] hover:border-[#c5a059]/60 rounded-md text-[11px] font-mono text-[#c5a059] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={`Click to insert {{${v.tag}}} - ${v.desc}`}
                    >
                      <span>{`{{${v.tag}}}`}</span>
                      <span className="text-[10px] text-[#7d776a] font-sans">({v.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Variable Validation Warnings */}
              {(() => {
                const subValidation = validateTemplateVariables(editingSubject);
                const bodyValidation = validateTemplateVariables(editingBody);
                const unknownVars = [
                  ...subValidation.unknownVariables,
                  ...bodyValidation.unknownVariables.filter(
                    (v) => !subValidation.unknownVariables.includes(v)
                  ),
                ];
                if (unknownVars.length === 0) return null;
                return (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-lg text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-300">
                        Unknown personalization variable detected:
                      </div>
                      <div className="mt-0.5 space-x-1.5">
                        {unknownVars.map((v) => (
                          <span
                            key={v}
                            className="inline-block px-1.5 py-0.5 bg-amber-900/60 border border-amber-600/50 rounded font-mono text-[11px]"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#9c9484] mt-1">
                        Please check for spelling typos (e.g., use <code className="text-[#c5a059]">{`{{firstName}}`}</code>, <code className="text-[#c5a059]">{`{{lastName}}`}</code>, <code className="text-[#c5a059]">{`{{username}}`}</code>, <code className="text-[#c5a059]">{`{{email}}`}</code>, <code className="text-[#c5a059]">{`{{accountUrl}}`}</code>, or <code className="text-[#c5a059]">{`{{unsubscribeUrl}}`}</code>).
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Body Textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-cinzel text-[#d4cfc2]">
                  Email Message Body *
                </label>
                <textarea
                  rows={11}
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  placeholder="Enter the welcome dispatch wording..."
                  className="w-full p-3.5 bg-[#12141f] border border-[#2b2e40] rounded-lg text-xs font-mono text-[#f5efeb] leading-relaxed focus:outline-none focus:border-[#c5a059] resize-y"
                />
                <p className="text-[10px] text-[#6d685c]">
                  Blank lines separate paragraphs. Lines starting with bullet points (• or -) render as responsive structured lists. The author signature and branded header/footer are framed automatically.
                </p>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1b1d2a]">
                <div className="flex items-center gap-2">
                  {welcomeTemplates[selectedTemplateType].isCustomized && (
                    <button
                      type="button"
                      disabled={!isAuthor || isRestoringTemplate}
                      onClick={() => setShowRestoreModal(true)}
                      className="px-3 py-1.5 text-xs font-cinzel text-[#8e887a] hover:text-amber-300 hover:bg-amber-950/20 border border-transparent hover:border-amber-700/40 rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Default</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWelcomeTemplatePreview(selectedTemplateType)}
                    className="px-3.5 py-2 bg-[#161826] hover:bg-[#202336] border border-[#2e3146] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTestWelcomeType(selectedTemplateType);
                      setWelcomeTemplatePreview('SEND_TEST' as any);
                    }}
                    className="px-3.5 py-2 bg-[#1b1e2c] hover:bg-[#25283c] border border-[#2e3146] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isAuthor || isSavingTemplate}
                    onClick={handleSaveTemplate}
                    className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#c5a059]/15"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingTemplate ? 'Saving...' : 'Save Template'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#7d776a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={welcomeSearch}
              onChange={(e) => setWelcomeSearch(e.target.value)}
              placeholder="Search by recipient email or event ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          {/* Events table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#212332] text-[#8e887a] font-cinzel uppercase text-[11px] bg-[#0c0d12]">
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Email Type</th>
                  <th className="py-2.5 px-3">Delivery Status</th>
                  <th className="py-2.5 px-3">Event ID / Key</th>
                  <th className="py-2.5 px-3">Dispatched At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1e2c]">
                {emailEvents
                  .filter((ev) => {
                    const q = welcomeSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      ev.recipientEmail.toLowerCase().includes(q) ||
                      ev.recipientName.toLowerCase().includes(q) ||
                      ev.eventId.toLowerCase().includes(q) ||
                      ev.emailType.toLowerCase().includes(q)
                    );
                  })
                  .map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#151724] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="text-[#f5efeb] font-medium">{ev.recipientName || 'Reader'}</div>
                        <div className="font-mono text-[11px] text-[#c5a059]">{ev.recipientEmail}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                          ev.emailType === 'ACCOUNT_AND_NEWSLETTER_WELCOME'
                            ? 'bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30'
                            : 'bg-[#25283c] text-[#d4cfc2] border border-[#373b54]'
                        }`}>
                          {ev.emailType === 'ACCOUNT_AND_NEWSLETTER_WELCOME' ? 'Account + Newsletter' : 'Newsletter Only'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold inline-flex items-center gap-1 ${
                          ev.deliveryStatus === 'SENT'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : ev.deliveryStatus === 'FAILED'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}>
                          {ev.deliveryStatus === 'SENT' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Delivered</span>
                            </>
                          ) : ev.deliveryStatus === 'FAILED' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Failed</span>
                            </>
                          ) : (
                            <span>Pending</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#7d776a]">
                        {ev.eventId}
                      </td>
                      <td className="py-2.5 px-3 text-[#7d776a]">
                        {ev.sentAt ? new Date(ev.sentAt).toLocaleString() : new Date(ev.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setWelcomeTemplatePreview(ev.emailType)}
                            className="px-2.5 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded cursor-pointer"
                          >
                            Preview
                          </button>
                          {ev.deliveryStatus === 'FAILED' && (
                            <button
                              type="button"
                              disabled={retryingEventId === ev.eventId}
                              onClick={async () => {
                                setRetryingEventId(ev.eventId);
                                try {
                                  await welcomeEmailService.retryWelcomeEmail(ev.eventId);
                                  setToastMessage(`Dispatched retry for ${ev.recipientEmail}`);
                                  setTimeout(() => setToastMessage(null), 3000);
                                } catch (err: any) {
                                  alert(`Retry failed: ${err.message}`);
                                } finally {
                                  setRetryingEventId(null);
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-[11px] font-cinzel rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
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
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none"
              >
                <option value="development">Development / Direct SMTP</option>
                <option value="kit">Kit (formerly ConvertKit)</option>
                <option value="mailchimp">Mailchimp</option>
                <option value="brevo">Brevo (Sendinblue)</option>
                <option value="buttondown">Buttondown</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Sender Display Name
              </label>
              <input
                type="text"
                defaultValue={providerConfig.fromName}
                onBlur={(e) => adminNewsletterService.updateProviderConfig({ fromName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Sender Email Address
              </label>
              <input
                type="email"
                defaultValue={providerConfig.fromEmail}
                onBlur={(e) => adminNewsletterService.updateProviderConfig({ fromEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                Timezone for Scheduled Dispatches
              </label>
              <input
                type="text"
                defaultValue={providerConfig.siteTimeZone}
                onBlur={(e) => adminNewsletterService.updateProviderConfig({ siteTimeZone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* DRAFT DELETION CONFIRMATION MODAL */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-rose-900/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-950/70 border border-rose-800/40 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Delete Draft Campaign
                </h3>
                <p className="text-xs text-[#8e887a]">Permanent draft removal</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
              <p className="text-sm font-cinzel font-bold text-[#f5efeb]">
                "{draftToDelete.subject || draftToDelete.title}"
              </p>
              <p className="text-xs text-rose-300 font-medium">
                Are you sure you want to permanently delete this draft?
              </p>
              <p className="text-[11px] text-[#7d776a] leading-relaxed">
                This deletion will remove the persisted draft from the authoritative database. It will disappear immediately and will not return upon refreshing or logging in.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeletingDraft}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDraft}
                disabled={isDeletingDraft}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingDraft ? 'Deleting...' : 'Delete Draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBER DELETION CONFIRMATION MODAL */}
      {subscriberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-rose-900/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-950/70 border border-rose-800/40 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Delete Subscriber
                </h3>
                <p className="text-xs text-[#8e887a]">Authoritative reader removal</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
              <div className="text-sm font-cinzel font-bold text-[#f5efeb]">
                {subscriberToDelete.firstName || 'Reader'} &lt;{subscriberToDelete.email}&gt;
              </div>
              <p className="text-xs text-rose-300 font-medium">
                Are you sure you want to permanently delete this subscriber?
              </p>
              <p className="text-[11px] text-[#7d776a] leading-relaxed">
                This will remove the subscriber from the authoritative subscriber collection, subscriber counts, and campaign recipient selection. Refreshing the page will not restore them.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubscriberToDelete(null)}
                disabled={isDeletingSubscriber}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubscriber}
                disabled={isDeletingSubscriber}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSubscriber ? 'Deleting...' : 'Delete Subscriber'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBER DETAILS MODAL */}
      {subscriberDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#c5a059]" />
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Subscriber Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubscriberDetails(null)}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0a0b10] border border-[#1f2231] rounded-lg space-y-2">
                <div>
                  <span className="text-[#7d776a] text-[11px] block">First Name</span>
                  <span className="text-[#f5efeb] font-medium">{subscriberDetails.firstName || 'Reader'}</span>
                </div>
                <div>
                  <span className="text-[#7d776a] text-[11px] block">Email Address</span>
                  <span className="font-mono text-[#c5a059]">{subscriberDetails.email}</span>
                </div>
                <div>
                  <span className="text-[#7d776a] text-[11px] block">Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-cinzel bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                    {subscriberDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#7d776a] text-[11px] block">Consent & Subscription Date</span>
                  <span className="text-[#d4cfc2]">
                    {subscriberDetails.dateSubscribed ? new Date(subscriberDetails.dateSubscribed).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div>
                  <span className="text-[#7d776a] text-[11px] block">Opt-in Source</span>
                  <span className="text-[#d4cfc2] font-mono">{subscriberDetails.source}</span>
                </div>
                <div>
                  <span className="text-[#7d776a] text-[11px] block">Subscriber Record ID</span>
                  <span className="text-[#6d685c] font-mono text-[10px]">{subscriberDetails.id}</span>
                </div>

                <div className="pt-2.5 border-t border-[#1f2231]">
                  <span className="text-[#7d776a] text-[11px] block">Automatic Welcome Dispatch</span>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-cinzel font-semibold inline-flex items-center gap-1 ${
                        subscriberDetails.welcomeEmailStatus === 'SENT'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : subscriberDetails.welcomeEmailStatus === 'FAILED'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {subscriberDetails.welcomeEmailStatus === 'SENT' ? '✓ Delivered' : subscriberDetails.welcomeEmailStatus || 'Sent'}
                    </span>
                    <span className="text-[10px] text-[#8e887a]">
                      {subscriberDetails.welcomeEmailType === 'ACCOUNT_AND_NEWSLETTER_WELCOME'
                        ? 'Combined (Account + Newsletter)'
                        : 'Newsletter Welcome'}
                    </span>
                  </div>
                  {subscriberDetails.welcomeEmailSentAt && (
                    <div className="text-[10px] text-[#8e887a] mt-1">
                      Dispatched on {new Date(subscriberDetails.welcomeEmailSentAt).toLocaleString()}
                    </div>
                  )}
                  {subscriberDetails.welcomeEmailError && (
                    <div className="text-[10px] text-rose-400 mt-1">
                      Error: {subscriberDetails.welcomeEmailError}
                    </div>
                  )}
                  {subscriberDetails.welcomeEmailStatus === 'FAILED' && subscriberDetails.welcomeEmailEventId && (
                    <button
                      type="button"
                      disabled={retryingEventId === subscriberDetails.welcomeEmailEventId}
                      onClick={async () => {
                        setRetryingEventId(subscriberDetails.welcomeEmailEventId!);
                        try {
                          await welcomeEmailService.retryWelcomeEmail(subscriberDetails.welcomeEmailEventId!);
                          setToastMessage(`Welcome email retried for ${subscriberDetails.email}`);
                          setTimeout(() => setToastMessage(null), 3000);
                        } catch (e: any) {
                          alert(`Retry failed: ${e.message}`);
                        } finally {
                          setRetryingEventId(null);
                        }
                      }}
                      className="mt-2 px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded text-[11px] font-cinzel flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{retryingEventId === subscriberDetails.welcomeEmailEventId ? 'Retrying...' : 'Retry Welcome Dispatch'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    const sub = subscriberDetails;
                    setSubscriberDetails(null);
                    setSubscriberToDelete(sub);
                  }}
                  className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-cinzel rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Subscriber</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSubscriberDetails(null)}
                className="px-4 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded ml-auto cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH SEND CONFIRMATION MODAL */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-xl text-[#c5a059]">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Confirm Newsletter Broadcast
                </h3>
                <p className="text-xs text-[#8e887a]">Authoritative reader dispatch</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0b10] border border-[#212334] rounded-xl space-y-2 text-xs text-[#aba597]">
              <p>
                You are preparing to send <strong className="text-[#f5efeb]">"{currentNewsletter.subject}"</strong> to all verified active readers.
              </p>
              <div className="flex items-center justify-between text-[#c5a059] font-cinzel font-semibold pt-1">
                <span>Total Active Recipients:</span>
                <span>{activeSubscribers.length} Readers</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#d4cfc2] cursor-pointer">
              <input
                type="checkbox"
                checked={sendConsent}
                onChange={(e) => setSendConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#c5a059] focus:ring-0"
              />
              <span>
                I understand this newsletter will be submitted for dispatch to all {activeSubscribers.length} active subscribers.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!sendConsent || isSending}
                onClick={handleConfirmSend}
                className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isSending ? 'Dispatching...' : 'Confirm & Send Newsletter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WELCOME TEMPLATE PREVIEW MODAL */}
      {welcomeTemplatePreview && welcomeTemplatePreview !== ('SEND_TEST' as any) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Inbox className="w-5 h-5 text-[#c5a059]" />
                <div>
                  <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                    Automatic Welcome Email Template Preview
                  </h3>
                  <p className="text-[11px] text-[#8e887a]">
                    Verified layout dispatched automatically upon signup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWelcomeTemplatePreview(null)}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1.5 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Switcher */}
            <div className="flex items-center justify-between border-b border-[#212332] pb-3 shrink-0 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWelcomeTemplatePreview('ACCOUNT_AND_NEWSLETTER_WELCOME')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-cinzel transition-colors cursor-pointer ${
                    welcomeTemplatePreview === 'ACCOUNT_AND_NEWSLETTER_WELCOME'
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'bg-[#1b1e2c] text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  Scenario B: Account + Newsletter
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeTemplatePreview('NEWSLETTER_WELCOME')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-cinzel transition-colors cursor-pointer ${
                    welcomeTemplatePreview === 'NEWSLETTER_WELCOME'
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'bg-[#1b1e2c] text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  Scenario A: Newsletter Only
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded cursor-pointer ${previewDevice === 'desktop' ? 'bg-[#232635] text-[#c5a059]' : 'text-[#7d776a]'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded cursor-pointer ${previewDevice === 'mobile' ? 'bg-[#232635] text-[#c5a059]' : 'text-[#7d776a]'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Template Render */}
            {(() => {
              const isCurrentlyEdited = selectedTemplateType === welcomeTemplatePreview;
              const custom = isCurrentlyEdited
                ? { subject: editingSubject, body: editingBody }
                : undefined;
              const tmpl = welcomeEmailService.generateTemplates(
                {
                  firstName: 'Matthew',
                  lastName: 'Messmer',
                  username: 'mmessmer',
                  email: 'reader@example.com',
                },
                welcomeTemplatePreview,
                custom
              );
              return (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="p-3 bg-[#0a0b10] border border-[#212433] rounded-lg text-xs space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[#8e887a]">
                        Subject: <strong className="text-[#f5efeb]">{tmpl.subject}</strong>
                      </div>
                      <div className="flex items-center gap-1 bg-[#12141f] border border-[#212433] rounded p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('html')}
                          className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                            previewTab === 'html'
                              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                              : 'text-[#8e887a] hover:text-[#f5efeb]'
                          }`}
                        >
                          HTML View
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('text')}
                          className={`px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
                            previewTab === 'text'
                              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                              : 'text-[#8e887a] hover:text-[#f5efeb]'
                          }`}
                        >
                          Plain Text
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#6e685c]">
                      Test variable substitution: <code className="text-[#c5a059]">{`{{firstName}}`}</code> &rarr; Matthew · <code className="text-[#c5a059]">{`{{lastName}}`}</code> &rarr; Messmer · <code className="text-[#c5a059]">{`{{username}}`}</code> &rarr; mmessmer
                    </div>
                  </div>

                  {previewTab === 'html' ? (
                    <div className="flex justify-center bg-[#08090d] p-4 rounded-xl border border-[#1f2231]">
                      <div
                        className={`bg-[#0c0d12] rounded-xl overflow-hidden shadow-2xl transition-all duration-200 border border-[#282b3d] ${
                          previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-[620px]'
                        }`}
                      >
                        <iframe
                          srcDoc={tmpl.html}
                          title="Welcome Email Preview"
                          className="w-full h-[480px] border-none bg-[#0c0d12]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#0a0b10] border border-[#1f2231] rounded-xl font-mono text-xs text-[#d6d0c2] whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
                      {tmpl.text}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-[#212332] shrink-0 text-xs">
              <span className="text-[11px] text-[#7d776a]">
                Authoritative HTML template with responsive typography & dark background palette
              </span>
              <button
                type="button"
                onClick={() => setWelcomeTemplatePreview(null)}
                className="px-4 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND TEST WELCOME EMAIL MODAL */}
      {welcomeTemplatePreview === ('SEND_TEST' as any) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-[#c5a059]" />
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Send Test Welcome Dispatch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWelcomeTemplatePreview(null);
                  setTestWelcomeResult(null);
                }}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8e887a]">
              Send a test automated welcome email to your inbox to inspect the formatting, links, and styling.
            </p>

            {hasUnsavedChanges && (
              <div className="p-3 bg-amber-950/50 border border-amber-600/50 rounded-lg text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Note:</strong> This test uses your current unsaved draft wording.
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#d4cfc2] font-cinzel mb-1">
                  Welcome Dispatch Type
                </label>
                <select
                  value={testWelcomeType}
                  onChange={(e) => setTestWelcomeType(e.target.value as WelcomeEmailType)}
                  className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="ACCOUNT_AND_NEWSLETTER_WELCOME">
                    Scenario B: Combined Account & Newsletter Welcome
                  </option>
                  <option value="NEWSLETTER_WELCOME">
                    Scenario A: Newsletter Only Welcome
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[#d4cfc2] font-cinzel mb-1">
                  Recipient Test Email Address
                </label>
                <input
                  type="email"
                  value={testWelcomeEmail}
                  onChange={(e) => setTestWelcomeEmail(e.target.value)}
                  placeholder="author@example.com"
                  className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {testWelcomeResult && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{testWelcomeResult}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#0a0b10] border border-[#212334] rounded-lg text-[11px] text-[#8e887a] leading-relaxed">
              Will dispatch a real welcome message via the configured provider pipeline directly to <strong className="text-[#c5a059]">{testWelcomeEmail || 'your email'}</strong>.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWelcomeTemplatePreview(null);
                  setTestWelcomeResult(null);
                }}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingTestWelcome || !testWelcomeEmail.trim()}
                onClick={async () => {
                  setIsSendingTestWelcome(true);
                  setTestWelcomeResult(null);
                  try {
                    const customDraft = hasUnsavedChanges
                      ? { subject: editingSubject, body: editingBody }
                      : undefined;

                    const res = await welcomeEmailService.sendWelcomeEmail({
                      email: testWelcomeEmail.trim(),
                      firstName: 'Matthew',
                      lastName: 'Messmer',
                      username: 'mmessmer',
                      type: testWelcomeType,
                      subscriberId: `test_sub_${Date.now()}`,
                      triggerSource: 'author_admin_test',
                      customTemplate: customDraft,
                    });
                    setTestWelcomeResult(res.message);
                    setToastMessage(`Test dispatch complete to ${testWelcomeEmail}`);
                    setTimeout(() => setToastMessage(null), 3000);
                  } catch (err: any) {
                    alert(`Failed to send test: ${err.message}`);
                  } finally {
                    setIsSendingTestWelcome(false);
                  }
                }}
                className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTestWelcome ? 'Dispatching...' : `Send Test Email to: ${testWelcomeEmail || 'Recipient'}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE DEFAULT CONFIRMATION MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center gap-2.5 border-b border-[#212334] pb-3">
              <div className="p-2 bg-amber-950/50 border border-amber-700/40 rounded-lg text-amber-300">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Restore Default Template?
                </h3>
                <p className="text-[11px] text-[#8e887a]">Authoritative reset to default copy</p>
              </div>
            </div>

            <p className="text-xs text-[#d4cfc2] leading-relaxed">
              Are you sure you want to restore the default author wording for{' '}
              <strong className="text-[#c5a059]">
                {welcomeTemplates[selectedTemplateType].title}
              </strong>
              ?
            </p>

            <div className="p-3 bg-[#0a0b10] border border-[#212334] rounded-lg text-[11px] text-[#8e887a] leading-relaxed">
              This will overwrite your saved customized subject and body with the initial author defaults in Firestore. All future welcome emails will use the restored defaults.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestoringTemplate}
                onClick={handleRestoreTemplate}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRestoringTemplate ? 'Restoring...' : 'Confirm & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#c5a059]/15 border border-[#c5a059]/30 rounded-lg text-[#c5a059]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                    Version History — {welcomeTemplates[selectedTemplateType].title}
                  </h3>
                  <p className="text-[11px] text-[#8e887a]">
                    Review historical revisions and recover older template versions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVersionHistoryModal(false);
                  setVersionToRestore(null);
                }}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Current Active Version banner */}
              <div className="p-3.5 bg-[#151724] border border-[#c5a059]/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                      Currently Active
                    </span>
                    <span className="text-xs font-cinzel font-bold text-[#f5efeb]">
                      {welcomeTemplates[selectedTemplateType].subject}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e887a]">
                    {new Date(welcomeTemplates[selectedTemplateType].updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-[#6e685c]">
                  Saved by {welcomeTemplates[selectedTemplateType].updatedByName} · {welcomeTemplates[selectedTemplateType].isCustomized ? 'Customized' : 'Original Default'}
                </div>
              </div>

              {/* Historical revisions */}
              <div className="text-xs font-cinzel text-[#8e887a] uppercase pt-2">
                Prior Saved Versions ({(templateVersions[selectedTemplateType] || []).length})
              </div>

              {(templateVersions[selectedTemplateType] || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7d776a] bg-[#0a0b10] border border-[#212433] rounded-xl">
                  No prior versions recorded yet. Previous versions are saved automatically each time you update and save this template.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(templateVersions[selectedTemplateType] || []).map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3.5 bg-[#0a0b10] border border-[#212433] hover:border-[#2e3146] rounded-xl space-y-2 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-cinzel font-bold text-[#f5efeb]">
                            {ver.subject}
                          </div>
                          <div className="text-[11px] text-[#7d776a] mt-0.5">
                            Saved: <strong>{new Date(ver.savedAt).toLocaleString()}</strong> by{' '}
                            <span className="text-[#aba597]">{ver.savedByName}</span>
                            {ver.isDefault && (
                              <span className="ml-2 px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded text-[9px]">
                                Default Reset
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={isRestoringVersion}
                            onClick={() => handleRestoreVersion(ver)}
                            className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#c5a059] hover:text-[#0c0d12] text-xs font-cinzel text-[#c5a059] rounded-lg transition-colors cursor-pointer border border-[#2e3146] flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore This Version</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#12141f] rounded-lg text-[11px] font-mono text-[#a8a296] max-h-20 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-[#1e2030]">
                        {ver.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#212332] shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES WARNING MODAL */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-amber-600/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center gap-2.5 border-b border-[#212334] pb-3">
              <div className="p-2 bg-amber-950/50 border border-amber-700/40 rounded-lg text-amber-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Unsaved Changes
                </h3>
                <p className="text-[11px] text-[#8e887a]">
                  You have unsaved changes in this template draft
                </p>
              </div>
            </div>

            <p className="text-xs text-[#d4cfc2] leading-relaxed">
              You have unsaved changes to{' '}
              <strong className="text-[#c5a059]">
                {welcomeTemplates[selectedTemplateType].title}
              </strong>
              . Leave without saving?
            </p>

            <div className="p-3 bg-[#0a0b10] border border-[#212334] rounded-lg text-[11px] text-[#8e887a] leading-relaxed">
              If you leave now, your edits to the subject line or message body will be discarded and revert to the saved version.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setPendingTabChange(null);
                  setPendingTemplateChange(null);
                }}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg cursor-pointer"
              >
                Stay & Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  // Discard and proceed
                  if (pendingTabChange) {
                    setSubTab(pendingTabChange as any);
                    setPendingTabChange(null);
                  }
                  if (pendingTemplateChange) {
                    setSelectedTemplateType(pendingTemplateChange);
                    setPendingTemplateChange(null);
                  }
                  setShowUnsavedModal(false);
                }}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletterView;
