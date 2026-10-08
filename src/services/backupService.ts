import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth, ADMIN_EMAIL } from './firebase';
import { bookService, ManagedBook, ManagedSeries, AuditLogItem } from './bookService';
import { storyService } from './storyService';
import { newsService } from './newsService';
import { songService } from './songService';
import { galleryService } from './galleryService';
import { characterLoreService } from './characterLoreService';
import { commentService } from './commentService';
import { messageService } from './messageService';
import { siteContentService } from './siteContentService';
import { siteSettingsService, SiteSettings } from './siteSettingsService';
import { userService } from './userService';
import { newsletterService } from './newsletterService';
import { adminNewsletterService } from './adminNewsletterService';
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
  GalleryItem,
  Character,
  LoreEntry,
  Song,
} from '../types';

export interface RestoreProgress {
  processed: number;
  total: number;
  collectionName: string;
  percent: number;
}

export interface RestoreResult {
  totalRestored: number;
  collectionsSummary: Record<string, number>;
}

export interface StandardBackupPayload {
  version: string;
  timestamp: string;
  metadata?: any;
  data: {
    books: ManagedBook[];
    chapters: Story[];
    posts: NewsArticle[];
    series?: ManagedSeries[];
    stories?: Story[];
    news?: NewsArticle[];
    songs?: Song[];
    gallery?: GalleryItem[];
    characters?: Character[];
    lore?: LoreEntry[];
    messages?: ReaderMessage[];
    users?: Partial<UserProfile>[];
    moderationLogs?: AuditLogItem[];
    auditLogs?: AuditLogItem[];
    comments?: BookComment[];
    commentReports?: CommentReport[];
    subscribers?: NewsletterSubscriber[];
    siteContent?: HomepageContent;
    siteSettings?: SiteSettings;
    newsletterSettings?: NewsletterSettings;
    [key: string]: any;
  };
}

export interface SiteBackupSummary {
  booksCount: number;
  seriesCount: number;
  storiesCount: number;
  newsCount: number;
  galleryCount: number;
  charactersCount: number;
  loreCount: number;
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
    gallery: GalleryItem[];
    characters: Character[];
    lore: LoreEntry[];
    siteContent: HomepageContent;
    siteSettings?: SiteSettings;
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

    // 2. Stories, News, Gallery, Characters & Lore
    const stories: Story[] = await storyService.getStories();
    const news: NewsArticle[] = await newsService.getAllArticles();
    const gallery: GalleryItem[] = await galleryService.getAllItems();
    const characters: Character[] = await characterLoreService.getAllCharacters();
    const lore: LoreEntry[] = await characterLoreService.getAllLore();

