import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { NewsArticle, PublicationState } from '../types';
import { NEWS_ARTICLES as SEEDED_NEWS } from '../data/authorData';

const NEWS_COLLECTION = 'news';
const LOCAL_STORAGE_KEY = 'mmessmer_author_news_v2';
const LOCAL_STORAGE_NEWS_SEEDED_KEY = 'mmessmer_author_news_seeded_v2';

type NewsListener = (articles: NewsArticle[]) => void;

class NewsService {
  private articles: NewsArticle[] = [];
  private listeners: Set<NewsListener> = new Set();
  private initialized = false;
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.articles = JSON.parse(stored);
      } else {
        this.articles = SEEDED_NEWS.map((n) => ({
          ...n,
          publicationState: n.publicationState || 'PUBLIC',
          createdAt: n.date ? new Date(n.date).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Matthew E. Messmer',
        }));
        this.saveLocally();
      }
    } catch {
      this.articles = [...SEEDED_NEWS];
    }

    this.initRealtime();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.articles));
      localStorage.setItem(LOCAL_STORAGE_NEWS_SEEDED_KEY, 'true');
    } catch {}
  }

  private notify(): void {
    const copy = [...this.articles];
    this.listeners.forEach((fn) => fn(copy));
  }

  subscribe(listener: NewsListener): () => void {
    this.listeners.add(listener);
    listener([...this.articles]);
    return () => this.listeners.delete(listener);
  }

  private initRealtime(): void {
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, NEWS_COLLECTION),
        (snapshot) => {
          const isSeeded = typeof window !== 'undefined'
            ? localStorage.getItem(LOCAL_STORAGE_NEWS_SEEDED_KEY)
            : null;

          if (!snapshot.empty) {
            this.initialized = true;
            const list: NewsArticle[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Partial<NewsArticle>;
              list.push({
                id: d.id,
                slug: data.slug || d.id,
                title: data.title || 'Untitled Dispatch',
                category: data.category || 'Announcement',
                date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                readTime: data.readTime || '4 min read',
                summary: data.summary || '',
                content: Array.isArray(data.content) ? data.content : [String(data.content || '')],
                tags: Array.isArray(data.tags) ? data.tags : [],
                featured: !!data.featured,
                publicationState: (data.publicationState as PublicationState) || 'PUBLIC',
                publishedAt: data.publishedAt,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                author: data.author || 'Matthew E. Messmer',
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
                seo: data.seo,
              });
            });
            // Sort by createdAt / date descending
            list.sort((a, b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime());
            this.articles = list;
            this.saveLocally();
            this.notify();
          } else {
            this.initialized = true;
            this.articles = [];
            this.saveLocally();
            this.notify();
          }
        },
        (error) => {
          console.warn('Realtime news listener notice:', error);
          this.fetchInitialOnce();
        }
      );
    } catch (err) {
      this.fetchInitialOnce();
    }
  }

  private async fetchInitialOnce(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, NEWS_COLLECTION));
      this.initialized = true;

      if (!snap.empty) {
        const list: NewsArticle[] = [];
        snap.forEach((d) => {
          list.push({ ...(d.data() as NewsArticle), id: d.id });
        });
        this.articles = list;
        this.saveLocally();
        this.notify();
      } else {
        this.articles = [];
        this.saveLocally();
        this.notify();
      }
    } catch {}
  }

  private async seedInitialArticles(): Promise<void> {
    this.initialized = true;
    for (const item of SEEDED_NEWS) {
      try {
        const formatted: NewsArticle = {
          ...item,
          publicationState: item.publicationState || 'PUBLIC',
          createdAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Matthew E. Messmer',
          createdBy: 'system-seed',
        };
        await setDoc(doc(db, NEWS_COLLECTION, item.id), formatted);
      } catch {}
    }
  }

  async getAllArticles(): Promise<NewsArticle[]> {
    return [...this.articles];
  }

  async getPublicArticles(): Promise<NewsArticle[]> {
    return this.articles.filter((a) => {
      const state = (a.publicationState || 'PUBLIC').toUpperCase();
      return state === 'PUBLIC' || state === 'TEASER';
    });
  }

  getArticleById(id: string): NewsArticle | undefined {
    return this.articles.find((a) => a.id === id);
  }

  getArticleBySlug(slug: string): NewsArticle | undefined {
    return this.articles.find((a) => a.slug === slug || a.id === slug);
  }

  /**
   * Save (Create or In-Place Edit) a News Article.
   * Author has full control; Editors can edit existing content.
   */
  async saveArticle(
    article: Partial<NewsArticle> & { title: string },
    isAuthor: boolean,
    isEditor: boolean = false,
    userProfile?: { name?: string; email?: string }
  ): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    const isNew = !article.id || !this.articles.some((a) => a.id === article.id);

    if (isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You must be an Author or Editor to create news articles.' };
    }

    if (!isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You do not have permissions to edit news articles.' };
    }

    if (!article.title || !article.title.trim()) {
      return { success: false, error: 'Article title is required.' };
    }

    const existing = !isNew ? this.articles.find((a) => a.id === article.id) : null;
    const nowIso = new Date().toISOString();

    const id = existing ? existing.id : (article.id || `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const slug = article.slug?.trim() || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dateStr = article.date?.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const contentArray = Array.isArray(article.content)
      ? article.content
      : typeof article.content === 'string'
      ? (article.content as string).split('\n\n').filter(Boolean)
      : [];

    const savedArticle: NewsArticle = {
      id,
      slug,
      title: article.title.trim(),
      category: article.category || 'Announcement',
      date: dateStr,
      readTime: article.readTime?.trim() || '4 min read',
      summary: article.summary?.trim() || '',
      content: contentArray,
      tags: Array.isArray(article.tags) ? article.tags : [],
      featured: !!article.featured,
      publicationState: article.publicationState || 'PUBLIC',
      publishedAt: article.publishedAt || (article.publicationState === 'PUBLIC' ? dateStr : undefined),
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      author: article.author?.trim() || userProfile?.name || 'Matthew E. Messmer',
      createdBy: existing?.createdBy || userProfile?.email || 'author',
      updatedBy: userProfile?.email || (isAuthor ? 'author' : 'editor'),
      seo: article.seo,
    };

    // Update in-memory
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx >= 0) {
      this.articles[idx] = savedArticle;
    } else {
      this.articles.unshift(savedArticle);
    }

    this.saveLocally();
    this.notify();

    // Persist to Firestore (in-place update using doc ID)
    try {
      await setDoc(doc(db, NEWS_COLLECTION, id), savedArticle);
    } catch (error) {
      console.warn('Firestore setDoc notice for news:', error);
      try {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `news/${id}`);
      } catch (e) {
        // If Firestore rules blocked or connection failed, the local save ensures continuity
      }
    }

    return { success: true, article: savedArticle };
  }

  /**
   * Delete News Article.
   * Strictly Author-only.
   */
  async deleteArticle(
    articleId: string,
    isAuthor: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Deleting News & Dispatches is strictly restricted to the Author.',
      };
    }

    const idx = this.articles.findIndex((a) => a.id === articleId);
    if (idx === -1) {
      return { success: false, error: 'Dispatch not found.' };
    }

    this.articles.splice(idx, 1);
    this.saveLocally();
    this.notify();

    try {
      await deleteDoc(doc(db, NEWS_COLLECTION, articleId));
    } catch (error) {
      console.warn('Firestore deleteDoc notice for news:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `news/${articleId}`);
      } catch (e) {}
    }

    return { success: true };
  }
}

export const newsService = new NewsService();
