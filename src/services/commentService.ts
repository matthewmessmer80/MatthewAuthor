import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BookComment,
  CommentReport,
  CommentStatus,
  ReportReason,
  RemovalReason,
  ThematicTier,
  UserRole,
} from '../types';

const COMMENTS_COLLECTION = 'comments';
const REPORTS_COLLECTION = 'commentReports';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const LOCAL_STORAGE_COMMENTS_KEY = 'mmessmer_author_book_comments';
const LOCAL_STORAGE_REPORTS_KEY = 'mmessmer_author_comment_reports';

const INITIAL_SEEDED_COMMENTS: BookComment[] = [
  {
    id: 'comm-1',
    bookId: 'kings-severance',
    bookTitle: "The King's Severance",
    bookSlug: 'the-kings-severance',
    userId: 'user-samuel-k',
    userName: 'Samuel Kaye',
    userRole: 'READER',
    content: "The climactic revelation in Chapter 14 regarding the severance rite completely reshaped how I view the kingdom's history. The prose here is sharp and atmospheric!",
    status: 'APPROVED',
    createdAt: '2024-08-12T14:22:00Z',
    replyCount: 1,
    reportCount: 0,
    isReview: true,
    thematicTier: 'Unputdownable / Masterpiece',
    thematicScore: 5,
  },
  {
    id: 'comm-1-reply-1',
    bookId: 'kings-severance',
    bookTitle: "The King's Severance",
    bookSlug: 'the-kings-severance',
    userId: 'author-default-root',
    userName: 'Matthew E. Messmer',
    userRole: 'AUTHOR',
    content: "Thank you, Samuel! That chapter underwent four revisions to strike the balance between ancient ritual solemnity and personal betrayal. Glad it resonated.",
    status: 'APPROVED',
    createdAt: '2024-08-12T16:05:00Z',
    parentId: 'comm-1',
    replyCount: 0,
    reportCount: 0,
  },
  {
    id: 'comm-2',
    bookId: 'kings-severance',
    bookTitle: "The King's Severance",
    bookSlug: 'the-kings-severance',
    userId: 'user-mira-thorn',
    userName: 'Mira Thorn',
    userRole: 'READER',
    content: "Just finished reading chapter 1 through the online excerpt. The texture of the workshop and the description of the grain under the blade was breathtaking.",
    status: 'APPROVED',
    createdAt: '2024-09-02T19:40:00Z',
    replyCount: 0,
    reportCount: 0,
    isReview: true,
    thematicTier: 'Deeply Captivating / Essential',
    thematicScore: 4,
  },
  {
    id: 'comm-3-pending',
    bookId: 'kings-severance',
    bookTitle: "The King's Severance",
    bookSlug: 'the-kings-severance',
    userId: 'reader-pending-guest',
    userName: 'Rowan Vance',
    userRole: 'READER',
    content: "Is there any planned companion map showing the trade currents from the southern isles to the capital?",
    status: 'PENDING',
    createdAt: '2024-09-24T11:15:00Z',
    replyCount: 0,
    reportCount: 0,
  },
  {
    id: 'comm-4-flagged',
    bookId: 'blue-moon-child',
    bookTitle: 'The Blue Moon Child',
    bookSlug: 'the-blue-moon-child',
    userId: 'reader-suspicious',
    userName: 'MysteryUser42',
    userRole: 'READER',
    content: 'Check out cheap book downloads on this external link here: bit.ly/spam-link',
    status: 'FLAGGED',
    createdAt: '2024-09-22T08:30:00Z',
    replyCount: 0,
    reportCount: 2,
    moderationNotes: 'Reported as Spam by 2 readers.',
  },
];

const INITIAL_SEEDED_REPORTS: CommentReport[] = [
  {
    id: 'rep-1',
    commentId: 'comm-4-flagged',
    commentContent: 'Check out cheap book downloads on this external link here: bit.ly/spam-link',
    bookId: 'blue-moon-child',
    bookTitle: 'The Blue Moon Child',
    reporterUserId: 'user-samuel-k',
    reporterEmail: 'samuel.kaye@gmail.com',
    reason: 'Spam',
    details: 'Suspicious external link posted in discussion.',
    status: 'PENDING_REVIEW',
    createdAt: '2024-09-22T08:45:00Z',
  },
];

