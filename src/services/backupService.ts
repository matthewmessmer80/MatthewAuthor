import { db, auth, ADMIN_EMAIL } from './firebase';
import { bookService, ManagedBook, ManagedSeries, AuditLogItem } from './bookService';
import { commentService } from './commentService';
import { messageService } from './messageService';
import { siteContentService } from './siteContentService';
import { userService } from './userService';
import { newsletterService } from './newsletterService';
import { adminNewsletterService } from './adminNewsletterService';
import { STORIES, NEWS_ARTICLES } from '../data/authorData';
import {
  BookComment,
  CommentReport,
  ReaderMessage,
  UserProfile,
  NewsletterSubscriber,
  NewsletterSettings,
  HomepageContent,
  Story,
  NewsArticle,
} from '../types';

export interface SiteBackupSummary {
  booksCount: number;
  seriesCount: number;
  storiesCount: number;
  newsCount: number;
  subscribersCount: number;
  commentsCount: number;
  reportsCount: number;
  messagesCount: number;
  usersCount: number;
  auditLogsCount: number;
  generatedAt: string;
}

export interface SiteBackupPayload {
  metadata: {
    siteName: string;
    siteDomain: string;
    exportTimestamp: string;
    exportFormatVersion: string;
    exportedByEmail: string;
    exportedByRole: string;
    summary: SiteBackupSummary;
  };
  data: {
    books: ManagedBook[];
    series: ManagedSeries[];
    stories: Story[];
    news: NewsArticle[];
    siteContent: HomepageContent;
    newsletterSettings: NewsletterSettings;
    subscribers: NewsletterSubscriber[];
    comments: BookComment[];
    commentReports: CommentReport[];
    readerMessages: ReaderMessage[];
    users: Partial<UserProfile>[];
    auditLogs: AuditLogItem[];
  };
}

class BackupService {
  /**
   * Verify if current user is an Author
   */
  public isAuthorizedAuthor(userRole?: string, userEmail?: string): boolean {
    const currentEmail = (userEmail || auth.currentUser?.email || '').toLowerCase();
    const isDesignatedAuthor = currentEmail === ADMIN_EMAIL.toLowerCase();
    const roleLower = (userRole || '').toLowerCase();
    return isDesignatedAuthor || roleLower === 'author';
  }

  /**
   * Generates a complete snapshot of all site data.
   * STRICTLY RESTRICTED TO AUTHOR ROLE.
   */
  public async generateCompleteBackup(
    userRole?: string,
    userEmail?: string
  ): Promise<SiteBackupPayload> {
    if (!this.isAuthorizedAuthor(userRole, userEmail)) {
      throw new Error('Access Denied: Only users with an Author account are authorized to generate and download site backups.');
    }

    const email = userEmail || auth.currentUser?.email || ADMIN_EMAIL;
    const now = new Date().toISOString();

    // 1. Books & Series
    const books = await bookService.getBooks();
    const series = await bookService.getSeries();
    const auditLogs = await bookService.getAuditLogs();

    // 2. Stories & News
    const stories: Story[] = [...STORIES];
    const news: NewsArticle[] = [...NEWS_ARTICLES];

    // 3. Site Content
    const siteContent = siteContentService.getContent();

    // 4. Newsletter
    const subscribers = newsletterService.getSubscribers();
    const newsletterSettings = newsletterService.getSettings();

    // 5. Comments & Moderation
    const comments = await commentService.getAllComments();
    const commentReports = await commentService.getAllReports();

    // 6. Reader Correspondence
    const readerMessages = await messageService.getMessages();

    // 7. Users Registry (Safe fields only, passwords/tokens are in Firebase Auth and never stored in plain data)
    let usersList: Partial<UserProfile>[] = [];
    try {
      const fullUsers = await userService.getAllUsers();
      usersList = fullUsers.map((u) => ({
        uid: u.uid,
        displayName: u.displayName,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        usernameNormalized: u.usernameNormalized,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt,
        newsletterSubscribed: u.newsletterSubscribed,
      }));
    } catch {
      usersList = [];
    }

    const summary: SiteBackupSummary = {
      booksCount: books.length,
      seriesCount: series.length,
      storiesCount: stories.length,
      newsCount: news.length,
      subscribersCount: subscribers.length,
      commentsCount: comments.length,
      reportsCount: commentReports.length,
      messagesCount: readerMessages.length,
      usersCount: usersList.length,
      auditLogsCount: auditLogs.length,
      generatedAt: now,
    };

    const payload: SiteBackupPayload = {
      metadata: {
        siteName: 'Matthew E. Messmer | Official Author Website',
        siteDomain: 'matthewemessmer.com',
        exportTimestamp: now,
        exportFormatVersion: '2.0.0',
        exportedByEmail: email,
        exportedByRole: 'AUTHOR',
        summary,
      },
      data: {
        books,
        series,
        stories,
        news,
        siteContent,
        newsletterSettings,
        subscribers,
        comments,
        commentReports,
        readerMessages,
        users: usersList,
        auditLogs,
      },
    };

    return payload;
  }

  /**
   * Prompts the browser to download the backup as a JSON file
   */
  public triggerFileDownload(payload: SiteBackupPayload): void {
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `matthew-e-messmer-site-backup-${dateStamp}.json`;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports Newsletter Subscribers as CSV
   */
  public exportSubscribersCSV(subscribers: NewsletterSubscriber[]): void {
    const headers = ['Email', 'First Name', 'Date Subscribed', 'Status', 'Source'];
    const rows = subscribers.map((s) => [
      `"${s.email.replace(/"/g, '""')}"`,
      `"${(s.firstName || '').replace(/"/g, '""')}"`,
      `"${s.dateSubscribed}"`,
      `"${s.status}"`,
      `"${s.source}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports Books Catalog as CSV
   */
  public exportBooksCSV(books: ManagedBook[]): void {
    const headers = ['ID', 'Title', 'Series ID', 'Volume', 'Status', 'Publication State', 'ISBN', 'Page Count'];
    const rows = books.map((b) => [
      `"${b.id}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${(b.seriesId || '').replace(/"/g, '""')}"`,
      `"${b.seriesOrder || ''}"`,
      `"${b.status}"`,
      `"${b.publicationState}"`,
      `"${b.isbn || ''}"`,
      `"${b.pageCount || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `books-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const backupService = new BackupService();
