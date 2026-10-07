import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { discussionService } from '../services/discussionService';
import { DiscussionThread } from '../types';
import { ReaderComments } from '../components/ReaderComments';
import { useSEO } from '../hooks/useSEO';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Clock,
  User,
  Shield,
  Trash2,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

const DISCUSSION_CATEGORIES = [
  'All Categories',
  'General Discussion',
  'The Breathwoven Cycle',
  'The Abyssal Current',
  'Theories & Lore',
  'Craft & Workshop',
];

interface DiscussionsViewProps {
  onOpenAuthModal?: () => void;
}

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({ onOpenAuthModal }) => {
  useSEO('discussions');
  const { user, profile, role, isEditor, isAuthor } = useAuth();
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Thread Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Discussion');
  const [newContent, setNewContent] = useState('');
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirm modal
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadThreads = async () => {
    const list = await discussionService.getDiscussions();
    setThreads(list);
  };

  useEffect(() => {
    loadThreads();
    const unsub = discussionService.subscribe((list) => setThreads(list));
    return () => unsub();
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!rulesAgreed) {
      setFormError('You must explicitly agree to the community rules before posting.');
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('Title and message content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await discussionService.createDiscussion({
      title: newTitle,
      category: newCategory,
      content: newContent,
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || 'Reader',
      authorEmail: user.email || '',
      authorAvatar: profile?.photoURL || '',
      authorRole: role,
      rulesAgreed: true,
    });

    setIsSubmitting(false);
    if (res.success && res.thread) {
      setNewTitle('');
      setNewContent('');
      setRulesAgreed(false);
      setIsCreateModalOpen(false);
      setSelectedThread(res.thread);
      setActionMessage('Discussion thread created successfully!');
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setFormError(res.error || 'Failed to create thread.');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!user) return;
    const res = await discussionService.deleteDiscussion(threadId, role, user.uid);
    if (res.success) {
      setDeletingThreadId(null);
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
      }
      setActionMessage('Discussion thread deleted.');
      setTimeout(() => setActionMessage(null), 3000);
      loadThreads();
    } else {
      setActionMessage(res.error || 'Failed to delete discussion.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    if (selectedCategory !== 'All Categories' && t.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#212334] pb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Community Board
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#1d2030] text-[#a8a396] border border-[#2e3146]">
              Readers & Above
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Community Discussions
          </h1>
          <p className="text-xs sm:text-sm text-[#a8a396] mt-1 font-cormorant italic text-lg max-w-2xl">
            A welcoming reader salon to discuss theories, lore intricacies, book themes, and craft artifacts directly with fellow enthusiasts and the author.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              if (onOpenAuthModal) onOpenAuthModal();
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#c5a059]/15 flex items-center gap-2 self-start md:self-end cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Start a Discussion</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#19221b] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Selected Thread Detail View */}
      {selectedThread ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedThread(null)}
            className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Discussions</span>
          </button>

          {/* Original Post */}
          <article className="bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1e2132] border border-[#2e324a] text-[#c5a059] font-cinzel font-bold flex items-center justify-center text-sm">
                  {selectedThread.authorName.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cinzel font-bold text-sm text-[#f5efeb]">
                      {selectedThread.authorName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold border ${
                        selectedThread.authorRole === 'AUTHOR'
                          ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                          : selectedThread.authorRole === 'EDITOR'
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                          : 'bg-[#181a28] text-[#a8a396] border-[#292c3f]'
                      }`}
                    >
                      {selectedThread.authorRole}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-[#191b29] text-[#c5a059] border border-[#2b2e40]">
                      {selectedThread.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7d786d]">
                    Posted {new Date(selectedThread.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Administrative delete privileges (Author & Editor or Thread creator) */}
              {(isAuthor || isEditor || (user && user.uid === selectedThread.authorId)) && (
                <button
                  onClick={() => setDeletingThreadId(selectedThread.id)}
                  className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-cinzel rounded-md flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Thread</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
                {selectedThread.title}
              </h2>
              <div className="text-sm sm:text-base text-[#d8d3c7] leading-relaxed whitespace-pre-wrap font-serif">
                {selectedThread.content}
              </div>
            </div>
          </article>

          {/* Conversation & Replies Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
              Discussion Replies
            </h3>
            <ReaderComments
              discussionId={selectedThread.id}
              discussionTitle={selectedThread.title}
              targetType="discussion"
              onOpenAuthModal={onOpenAuthModal}
            />
          </div>
        </div>
      ) : (
        /* Threads List & Discovery */
        <div className="space-y-6">
          {/* Controls: Category Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#11131c] border border-[#232635] rounded-xl p-4">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {DISCUSSION_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-cinzel rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'text-[#9e978a] hover:bg-[#181a28] hover:text-[#f5efeb]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#736e63] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e8e2d9] placeholder-[#6b665c]"
              />
            </div>
          </div>

          {/* Threads Grid */}
          <div className="space-y-3">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-16 bg-[#11131c] border border-dashed border-[#232635] rounded-xl p-6 text-sm text-[#8e887a] space-y-3">
                <MessageSquare className="w-8 h-8 text-[#5c574c] mx-auto" />
                <p className="font-cinzel text-[#dcd7cb]">No discussions match your filter.</p>
                <p className="text-xs">Be the first to create a discussion in this topic!</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    thread.pinned
                      ? 'bg-[#151726] border-[#c5a059]/40 shadow-sm'
                      : 'bg-[#11131c] border-[#232635] hover:border-[#c5a059]/30 hover:bg-[#141624]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {thread.pinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1 font-bold">
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#1a1c2a] text-[#a8a396] border border-[#2b2e3e]">
                        {thread.category}
                      </span>
                      <span className="text-[11px] text-[#787367]">
                        by {thread.authorName} ({thread.authorRole}) · {new Date(thread.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors truncate">
                      {thread.title}
                    </h3>

                    <p className="text-xs text-[#9d978a] line-clamp-2 leading-relaxed">
                      {thread.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="px-3 py-1.5 rounded-lg bg-[#181a28] border border-[#2a2d40] text-xs font-mono text-[#c5a059] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{thread.replyCount} Replies</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#212334] pb-4">
              <div>
                <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] font-bold">
                  Community Salon
                </span>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                  Start a New Discussion
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#807b70] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="text-xs font-cinzel font-bold text-[#dcd7cb] block mb-1">
                  Discussion Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Theories on the Severance Rite & Ancient Weavers"
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-cinzel font-bold text-[#dcd7cb] block mb-1">
                  Topic Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                >
                  <option value="General Discussion">General Discussion</option>
                  <option value="The Breathwoven Cycle">The Breathwoven Cycle</option>
                  <option value="The Abyssal Current">The Abyssal Current</option>
                  <option value="Theories & Lore">Theories & Lore</option>
                  <option value="Craft & Workshop">Craft & Workshop</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-cinzel font-bold text-[#dcd7cb] block mb-1">
                  Message Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your opening thoughts, questions, or theories for the reading community..."
                  rows={5}
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#e8e2d9] resize-y"
                  required
                />
              </div>

              {/* Requirement: When creating a discussion, users must explicitly check an agreement box acknowledging community rules */}
              <div
                onClick={() => setRulesAgreed(!rulesAgreed)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  rulesAgreed
                    ? 'bg-[#142319] border-emerald-500/50 text-emerald-200'
                    : 'bg-[#181a28] border-[#2b2e40] text-[#a8a396] hover:border-[#3d425c]'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-lg shrink-0 cursor-pointer"
                  aria-label="Agree to community rules"
                >
                  {rulesAgreed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-[#7d786d]" />
                  )}
                </button>
                <div className="text-xs leading-relaxed space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel font-bold text-[#f5efeb] text-xs uppercase tracking-wider">
                      Community Rules Agreement (Mandatory Gate)
                    </span>
                    <span className="text-[10px] font-mono text-[#c5a059] uppercase">
                      {rulesAgreed ? 'Acknowledged' : 'Required before submission'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#c9c4b7]">
                    I have read and explicitly agree to uphold the core decorum standards:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-medium text-[#ded9cf] pt-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span><strong>No hate speech</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span><strong>No bullying or harassment</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span><strong>No spam or advertising</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span><strong>Maintaining respectful discourse</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212334]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rulesAgreed || !newTitle.trim() || !newContent.trim()}
                  className="px-6 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#c5a059]/10"
                >
                  {isSubmitting ? 'Creating Thread...' : 'Create Discussion Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Thread Confirmation Modal */}
      {deletingThreadId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#11131c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Confirm Thread Deletion</span>
            </div>
            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to permanently delete this discussion thread and all its replies? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingThreadId(null)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteThread(deletingThreadId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
