import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import { BookComment, ReportReason } from '../types';
import {
  MessageSquare,
  Send,
  Flag,
  CornerDownRight,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Sparkles,
} from 'lucide-react';

interface ReaderCommentsProps {
  bookId: string;
  bookTitle: string;
  bookSlug?: string;
  onOpenAuthModal?: () => void;
}

export const ReaderComments: React.FC<ReaderCommentsProps> = ({
  bookId,
  bookTitle,
  bookSlug,
  onOpenAuthModal,
}) => {
  const { user, profile, role, isEditor, isAuthor } = useAuth();
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Report modal state
  const [reportingComment, setReportingComment] = useState<BookComment | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const loadComments = async () => {
    try {
      const data = await commentService.getCommentsForBook(bookId, role, user?.uid);
      setComments(data);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [bookId, role, user?.uid]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const res = await commentService.postComment({
      bookId,
      bookTitle,
      bookSlug,
      userId: user.uid,
      userName: profile?.displayName || user.displayName || 'Reader',
      userEmail: user.email || '',
      userAvatar: profile?.photoURL || '',
      userRole: role,
      content: commentText.trim(),
    });

    setIsSubmitting(false);
    if (res.success) {
      setCommentText('');
      await loadComments();
      const isAutoApproved = role === 'AUTHOR' || role === 'EDITOR';
      setToastMessage(
        isAutoApproved
          ? 'Comment published!'
          : 'Thank you for sharing! Your comment was submitted and is pending review.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(res.error || 'Failed to post comment.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    const res = await commentService.postComment({
      bookId,
      bookTitle,
      bookSlug,
      userId: user.uid,
      userName: profile?.displayName || user.displayName || 'Reader',
      userEmail: user.email || '',
      userAvatar: profile?.photoURL || '',
      userRole: role,
      content: replyText.trim(),
      parentId,
    });

    setIsSubmittingReply(false);
    if (res.success) {
      setReplyText('');
      setReplyingToId(null);
      await loadComments();
      const isAutoApproved = role === 'AUTHOR' || role === 'EDITOR';
      setToastMessage(
        isAutoApproved
          ? 'Reply published!'
          : 'Your reply has been submitted and is pending review.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingComment || !user) return;

    setIsReporting(true);
    const res = await commentService.reportComment({
      commentId: reportingComment.id,
      bookId,
      bookTitle,
      reporterUserId: user.uid,
      reporterEmail: user.email || '',
      reason: reportReason,
      details: reportDetails,
    });

    setIsReporting(false);
    setReportingComment(null);
    setReportDetails('');

    if (res.success) {
      setToastMessage('Report submitted. Our moderation team will review this comment.');
      await loadComments();
    } else {
      setToastMessage('Could not submit report.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Group top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParentId = comments.reduce<Record<string, BookComment[]>>((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-[#10121b] border border-[#232635] rounded-2xl p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#212334] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Reader Discussion
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1c1e2d] text-[#c5a059] border border-[#c5a059]/30">
              {topLevelComments.length} {topLevelComments.length === 1 ? 'Thought' : 'Thoughts'}
            </span>
          </div>
          <h3 className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Join the Conversation
          </h3>
          <p className="text-xs sm:text-sm text-[#9e978b] mt-1 font-cormorant italic text-base">
            Share your thoughts, theories, and impressions on {bookTitle}.
          </p>
        </div>

        {/* User state in header */}
        <div className="text-xs text-[#8f897c]">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[#c5a059] font-cinzel font-medium">
                {profile?.displayName || user.displayName || user.email}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-cinzel tracking-wider bg-[#1a1d2c] border border-[#2c3044] text-[#a8a294]">
                {role}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="text-[#c5a059] hover:underline font-cinzel cursor-pointer"
            >
              Sign in to participate →
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-[#19221b] border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Comment Box */}
      <form onSubmit={handlePostComment} className="space-y-3">
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              user
                ? "Share your thoughts about this book..."
                : "Sign in as a Reader to share your thoughts about this book..."
            }
            rows={4}
            disabled={!user}
            className="w-full bg-[#141622] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none focus:ring-1 focus:ring-[#c5a059] rounded-xl p-4 text-sm text-[#e8e2d9] placeholder-[#6b665c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed resize-y"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-[#787367]">
            {user
              ? role === 'AUTHOR' || role === 'EDITOR'
                ? "Moderator post will be published immediately."
                : "New reader comments are held briefly for moderation."
              : "Registered readers can post, reply, and report comments."}
          </p>

          <div className="flex items-center gap-3">
            {!user ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-5 py-2.5 bg-[#1a1d2c] hover:bg-[#25283c] border border-[#373a50] text-[#c5a059] text-xs font-cinzel font-semibold tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
              >
                Sign In to Comment
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c5a059]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6 pt-4">
        {loading ? (
          <div className="text-center py-10 text-xs font-cinzel text-[#8f897c]">
            Loading discussion threads...
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#232635] rounded-xl p-6 text-sm text-[#8f897c] space-y-2">
            <MessageSquare className="w-8 h-8 text-[#5c574c] mx-auto" />
            <p className="font-cinzel text-[#dcd7cb]">No comments yet on this edition.</p>
            <p className="text-xs text-[#7d776b]">
              Be the first reader to start the discussion for {bookTitle}!
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = repliesByParentId[comment.id] || [];
            const isAuthorComment = comment.userRole === 'AUTHOR';
            const isEditorComment = comment.userRole === 'EDITOR';

            return (
              <div
                key={comment.id}
                className={`border rounded-xl p-5 sm:p-6 transition-colors ${
                  isAuthorComment
                    ? 'bg-[#141523] border-[#c5a059]/40 shadow-lg shadow-[#c5a059]/5'
                    : 'bg-[#12141e] border-[#222536]'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-cinzel uppercase shrink-0 ${
                        isAuthorComment
                          ? 'bg-[#c5a059] text-[#0c0d12]'
                          : isEditorComment
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'bg-[#212435] text-[#d6d0c4] border border-[#2e3146]'
                      }`}
                    >
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        comment.userName.charAt(0) || 'R'
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cinzel font-semibold text-sm text-[#f5efeb]">
                          {comment.userName}
                        </span>
                        {isAuthorComment && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-bold tracking-wider bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Author
                          </span>
                        )}
                        {isEditorComment && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase font-semibold tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            Editor
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#7d786d]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Moderation / State Tag */}
                  <div className="flex items-center gap-2">
                    {comment.status === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Moderation
                      </span>
                    )}
                    {comment.status === 'FLAGGED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Flagged
                      </span>
                    )}

                    {/* Report action for readers */}
                    {user && user.uid !== comment.userId && (
                      <button
                        onClick={() => setReportingComment(comment)}
                        title="Report inappropriate comment"
                        className="text-[#696459] hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                <div className="mt-3 text-sm text-[#d4cfc5] leading-relaxed whitespace-pre-wrap pl-12">
                  {comment.content}
                </div>

                {/* Actions: Reply */}
                <div className="mt-4 pt-3 border-t border-[#1b1e2c] pl-12 flex items-center gap-4 text-xs font-cinzel">
                  <button
                    onClick={() => {
                      if (!user) {
                        if (onOpenAuthModal) onOpenAuthModal();
                      } else {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                      }
                    }}
                    className="text-[#a8a396] hover:text-[#c5a059] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Inline Reply Input */}
                {replyingToId === comment.id && (
                  <div className="mt-4 ml-12 pt-3 border-t border-[#232637] space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.userName}...`}
                      rows={2}
                      className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#e8e2d9] resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 text-xs text-[#8f897c] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-1.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-md transition-colors disabled:opacity-50"
                      >
                        {isSubmittingReply ? 'Replying...' : 'Post Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="mt-4 ml-8 sm:ml-12 pl-4 border-l-2 border-[#2b2e42] space-y-3">
                    {replies.map((reply) => {
                      const isReplyAuthor = reply.userRole === 'AUTHOR';
                      const isReplyEditor = reply.userRole === 'EDITOR';

                      return (
                        <div
                          key={reply.id}
                          className={`p-3.5 rounded-lg border text-xs ${
                            isReplyAuthor
                              ? 'bg-[#181a28] border-[#c5a059]/30'
                              : 'bg-[#151724] border-[#222536]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-cinzel font-semibold text-[#f5efeb]">
                                {reply.userName}
                              </span>
                              {isReplyAuthor && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-cinzel uppercase font-bold bg-[#c5a059]/20 text-[#c5a059]">
                                  Author
                                </span>
                              )}
                              {isReplyEditor && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-cinzel uppercase bg-blue-500/20 text-blue-300">
                                  Editor
                                </span>
                              )}
                              <span className="text-[#6e695f] text-[10px]">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>

                            {user && user.uid !== reply.userId && (
                              <button
                                onClick={() => setReportingComment(reply)}
                                className="text-[#696459] hover:text-rose-400 p-0.5"
                                title="Report comment"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-[#ccc7bd] leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Report Inappropriate Comment</span>
              </div>
              <button
                onClick={() => setReportingComment(null)}
                className="text-[#807b70] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a8a396]">
              Help our editors keep the reading community respectful and constructive.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-[#c5a059] text-[#c9c4b7]">
              "{reportingComment.content.length > 120 ? reportingComment.content.slice(0, 120) + '...' : reportingComment.content}"
            </blockquote>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full bg-[#161825] border border-[#2e3146] rounded-lg px-3 py-2 text-xs text-[#e8e2d9] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="Spam">Spam / Unsolicited Promotion</option>
                  <option value="Harassment">Harassment or Abuse</option>
                  <option value="Offensive content">Offensive or Hate Speech</option>
                  <option value="Spoiler">Unmarked Major Spoiler</option>
                  <option value="Inappropriate content">Inappropriate / Off-Topic Content</option>
                  <option value="Other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for moderators..."
                  rows={3}
                  className="w-full bg-[#161825] border border-[#2e3146] rounded-lg p-3 text-xs text-[#e8e2d9] focus:outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingComment(null)}
                  className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-semibold tracking-wider uppercase rounded-lg transition-colors disabled:opacity-50"
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
