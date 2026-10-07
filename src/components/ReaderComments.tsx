import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import {
  BookComment,
  ReportReason,
  RemovalReason,
  ThematicTier,
} from '../types';
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
  Award,
  Star,
  Trash2,
  Bookmark,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

export const THEMATIC_TIERS: {
  tier: ThematicTier;
  shortLabel: string;
  score: number;
  badgeClass: string;
  dotColor: string;
  description: string;
}[] = [
  {
    tier: 'Unputdownable / Masterpiece',
    shortLabel: 'Masterpiece',
    score: 5,
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotColor: '#f59e0b',
    description: 'Highest acclaim · Could not put it down',
  },
  {
    tier: 'Deeply Captivating / Essential',
    shortLabel: 'Essential',
    score: 4,
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    dotColor: '#a855f7',
    description: 'Deeply moving lore and unforgettable characters',
  },
  {
    tier: 'Rich & Atmospheric / Recommended',
    shortLabel: 'Recommended',
    score: 3,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotColor: '#10b981',
    description: 'Woven prose and resonant worldbuilding',
  },
  {
    tier: 'Intriguing / Worth Reading',
    shortLabel: 'Worth Reading',
    score: 2,
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    dotColor: '#38bdf8',
    description: 'Engaging premise with memorable moments',
  },
  {
    tier: 'Not for Me',
    shortLabel: 'Not for Me',
    score: 1,
    badgeClass: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    dotColor: '#a8a29e',
    description: 'Pacing or style did not align with personal taste',
  },
];

interface ReaderCommentsProps {
  bookId?: string;
  bookTitle?: string;
  bookSlug?: string;
  storyId?: string;
  storyTitle?: string;
  discussionId?: string;
  discussionTitle?: string;
  targetType?: 'book' | 'story' | 'discussion';
  onOpenAuthModal?: () => void;
}

