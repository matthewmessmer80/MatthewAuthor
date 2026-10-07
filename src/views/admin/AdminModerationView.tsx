import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commentService } from '../../services/commentService';
import { BookComment, CommentReport, CommentStatus, RemovalReason } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle,
  EyeOff,
  Trash2,
  RotateCcw,
  Clock,
  MessageSquare,
  RefreshCw,
  Search,
  ExternalLink,
  Hourglass,
  Calendar,
  AlertCircle,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';

export const AdminModerationView: React.FC = () => {
  const { profile, user, role, isAuthor, isEditor } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'pending' | 'flagged' | 'holding' | 'expiring' | 'reports' | 'all'
  >('pending');
  const [comments, setComments] = useState<BookComment[]>([]);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Holding Removal Modal state
  const [removingComment, setRemovingComment] = useState<BookComment | null>(null);
  const [removalReason, setRemovalReason] = useState<RemovalReason>('Spam');
  const [removalNotes, setRemovalNotes] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Restore Confirmation Modal state
  const [restoringComment, setRestoringComment] = useState<BookComment | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Permanent Delete Modal state (Author only)
  const [purgingComment, setPurgingComment] = useState<BookComment | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const moderatorName = profile?.displayName || user?.displayName || `${role} Moderator`;

  const loadData = async () => {
    setLoading(true);
    try {
      // Run automatic scheduled purge check for expired holding comments
      await commentService.processExpiredRemovedComments({
        name: moderatorName,
        email: user?.email || '',
        userId: user?.uid || 'moderator',
      });

      const [comms, reps] = await Promise.all([
        commentService.getAllComments(),
        commentService.getAllReports(),
      ]);
      setComments(comms);
      setReports(reps);
    } catch (err) {
      console.warn('Failed to load moderation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubComments = commentService.subscribe((list) => {
      setComments(list);
      setLoading(false);
    });
    const unsubReports = commentService.subscribeReports((list) => {
      setReports(list);
    });
    return () => {
      unsubComments();
      unsubReports();
    };
  }, []);

  const handleUpdateStatus = async (commentId: string, status: CommentStatus) => {
    const res = await commentService.updateCommentStatus(commentId, status, moderatorName);
    if (res.success) {
      setActionSuccess(`Comment updated to ${status}.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  // 7-day holding initial removal
  const handleConfirmRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingComment || !user) return;

    setIsRemoving(true);
    const res = await commentService.removeCommentWithHolding({
      commentId: removingComment.id,
      moderatorName,
      reason: removalReason,
      notes: removalNotes,
      moderatorEmail: user.email || '',
      moderatorId: user.uid,
    });

    setIsRemoving(false);
    setRemovingComment(null);
    setRemovalNotes('');

    if (res.success) {
      setActionSuccess('Comment removed and moved to 7-day holding period.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  // Restore comment workflow
  const handleConfirmRestore = async () => {
    if (!restoringComment || !user) return;

    setIsRestoring(true);
    const res = await commentService.restoreComment({
      commentId: restoringComment.id,
      moderatorName,
      moderatorEmail: user.email || '',
      moderatorId: user.uid,
    });

    setIsRestoring(false);
    setRestoringComment(null);

    if (res.success) {
      setActionSuccess('Comment restored to approved state and deletion timers cleared.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  // Author immediate override: Delete permanently now
  const handleConfirmPurge = async () => {
    if (!purgingComment || !user || !isAuthor) return;

    setIsPurging(true);
    const res = await commentService.permanentlyDeleteComment({
      commentId: purgingComment.id,
      authorName: moderatorName,
      authorEmail: user.email || '',
      authorId: user.uid,
    });

    setIsPurging(false);
    setPurgingComment(null);

    if (res.success) {
      setActionSuccess('Comment permanently purged immediately with Author audit log recorded.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    const res = await commentService.resolveReport(reportId, action, moderatorName);
    if (res.success) {
      setActionSuccess(`Report marked as ${action.toLowerCase()}.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  // Calculations for remaining time
  const getTimeRemaining = (scheduledDeletionAt?: string | null) => {
    if (!scheduledDeletionAt) return '7 days remaining';
    const diffMs = new Date(scheduledDeletionAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired (Queued for permanent purge)';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h remaining`;
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m remaining`;
    }
    return `${diffMinutes}m remaining`;
  };

  const pendingComments = comments.filter((c) => c.status === 'PENDING' || (c.status as string)?.toLowerCase() === 'pending');
  const flaggedComments = comments.filter((c) => c.status === 'FLAGGED' || (c.status as string)?.toLowerCase() === 'flagged');
  const holdingComments = comments.filter((c) => c.status === 'REMOVED_PENDING_DELETION');
  // Expiring soon: comments in holding with <= 3 days remaining or sorted by nearest expiration
  const expiringSoonComments = [...holdingComments].sort((a, b) => {
    const timeA = a.scheduledDeletionAt ? new Date(a.scheduledDeletionAt).getTime() : 0;
    const timeB = b.scheduledDeletionAt ? new Date(b.scheduledDeletionAt).getTime() : 0;
    return timeA - timeB;
  });
  const activeReports = reports.filter((r) => r.status === 'PENDING_REVIEW' || (r.status as string)?.toLowerCase() === 'pending_review');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Community Health & Moderation
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-blue-500/10 border border-blue-500/30 text-blue-300">
              Editor & Author
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Comment & Report Moderation
          </h2>
          <p className="text-xs sm:text-sm text-[#8f897c] mt-1">
            Review reader thoughts, resolve flagged reports, manage the 7-day holding workflow for removed comments, and maintain community decorum.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue & Purge Expired</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#212334] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending ({pendingComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'flagged'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Flagged ({flaggedComments.length})</span>
        </button>

        {/* Filter: "Removed — Pending Deletion" */}
        <button
          onClick={() => setActiveTab('holding')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'holding'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5 text-rose-400" />
          <span>Removed — Pending Deletion ({holdingComments.length})</span>
        </button>

        {/* View: "Expiring Soon" */}
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'expiring'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Expiring Soon ({holdingComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Reports ({activeReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>All Comments ({comments.length})</span>
        </button>
      </div>

      {/* TAB: PENDING COMMENTS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c] space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[#f5efeb]">Queue Clear</p>
              <p>No comments awaiting moderation review.</p>
            </div>
          ) : (
            pendingComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-[#242738] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-[#c5a059]">
                      {comm.userName}
                    </span>
                    <span className="text-[11px] text-[#787367] ml-2">
                      on <em>{comm.bookTitle || comm.storyTitle || comm.discussionTitle || 'work'}</em> · {new Date(comm.createdAt).toLocaleString()}
                    </span>
                    {comm.thematicTier && (
                      <span className="block mt-1 text-[10px] text-amber-300 font-cinzel font-semibold">
                        Rating Tier: {comm.thematicTier}
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    PENDING
                  </span>
                </div>

                <p className="text-xs text-[#d6d1c7] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536]">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                  <button
                    onClick={() => setRemovingComment(comm)}
                    className="px-3 py-1.5 bg-[#171926] hover:bg-rose-950/30 text-rose-300 text-xs font-cinzel rounded-md border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove (7-Day Holding)</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'APPROVED')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-cinzel font-bold tracking-wider uppercase rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: FLAGGED COMMENTS */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          {flaggedComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c] space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[#f5efeb]">No Flagged Comments</p>
              <p>Discussion threads are clean of reported infractions.</p>
            </div>
          ) : (
            flaggedComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-rose-500/30 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-rose-400">
                      {comm.userName}
                    </span>
                    <span className="text-[11px] text-[#787367] ml-2">
                      on <em>{comm.bookTitle || comm.storyTitle || comm.discussionTitle || 'work'}</em> · {new Date(comm.createdAt).toLocaleString()}
                    </span>
                    {comm.moderationNotes && (
                      <span className="block text-[11px] text-rose-300/80 mt-1 italic">
                        {comm.moderationNotes}
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    FLAGGED ({comm.reportCount || 1} Reports)
                  </span>
                </div>

                <p className="text-xs text-[#d6d1c7] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536]">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                  <button
                    onClick={() => setRemovingComment(comm)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-cinzel rounded-md border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove (7-Day Holding)</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'APPROVED')}
                    className="px-4 py-1.5 bg-[#171926] hover:bg-[#202334] text-emerald-400 border border-emerald-500/30 text-xs font-cinzel rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Dismiss Flags & Approve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: REMOVED — PENDING DELETION (7-DAY HOLDING PERIOD) */}
      {activeTab === 'holding' && (
        <div className="space-y-4">
          <div className="bg-[#181a28] border border-rose-500/30 rounded-xl p-4 text-xs text-[#d6d0c4] flex items-start gap-3">
            <Hourglass className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-cinzel font-bold text-rose-300 block mb-0.5">
                7-Day Holding Period Policy
              </span>
              Removed comments are hidden from all Readers. Editors and Authors can inspect them or click <strong>Restore Comment</strong> (with confirmation) to return them to the discussion. After 7 days, they are permanently purged by the scheduled process. The Author also has an immediate override: <strong>Delete Permanently Now</strong>.
              <span className="block text-[11px] text-[#8e887a] mt-1 italic">
                Note: Viewing removed comments does not reset or alter the 7-day deletion countdown.
              </span>
            </div>
          </div>

          {holdingComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c] space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[#f5efeb]">No Comments in Holding</p>
              <p>No comments are currently pending scheduled deletion.</p>
            </div>
          ) : (
            holdingComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-rose-500/30 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-cinzel font-bold text-rose-400">
                        {comm.userName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        REMOVED — PENDING DELETION
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-[#191b28] text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(comm.scheduledDeletionAt)}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7d786d] mt-1">
                      Target: <em>{comm.bookTitle || comm.storyTitle || comm.discussionTitle || 'work'}</em> · Removed on {comm.removedAt ? new Date(comm.removedAt).toLocaleString() : 'Recently'} by {comm.removedBy || 'Moderator'}
                    </div>

                    <div className="text-[11px] text-rose-300/90 mt-1 font-cinzel font-semibold">
                      Reason on Record: <span className="text-[#f5efeb]">{comm.removalReason || 'Unspecified'}</span>
                      {comm.moderationNotes && (
                        <span className="text-[#9e978a] font-normal italic ml-2">
                          ({comm.moderationNotes})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#a8a396] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536] line-through opacity-80">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#1e202f]">
                  <span className="text-[10px] text-[#7d786d] font-mono">
                    Scheduled Deletion: {comm.scheduledDeletionAt ? new Date(comm.scheduledDeletionAt).toLocaleString() : 'Within 7 days'}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Restore Comment (Requires Confirmation) */}
                    <button
                      onClick={() => setRestoringComment(comm)}
                      className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] text-emerald-400 border border-emerald-500/30 text-xs font-cinzel rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Comment</span>
                    </button>

                    {/* Author Immediate Override: Delete Permanently Now */}
                    {isAuthor && (
                      <button
                        onClick={() => setPurgingComment(comm)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: EXPIRING SOON VIEW */}
      {activeTab === 'expiring' && (
        <div className="space-y-4">
          <div className="bg-[#181a28] border border-amber-500/30 rounded-xl p-4 text-xs text-[#d6d0c4] flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-cinzel font-bold text-amber-300 block mb-0.5">
                Expiring Soon Prioritized View
              </span>
              Comments closest to permanent deletion are ranked first. Once the scheduled time arrives, comments are automatically purged with a minimal Author-only audit record.
            </div>
          </div>

          {expiringSoonComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c]">
              No comments pending expiration.
            </div>
          ) : (
            expiringSoonComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-amber-500/30 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-cinzel font-bold text-[#f5efeb]">
                        {comm.userName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeRemaining(comm.scheduledDeletionAt)}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7d786d] mt-1">
                      Reason: <strong className="text-rose-300">{comm.removalReason || 'Unspecified'}</strong> · Removed by {comm.removedBy || 'Moderator'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#a8a396] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536]">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#1e202f]">
                  <span className="text-[10px] text-[#7d786d] font-mono">
                    Deletion At: {comm.scheduledDeletionAt ? new Date(comm.scheduledDeletionAt).toLocaleString() : 'Soon'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRestoringComment(comm)}
                      className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] text-emerald-400 border border-emerald-500/30 text-xs font-cinzel rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Comment</span>
                    </button>

                    {isAuthor && (
                      <button
                        onClick={() => setPurgingComment(comm)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c]">
              No report logs recorded.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#12141e] border border-[#242738] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-rose-400">
                      Reason: {rep.reason}
                    </span>
                    <span className="text-[11px] text-[#8f897c] ml-2">
                      Reported by {rep.reporterEmail || 'Reader'} on {new Date(rep.createdAt).toLocaleString()}
                    </span>
                    {rep.details && (
                      <p className="text-[11px] text-[#a8a396] mt-1">
                        Note: {rep.details}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                      rep.status === 'PENDING_REVIEW'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="bg-[#151724] p-3 rounded-lg border border-[#222536] text-xs text-[#c9c4b7]">
                  <span className="text-[10px] text-[#706b60] uppercase font-cinzel block mb-1">
                    Reported Comment Content:
                  </span>
                  "{rep.commentContent}"
                </div>

                {rep.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                      className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] text-[#a8a396] text-xs font-cinzel rounded-md border border-[#2b2e40]"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => {
                        const targetComm = comments.find((c) => c.id === rep.commentId);
                        handleResolveReport(rep.id, 'RESOLVED');
                        if (targetComm) {
                          setRemovingComment(targetComm);
                        }
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-md shadow-md"
                    >
                      Resolve & Move to 7-Day Holding
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: ALL COMMENTS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-[#d6d0c4]">
              <thead className="bg-[#161825] border-b border-[#242738] text-[11px] font-cinzel text-[#8f897c] uppercase">
                <tr>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Target Work</th>
                  <th className="py-3 px-4">Content</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e202f]">
                {comments.map((comm) => (
                  <tr key={comm.id} className="hover:bg-[#151724]">
                    <td className="py-3 px-4 font-cinzel text-[#f5efeb] whitespace-nowrap">
                      {comm.userName}
                    </td>
                    <td className="py-3 px-4 text-[#c5a059] whitespace-nowrap">
                      {comm.bookTitle || comm.storyTitle || comm.discussionTitle || 'General'}
                    </td>
                    <td className="py-3 px-4 text-[#a8a396] max-w-xs truncate">
                      "{comm.content}"
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                          comm.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : comm.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : comm.status === 'REMOVED_PENDING_DELETION'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {comm.status === 'REMOVED_PENDING_DELETION' ? 'HOLDING' : comm.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {comm.status === 'REMOVED_PENDING_DELETION' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setRestoringComment(comm)}
                            className="px-2 py-1 text-[11px] font-cinzel text-emerald-400 hover:underline"
                          >
                            Restore
                          </button>
                          {isAuthor && (
                            <button
                              onClick={() => setPurgingComment(comm)}
                              className="px-2 py-1 text-[11px] font-cinzel text-rose-400 hover:underline"
                            >
                              Purge
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemovingComment(comm)}
                          className="px-2.5 py-1 text-[11px] font-cinzel text-rose-400 hover:bg-rose-950/30 rounded border border-rose-500/30"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Initial Removal Modal (7-Day Holding) */}
      {removingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#11131c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Remove Comment (7-Day Holding Period)</span>
              </div>
              <button
                onClick={() => setRemovingComment(null)}
                className="text-[#807b70] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a8a396]">
              Per policy, removing this comment does <strong>not</strong> permanently erase it right away. It enters a <strong>7-Day Holding Period</strong> (hidden from public readers) where Editors and Authors can inspect or restore it before permanent deletion.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-rose-500 text-[#c9c4b7]">
              "{removingComment.content.length > 120 ? removingComment.content.slice(0, 120) + '...' : removingComment.content}"
            </blockquote>

            <form onSubmit={handleConfirmRemoval} className="space-y-4">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Removal Reason (Required)
                </label>
                <select
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value as RemovalReason)}
                  className="w-full bg-[#161825] border border-[#2e3146] rounded-lg px-3 py-2 text-xs text-[#e8e2d9] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="Spam">Spam / Advertising</option>
                  <option value="Harassment">Harassment / Bullying</option>
                  <option value="Hate Speech">Hate Speech</option>
                  <option value="Off-Topic">Off-Topic / Disruptive</option>
                  <option value="Inappropriate content">Inappropriate Content</option>
                  <option value="Spoiler">Unmarked Major Spoiler</option>
                  <option value="Other">Other Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Moderator Notes (Optional)
                </label>
                <textarea
                  value={removalNotes}
                  onChange={(e) => setRemovalNotes(e.target.value)}
                  placeholder="Notes for editorial team audit..."
                  rows={2}
                  className="w-full bg-[#161825] border border-[#2e3146] rounded-lg p-3 text-xs text-[#e8e2d9] focus:outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRemovingComment(null)}
                  className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemoving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-semibold tracking-wider uppercase rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRemoving ? 'Processing...' : 'Confirm 7-Day Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Comment Confirmation Modal */}
      {restoringComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#11131c] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-cinzel font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Restore Comment to Approved State</span>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              Are you sure you want to restore this comment by <strong>{restoringComment.userName}</strong>? This will clear all 7-day deletion timers and return it to public visibility.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-emerald-500 text-[#c9c4b7]">
              "{restoringComment.content.length > 100 ? restoringComment.content.slice(0, 100) + '...' : restoringComment.content}"
            </blockquote>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoringComment(null)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors"
              >
                {isRestoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Now Confirmation Modal (Author Override Only) */}
      {purgingComment && isAuthor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#11131c] border border-rose-600 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Author Override: Delete Permanently Now</span>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              As the Author, you have the immediate authority to bypass the remaining 7-day holding period and <strong>permanently purge</strong> this comment immediately. Only a minimal Author-only audit log will be retained.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-rose-600 text-[#c9c4b7]">
              "{purgingComment.content.length > 100 ? purgingComment.content.slice(0, 100) + '...' : purgingComment.content}"
            </blockquote>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPurgingComment(null)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={isPurging}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors"
              >
                {isPurging ? 'Purging...' : 'Delete Permanently Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
