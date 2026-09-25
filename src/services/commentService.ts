import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { BookComment, CommentReport, CommentStatus, ReportReason, UserRole } from '../types';

const COMMENTS_COLLECTION = 'comments';
const REPORTS_COLLECTION = 'commentReports';
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
   * - Editors and Authors see all states (PENDING, APPROVED, FLAGGED, HIDDEN).
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
        if (c.bookId !== bookId) return false;

        // If moderator, see all except permanently removed
        if (isModerator) return c.status !== 'REMOVED';

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
   * Post a new comment
   * New comments default to PENDING status per recommendation
   */
  async postComment(params: {
    bookId: string;
    bookTitle?: string;
    bookSlug?: string;
    userId: string;
    userName: string;
    userEmail?: string;
    userAvatar?: string;
    userRole?: UserRole;
    content: string;
    parentId?: string | null;
  }): Promise<{ success: boolean; comment?: BookComment; error?: string }> {
    if (!params.content.trim()) {
      return { success: false, error: 'Comment text cannot be empty.' };
    }

    // Role-based auto-approval: Author and Editor comments auto-approved, Reader comments set to PENDING
    const initialStatus: CommentStatus =
      params.userRole === 'AUTHOR' || params.userRole === 'EDITOR' ? 'APPROVED' : 'PENDING';

    const newComment: BookComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookId: params.bookId,
      bookTitle: params.bookTitle || params.bookId,
      bookSlug: params.bookSlug || params.bookId,
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
    };

    // Update parent's replyCount if replying
    if (params.parentId) {
      const parent = this.comments.find((c) => c.id === params.parentId);
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
      }
    }

    this.comments.push(newComment);
    this.saveComments();

    // Sync to Firestore
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
    bookId: string;
    bookTitle?: string;
    reporterUserId: string;
    reporterEmail?: string;
    reason: ReportReason;
    details?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const comment = this.comments.find((c) => c.id === params.commentId);
    if (!comment) {
      return { success: false, error: 'Comment not found.' };
    }

    // Increment comment report count and flag
    comment.reportCount = (comment.reportCount || 0) + 1;
    if (comment.status !== 'REMOVED' && comment.status !== 'HIDDEN') {
      comment.status = 'FLAGGED';
    }

    const report: CommentReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      commentId: params.commentId,
      commentContent: comment.content,
      bookId: params.bookId,
      bookTitle: params.bookTitle || comment.bookTitle,
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

    // Firestore sync
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
   * Update moderation state of a comment
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
   */
  getUserComments(userId: string): BookComment[] {
    return this.comments
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const commentService = new CommentService();