export const ReaderComments: React.FC<ReaderCommentsProps> = ({
  bookId,
  bookTitle,
  bookSlug,
  storyId,
  storyTitle,
  discussionId,
  discussionTitle,
  targetType = bookId ? 'book' : storyId ? 'story' : 'discussion',
  onOpenAuthModal,
}) => {
  const { user, profile, role, isEditor, isAuthor } = useAuth();
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review & Thematic Tier
  const isBookContext = targetType === 'book';
  const [postMode, setPostMode] = useState<'review' | 'comment'>(isBookContext ? 'review' : 'comment');
  const [selectedTier, setSelectedTier] = useState<ThematicTier>('Unputdownable / Masterpiece');
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  // Administrative instant permanent delete state (Editor & Author)
  const [permanentlyDeletingComment, setPermanentlyDeletingComment] = useState<BookComment | null>(null);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Report modal state
  const [reportingComment, setReportingComment] = useState<BookComment | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // 7-day holding removal modal state (Editor / Author only)
  const [removingComment, setRemovingComment] = useState<BookComment | null>(null);
  const [removalReason, setRemovalReason] = useState<RemovalReason>('Spam');
  const [removalNotes, setRemovalNotes] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const displayTitle = bookTitle || storyTitle || discussionTitle || 'this work';

  const loadComments = async () => {
    try {
      let data: BookComment[] = [];
      if (targetType === 'story' && storyId) {
        data = await commentService.getCommentsForStory(storyId, role, user?.uid);
      } else if (targetType === 'discussion' && discussionId) {
        data = await commentService.getCommentsForDiscussion(discussionId, role, user?.uid);
      } else if (bookId) {
        data = await commentService.getCommentsForBook(bookId, role, user?.uid);
      }
      setComments(data);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [bookId, storyId, discussionId, role, user?.uid]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const isReviewSubmission = isBookContext && postMode === 'review';
    const currentTierObj = THEMATIC_TIERS.find((t) => t.tier === selectedTier);
    const thematicScore = currentTierObj ? currentTierObj.score : 5;

    const res = await commentService.postComment({
      bookId,
      bookTitle,
      bookSlug,
      storyId,
      storyTitle,
      discussionId,
      discussionTitle,
      targetType,
      userId: user.uid,
      userName: profile?.displayName || user.displayName || 'Reader',
      userEmail: user.email || '',
      userAvatar: profile?.photoURL || '',
      userRole: role,
      content: commentText.trim(),
      isReview: isReviewSubmission,
      thematicTier: isReviewSubmission ? selectedTier : undefined,
      thematicScore: isReviewSubmission ? thematicScore : undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setCommentText('');
      await loadComments();
      const isAutoApproved = role === 'AUTHOR' || role === 'EDITOR';
      setToastMessage(
        isAutoApproved
          ? isReviewSubmission
            ? 'Review published!'
            : 'Comment published!'
          : 'Thank you for sharing! Your submission is pending brief review.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(res.error || 'Failed to submit.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePermanentDeleteSubmit = async () => {
    if (!permanentlyDeletingComment || !user) return;
    setIsDeletingPermanently(true);

    const res = await commentService.permanentlyDeleteComment({
      commentId: permanentlyDeletingComment.id,
      authorName: profile?.displayName || user.displayName || 'Moderator',
      authorEmail: user.email || '',
      authorId: user.uid,
    });

    setIsDeletingPermanently(false);
    setPermanentlyDeletingComment(null);

    if (res.success) {
      setToastMessage('Comment permanently purged.');
      await loadComments();
    } else {
      setToastMessage('Could not permanently delete comment.');
    }
    setTimeout(() => setToastMessage(null), 4000);
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
      storyId,
      storyTitle,
      discussionId,
      discussionTitle,
      targetType,
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
      storyId,
      discussionId,
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

  // 7-day holding removal
  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingComment || !user) return;

    setIsRemoving(true);
    const res = await commentService.removeCommentWithHolding({
      commentId: removingComment.id,
      moderatorName: profile?.displayName || user.displayName || 'Moderator',
      reason: removalReason,
      notes: removalNotes,
      moderatorEmail: user.email || '',
      moderatorId: user.uid,
    });

    setIsRemoving(false);
    setRemovingComment(null);
    setRemovalNotes('');

    if (res.success) {
      setToastMessage('Comment removed and moved to 7-day holding period.');
      await loadComments();
    } else {
      setToastMessage('Could not remove comment.');
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

  // Thematic tier breakdown stats for books
  const reviewsWithTier = topLevelComments.filter((c) => c.thematicTier);
  const tierCounts: Record<ThematicTier, number> = {
    'Unputdownable / Masterpiece': 0,
    'Deeply Captivating / Essential': 0,
    'Rich & Atmospheric / Recommended': 0,
    'Intriguing / Worth Reading': 0,
    'Not for Me': 0,
  };
  reviewsWithTier.forEach((r) => {
    if (r.thematicTier && tierCounts[r.thematicTier] !== undefined) {
      tierCounts[r.thematicTier]++;
    }
  });

  const totalTomeScore = reviewsWithTier.reduce((sum, r) => {
    const s = r.thematicScore || (THEMATIC_TIERS.find((t) => t.tier === r.thematicTier)?.score || 5);
    return sum + s;
  }, 0);
  const avgTomeScore = reviewsWithTier.length > 0 ? (totalTomeScore / reviewsWithTier.length).toFixed(1) : '5.0';

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
              {isBookContext ? 'Reader Reviews & Discussion' : 'Reader Community Discussion'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1c1e2d] text-[#c5a059] border border-[#c5a059]/30">
              {topLevelComments.length} {topLevelComments.length === 1 ? 'Contribution' : 'Contributions'}
            </span>
          </div>
          <h3 className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
            {isBookContext ? `Reviews & Thoughts on ${displayTitle}` : `Discussion on ${displayTitle}`}
          </h3>
          <p className="text-xs sm:text-sm text-[#9e978b] mt-1 font-cormorant italic text-base">
            {isBookContext
              ? 'Share your written review with a thematic rating tier, or converse with fellow readers.'
              : 'Join the conversation, explore lore theories, and engage with the community.'}
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

      {/* Thematic Tier Summary breakdown on Books */}
      {isBookContext && reviewsWithTier.length > 0 && (
        <div className="bg-[#131522] border border-[#272a3e] rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2030] pb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-cinzel font-bold text-[#f5efeb] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Reader Reception ({reviewsWithTier.length} Evaluated)</span>
              </span>
              <div className="flex items-center gap-1 text-[#c5a059]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <BookOpen
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(Number(avgTomeScore))
                        ? 'fill-current text-[#c5a059]'
                        : 'text-stone-600'
                    }`}
                  />
                ))}
                <span className="text-xs font-mono font-bold text-[#f5efeb] ml-1">
                  {avgTomeScore} / 5.0 Tomes
                </span>
              </div>
            </div>
            <span className="text-[11px] text-[#8e887a]">
              Thematic Alternative Rating System
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {THEMATIC_TIERS.map((t) => {
              const count = tierCounts[t.tier];
              const pct = Math.round((count / reviewsWithTier.length) * 100) || 0;
              return (
                <div
                  key={t.tier}
                  className="bg-[#10121d] border border-[#212436] rounded-lg p-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-cinzel font-bold text-[#d6d0c4] truncate flex items-center gap-1" title={t.tier}>
                      <span className="text-[#c5a059] font-mono">{t.score}T</span>
                      <span>{t.shortLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#c5a059] font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#181a28] h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: t.dotColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Main Comment / Review Form */}
      <form onSubmit={handlePostComment} className="space-y-4">
        {/* If Book context: Mode switcher (Review vs Discussion comment) */}
        {isBookContext && (
          <div className="flex items-center gap-2 border-b border-[#212334] pb-2">
            <button
              type="button"
              onClick={() => setPostMode('review')}
              className={`px-3 py-1.5 text-xs font-cinzel rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                postMode === 'review'
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                  : 'text-[#9e978a] hover:bg-[#181a28]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Leave a Review with Thematic Tier</span>
            </button>
            <button
              type="button"
              onClick={() => setPostMode('comment')}
              className={`px-3 py-1.5 text-xs font-cinzel rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                postMode === 'comment'
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                  : 'text-[#9e978a] hover:bg-[#181a28]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussion Comment</span>
            </button>
          </div>
        )}

        {/* Thematic Tier Selector (Non-Star Rating) */}
        {isBookContext && postMode === 'review' && (
          <div className="bg-[#141624] border border-[#2b2e42] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222538] pb-3">
              <div>
                <label className="text-xs font-cinzel font-bold text-[#c5a059] block uppercase tracking-wider">
                  Thematic Rating & Tome Scale
                </label>
                <p className="text-[11px] text-[#8e887a] mt-0.5">
                  Alternative non-star rating indicator: select by Tome count or descriptive tier
                </p>
              </div>

              {/* Interactive 5-Tome Scale */}
              <div className="flex items-center gap-1.5 bg-[#0f111c] border border-[#242738] px-3 py-1.5 rounded-lg self-start sm:self-auto">
                <span className="text-[10px] font-cinzel text-[#8e887a] uppercase mr-1">Tomes:</span>
                {[1, 2, 3, 4, 5].map((score) => {
                  const currentTierObj = THEMATIC_TIERS.find((t) => t.tier === selectedTier);
                  const activeScore = currentTierObj ? currentTierObj.score : 5;
                  const isFilled = (hoveredScore !== null ? hoveredScore : activeScore) >= score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onMouseEnter={() => setHoveredScore(score)}
                      onMouseLeave={() => setHoveredScore(null)}
                      onClick={() => {
                        const targetTier = THEMATIC_TIERS.find((t) => t.score === score);
                        if (targetTier) setSelectedTier(targetTier.tier);
                      }}
                      className="p-1 text-[#c5a059] hover:scale-125 transition-transform cursor-pointer"
                      title={`${score} Tomes: ${THEMATIC_TIERS.find((t) => t.score === score)?.shortLabel}`}
                    >
                      <BookOpen
                        className={`w-4 h-4 transition-all ${
                          isFilled
                            ? 'fill-current text-[#c5a059] drop-shadow-[0_0_6px_rgba(197,160,89,0.5)]'
                            : 'text-stone-600'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-mono font-bold text-[#c5a059] ml-1.5">
                  {hoveredScore !== null
                    ? `${hoveredScore}/5`
                    : `${THEMATIC_TIERS.find((t) => t.tier === selectedTier)?.score || 5}/5`}
                </span>
              </div>
            </div>

            {/* Descriptive Tier Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {THEMATIC_TIERS.map((t) => {
                const isSelected = selectedTier === t.tier;
                return (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => setSelectedTier(t.tier)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#1b1e30] border-[#c5a059] shadow-md shadow-[#c5a059]/10'
                        : 'bg-[#11131c] border-[#252839] hover:border-[#383c54]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.dotColor }}
                      />
                      <span className="text-[9px] font-mono text-[#c5a059] font-bold">
                        {t.score}T
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-cinzel font-bold text-[#f5efeb] truncate">
                        {t.tier}
                      </div>
                      <div className="text-[10px] text-[#8e887a] line-clamp-1">
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              user
                ? isBookContext && postMode === 'review'
                  ? `Write your review of ${displayTitle}... What stood out about the prose, themes, or craft?`
                  : `Share your thoughts about ${displayTitle}...`
                : `Sign in as a Reader to share your thoughts on ${displayTitle}...`
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
                ? 'Moderator post will be published immediately.'
                : 'Reader contributions are held briefly for moderation.'
              : 'Registered readers can post reviews, reply to threads, and report inappropriate content.'}
          </p>

          <div className="flex items-center gap-3">
            {!user ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-5 py-2.5 bg-[#1a1d2c] hover:bg-[#25283c] border border-[#373a50] text-[#c5a059] text-xs font-cinzel font-semibold tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
              >
                Sign In to Post
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c5a059]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Publishing...'
                    : isBookContext && postMode === 'review'
                    ? 'Submit Review'
                    : 'Post Comment'}
                </span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Contributions List */}
      <div className="space-y-6 pt-4">
        {loading ? (
          <div className="text-center py-10 text-xs font-cinzel text-[#8f897c]">
            Loading reader thoughts & reviews...
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#232635] rounded-xl p-6 text-sm text-[#8f897c] space-y-2">
            <MessageSquare className="w-8 h-8 text-[#5c574c] mx-auto" />
            <p className="font-cinzel text-[#dcd7cb]">No reviews or comments yet.</p>
            <p className="text-xs text-[#7d776b]">
              Be the first reader to share your impression on {displayTitle}!
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = repliesByParentId[comment.id] || [];
            const isAuthorComment = comment.userRole === 'AUTHOR';
            const isEditorComment = comment.userRole === 'EDITOR';
            const tierMeta = comment.thematicTier
              ? THEMATIC_TIERS.find((t) => t.tier === comment.thematicTier)
              : null;

            return (
              <div
                key={comment.id}
                className={`border rounded-xl p-5 sm:p-6 transition-colors ${
                  isAuthorComment
                    ? 'bg-[#141523] border-[#c5a059]/40 shadow-lg shadow-[#c5a059]/5'
                    : 'bg-[#12141e] border-[#222536]'
                }`}
              >
                {/* Header */}
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

                        {/* Thematic Tier & Tome Rating Badge if review */}
                        {tierMeta && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Tome Rating Scale Indicator */}
                            <div
                              className="flex items-center gap-0.5 text-[#c5a059]"
                              title={`${comment.thematicScore || tierMeta.score} of 5 Tomes`}
                            >
                              {Array.from({ length: 5 }).map((_, i) => (
                                <BookOpen
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < (comment.thematicScore || tierMeta.score)
                                      ? 'fill-current text-[#c5a059]'
                                      : 'text-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-semibold uppercase border flex items-center gap-1.5 ${tierMeta.badgeClass}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: tierMeta.dotColor }}
                              />
                              <span>
                                {comment.thematicScore || tierMeta.score}/5 · {tierMeta.tier}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#7d786d]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Moderation / State Tag & Actions */}
                  <div className="flex items-center gap-2">
                    {comment.status === 'PENDING' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Review
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

                    {/* Editor / Author Actions: 7-Day Holding or Direct Admin Delete */}
                    {(isEditor || isAuthor) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRemovingComment(comment)}
                          title="Move to 7-day holding workflow"
                          className="text-[#8f897c] hover:text-amber-400 p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-cinzel"
                        >
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">Hold</span>
                        </button>
                        <button
                          onClick={() => setPermanentlyDeletingComment(comment)}
                          title="Administrative Delete: Permanently delete comment immediately"
                          className="text-[#8f897c] hover:text-rose-400 p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-cinzel"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
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

                            <div className="flex items-center gap-2">
                              {user && user.uid !== reply.userId && (
                                <button
                                  onClick={() => setReportingComment(reply)}
                                  className="text-[#696459] hover:text-rose-400 p-0.5"
                                  title="Report comment"
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              )}
                              {(isEditor || isAuthor) && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setRemovingComment(reply)}
                                    className="text-[#696459] hover:text-amber-400 p-0.5"
                                    title="Hold comment (7 days)"
                                  >
                                    <Clock className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setPermanentlyDeletingComment(reply)}
                                    className="text-[#696459] hover:text-rose-400 p-0.5"
                                    title="Delete comment immediately"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
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

      {/* 7-Day Holding Removal Modal (Editor / Author only) */}
      {removingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
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
              Per policy, removed comments are placed in a <strong>7-Day Holding Period</strong> (hidden from all Readers). Editors and Authors can review or restore it anytime during the 7 days before permanent deletion.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-rose-500 text-[#c9c4b7]">
              "{removingComment.content.length > 120 ? removingComment.content.slice(0, 120) + '...' : removingComment.content}"
            </blockquote>

            <form onSubmit={handleRemoveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Removal Reason (Required)
                </label>
                <select
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value as RemovalReason)}
                  className="w-full bg-[#161825] border border-[#2e3146] rounded-lg px-3 py-2 text-xs text-[#e8e2d9] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="Spam">Spam / Unsolicited Advertising</option>
                  <option value="Harassment">Bullying / Harassment</option>
                  <option value="Hate Speech">Hate Speech</option>
                  <option value="Off-Topic">Off-Topic / Disruptive</option>
                  <option value="Inappropriate content">Inappropriate / Obscene</option>
                  <option value="Spoiler">Unmarked Major Spoilers</option>
                  <option value="Other">Other Infraction</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Moderator Notes (Optional)
                </label>
                <textarea
                  value={removalNotes}
                  onChange={(e) => setRemovalNotes(e.target.value)}
                  placeholder="Internal audit notes..."
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
                  {isRemoving ? 'Removing...' : 'Confirm 7-Day Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <span>Report Inappropriate Content</span>
              </div>
              <button
                onClick={() => setReportingComment(null)}
                className="text-[#807b70] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a8a396]">
              Help our editorial team keep the community respectful, welcoming, and spam-free.
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
                  <option value="Inappropriate content">Inappropriate / Off-Topic</option>
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

      {/* Immediate Permanent Deletion Modal (Editor & Author Administrative Action) */}
      {permanentlyDeletingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#11131c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Administrative Delete</span>
              </div>
              <button
                onClick={() => setPermanentlyDeletingComment(null)}
                className="text-[#807b70] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#a8a396] leading-relaxed">
              As an Editor or Author, you have administrative delete privileges. Are you sure you want to permanently delete this comment immediately? This cannot be undone.
            </p>

            <blockquote className="text-xs italic bg-[#171926] p-3 rounded border-l-2 border-rose-500 text-[#c9c4b7]">
              "{permanentlyDeletingComment.content.length > 120
                ? permanentlyDeletingComment.content.slice(0, 120) + '...'
                : permanentlyDeletingComment.content}"
            </blockquote>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPermanentlyDeletingComment(null)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingPermanently}
                onClick={handlePermanentDeleteSubmit}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeletingPermanently ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