    // 3. Site Content & Global Site Settings
    const siteContent = siteContentService.getContent();
    const siteSettings = siteSettingsService.getSettings();

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
      galleryCount: gallery.length,
      charactersCount: characters.length,
      loreCount: lore.length,
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
        gallery,
        characters,
        lore,
        siteContent,
        siteSettings,
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
   * Generates a full structured JSON backup matching the standardized payload format:
   * {
   *   "version": "1.0",
   *   "timestamp": "ISO_TIMESTAMP",
   *   "data": { "books": [...], "chapters": [...], "posts": [...], ... }
   * }
   * and triggers automatic download of backup-[timestamp].json.
   */
  public async exportFullBackupJSON(
    userRole?: string,
    userEmail?: string
  ): Promise<StandardBackupPayload> {
    if (!this.isAuthorizedAuthor(userRole, userEmail)) {
      throw new Error(
        'Access Denied: Only administrator users with an Author account are authorized to export backups.'
      );
    }

    const email = userEmail || auth.currentUser?.email || ADMIN_EMAIL;
    const now = new Date().toISOString();

    // 1. Fetch primary collections
    const [
      books,
      series,
      auditLogs,
      stories,
      news,
      songs,
      gallery,
      characters,
      lore,
      comments,
      commentReports,
      readerMessages,
    ] = await Promise.all([
      bookService.getBooks(),
      bookService.getSeries(),
      bookService.getAuditLogs(),
      storyService.getStories(),
      newsService.getAllArticles(),
      songService.getSongs(),
      galleryService.getAllItems(),
      characterLoreService.getAllCharacters(),
      characterLoreService.getAllLore(),
      commentService.getAllComments(),
      commentService.getAllReports(),
      messageService.getMessages(),
    ]);

    let usersList: Partial<UserProfile>[] = [];
    try {
      const fullUsers = await userService.getAllUsers();
      usersList = fullUsers.map((u) => ({
        uid: u.uid,
        displayName: u.displayName,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
    } catch {
      usersList = [];
    }

    const subscribers = newsletterService.getSubscribers();
    const siteContent = siteContentService.getContent();
    const siteSettings = siteSettingsService.getSettings();

    const payload: StandardBackupPayload = {
      version: '1.0',
      timestamp: now,
      metadata: {
        siteName: 'Matthew E. Messmer | Official Author Website',
        exportedByEmail: email,
        exportedByRole: 'AUTHOR',
      },
      data: {
        books,
        chapters: stories,
        posts: news,
        series,
        stories,
        news,
        songs,
        gallery,
        characters,
        lore,
        messages: readerMessages,
        readerMessages,
        users: usersList,
        comments,
        commentReports,
        auditLogs,
        moderationLogs: auditLogs,
        subscribers,
        siteContent,
        siteSettings,
      },
    };

    // Trigger download of backup-[timestamp].json
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStamp = now.replace(/[:.]/g, '-');
    const filename = `backup-${dateStamp}.json`;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return payload;
  }

  /**
   * Reads, parses, and validates an uploaded backup file (.json)
   */
  public async parseBackupFile(
    file: File
  ): Promise<{
    parsed: StandardBackupPayload;
    totalRecords: number;
    collectionsSummary: Record<string, number>;
  }> {
    if (!file) {
      throw new Error('No file was selected for restoration.');
    }

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      throw new Error('Invalid file type. Please upload a valid JSON backup file (.json).');
    }

    const text = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      throw new Error(`Failed to parse JSON backup file: ${err.message}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Corrupted backup file: Root structure must be a JSON object.');
    }

    const dataObj = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    const collectionsSummary: Record<string, number> = {};
    let totalRecords = 0;

    const countItems = (key: string, arr: any) => {
      if (Array.isArray(arr) && arr.length > 0) {
        collectionsSummary[key] = arr.length;
        totalRecords += arr.length;
      }
    };

    countItems('books', dataObj.books);
    countItems('series', dataObj.series);
    countItems('chapters/stories', dataObj.chapters || dataObj.stories);
    countItems('posts/news', dataObj.posts || dataObj.news);
    countItems('songs', dataObj.songs);
    countItems('gallery', dataObj.gallery);
    countItems('characters', dataObj.characters);
    countItems('lore', dataObj.lore);
    countItems('messages', dataObj.messages || dataObj.readerMessages);
    countItems('users', dataObj.users);
    countItems('comments', dataObj.comments);
    countItems('commentReports', dataObj.commentReports);
    countItems('auditLogs', dataObj.auditLogs || dataObj.moderationLogs);
    countItems('subscribers', dataObj.subscribers);

    if (totalRecords === 0 && !dataObj.siteContent && !dataObj.siteSettings) {
      throw new Error(
        'Invalid backup file: No recognizable collections or records found to restore.'
      );
    }

    return {
      parsed,
      totalRecords,
      collectionsSummary,
    };
  }

  /**
   * Safely restores collections into Firestore using writeBatch in chunks of 200,
   * retaining original document IDs and updating live progress.
   */
  public async restoreFromBackup(
    payload: StandardBackupPayload | any,
    options?: {
      onProgress?: (progress: RestoreProgress) => void;
      userRole?: string;
      userEmail?: string;
    }
  ): Promise<RestoreResult> {
    if (!this.isAuthorizedAuthor(options?.userRole, options?.userEmail)) {
      throw new Error(
        'Access Denied: Only administrator users with Author privileges are authorized to restore backups.'
      );
    }

    const dataObj = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    const collectionsMap: { collectionName: string; items: any[] }[] = [];

    // Collect array collections
    if (Array.isArray(dataObj.books) && dataObj.books.length > 0) {
      collectionsMap.push({ collectionName: 'books', items: dataObj.books });
    }
    if (Array.isArray(dataObj.series) && dataObj.series.length > 0) {
      collectionsMap.push({ collectionName: 'series', items: dataObj.series });
    }
    const storiesList = dataObj.chapters || dataObj.stories;
    if (Array.isArray(storiesList) && storiesList.length > 0) {
      collectionsMap.push({ collectionName: 'stories', items: storiesList });
    }
    const newsList = dataObj.posts || dataObj.news;
    if (Array.isArray(newsList) && newsList.length > 0) {
      collectionsMap.push({ collectionName: 'news', items: newsList });
    }
    if (Array.isArray(dataObj.songs) && dataObj.songs.length > 0) {
      collectionsMap.push({ collectionName: 'songs', items: dataObj.songs });
    }
    if (Array.isArray(dataObj.gallery) && dataObj.gallery.length > 0) {
      collectionsMap.push({ collectionName: 'gallery', items: dataObj.gallery });
    }
    if (Array.isArray(dataObj.characters) && dataObj.characters.length > 0) {
      collectionsMap.push({ collectionName: 'characters', items: dataObj.characters });
    }
    if (Array.isArray(dataObj.lore) && dataObj.lore.length > 0) {
      collectionsMap.push({ collectionName: 'lore', items: dataObj.lore });
    }
    const messagesList = dataObj.messages || dataObj.readerMessages;
    if (Array.isArray(messagesList) && messagesList.length > 0) {
      collectionsMap.push({ collectionName: 'messages', items: messagesList });
    }
    if (Array.isArray(dataObj.users) && dataObj.users.length > 0) {
      collectionsMap.push({ collectionName: 'users', items: dataObj.users });
    }
    if (Array.isArray(dataObj.comments) && dataObj.comments.length > 0) {
      collectionsMap.push({ collectionName: 'comments', items: dataObj.comments });
    }
    if (Array.isArray(dataObj.commentReports) && dataObj.commentReports.length > 0) {
      collectionsMap.push({ collectionName: 'commentReports', items: dataObj.commentReports });
    }
    const logsList = dataObj.moderationLogs || dataObj.auditLogs;
    if (Array.isArray(logsList) && logsList.length > 0) {
      collectionsMap.push({ collectionName: 'audit_logs', items: logsList });
    }

    // Calculate total operations
    let totalItems = collectionsMap.reduce((acc, c) => acc + c.items.length, 0);
    if (dataObj.siteContent) totalItems += 1;
    if (dataObj.siteSettings) totalItems += 1;

    let processedCount = 0;
    const collectionsSummary: Record<string, number> = {};

    // Execute batched writes in chunks of 200
    for (const group of collectionsMap) {
      const { collectionName, items } = group;
      let colSuccessCount = 0;
      const CHUNK_SIZE = 200;

      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        for (const item of chunk) {
          const docId = String(item.id || item.uid || item._id || `restored-${Date.now()}-${Math.random()}`);
          const docRef = doc(db, collectionName, docId);
          // Clean item of undefined values
          const cleanItem = JSON.parse(JSON.stringify(item));
          cleanItem.restoredAt = new Date().toISOString();
          batch.set(docRef, cleanItem, { merge: true });
        }

        await batch.commit();

        colSuccessCount += chunk.length;
        processedCount += chunk.length;

        const percent = totalItems > 0 ? Math.round((processedCount / totalItems) * 100) : 100;
        options?.onProgress?.({
          processed: processedCount,
          total: totalItems,
          collectionName,
          percent,
        });
      }

      collectionsSummary[collectionName] = colSuccessCount;
    }

    // Restore single docs if present
    if (dataObj.siteContent) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'site_content', 'homepage'), JSON.parse(JSON.stringify(dataObj.siteContent)), { merge: true });
        await batch.commit();
        processedCount += 1;
        collectionsSummary['site_content'] = 1;
      } catch (err) {
        console.warn('Failed restoring siteContent document:', err);
      }
    }

    if (dataObj.siteSettings) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'settings', 'global'), JSON.parse(JSON.stringify(dataObj.siteSettings)), { merge: true });
        await batch.commit();
        processedCount += 1;
        collectionsSummary['settings'] = 1;
      } catch (err) {
        console.warn('Failed restoring siteSettings document:', err);
      }
    }

    // Final 100% progress
    options?.onProgress?.({
      processed: totalItems,
      total: totalItems,
      collectionName: 'Complete',
      percent: 100,
    });

    // Invalidate and re-fetch UI caches across all services
    try {
      await Promise.allSettled([
        bookService.getBooks(),
        bookService.getSeries(),
        newsService.getAllArticles(),
        storyService.getStories(),
        songService.forceRefresh(),
        galleryService.getAllItems(),
        characterLoreService.getAllCharacters(),
        characterLoreService.getAllLore(),
        messageService.getMessages(),
        commentService.getAllComments(),
        commentService.getAllReports(),
      ]);
    } catch (err) {
      console.warn('Cache re-fetch warning after restore:', err);
    }

    return {
      totalRestored: processedCount,
      collectionsSummary,
    };
  }

  /**
   * Prompts the browser to download the backup as a JSON file
   */
  public triggerFileDownload(payload: SiteBackupPayload): void {
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${dateStamp}.json`;

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
