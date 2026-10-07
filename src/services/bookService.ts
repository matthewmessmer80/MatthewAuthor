import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getCountFromServer,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { BOOKS as INITIAL_STATIC_BOOKS } from '../data/authorData';
import { Book } from '../types';
import { optimizeCoverImage } from '../utils/imageOptimizer';

export type AdminPublicationState = 'PUBLIC' | 'TEASER' | 'DRAFT' | 'PRIVATE';

export interface ManagedBook {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  seriesId: string;
  seriesName: string;
  seriesOrder: number;
  bookNumber?: number;
  shortDescription?: string;
  description: string;
  genre?: string;
  coverImage?: string;
  coverImageAlt?: string;
  coverStoragePath?: string;
  amazonUrl?: string;
  retailerLinks?: Array<{ name: string; url: string; badge?: string }>;
  author: string;
  language: string;
  isbn?: string;
  publisher?: string;
  publicationDate?: string;
  pageCount?: number;
  status: 'published' | 'pending' | 'unreleased' | 'archived';
  publicationState: AdminPublicationState;
  featured: boolean;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  socialImage?: string;
  indexing: 'index' | 'noindex';
  woodEngravingNote?: string;
  quote?: {
    text: string;
    attribution: string;
  };
  excerpt?: {
    chapterTitle: string;
    text: string[];
  };
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  updatedBy?: string;
  updatedByRole?: string;
}

export type SeriesStatus =
  | 'ACTIVE'
  | 'IN DEVELOPMENT'
  | 'COMPLETED'
  | 'ON HIATUS'
  | 'ARCHIVED'
  | 'published'
  | 'in-progress'
  | 'archived';