class CommentService {
  private comments: BookComment[] = [];
  private reports: CommentReport[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const storedComments = localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY);
      if (storedComments) {
        this.comments = JSON.parse(storedComments);
      } else {
        this.comments = [...INITIAL_SEEDED_COMMENTS];
        this.saveComments();
      }
    } catch {
      this.comments = [...INITIAL_SEEDED_COMMENTS];
    }

    try {
      const storedReports = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (storedReports) {
        this.reports = JSON.parse(storedReports);
      } else {
        this.reports = [...INITIAL_SEEDED_REPORTS];
        this.saveReports();
      }
    } catch {
      this.reports = [...INITIAL_SEEDED_REPORTS];
    }
  }

  private saveComments(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(this.comments));
    } catch {}
  }

  private saveReports(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(this.reports));
    } catch {}
  }

  /**
   * Get comments for a specific book page.
   * - Public readers see APPROVED comments.
   * - Authenticated reader also sees their own PENDING comments.
   * - Readers must NOT be able to see comments marked REMOVED_PENDING_DELETION.
   * - Editors and Authors see all states (PENDING, APPROVED, FLAGGED, HIDDEN, REMOVED_PENDING_DELETION).
   */
  async getCommentsForBook(
    bookId: string,
    currentUserRole?: UserRole,
    currentUserId?: string
  ): Promise<BookComment[]> {
    try {
      // Sync from Firestore if available
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('bookId', '==', bookId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreList: BookComment[] = [];
        snap.forEach((d) => firestoreList.push({ ...(d.data() as BookComment), id: d.id }));
        
        // Merge with local comments
        firestoreList.forEach((fc) => {
          const idx = this.comments.findIndex((c) => c.id === fc.id);
          if (idx >= 0) this.comments[idx] = fc;
          else this.comments.push(fc);
        });
        this.saveComments();
      }
    } catch (err) {
      console.warn('Could not fetch comments from Firestore (using cache):', err);
    }

    const isModerator = currentUserRole === 'EDITOR' || currentUserRole === 'AUTHOR';

    return this.comments
      .filter((c) => {
        if (c.bookId !== bookId && c.targetType !== 'book') {
          if (c.bookId !== bookId) return false;
        }
        if (c.bookId !== bookId) return false;

        // If moderator, see all states including REMOVED_PENDING_DELETION (except permanently deleted)
        if (isModerator) {
          return c.status !== 'REMOVED';
        }

        // Readers must NEVER see REMOVED_PENDING_DELETION or REMOVED or HIDDEN
        if (c.status === 'REMOVED_PENDING_DELETION' || c.status === 'REMOVED' || c.status === 'HIDDEN') {
          return false;
        }

        // Public / Readers:
        if (c.status === 'APPROVED') return true;
        // Reader can see their own pending/flagged comment
        if (currentUserId && c.userId === currentUserId && (c.status === 'PENDING' || c.status === 'FLAGGED')) {
          return true;
        }

        return false;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Get comments for a short story.
   * Full commenting capability for Readers and above.
   * Readers must NOT see REMOVED_PENDING_DELETION.
   */
  async getCommentsForStory(
    storyId: string,
    currentUserRole?: UserRole,
    currentUserId?: string
  ): Promise<BookComment[]> {
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('storyId', '==', storyId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreList: BookComment[] = [];
        snap.forEach((d) => firestoreList.push({ ...(d.data() as BookComment), id: d.id }));
        firestoreList.forEach((fc) => {
          const idx = this.comments.findIndex((c) => c.id === fc.id);
          if (idx >= 0) this.comments[idx] = fc;
          else this.comments.push(fc);
        });
        this.saveComments();
      }
    } catch {}

    const isModerator = currentUserRole === 'EDITOR' || currentUserRole === 'AUTHOR';

    return this.comments
      .filter((c) => {
        if (c.storyId !== storyId) return false;

        if (isModerator) return c.status !== 'REMOVED';

        if (c.status === 'REMOVED_PENDING_DELETION' || c.status === 'REMOVED' || c.status === 'HIDDEN') {
          return false;
        }

        if (c.status === 'APPROVED') return true;
        if (currentUserId && c.userId === currentUserId && (c.status === 'PENDING' || c.status === 'FLAGGED')) {
          return true;
        }

        return false;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Get comments / replies for a community discussion thread.
   */
  async getCommentsForDiscussion(
    discussionId: string,
    currentUserRole?: UserRole,
    currentUserId?: string
  ): Promise<BookComment[]> {
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('discussionId', '==', discussionId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreList: BookComment[] = [];
        snap.forEach((d) => firestoreList.push({ ...(d.data() as BookComment), id: d.id }));
        firestoreList.forEach((fc) => {
          const idx = this.comments.findIndex((c) => c.id === fc.id);
          if (idx >= 0) this.comments[idx] = fc;
          else this.comments.push(fc);
        });
        this.saveComments();
      }
    } catch {}

    const isModerator = currentUserRole === 'EDITOR' || currentUserRole === 'AUTHOR';

    return this.comments
      .filter((c) => {
        if (c.discussionId !== discussionId) return false;

        if (isModerator) return c.status !== 'REMOVED';

        if (c.status === 'REMOVED_PENDING_DELETION' || c.status === 'REMOVED' || c.status === 'HIDDEN') {
          return false;
        }

        if (c.status === 'APPROVED') return true;
        if (currentUserId && c.userId === currentUserId && (c.status === 'PENDING' || c.status === 'FLAGGED')) {
          return true;
        }

        return false;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Post a new comment or review
   */
  async postComment(params: {
    bookId?: string;
    bookTitle?: string;
    bookSlug?: string;
    storyId?: string;
    storyTitle?: string;
    discussionId?: string;
    discussionTitle?: string;
    targetType?: 'book' | 'story' | 'discussion';
    userId: string;
    userName: string;
    userEmail?: string;
    userAvatar?: string;
    userRole?: UserRole;
    content: string;
    parentId?: string | null;
    isReview?: boolean;
    thematicTier?: ThematicTier;
    thematicScore?: number;
  }): Promise<{ success: boolean; comment?: BookComment; error?: string }> {
    if (!params.content.trim()) {
      return { success: false, error: 'Content cannot be empty.' };
    }

    const initialStatus: CommentStatus =
      params.userRole === 'AUTHOR' || params.userRole === 'EDITOR' ? 'APPROVED' : 'PENDING';

    let resolvedScore = params.thematicScore;
    if (!resolvedScore && params.thematicTier) {
      const scoreMap: Record<ThematicTier, number> = {
        'Unputdownable / Masterpiece': 5,
        'Deeply Captivating / Essential': 4,
        'Rich & Atmospheric / Recommended': 3,
        'Intriguing / Worth Reading': 2,
        'Not for Me': 1,
      };
      resolvedScore = scoreMap[params.thematicTier] || 5;
    }

    const newComment: BookComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookId: params.bookId,
      bookTitle: params.bookTitle,
      bookSlug: params.bookSlug,
      storyId: params.storyId,
      storyTitle: params.storyTitle,
      discussionId: params.discussionId,
      discussionTitle: params.discussionTitle,
      targetType: params.targetType || (params.storyId ? 'story' : params.discussionId ? 'discussion' : 'book'),
      userId: params.userId,
      userName: params.userName || 'Reader',
      userEmail: params.userEmail,
      userAvatar: params.userAvatar,
      userRole: params.userRole || 'READER',
      content: params.content.trim(),
      status: initialStatus,
      createdAt: new Date().toISOString(),
      parentId: params.parentId || null,
      replyCount: 0,
      reportCount: 0,
      isReview: params.isReview,
      thematicTier: params.thematicTier,
      thematicScore: params.isReview ? resolvedScore : undefined,
    };

    if (params.parentId) {
      const parent = this.comments.find((c) => c.id === params.parentId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
      }
    }

    this.comments.push(newComment);
    this.saveComments();

    try {
      const commentRef = doc(db, COMMENTS_COLLECTION, newComment.id);
      await setDoc(commentRef, newComment);
    } catch (err) {
      console.warn('Could not post comment to Firestore directly (saved locally):', err);
    }

    return { success: true, comment: newComment };
  }

  /**
   * Report an inappropriate comment
   */
  async reportComment(params: {
    commentId: string;
    bookId?: string;
    bookTitle?: string;
    storyId?: string;
    discussionId?: string;
    reporterUserId: string;
    reporterEmail?: string;
    reason: ReportReason;
    details?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const comment = this.comments.find((c) => c.id === params.commentId);
    if (!comment) {
      return { success: false, error: 'Comment not found.' };
    }

    comment.reportCount = (comment.reportCount || 0) + 1;
    if (comment.status !== 'REMOVED' && comment.status !== 'REMOVED_PENDING_DELETION' && comment.status !== 'HIDDEN') {
      comment.status = 'FLAGGED';
    }

    const report: CommentReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      commentId: params.commentId,
      commentContent: comment.content,
      bookId: params.bookId || comment.bookId,
      bookTitle: params.bookTitle || comment.bookTitle,
      storyId: params.storyId || comment.storyId,
      discussionId: params.discussionId || comment.discussionId,
      reporterUserId: params.reporterUserId,
      reporterEmail: params.reporterEmail,
      reason: params.reason,
      details: params.details || '',
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    };

    this.reports.unshift(report);
    this.saveComments();
    this.saveReports();

    try {
      await updateDoc(doc(db, COMMENTS_COLLECTION, comment.id), {
        status: comment.status,
        reportCount: comment.reportCount,
      });
      await setDoc(doc(db, REPORTS_COLLECTION, report.id), report);
    } catch (err) {
      console.warn('Could not save report to Firestore (saved locally):', err);
    }

    return { success: true };
  }

  /**
   * Get all comments (Moderator / Editor / Author only)
   * Note: Viewing comments does NOT reset any deletion timers!
   */
  async getAllComments(): Promise<BookComment[]> {
    try {
      const snap = await getDocs(collection(db, COMMENTS_COLLECTION));
      if (!snap.empty) {
        const list: BookComment[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as BookComment), id: d.id }));
        list.forEach((fc) => {
          const idx = this.comments.findIndex((c) => c.id === fc.id);
          if (idx >= 0) this.comments[idx] = fc;
          else this.comments.push(fc);
        });
        this.saveComments();
      }
    } catch {}
    return [...this.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all reports (Moderator / Editor / Author only)
   */
  async getAllReports(): Promise<CommentReport[]> {
    try {
      const snap = await getDocs(collection(db, REPORTS_COLLECTION));
      if (!snap.empty) {
        const list: CommentReport[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as CommentReport), id: d.id }));
        this.reports = list;
        this.saveReports();
      }
    } catch {}
    return [...this.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Update moderation state of a comment (generic)
   */
  async updateCommentStatus(
    commentId: string,
    status: CommentStatus,
    moderatorName: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) {
      return { success: false, error: 'Comment not found.' };
    }

    comment.status = status;
    comment.moderatedBy = moderatorName;
    comment.moderatedAt = new Date().toISOString();
    if (notes) comment.moderationNotes = notes;

    this.saveComments();

    try {
      await updateDoc(doc(db, COMMENTS_COLLECTION, commentId), {
        status,
        moderatedBy: moderatorName,
        moderatedAt: comment.moderatedAt,
        ...(notes ? { moderationNotes: notes } : {}),
      });
    } catch (err) {
      console.warn('Could not update comment status in Firestore (updated locally):', err);
    }

    return { success: true };
  }

  /**
   * WORKFLOW 1: REMOVED COMMENT STATUS & 7-DAY HOLDING PERIOD
   * When an Editor or Author selects "Remove" on a comment:
   * - Set status to: REMOVED_PENDING_DELETION
   * - Set removedAt and scheduledDeletionAt timestamps exactly seven days out.
   * - Require valid removal reasons (e.g., Spam, Harassment, Hate Speech, Off-Topic, etc.) upon initial removal.
   * - Do NOT reset the seven-day period simply because an Editor views the comment.
   */
  async removeCommentWithHolding(params: {
    commentId: string;
    moderatorName: string;
    reason: RemovalReason;
    notes?: string;
    moderatorEmail?: string;
    moderatorId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const comment = this.comments.find((c) => c.id === params.commentId);
    if (!comment) return { success: false, error: 'Comment not found.' };

    const now = new Date();
    const scheduledDeletion = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // exactly 7 days out

    comment.previousStatus = comment.status;
    comment.status = 'REMOVED_PENDING_DELETION';
    comment.removedAt = now.toISOString();
    comment.scheduledDeletionAt = scheduledDeletion.toISOString();
    comment.removalReason = params.reason;
    comment.removedBy = params.moderatorName;
    if (params.notes) comment.moderationNotes = params.notes;
    comment.moderatedBy = params.moderatorName;
    comment.moderatedAt = now.toISOString();

    this.saveComments();

    try {
      await updateDoc(doc(db, COMMENTS_COLLECTION, params.commentId), {
        status: 'REMOVED_PENDING_DELETION',
        previousStatus: comment.previousStatus,
        removedAt: comment.removedAt,
        scheduledDeletionAt: comment.scheduledDeletionAt,
        removalReason: params.reason,
        removedBy: params.moderatorName,
        moderatedBy: params.moderatorName,
        moderatedAt: comment.moderatedAt,
        ...(params.notes ? { moderationNotes: params.notes } : {}),
      });

      // Audit log entry
      await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
        action: 'COMMENT_REMOVED_PENDING_DELETION',
        targetId: params.commentId,
        targetType: 'comment',
        details: `Comment by ${comment.userName} removed with 7-day holding period (scheduled deletion: ${scheduledDeletion.toLocaleDateString()}). Reason: ${params.reason}.`,
        userEmail: params.moderatorEmail || params.moderatorName,
        userId: params.moderatorId || 'moderator',
        timestamp: now.toISOString(),
      });
    } catch (err) {
      console.warn('Could not sync removal to Firestore (saved locally):', err);
    }

    return { success: true };
  }

  /**
   * WORKFLOW 2: RESTORATION WORKFLOW
   * During the 7-day holding period, Editors and Authors can click "Restore Comment"
   * to return the comment to its previous approved/moderated state and clear the deletion timers.
   */
  async restoreComment(params: {
    commentId: string;
    moderatorName: string;
    moderatorEmail?: string;
    moderatorId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const comment = this.comments.find((c) => c.id === params.commentId);
    if (!comment) return { success: false, error: 'Comment not found.' };

    const restoredStatus: CommentStatus =
      comment.previousStatus && comment.previousStatus !== 'REMOVED_PENDING_DELETION'
        ? comment.previousStatus
        : 'APPROVED';

    comment.status = restoredStatus;
    comment.removedAt = null;
    comment.scheduledDeletionAt = null;
    comment.removalReason = null;
    comment.removedBy = null;
    comment.moderatedBy = params.moderatorName;
    comment.moderatedAt = new Date().toISOString();

    this.saveComments();

    try {
      await updateDoc(doc(db, COMMENTS_COLLECTION, params.commentId), {
        status: restoredStatus,
        removedAt: null,
        scheduledDeletionAt: null,
        removalReason: null,
        removedBy: null,
        moderatedBy: params.moderatorName,
        moderatedAt: comment.moderatedAt,
      });

      // Audit log entry
      await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
        action: 'COMMENT_RESTORED',
        targetId: params.commentId,
        targetType: 'comment',
        details: `Comment by ${comment.userName} restored from holding to ${restoredStatus} state.`,
        userEmail: params.moderatorEmail || params.moderatorName,
        userId: params.moderatorId || 'moderator',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not sync restoration to Firestore (updated locally):', err);
    }

    return { success: true };
  }

  /**
   * WORKFLOW 3: IMMEDIATE AUTHOR OVERRIDE: "DELETE PERMANENTLY NOW"
   * The Author has an immediate override action to bypass the 7-day period.
   * Completely purges the comment and leaves an Author-only audit record.
   */
  async permanentlyDeleteComment(params: {
    commentId: string;
    authorName: string;
    authorEmail?: string;
    authorId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const idx = this.comments.findIndex((c) => c.id === params.commentId);
    const comment = idx >= 0 ? this.comments[idx] : null;

    if (idx >= 0) {
      this.comments.splice(idx, 1);
      this.saveComments();
    }

    try {
      await deleteDoc(doc(db, COMMENTS_COLLECTION, params.commentId));

      // Retain minimal Author-only audit record
      await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
        action: 'AUTHOR_PERMANENT_COMMENT_PURGE',
        targetId: params.commentId,
        targetType: 'comment',
        details: `Author ${params.authorName} immediately purged comment (Author UID: ${params.authorId || 'Author'}). Commenter: ${comment?.userName || 'Reader'}. Original Reason: ${comment?.removalReason || 'Manual Author Purge'}.`,
        userEmail: params.authorEmail || 'author@breathwovenpress.com',
        userId: params.authorId || 'author',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not delete comment from Firestore (purged locally):', err);
    }

    return { success: true };
  }

  /**
   * WORKFLOW 4: SECURE SCHEDULED BACKEND PROCESS: processExpiredRemovedComments
   * Permanently deletes comments where status == REMOVED_PENDING_DELETION
   * and scheduledDeletionAt <= currentTime, retaining only a minimal Author-only audit record.
   */
  async processExpiredRemovedComments(actingUser?: {
    name?: string;
    email?: string;
    userId?: string;
  }): Promise<{ deletedCount: number }> {
    const now = Date.now();
    const expiredComments = this.comments.filter(
      (c) =>
        c.status === 'REMOVED_PENDING_DELETION' &&
        c.scheduledDeletionAt &&
        new Date(c.scheduledDeletionAt).getTime() <= now
    );

    if (expiredComments.length === 0) {
      return { deletedCount: 0 };
    }

    for (const exp of expiredComments) {
      // Remove from memory
      const idx = this.comments.findIndex((c) => c.id === exp.id);
      if (idx >= 0) {
        this.comments.splice(idx, 1);
      }

      // Remove from Firestore & record Author-only audit log
      try {
        await deleteDoc(doc(db, COMMENTS_COLLECTION, exp.id));
        await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
          action: 'SCHEDULED_PURGE_EXPIRED_COMMENT',
          targetId: exp.id,
          targetType: 'comment',
          details: `System automatically purged comment by ${exp.userName} after 7-day holding period expired. Reason on record: ${exp.removalReason || 'Unspecified'}. Removed by: ${exp.removedBy || 'Editor'}.`,
          userEmail: actingUser?.email || 'system-worker@breathwovenpress.com',
          userId: actingUser?.userId || 'system-worker',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`Could not process expired comment ${exp.id}:`, err);
      }
    }

    this.saveComments();
    return { deletedCount: expiredComments.length };
  }

  /**
   * Resolve or dismiss a report
   */
  async resolveReport(
    reportId: string,
    action: 'RESOLVED' | 'DISMISSED',
    moderatorName: string
  ): Promise<{ success: boolean; error?: string }> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return { success: false, error: 'Report not found' };

    rep.status = action;
    rep.resolvedBy = moderatorName;
    rep.resolvedAt = new Date().toISOString();

    this.saveReports();

    try {
      await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
        status: action,
        resolvedBy: moderatorName,
        resolvedAt: rep.resolvedAt,
      });
    } catch {}

    return { success: true };
  }

  /**
   * Get comment history for a specific reader (/account view)
   * Note: Readers must NOT see comments marked REMOVED_PENDING_DELETION
   */
  getUserComments(userId: string): BookComment[] {
    return this.comments
      .filter((c) => c.userId === userId && c.status !== 'REMOVED' && c.status !== 'REMOVED_PENDING_DELETION')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const commentService = new CommentService();