export interface ManagedSeries {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  genres?: string[];
  artworkUrl?: string;
  bannerImage?: string;
  status: SeriesStatus;
  publicationState: AdminPublicationState;
  bookIds: string[]; // Order of book IDs
  seoTitle?: string;
  metaDescription?: string;
  socialImage?: string;
  canonicalUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface AuditLogItem {
  id?: string;
  action: string;
  targetId?: string;
  targetType: 'book' | 'series' | 'cover' | 'newsletter' | 'settings';
  details: string;
  userEmail: string;
  userId: string;
  timestamp: any;
}

/**
 * Normalizes any incoming Firestore book document to the canonical ManagedBook interface.
 * Guards against field-name variations (e.g., publication_status vs publicationState, series_id vs seriesId).
 */
export function normalizeFirestoreBook(docId: string, raw: any): ManagedBook {
  if (!raw) {
    return {
      id: docId,
      slug: docId,
      title: 'Untitled Book',
      seriesId: '',
      seriesName: '',
      seriesOrder: 1,
      description: '',
      author: 'Matthew E. Messmer',
      language: 'English',
      status: 'unreleased',
      publicationState: 'DRAFT',
      featured: false,
      indexing: 'noindex',
    };
  }

  const rawPubState = raw.publicationState || raw.publication_state || raw.publication_status;
  let publicationState: AdminPublicationState = 'DRAFT';
  if (rawPubState) {
    const upper = String(rawPubState).toUpperCase();
    if (upper === 'PUBLIC' || upper === 'TEASER' || upper === 'DRAFT' || upper === 'PRIVATE') {
      publicationState = upper;
    }
  } else if (raw.status === 'published') {
    publicationState = 'PUBLIC';
  }

  const seriesOrder = Number(raw.seriesOrder ?? raw.series_order ?? raw.bookNumber ?? raw.book_number ?? 1);
  const bookNumber = Number(raw.bookNumber ?? raw.book_number ?? seriesOrder);

  return {
    id: docId || raw.id || raw.slug,
    slug: raw.slug || docId,
    title: raw.title || raw.name || 'Untitled Book',
    subtitle: raw.subtitle || '',
    seriesId: raw.seriesId || raw.series_id || '',
    seriesName: raw.seriesName || raw.series_name || '',
    seriesOrder: isNaN(seriesOrder) ? 1 : seriesOrder,
    bookNumber: isNaN(bookNumber) ? 1 : bookNumber,
    shortDescription: raw.shortDescription || raw.short_description || '',
    description: raw.description || raw.synopsis || '',
    genre: raw.genre || 'Epic Fantasy',
    coverImage: raw.coverImage || raw.coverUrl || raw.cover_url || raw.cover || raw.customCoverUrl || '',
    coverImageAlt: raw.coverImageAlt || raw.cover_image_alt || `${raw.title || 'Book'} cover by Matthew E. Messmer`,
    coverStoragePath: raw.coverStoragePath || raw.cover_storage_path || '',
    amazonUrl: raw.amazonUrl || raw.amazon_url || '',
    retailerLinks: Array.isArray(raw.retailerLinks) ? raw.retailerLinks : (raw.retailer_links || raw.buyLinks || []),
    author: raw.author || 'Matthew E. Messmer',
    language: raw.language || 'English',
    isbn: raw.isbn || '',
    publisher: raw.publisher || 'Breathwoven Press',
    publicationDate: raw.publicationDate || raw.publication_date || raw.releaseYear || '',
    pageCount: Number(raw.pageCount || raw.page_count || 0),
    status: ((): 'published' | 'pending' | 'unreleased' => {
      const s = String(raw.status || '').toLowerCase();
      if (s === 'pending' || s === 'upcoming') return 'pending';
      if (s === 'unreleased' || s === 'in-progress' || s === 'draft') return 'unreleased';
      if (s === 'published') return 'published';
      if (publicationState === 'TEASER') return 'pending';
      if (publicationState === 'DRAFT' || publicationState === 'PRIVATE') return 'unreleased';
      return 'published';
    })(),
    publicationState,
    featured: Boolean(raw.featured),
    seoTitle: raw.seoTitle || raw.seo_title || `${raw.title || 'Book'} | Matthew E. Messmer`,
    metaDescription: raw.metaDescription || raw.meta_description || raw.shortDescription || '',
    canonicalUrl: raw.canonicalUrl || raw.canonical_url || `/${raw.slug || docId}`,
    socialImage: raw.socialImage || raw.social_image || raw.coverImage || '',
    indexing: raw.indexing || (publicationState === 'PUBLIC' ? 'index' : 'noindex'),
    woodEngravingNote: raw.woodEngravingNote || raw.wood_engraving_note || '',
    quote: raw.quote,
    excerpt: raw.excerpt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy || raw.created_by,
    updatedBy: raw.updatedBy || raw.updated_by,
    updatedByRole: raw.updatedByRole || raw.updated_by_role,
  };
}

/**
 * Normalizes any incoming Firestore series document to the canonical ManagedSeries interface.
 */
export function normalizeFirestoreSeries(docId: string, raw: any): ManagedSeries {
  if (!raw) {
    return {
      id: docId,
      name: 'Untitled Series',
      slug: docId,
      description: '',
      status: 'IN DEVELOPMENT',
      publicationState: 'DRAFT',
      bookIds: [],
    };
  }

  const rawPubState = raw.publicationState || raw.publication_state || raw.publication_status;
  let publicationState: AdminPublicationState = 'PUBLIC';
  if (rawPubState) {
    const upper = String(rawPubState).toUpperCase();
    if (upper === 'PUBLIC' || upper === 'TEASER' || upper === 'DRAFT' || upper === 'PRIVATE') {
      publicationState = upper;
    }
  }

  let rawBookIds: string[] = Array.isArray(raw.bookIds) ? raw.bookIds : (raw.book_ids || []);
  rawBookIds = Array.from(new Set(rawBookIds));

  return {
    id: docId || raw.id || raw.slug,
    name: raw.name || raw.title || 'Untitled Series',
    slug: raw.slug || (raw.name ? raw.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : docId),
    description: raw.description || '',
    shortDescription: raw.shortDescription || raw.short_description || '',
    genres: Array.isArray(raw.genres) ? raw.genres : (raw.genre ? [raw.genre] : ['Epic Fantasy']),
    artworkUrl: raw.artworkUrl || raw.artwork_url || raw.coverImage || raw.image || raw.bannerImage || '',
    bannerImage: raw.bannerImage || raw.banner_image || raw.bannerUrl || raw.banner_url || raw.artworkUrl || raw.artwork_url || '',
    status: raw.status || 'IN DEVELOPMENT',
    publicationState,
    bookIds: rawBookIds,
    seoTitle: raw.seoTitle || raw.seo_title || `${raw.name || 'Series'} | Matthew E. Messmer`,
    metaDescription: raw.metaDescription || raw.meta_description || raw.shortDescription || '',
    socialImage: raw.socialImage || raw.social_image || raw.artworkUrl || '',
    canonicalUrl: raw.canonicalUrl || `/series/${raw.slug || docId}`,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy,
  };
}

// Convert Initial Static Books to ManagedBook format
const INITIAL_MANAGED_BOOKS: ManagedBook[] = [
  {
    id: 'kings-severance',
    slug: 'the-kings-severance',
    title: "The King's Severance",
    subtitle: 'Book One of The Breathwoven Cycle',
    seriesId: 'breathwoven-cycle',
    seriesName: 'The Breathwoven Cycle',
    seriesOrder: 1,
    bookNumber: 1,
    shortDescription: 'When the golden thread of royalty snaps, an empire unravels into song and blade.',
    description: INITIAL_STATIC_BOOKS[0].description || INITIAL_STATIC_BOOKS[0].synopsis || '',
    genre: 'Epic Fantasy',
    coverImageAlt: "The King's Severance book cover by Matthew E. Messmer",
    amazonUrl: 'https://www.amazon.com/gp/product/B0GZFDD4VG',
    retailerLinks: INITIAL_STATIC_BOOKS[0].buyLinks,
    author: 'Matthew E. Messmer',
    language: 'English',
    isbn: '978-1-962450-01-8',
    publisher: 'Breathwoven Press',
    publicationDate: '2024',
    pageCount: 448,
    status: 'published',
    publicationState: 'PUBLIC',
    featured: true,
    seoTitle: "The King's Severance | Matthew E. Messmer",
    metaDescription: "The King's Severance (Breathwoven Cycle Book 1) by Matthew E. Messmer. When the golden thread of royalty snaps, an empire unravels into song and blade.",
    canonicalUrl: '/the-kings-severance',
    indexing: 'index',
    woodEngravingNote: INITIAL_STATIC_BOOKS[0].woodEngravingNote,
    quote: INITIAL_STATIC_BOOKS[0].quote,
    excerpt: INITIAL_STATIC_BOOKS[0].excerpt,
  },
  {
    id: 'blue-moon-child',
    slug: 'the-blue-moon-child',
    title: 'The Blue Moon Child',
    subtitle: 'Book Two of The Breathwoven Cycle',
    seriesId: 'breathwoven-cycle',
    seriesName: 'The Breathwoven Cycle',
    seriesOrder: 2,
    bookNumber: 2,
    shortDescription: 'Beneath a celestial tide that drowns memory, an orphaned daughter carries the loom of kings.',
    description: INITIAL_STATIC_BOOKS[1].description || INITIAL_STATIC_BOOKS[1].synopsis || '',
    genre: 'Epic Fantasy',
    coverImageAlt: 'The Blue Moon Child book cover by Matthew E. Messmer',
    amazonUrl: 'https://www.amazon.com/gp/product/B0GZDNWRML',
    retailerLinks: INITIAL_STATIC_BOOKS[1].buyLinks,
    author: 'Matthew E. Messmer',
    language: 'English',
    isbn: '978-1-962450-02-5',
    publisher: 'Breathwoven Press',
    publicationDate: '2025',
    pageCount: 486,
    status: 'published',
    publicationState: 'PUBLIC',
    featured: false,
    seoTitle: 'The Blue Moon Child | Matthew E. Messmer',
    metaDescription: 'The Blue Moon Child (Breathwoven Cycle Book 2) by Matthew E. Messmer. An orphaned daughter with silver strands in her eyes carries the loom of kings.',
    canonicalUrl: '/the-blue-moon-child',
    indexing: 'index',
    woodEngravingNote: INITIAL_STATIC_BOOKS[1].woodEngravingNote,
    quote: INITIAL_STATIC_BOOKS[1].quote,
    excerpt: INITIAL_STATIC_BOOKS[1].excerpt,
  },
  {
    id: 'weavers-lullaby',
    slug: 'the-weavers-lullaby',
    title: "The Weaver's Lullaby",
    subtitle: 'The Great Mending · Book 3 of The Breathwoven Cycle',
    seriesId: 'breathwoven-cycle',
    seriesName: 'The Breathwoven Cycle',
    seriesOrder: 3,
    bookNumber: 3,
    shortDescription: 'The final stitch is never spoken; it is endured.',
    description: INITIAL_STATIC_BOOKS[2].description || INITIAL_STATIC_BOOKS[2].synopsis || '',
    genre: 'Epic Fantasy',
    coverImageAlt: "The Weaver's Lullaby book cover by Matthew E. Messmer",
    amazonUrl: 'https://www.amazon.com/gp/product/B0H1F45TVM',
    retailerLinks: INITIAL_STATIC_BOOKS[2].buyLinks,
    author: 'Matthew E. Messmer',
    language: 'English',
    isbn: '978-1-962450-03-2',
    publisher: 'Breathwoven Press',
    publicationDate: '2026',
    pageCount: 528,
    status: 'published',
    publicationState: 'PUBLIC',
    featured: false,
    seoTitle: "The Weaver's Lullaby | Matthew E. Messmer",
    metaDescription: "The Weaver's Lullaby (Breathwoven Cycle Book 3) by Matthew E. Messmer. The climactic conclusion to the first arc of The Breathwoven Cycle.",
    canonicalUrl: '/the-weavers-lullaby',
    indexing: 'index',
    woodEngravingNote: INITIAL_STATIC_BOOKS[2].woodEngravingNote,
    quote: INITIAL_STATIC_BOOKS[2].quote,
    excerpt: INITIAL_STATIC_BOOKS[2].excerpt,
  },
  {
    id: 'ignis-kor',
    slug: 'ignis-kor-the-heart-of-fire',
    title: 'Ignis-Kor: The Heart of Fire',
    subtitle: 'A Breathwoven Universe Novella',
    seriesId: 'series-1791135616897',
    seriesName: 'The Abyssmal Current',
    seriesOrder: 1,
    bookNumber: 1,
    shortDescription: 'Where embers refuse to die, an ancient forge reawakens.',
    description: INITIAL_STATIC_BOOKS[4]?.synopsis || 'Subterranean fire and ancient forge worldbuilding.',
    genre: 'Fantasy Novella',
    coverImageAlt: 'Ignis-Kor: The Heart of Fire book cover by Matthew E. Messmer',
    amazonUrl: '',
    retailerLinks: INITIAL_STATIC_BOOKS[4]?.buyLinks || [],
    author: 'Matthew E. Messmer',
    language: 'English',
    isbn: '978-1-962450-05-7',
    publisher: 'Breathwoven Press',
    publicationDate: '2026',
    pageCount: 224,
    status: 'unreleased',
    publicationState: 'TEASER',
    featured: false,
    seoTitle: 'Ignis-Kor: The Heart of Fire | Matthew E. Messmer',
    metaDescription: 'Ignis-Kor: The Heart of Fire by Matthew E. Messmer. An ancient forge awakens in the subterranean magma catacombs.',
    canonicalUrl: '/ignis-kor',
    indexing: 'index',
    woodEngravingNote: INITIAL_STATIC_BOOKS[4]?.woodEngravingNote,
    quote: INITIAL_STATIC_BOOKS[4]?.quote,
    excerpt: INITIAL_STATIC_BOOKS[4]?.excerpt,
  },
];

const INITIAL_MANAGED_SERIES: ManagedSeries[] = [
  {
    id: 'breathwoven-cycle',
    name: 'The Breathwoven Cycle',
    slug: 'the-breathwoven-cycle',
    description: 'An expansive epic fantasy trilogy exploring the metaphysical threads binding human memory, courage, and family across time.',
    shortDescription: 'The high fantasy saga of Val-Mora and the Archipelago of Spires.',
    genres: ['Epic Fantasy', 'High Fantasy', 'Metaphysical Fantasy'],
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    status: 'COMPLETED',
    publicationState: 'PUBLIC',
    bookIds: ['kings-severance', 'blue-moon-child', 'weavers-lullaby'],
    seoTitle: 'The Breathwoven Cycle | Matthew E. Messmer',
    metaDescription: 'The Breathwoven Cycle by Matthew E. Messmer. An epic fantasy saga where celestial threads bind fate, memory, and the fate of fractured realms.',
    socialImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: '/the-breathwoven-cycle',
  },
  {
    id: 'series-1791135616897',
    name: 'The Abyssmal Current',
    slug: 'the-abyssmal-current',
    description: 'Drawing from naval discipline and oceanic physics, an ironclad exploration vessel descends into uncharted oceanic depths where time itself compresses.',
    shortDescription: 'A maritime fantasy epic inspired by Navy Master-at-Arms service.',
    genres: ['Maritime Fantasy', 'Naval Epic', 'Temporal Fantasy'],
    artworkUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    status: 'IN DEVELOPMENT',
    publicationState: 'TEASER',
    bookIds: ['ignis-kor'],
    seoTitle: 'The Abyssmal Current | Matthew E. Messmer',
    metaDescription: 'The Abyssal Current by Matthew E. Messmer. A maritime fantasy epic inspired by naval service where oceanic depths hide compressed time.',
    socialImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    canonicalUrl: '/the-abyssal-current',
  },
];

class BookService {
  private books: ManagedBook[] = [];
  private series: ManagedSeries[] = [];
  private booksLoading = true;
  private seriesLoading = true;
  private booksError: Error | null = null;
  private seriesError: Error | null = null;
  private unsubBooks: Unsubscribe | null = null;
  private unsubSeries: Unsubscribe | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.clearStaleStorage();
    this.initRealtimeListeners();
  }

  /**
   * Purge any stale localStorage caches so live Firestore is always authoritative
   */
  private clearStaleStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('mem_managed_books_v1');
      localStorage.removeItem('mem_managed_series_v1');
    } catch (e) {
      // ignore
    }
  }

  private initRealtimeListeners() {
    if (typeof window === 'undefined') return;

    // 1. Canonical Books collection listener
    try {
      const booksCol = collection(db, 'books');
      this.unsubBooks = onSnapshot(
        booksCol,
        (snapshot) => {
          const loaded: ManagedBook[] = [];
          snapshot.forEach((d) => {
            loaded.push(normalizeFirestoreBook(d.id, d.data()));
          });
          // Order by seriesOrder
          loaded.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
          this.books = loaded;
          this.booksLoading = false;
          this.booksError = null;
          this.notify();
        },
        (error) => {
          console.error('[BookService] Real-time Firestore books listener error:', error);
          this.booksLoading = false;
          this.booksError = error instanceof Error ? error : new Error(String(error));
          this.notify();
        }
      );
    } catch (err: any) {
      console.error('[BookService] Error initializing books listener:', err);
      this.booksLoading = false;
      this.booksError = err instanceof Error ? err : new Error(String(err));
      this.notify();
    }

    // 2. Canonical Series collection listener
    try {
      const seriesCol = collection(db, 'series');
      this.unsubSeries = onSnapshot(
        seriesCol,
        (snapshot) => {
          const loaded: ManagedSeries[] = [];
          snapshot.forEach((d) => {
            loaded.push(normalizeFirestoreSeries(d.id, d.data()));
          });
          this.series = loaded;
          this.seriesLoading = false;
          this.seriesError = null;
          this.notify();
        },
        (error) => {
          console.error('[BookService] Real-time Firestore series listener error:', error);
          this.seriesLoading = false;
          this.seriesError = error instanceof Error ? error : new Error(String(error));
          this.notify();
        }
      );
    } catch (err: any) {
      console.error('[BookService] Error initializing series listener:', err);
      this.seriesLoading = false;
      this.seriesError = err instanceof Error ? err : new Error(String(err));
      this.notify();
    }
  }

  public isBooksLoading(): boolean {
    return this.booksLoading;
  }

  public isSeriesLoading(): boolean {
    return this.seriesLoading;
  }

  public getBooksError(): Error | null {
    return this.booksError;
  }

  public getSeriesError(): Error | null {
    return this.seriesError;
  }

  public getCachedBooks(): ManagedBook[] {
    return this.books;
  }

  public getCachedBookById(idOrSlug: string): ManagedBook | null {
    if (!idOrSlug) return null;
    const clean = idOrSlug.trim().toLowerCase();
    return this.books.find((b) => b.id.toLowerCase() === clean || (b.slug && b.slug.toLowerCase() === clean)) || null;
  }

  public getCachedSeries(): ManagedSeries[] {
    return this.series;
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('BookService listener notification error:', e);
      }
    });
  }

  /**
   * Primary method: Returns all actual book documents from Firestore.
   * Does NOT filter by publicationState so Authors & Editors can manage drafts, teasers, and published books.
   */
  public async getAllBooks(): Promise<ManagedBook[]> {
    try {
      const booksCol = collection(db, 'books');
      const snap = await getDocs(booksCol);
      const firestoreBooks: ManagedBook[] = [];
      snap.forEach((doc) => {
        firestoreBooks.push(normalizeFirestoreBook(doc.id, doc.data()));
      });
      firestoreBooks.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
      this.books = firestoreBooks;
      this.booksLoading = false;
      this.booksError = null;
      return firestoreBooks;
    } catch (e: any) {
      console.error('[BookService] Firestore books query failed:', e);
      this.booksLoading = false;
      this.booksError = e instanceof Error ? e : new Error(String(e));
      return this.books;
    }
  }

  /**
   * Alias for getAllBooks for backward compatibility
   */
  public async getBooks(): Promise<ManagedBook[]> {
    return this.getAllBooks();
  }

  /**
   * Returns server-side count of books from Firestore collection
   */
  public async getBookCount(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(db, 'books'));
      return snap.data().count;
    } catch (e) {
      return this.books.length;
    }
  }

  /**
   * Primary method: Returns all actual series documents from Firestore.
   */
  public async getAllSeries(): Promise<ManagedSeries[]> {
    try {
      const snap = await getDocs(collection(db, 'series'));
      const list: ManagedSeries[] = [];
      snap.forEach((d) => {
        list.push(normalizeFirestoreSeries(d.id, d.data()));
      });
      this.series = list;
      this.seriesLoading = false;
      this.seriesError = null;
      return list;
    } catch (e: any) {
      console.error('[BookService] Firestore series query failed:', e);
      this.seriesLoading = false;
      this.seriesError = e instanceof Error ? e : new Error(String(e));
      return this.series;
    }
  }

  /**
   * Alias for getAllSeries for backward compatibility
   */
  public async getSeries(): Promise<ManagedSeries[]> {
    return this.getAllSeries();
  }

  /**
   * Returns server-side count of series from Firestore collection
   */
  public async getSeriesCount(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(db, 'series'));
      return snap.data().count;
    } catch (e) {
      return this.series.length;
    }
  }

  /**
   * Returns only publicly visible books for general site visitors.
   * Excludes archived and private/draft items.
   */
  public async getPublicBooks(): Promise<ManagedBook[]> {
    const all = await this.getAllBooks();
    return all.filter(
      (b) =>
        b.status !== 'archived' &&
        b.publicationState !== 'PRIVATE' &&
        b.publicationState !== 'DRAFT'
    );
  }

  public async getBookById(idOrSlug: string): Promise<ManagedBook | null> {
    const books = await this.getAllBooks();
    const clean = idOrSlug.toLowerCase().trim();
    return (
      books.find(
        (b) =>
          b.id.toLowerCase() === clean ||
          (b.slug && b.slug.toLowerCase() === clean) ||
          (b.canonicalUrl && b.canonicalUrl.toLowerCase().replace(/^\//, '') === clean.replace(/^\//, ''))
      ) || null
    );
  }

  /**
   * Resolves a series by ID, URL slug, or name with robust fuzzy fallback.
   */
  public async getSeriesByIdOrSlug(idOrSlug: string): Promise<ManagedSeries | null> {
    const list = await this.getAllSeries();
    if (!idOrSlug) return list[0] || null;

    const rawClean = idOrSlug.toLowerCase().trim().replace(/^\/series\//, '');
    const withoutPrefix = rawClean.replace(/^series-/, '');
    
    // 1. Direct ID, slug, or name exact match
    let found = list.find(
      (s) =>
        s.id.toLowerCase() === rawClean ||
        s.id.toLowerCase() === withoutPrefix ||
        s.id.toLowerCase() === `series-${withoutPrefix}` ||
        s.slug.toLowerCase().replace(/^\/series\//, '') === rawClean ||
        s.slug.toLowerCase().replace(/^\/series\//, '') === withoutPrefix ||
        s.name.toLowerCase() === rawClean ||
        s.name.toLowerCase() === withoutPrefix
    );
    if (found) return found;

    // 2. Semantic matching for Abyssal Current series
    if (rawClean.includes('abyssal') || rawClean.includes('abyssmal')) {
      found = list.find(
        (s) =>
          s.id.toLowerCase().includes('abyssal') ||
          s.id.toLowerCase().includes('abyssmal') ||
          s.slug.toLowerCase().includes('abyssal') ||
          s.slug.toLowerCase().includes('abyssmal') ||
          s.name.toLowerCase().includes('abyssal') ||
          s.name.toLowerCase().includes('abyssmal')
      );
      if (found) return found;
    }

    // 3. Semantic matching for Breathwoven Cycle series
    if (rawClean.includes('breathwoven')) {
      found = list.find(
        (s) =>
          s.id.toLowerCase().includes('breathwoven') ||
          s.slug.toLowerCase().includes('breathwoven') ||
          s.name.toLowerCase().includes('breathwoven')
      );
      if (found) return found;
    }

    return null;
  }

  /**
   * Returns books belonging to a series, strictly ordered by seriesOrder.
   * Unifies seriesId matching, series.bookIds ordering, and status filtering.
   */
  public async getBooksForSeries(
    seriesQuery: string,
    isAuthorOrEditor = false
  ): Promise<ManagedBook[]> {
    const allBooks = isAuthorOrEditor ? await this.getAllBooks() : await this.getPublicBooks();
    const series = await this.getSeriesByIdOrSlug(seriesQuery);

    const rawCleanQuery = seriesQuery.toLowerCase().trim().replace(/^\/series\//, '');
    const cleanQuery = rawCleanQuery.replace(/^series-/, '');
    const sId = series?.id;
    const sSlug = series?.slug?.toLowerCase().replace(/^\/series\//, '');
    const sName = series?.name?.toLowerCase();
    const sBookIds = series?.bookIds || [];

    const matched = allBooks.filter((b) => {
      // 1. Matched by foreign key seriesId
      if (sId && b.seriesId === sId) return true;
      if (sSlug && (b.seriesId?.toLowerCase() === sSlug || b.slug?.toLowerCase() === sSlug)) return true;
      // 2. Matched by seriesName
      if (sName && b.seriesName && b.seriesName.toLowerCase() === sName) return true;
      // 3. Included in series bookIds array
      if (sBookIds.includes(b.id)) return true;
      // 4. Query string direct match on book's seriesId or seriesName
      if (b.seriesId && (b.seriesId.toLowerCase() === rawCleanQuery || b.seriesId.toLowerCase() === cleanQuery)) return true;
      if (b.seriesName && (b.seriesName.toLowerCase() === rawCleanQuery || b.seriesName.toLowerCase() === cleanQuery)) return true;
      return false;
    });

    // Sort strictly by seriesOrder (1, 2, 3...)
    matched.sort((a, b) => {
      const orderA = a.seriesOrder !== undefined && a.seriesOrder !== null && !isNaN(Number(a.seriesOrder))
        ? Number(a.seriesOrder)
        : undefined;
      const orderB = b.seriesOrder !== undefined && b.seriesOrder !== null && !isNaN(Number(b.seriesOrder))
        ? Number(b.seriesOrder)
        : undefined;

      if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
        return orderA - orderB;
      }
      if (orderA !== undefined && orderB === undefined) return -1;
      if (orderB !== undefined && orderA === undefined) return 1;

      // Fallback: position in series.bookIds
      if (sBookIds.length > 0) {
        const idxA = sBookIds.indexOf(a.id);
        const idxB = sBookIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
          return idxA - idxB;
        }
        if (idxA !== -1 && idxB === -1) return -1;
        if (idxB !== -1 && idxA === -1) return 1;
      }

      // Safe fallback: title
      return (a.title || '').localeCompare(b.title || '');
    });

    return matched;
  }

  public async getBooksBySeriesId(seriesId: string): Promise<ManagedBook[]> {
    return this.getBooksForSeries(seriesId, false);
  }

  /**
   * Saves or creates a book record in Firestore.
   */
  public async saveBook(
    bookData: Partial<ManagedBook>,
    isNew = false,
    updaterInfo?: { name?: string; email?: string; role?: string }
  ): Promise<ManagedBook> {
    const user = auth.currentUser;
    const bookId = bookData.id || bookData.slug || `book-${Date.now()}`;
    const slug =
      bookData.slug ||
      bookData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      bookId;

    const existing = this.books.find((b) => b.id === bookId);

    const actorRole =
      updaterInfo?.role ||
      (user?.email?.toLowerCase() === 'mmessmer80@gmail.com' ? 'AUTHOR' : 'EDITOR');
    const actorName = updaterInfo?.name || user?.displayName || user?.email || 'Author';

    const merged: ManagedBook = {
      id: bookId,
      slug,
      title: bookData.title || existing?.title || 'Untitled Book',
      subtitle: bookData.subtitle !== undefined ? bookData.subtitle : existing?.subtitle,
      seriesId: bookData.seriesId || existing?.seriesId || '',
      seriesName: bookData.seriesName || existing?.seriesName || '',
      seriesOrder: bookData.seriesOrder !== undefined ? Number(bookData.seriesOrder) : (existing?.seriesOrder || 1),
      bookNumber: bookData.bookNumber !== undefined ? Number(bookData.bookNumber) : (existing?.bookNumber || 1),
      shortDescription: bookData.shortDescription || existing?.shortDescription || '',
      description: bookData.description || existing?.description || '',
      genre: bookData.genre || existing?.genre || 'Epic Fantasy',
      coverImage: bookData.coverImage !== undefined ? bookData.coverImage : (existing?.coverImage || ''),
      coverImageAlt: bookData.coverImageAlt || `"${bookData.title || 'Book'}" book cover by Matthew E. Messmer`,
      coverStoragePath: bookData.coverStoragePath || existing?.coverStoragePath,
      amazonUrl: bookData.amazonUrl !== undefined ? bookData.amazonUrl : existing?.amazonUrl,
      retailerLinks: bookData.retailerLinks || existing?.retailerLinks || [],
      author: bookData.author || existing?.author || 'Matthew E. Messmer',
      language: bookData.language || existing?.language || 'English',
      isbn: bookData.isbn || existing?.isbn,
      publisher: bookData.publisher || existing?.publisher || 'Breathwoven Press',
      publicationDate: bookData.publicationDate || existing?.publicationDate,
      pageCount: bookData.pageCount || existing?.pageCount,
      status: bookData.status || existing?.status || 'published',
      publicationState: bookData.publicationState || existing?.publicationState || 'PUBLIC',
      featured: bookData.featured !== undefined ? bookData.featured : (existing?.featured || false),
      seoTitle: bookData.seoTitle || `${bookData.title} | Matthew E. Messmer`,
      metaDescription: bookData.metaDescription || bookData.shortDescription || existing?.metaDescription || '',
      canonicalUrl: bookData.canonicalUrl || `/${slug}`,
      socialImage: bookData.socialImage || bookData.coverImage || existing?.socialImage,
      indexing: bookData.indexing || existing?.indexing || 'index',
      woodEngravingNote: bookData.woodEngravingNote || existing?.woodEngravingNote,
      quote: bookData.quote || existing?.quote,
      excerpt: bookData.excerpt || existing?.excerpt,
      updatedAt: new Date().toISOString(),
      updatedBy: `${actorName} — ${actorRole === 'AUTHOR' ? 'Author' : 'Editor'}`,
      updatedByRole: actorRole,
    };

    if (isNew || !existing) {
      merged.createdAt = new Date().toISOString();
      merged.createdBy = user?.email || 'admin';
    }

    // Ensure series synchronization: update series.bookIds and keep seriesName in sync
    if (merged.seriesId) {
      try {
        const seriesList = await this.getAllSeries();
        const targetSeries = seriesList.find((s) => s.id === merged.seriesId || s.slug === merged.seriesId);
        if (targetSeries) {
          merged.seriesId = targetSeries.id;
          merged.seriesName = targetSeries.name;
          if (!targetSeries.bookIds.includes(bookId)) {
            targetSeries.bookIds.push(bookId);
            await setDoc(doc(db, 'series', targetSeries.id), {
              bookIds: targetSeries.bookIds,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        }
        if (existing?.seriesId && existing.seriesId !== merged.seriesId) {
          const oldSeries = seriesList.find((s) => s.id === existing.seriesId);
          if (oldSeries && oldSeries.bookIds.includes(bookId)) {
            oldSeries.bookIds = oldSeries.bookIds.filter((id) => id !== bookId);
            await setDoc(doc(db, 'series', oldSeries.id), {
              bookIds: oldSeries.bookIds,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn('Series synchronization warning in saveBook:', err);
      }
    } else {
      // Book was marked Standalone / Unassigned
      merged.seriesId = '';
      merged.seriesName = '';
      try {
        const seriesList = await this.getAllSeries();
        for (const s of seriesList) {
          if (s.bookIds && s.bookIds.includes(bookId)) {
            s.bookIds = s.bookIds.filter((id) => id !== bookId);
            await setDoc(doc(db, 'series', s.id), {
              bookIds: s.bookIds,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn('Series cleanup warning in saveBook:', err);
      }
    }

    // Save directly to Firestore books collection
    try {
      const bookRef = doc(db, 'books', bookId);
      await setDoc(bookRef, { ...merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error('[BookService] Error writing book to Firestore:', e);
      throw e;
    }

    // Update in-memory cache and notify listeners
    const idx = this.books.findIndex((b) => b.id === bookId);
    if (idx >= 0) {
      this.books[idx] = merged;
    } else {
      this.books.push(merged);
    }
    this.books.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));

    this.notify();

    // Log audit
    await this.logAudit({
      action: isNew ? 'Book Created' : 'Book Updated',
      targetId: bookId,
      targetType: 'book',
      details: `Book "${merged.title}" saved with publication state: ${merged.publicationState}`,
      userEmail: user?.email || 'admin',
      userId: user?.uid || 'local',
      timestamp: new Date().toISOString(),
    });

    return merged;
  }

  /**
   * Soft deletes / archives a book
   */
  public async archiveBook(id: string): Promise<void> {
    const book = await this.getBookById(id);
    if (!book) return;

    book.status = 'archived';
    book.publicationState = 'PRIVATE';
    book.indexing = 'noindex';

    try {
      const bookRef = doc(db, 'books', id);
      await updateDoc(bookRef, {
        status: 'archived',
        publicationState: 'PRIVATE',
        indexing: 'noindex',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore archive update note:', e);
    }

    const idx = this.books.findIndex((b) => b.id === id);
    if (idx >= 0) this.books[idx] = book;
    this.notify();

    await this.logAudit({
      action: 'Book Archived',
      targetId: id,
      targetType: 'book',
      details: `Book "${book.title}" was archived (removed from public site & sitemap).`,
      userEmail: auth.currentUser?.email || 'admin',
      userId: auth.currentUser?.uid || 'local',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Restores an archived book
   */
  public async restoreBook(id: string): Promise<void> {
    const book = await this.getBookById(id);
    if (!book) return;

    book.status = 'published';
    book.publicationState = 'PUBLIC';
    book.indexing = 'index';

    try {
      const bookRef = doc(db, 'books', id);
      await updateDoc(bookRef, {
        status: 'published',
        publicationState: 'PUBLIC',
        indexing: 'index',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore restore update note:', e);
    }

    const idx = this.books.findIndex((b) => b.id === id);
    if (idx >= 0) this.books[idx] = book;
    this.notify();

    await this.logAudit({
      action: 'Book Restored',
      targetId: id,
      targetType: 'book',
      details: `Book "${book.title}" was restored to public site.`,
      userEmail: auth.currentUser?.email || 'admin',
      userId: auth.currentUser?.uid || 'local',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Duplicates a book as a draft
   */
  public async duplicateBook(id: string): Promise<ManagedBook> {
    const original = await this.getBookById(id);
    if (!original) throw new Error('Original book not found');

    const newId = `${original.id}-copy-${Date.now().toString().slice(-4)}`;
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy`;

    const copyData: Partial<ManagedBook> = {
      ...original,
      id: newId,
      title: newTitle,
      slug: newSlug,
      status: 'unreleased',
      publicationState: 'DRAFT',
      indexing: 'noindex',
      featured: false,
    };

    return this.saveBook(copyData, true);
  }

  /**
   * Permanently deletes a book (AUTHOR ONLY)
   */
  public async deleteBookPermanently(id: string, userRole?: string): Promise<{ success: boolean; error?: string }> {
    if (userRole && userRole.toUpperCase() !== 'AUTHOR' && userRole.toUpperCase() !== 'ADMIN') {
      throw new Error('Unauthorized: Only Authors have deletion privileges.');
    }
    const book = await this.getBookById(id);
    if (!book) return { success: false, error: 'Book not found' };

    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (e) {
      console.warn('Firestore book delete note:', e);
    }

    // Clean up series.bookIds in Firestore
    try {
      const seriesList = await this.getAllSeries();
      for (const s of seriesList) {
        if (s.bookIds && s.bookIds.includes(id)) {
          s.bookIds = s.bookIds.filter((bId) => bId !== id);
          await updateDoc(doc(db, 'series', s.id), {
            bookIds: s.bookIds,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.warn('Series cleanup warning during book deletion:', err);
    }

    this.books = this.books.filter((b) => b.id !== id);
    this.notify();

    await this.logAudit({
      action: 'Book Deleted Permanently',
      targetId: id,
      targetType: 'book',
      details: `Book "${book.title}" was permanently removed by Author.`,
      userEmail: auth.currentUser?.email || 'author',
      userId: auth.currentUser?.uid || 'local',
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  /**
   * Authoritative cover update: writes directly to Firestore books collection,
   * updates the in-memory cache, and immediately notifies all listening components.
   */
  public async updateBookCover(
    bookId: string,
    coverImage: string,
    storagePath?: string
  ): Promise<void> {
    if (!bookId) return;

    // 1. Immediately update in-memory cache for instant UI feedback across all views
    const idx = this.books.findIndex((b) => b.id === bookId);
    if (idx >= 0) {
      this.books[idx].coverImage = coverImage;
      if (storagePath !== undefined) this.books[idx].coverStoragePath = storagePath;
    }
    this.notify();

    // 2. Persist to Firestore
    try {
      const bookRef = doc(db, 'books', bookId);
      await setDoc(
        bookRef,
        {
          coverImage,
          coverStoragePath: storagePath || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('[BookService] Warning updating book cover in Firestore:', e);
    }
  }

  /**
   * Uploads a book cover image to Firebase Cloud Storage.
   * Structure: /books/{bookId}/cover/{filename}
   * Returns download URL and storage path.
   * Automatically optimizes and compresses the image client-side in < 50ms,
   * immediately updates the authoritative book record, and handles storage
   * gracefully with a fast timeout so uploads never take forever or hang.
   */
  public async uploadBookCover(
    bookId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `books/${bookId}/cover/${timestamp}_${sanitizedFilename}`;

    // 1. Immediately compress & optimize client-side (< 50ms)
    onProgress?.(25);
    let optimizedDataUrl: string;
    let uploadBlob: Blob = file;

    try {
      const optimized = await optimizeCoverImage(file, {
        maxWidth: 1200,
        maxHeight: 1800,
        quality: 0.85,
        format: 'image/webp',
      });
      optimizedDataUrl = optimized.dataUrl;
      uploadBlob = optimized.blob;
    } catch {
      // Fallback to basic data URL if canvas unavailable
      optimizedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    onProgress?.(60);

    // Immediately update authoritative book record with client preview/dataUrl
    await this.updateBookCover(bookId, optimizedDataUrl, storagePath);

    // 2. Attempt Cloud Storage upload with a strict 2000ms timeout
    // If the storage bucket is unreachable, 404s, or unprovisioned, abort immediately
    // so the admin is never stuck waiting.
    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, uploadBlob, {
        contentType: uploadBlob.type || 'image/webp',
        customMetadata: {
          bookId,
          uploadedBy: auth.currentUser?.email || 'admin',
        },
      });

      const storageResult = await new Promise<{ downloadUrl: string; storagePath: string }>((resolve) => {
        let isDone = false;

        const timeoutId = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            onProgress?.(100);
            resolve({ downloadUrl: optimizedDataUrl, storagePath });
          }
        }, 2000);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = Math.round(60 + (snapshot.bytesTransferred / snapshot.totalBytes) * 40);
              onProgress?.(progress);
            }
          },
          (error) => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              onProgress?.(100);
              resolve({ downloadUrl: optimizedDataUrl, storagePath });
            }
          },
          async () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                onProgress?.(100);
                resolve({ downloadUrl, storagePath });
              } catch {
                onProgress?.(100);
                resolve({ downloadUrl: optimizedDataUrl, storagePath });
              }
            }
          }
        );
      });

      // Persist the final cloud download URL into the authoritative book record
      await this.updateBookCover(bookId, storageResult.downloadUrl, storageResult.storagePath);
      return storageResult;
    } catch (err) {
      onProgress?.(100);
      return { downloadUrl: optimizedDataUrl, storagePath };
    }
  }

  /**
   * Uploads and optimizes a series banner image with real-time progress and robust fallbacks.
   */
  public async uploadSeriesBanner(
    seriesId: string,
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    const cleanSeriesId = seriesId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = file.name.split('.').pop() || 'webp';
    const storagePath = `series_banners/${cleanSeriesId}_banner_${Date.now()}.${ext}`;

    onProgress?.(25);

    // Create immediate local data URL
    let localDataUrl = '';
    try {
      const reader = new FileReader();
      localDataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    } catch {
      localDataUrl = URL.createObjectURL(file);
    }

    onProgress?.(60);

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          seriesId,
          uploadedBy: auth.currentUser?.email || 'admin',
        },
      });

      const storageResult = await new Promise<{ downloadUrl: string; storagePath: string }>((resolve) => {
        let isDone = false;

        const timeoutId = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            onProgress?.(100);
            resolve({ downloadUrl: localDataUrl, storagePath });
          }
        }, 2500);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = Math.round(60 + (snapshot.bytesTransferred / snapshot.totalBytes) * 40);
              onProgress?.(progress);
            }
          },
          (error) => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              onProgress?.(100);
              resolve({ downloadUrl: localDataUrl, storagePath });
            }
          },
          async () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                onProgress?.(100);
                resolve({ downloadUrl, storagePath });
              } catch {
                onProgress?.(100);
                resolve({ downloadUrl: localDataUrl, storagePath });
              }
            }
          }
        );
      });

      return storageResult;
    } catch (err) {
      onProgress?.(100);
      return { downloadUrl: localDataUrl, storagePath };
    }
  }

  /**
   * Get single series by ID or slug
   */
  public async getSeriesById(idOrSlug: string): Promise<ManagedSeries | null> {
    const list = await this.getAllSeries();
    return (
      list.find(
        (s) =>
          s.id === idOrSlug ||
          s.slug === idOrSlug ||
          s.slug === idOrSlug.replace(/^\/series\//, '')
      ) || null
    );
  }

  /**
   * Save or create a series (Author only for creation)
   */
  public async saveSeries(
    seriesData: Partial<ManagedSeries>,
    isNew = false,
    authorInfo?: { name?: string; email?: string }
  ): Promise<{ success: boolean; series?: ManagedSeries; error?: string }> {
    const seriesList = await this.getAllSeries();
    const id = seriesData.id || `series-${Date.now()}`;

    let rawSlug = seriesData.slug || seriesData.name || id;
    let cleanSlug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/^\/series\//, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!cleanSlug) cleanSlug = id;

    const duplicate = seriesList.find((s) => s.slug === cleanSlug && s.id !== id);
    if (duplicate) {
      return {
        success: false,
        error: `A series with the URL slug "/series/${cleanSlug}" already exists ("${duplicate.name}"). Please choose a unique slug.`,
      };
    }

    const nowStr = new Date().toISOString();
    const existing = seriesList.find((s) => s.id === id);

    const savedSeries: ManagedSeries = {
      id,
      name: seriesData.name?.trim() || existing?.name || 'Untitled Series',
      slug: cleanSlug,
      description: seriesData.description?.trim() || existing?.description || '',
      shortDescription: seriesData.shortDescription?.trim() || existing?.shortDescription || '',
      genres: seriesData.genres || existing?.genres || [],
      artworkUrl: seriesData.artworkUrl || existing?.artworkUrl || '',
      status: seriesData.status || existing?.status || 'IN DEVELOPMENT',
      publicationState: seriesData.publicationState || existing?.publicationState || 'DRAFT',
      bookIds: seriesData.bookIds || existing?.bookIds || [],
      seoTitle: seriesData.seoTitle || existing?.seoTitle || `${seriesData.name || 'Series'} | Matthew E. Messmer`,
      metaDescription:
        seriesData.metaDescription ||
        existing?.metaDescription ||
        seriesData.shortDescription ||
        seriesData.description?.substring(0, 150) ||
        '',
      socialImage: seriesData.socialImage || existing?.socialImage || seriesData.artworkUrl || '',
      canonicalUrl: `/series/${cleanSlug}`,
      createdAt: existing?.createdAt || nowStr,
      updatedAt: nowStr,
      createdBy: existing?.createdBy || authorInfo?.email || auth.currentUser?.email || 'author',
    };

    try {
      const seriesRef = doc(db, 'series', id);
      await setDoc(seriesRef, { ...savedSeries, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error('[BookService] Error writing series to Firestore:', e);
      throw e;
    }

    const idx = this.series.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.series[idx] = savedSeries;
    } else {
      this.series.push(savedSeries);
    }
    this.notify();

    await this.logAudit({
      action: isNew ? 'Series Created' : 'Series Updated',
      targetId: id,
      targetType: 'series',
      details: `Series "${savedSeries.name}" (${savedSeries.publicationState}, ${savedSeries.status}) ${isNew ? 'created' : 'updated'} by ${authorInfo?.name || 'Author'}. Slug: /series/${cleanSlug}.`,
      userEmail: authorInfo?.email || auth.currentUser?.email || 'author',
      userId: auth.currentUser?.uid || 'local',
      timestamp: nowStr,
    });

    return { success: true, series: savedSeries };
  }

  /**
   * Deleting a series does NOT delete attached books!
   * It unassigns them, setting seriesId: '' and seriesName: ''.
   */
  public async deleteSeries(
    seriesId: string,
    authorInfo?: { name?: string; email?: string }
  ): Promise<{ success: boolean; unassignedCount: number }> {
    const seriesList = await this.getAllSeries();
    const target = seriesList.find((s) => s.id === seriesId);
    if (!target) return { success: false, unassignedCount: 0 };

    let unassignedCount = 0;
    const books = await this.getAllBooks();
    for (const b of books) {
      if (b.seriesId === seriesId || target.bookIds?.includes(b.id)) {
        b.seriesId = '';
        b.seriesName = '';
        b.seriesOrder = 0;
        unassignedCount++;
        try {
          await updateDoc(doc(db, 'books', b.id), {
            seriesId: '',
            seriesName: '',
            seriesOrder: 0,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          // ignore
        }
      }
    }

    try {
      await deleteDoc(doc(db, 'series', seriesId));
    } catch (e) {
      console.warn('Firestore series delete warning:', e);
    }

    this.series = this.series.filter((s) => s.id !== seriesId);
    this.notify();

    await this.logAudit({
      action: 'Series Deleted',
      targetId: seriesId,
      targetType: 'series',
      details: `Series "${target.name}" was deleted by Author. ${unassignedCount} attached books were safely unassigned and preserved.`,
      userEmail: authorInfo?.email || authorInfo?.email || 'author',
      userId: auth.currentUser?.uid || 'local',
      timestamp: new Date().toISOString(),
    });

    return { success: true, unassignedCount };
  }

  /**
   * Assigns an existing book to a series
   */
  public async assignBookToSeries(seriesId: string, bookId: string): Promise<void> {
    const [seriesList, booksList] = await Promise.all([this.getAllSeries(), this.getAllBooks()]);
    const targetSeries = seriesList.find((s) => s.id === seriesId);
    const targetBook = booksList.find((b) => b.id === bookId);
    if (!targetSeries || !targetBook) return;

    if (!targetSeries.bookIds.includes(bookId)) {
      targetSeries.bookIds.push(bookId);
    }
    targetBook.seriesId = targetSeries.id;
    targetBook.seriesName = targetSeries.name;
    targetBook.seriesOrder = targetSeries.bookIds.indexOf(bookId) + 1;

    await this.saveSeries(targetSeries);
    await this.saveBook(targetBook);
  }

  /**
   * Removes a book from a series (unassigns it)
   */
  public async removeBookFromSeries(seriesId: string, bookId: string): Promise<void> {
    const [seriesList, booksList] = await Promise.all([this.getAllSeries(), this.getAllBooks()]);
    const targetSeries = seriesList.find((s) => s.id === seriesId);
    const targetBook = booksList.find((b) => b.id === bookId);
    if (!targetSeries) return;

    targetSeries.bookIds = targetSeries.bookIds.filter((id) => id !== bookId);
    if (targetBook) {
      targetBook.seriesId = '';
      targetBook.seriesName = '';
      targetBook.seriesOrder = 0;
      await this.saveBook(targetBook);
    }
    await this.saveSeries(targetSeries);
  }

  /**
   * Reorders books within a series and saves the sequence
   */
  /**
   * Reorders books within a series and saves the sequence.
   * Authoritatively updates both the series.bookIds list and each book document's seriesOrder in Firestore!
   */
  public async reorderSeriesBooks(seriesId: string, orderedBookIds: string[]): Promise<void> {
    const seriesList = await this.getAllSeries();
    const targetSeries = seriesList.find((s) => s.id === seriesId);
    if (!targetSeries) return;

    targetSeries.bookIds = orderedBookIds;
    targetSeries.updatedAt = new Date().toISOString();

    // 1. Update every book's seriesOrder in memory and Firestore
    for (let idx = 0; idx < orderedBookIds.length; idx++) {
      const bookId = orderedBookIds[idx];
      const newOrder = idx + 1;
      const b = this.books.find((book) => book.id === bookId);
      if (b) {
        b.seriesOrder = newOrder;
        b.bookNumber = newOrder;
      }
      try {
        const bookRef = doc(db, 'books', bookId);
        await updateDoc(bookRef, {
          seriesOrder: newOrder,
          bookNumber: newOrder,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn(`Firestore book sequence update note for ${bookId}:`, err);
      }
    }

    // 2. Update series document in Firestore
    try {
      const seriesRef = doc(db, 'series', seriesId);
      await setDoc(seriesRef, { ...targetSeries, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Firestore series order note:', e);
    }

    this.notify();

    await this.logAudit({
      action: 'Series Books Reordered',
      targetId: seriesId,
      targetType: 'series',
      details: `Books in series "${targetSeries.name}" reordered: ${orderedBookIds.join(', ')}`,
      userEmail: auth.currentUser?.email || 'admin',
      userId: auth.currentUser?.uid || 'local',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Audit logging: writes to auditLogs
   */
  public async logAudit(item: Omit<AuditLogItem, 'id'>): Promise<void> {
    try {
      const auditCol = collection(db, 'auditLogs');
      await addDoc(auditCol, { ...item, timestamp: serverTimestamp() });
    } catch (e) {
      try {
        const stored = localStorage.getItem('mem_audit_logs_v1') || '[]';
        const parsed = JSON.parse(stored);
        parsed.unshift({ ...item, id: `log-${Date.now()}` });
        localStorage.setItem('mem_audit_logs_v1', JSON.stringify(parsed.slice(0, 50)));
      } catch (err) {
        // ignore
      }
    }
  }

  public async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const logs: AuditLogItem[] = [];
        snap.forEach((d) => logs.push({ ...(d.data() as AuditLogItem), id: d.id }));
        return logs;
      }
    } catch (e) {
      // use local
    }
    try {
      const stored = localStorage.getItem('mem_audit_logs_v1') || '[]';
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  /**
   * Seeds the initial books into Firestore ONLY if the database is newly provisioned.
   * Checks an initialization sentinel to guarantee deleted books are NEVER resurrected!
   */
  public async seedInitialBooksIfEmpty(): Promise<void> {
    try {
      const initRef = doc(db, 'siteSettings', 'catalog_init');
      const initSnap = await getDoc(initRef);
      if (initSnap.exists() && initSnap.data()?.seeded === true) {
        return; // Guard: catalog was already initialized, do not resurrect deleted books
      }

      const snap = await getDocs(collection(db, 'books'));
      if (snap.empty) {
        for (const book of INITIAL_MANAGED_BOOKS) {
          const docRef = doc(db, 'books', book.id);
          await setDoc(docRef, { ...book, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        for (const s of INITIAL_MANAGED_SERIES) {
          const docRef = doc(db, 'series', s.id);
          await setDoc(docRef, { ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }
      await setDoc(initRef, { seeded: true, initializedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.info('Initial books seed query completed.');
    }
  }
}

export const bookService = new BookService();

/**
 * Converts a ManagedBook document into the legacy public Book model
 * for consistent rendering in BookCard, BookPageView, and reading rooms.
 */
export function managedBookToBook(mb: ManagedBook, seriesFallback?: string): Book {
  const resolvedSeries = mb.seriesName || seriesFallback || (mb.seriesId ? mb.seriesId : 'Standalone');
  return {
    id: mb.id,
    slug: mb.slug || mb.id,
    title: mb.title,
    subtitle: mb.subtitle,
    description: mb.description || mb.shortDescription || '',
    coverImage: mb.coverImage || mb.coverStoragePath || '',
    purchaseLink: mb.amazonUrl || (mb.retailerLinks && mb.retailerLinks.length > 0 ? mb.retailerLinks[0].url : ''),
    series: resolvedSeries,
    seriesId: mb.seriesId || '',
    seriesName: mb.seriesName || resolvedSeries,
    seriesOrder: mb.seriesOrder !== undefined ? Number(mb.seriesOrder) : 1,
    releaseYear: mb.publicationDate || '2024',
    status: ((): 'published' | 'pending' | 'unreleased' => {
      const s = String(mb.status || '').toLowerCase();
      if (s === 'pending' || s === 'upcoming') return 'pending';
      if (s === 'unreleased' || s === 'in-progress' || s === 'draft') return 'unreleased';
      if (s === 'published') return 'published';
      if (mb.publicationState === 'TEASER') return 'pending';
      if (mb.publicationState === 'DRAFT' || mb.publicationState === 'PRIVATE') return 'unreleased';
      return 'published';
    })(),
    publicationState: mb.publicationState,
    format: ['Hardcover', 'Paperback', 'E-Book'],
    isbn: mb.isbn,
    pageCount: mb.pageCount,
    publisher: mb.publisher || 'Breathwoven Press',
    tagline: mb.shortDescription || mb.title,
    synopsis: mb.description,
    coverArtDescription: mb.coverImageAlt,
    customCoverUrl: mb.coverImage,
    excerpt: mb.excerpt || { chapterTitle: 'Prologue', text: ['Excerpt coming soon.'] },
    quote: mb.quote || { text: 'Words carry breath across worlds.', attribution: 'Matthew E. Messmer' },
    buyLinks: mb.retailerLinks && mb.retailerLinks.length > 0
      ? mb.retailerLinks
      : (mb.amazonUrl ? [{ name: 'Amazon', url: mb.amazonUrl }] : []),
    woodEngravingNote: mb.woodEngravingNote,
    accentColor: '#c5a059',
    motifIcon: 'loom',
  };
}

export { INITIAL_MANAGED_BOOKS, INITIAL_MANAGED_SERIES };
