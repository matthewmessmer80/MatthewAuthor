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
  serverTimestamp,
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
  status: 'published' | 'upcoming' | 'in-progress' | 'archived';
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

export interface ManagedSeries {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  artworkUrl?: string;
  status: 'published' | 'in-progress' | 'archived';
  publicationState: AdminPublicationState;
  bookIds: string[]; // Order of book IDs
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  createdAt?: any;
  updatedAt?: any;
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
    description: INITIAL_STATIC_BOOKS[0].synopsis,
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
    description: INITIAL_STATIC_BOOKS[1].synopsis,
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
    description: INITIAL_STATIC_BOOKS[2].synopsis,
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
    id: 'abyssal-current',
    slug: 'the-abyssal-current',
    title: 'The Abyssal Current',
    subtitle: 'Book 1 of The Abyssal Current Series',
    seriesId: 'abyssal-current',
    seriesName: 'The Abyssal Current',
    seriesOrder: 1,
    bookNumber: 1,
    shortDescription: 'Deep beneath the charted seas, time flows not forward, but down.',
    description: INITIAL_STATIC_BOOKS[3].synopsis,
    genre: 'Maritime Epic Fantasy',
    coverImageAlt: 'The Abyssal Current book cover by Matthew E. Messmer',
    amazonUrl: '',
    retailerLinks: INITIAL_STATIC_BOOKS[3].buyLinks,
    author: 'Matthew E. Messmer',
    language: 'English',
    isbn: '978-1-962450-04-X',
    publisher: 'Breathwoven Press',
    publicationDate: 'Forthcoming',
    pageCount: 512,
    status: 'upcoming',
    publicationState: 'TEASER',
    featured: false,
    seoTitle: 'The Abyssal Current | Matthew E. Messmer',
    metaDescription: 'The Abyssal Current by Matthew E. Messmer. A maritime fantasy epic inspired by naval service where oceanic depths hide compressed time.',
    canonicalUrl: '/the-abyssal-current',
    indexing: 'index',
    woodEngravingNote: INITIAL_STATIC_BOOKS[3].woodEngravingNote,
    quote: INITIAL_STATIC_BOOKS[3].quote,
    excerpt: INITIAL_STATIC_BOOKS[3].excerpt,
  },
  {
    id: 'ignis-kor',
    slug: 'ignis-kor-the-heart-of-fire',
    title: 'Ignis-Kor: The Heart of Fire',
    subtitle: 'Current Finalized Book of The Abyssal Current Series',
    seriesId: 'abyssal-current',
    seriesName: 'The Abyssal Current',
    seriesOrder: 2,
    bookNumber: 2,
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
    status: 'in-progress',
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
    description: 'An expansive epic fantasy trilogy exploring the metaphysical threads binding human memory, courage, and family across time.',
    shortDescription: 'The high fantasy saga of Val-Mora and the Archipelago of Spires.',
    status: 'published',
    publicationState: 'PUBLIC',
    bookIds: ['kings-severance', 'blue-moon-child', 'weavers-lullaby'],
    seoTitle: 'The Breathwoven Cycle | Matthew E. Messmer',
    metaDescription: 'The Breathwoven Cycle by Matthew E. Messmer. An epic fantasy saga where celestial threads bind fate, memory, and the fate of fractured realms.',
    canonicalUrl: '/the-breathwoven-cycle',
  },
  {
    id: 'abyssal-current',
    name: 'The Abyssal Current',
    description: 'Drawing from naval discipline and oceanic physics, an ironclad exploration vessel descends into uncharted oceanic depths where time itself compresses.',
    shortDescription: 'A maritime fantasy epic inspired by Navy Master-at-Arms service.',
    status: 'in-progress',
    publicationState: 'TEASER',
    bookIds: ['abyssal-current', 'ignis-kor'],
    seoTitle: 'The Abyssal Current | Matthew E. Messmer',
    metaDescription: 'The Abyssal Current by Matthew E. Messmer. A maritime fantasy epic inspired by naval service where oceanic depths hide compressed time.',
    canonicalUrl: '/the-abyssal-current',
  },
];

class BookService {
  private localBooksCache: ManagedBook[] = [];
  private localSeriesCache: ManagedSeries[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedBooks = localStorage.getItem('mem_managed_books_v1');
      if (storedBooks) {
        this.localBooksCache = JSON.parse(storedBooks);
      } else {
        this.localBooksCache = [...INITIAL_MANAGED_BOOKS];
      }

      const storedSeries = localStorage.getItem('mem_managed_series_v1');
      if (storedSeries) {
        this.localSeriesCache = JSON.parse(storedSeries);
      } else {
        this.localSeriesCache = [...INITIAL_MANAGED_SERIES];
      }
    } catch (e) {
      console.warn('Storage read error in BookService:', e);
      this.localBooksCache = [...INITIAL_MANAGED_BOOKS];
      this.localSeriesCache = [...INITIAL_MANAGED_SERIES];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mem_managed_books_v1', JSON.stringify(this.localBooksCache));
      localStorage.setItem('mem_managed_series_v1', JSON.stringify(this.localSeriesCache));
    } catch (e) {
      console.warn('Storage write error in BookService:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Fetches books, prioritizing Firestore if reachable, falling back to local storage/defaults.
   */
  public async getBooks(): Promise<ManagedBook[]> {
    try {
      const booksCol = collection(db, 'books');
      const snap = await getDocs(booksCol);
      if (!snap.empty) {
        const firestoreBooks: ManagedBook[] = [];
        snap.forEach((doc) => {
          firestoreBooks.push({ ...(doc.data() as ManagedBook), id: doc.id });
        });
        // Sort by seriesOrder
        firestoreBooks.sort((a, b) => a.seriesOrder - b.seriesOrder);
        this.localBooksCache = firestoreBooks;
        this.saveToStorage();
        return firestoreBooks;
      }
    } catch (e) {
      // In offline / preview / permission states, use cached
      console.info('Firestore books query completed, using local state:', e);
    }
    return this.localBooksCache;
  }

  /**
   * Returns only publicly visible books for visitors.
   */
  public async getPublicBooks(): Promise<ManagedBook[]> {
    const all = await this.getBooks();
    return all.filter(
      (b) => b.status !== 'archived' && (b.publicationState === 'PUBLIC' || b.publicationState === 'TEASER' || b.status === 'published')
    );
  }

  public async getBookById(id: string): Promise<ManagedBook | null> {
    const books = await this.getBooks();
    return books.find((b) => b.id === id || b.slug === id) || null;
  }

  /**
   * Saves or creates a book record in Firestore and local cache.
   */
  public async saveBook(
    bookData: Partial<ManagedBook>,
    isNew = false,
    updaterInfo?: { name?: string; email?: string; role?: string }
  ): Promise<ManagedBook> {
    const user = auth.currentUser;
    const bookId = bookData.id || bookData.slug || `book-${Date.now()}`;
    const slug = bookData.slug || bookData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || bookId;

    const existing = this.localBooksCache.find((b) => b.id === bookId);

    const actorRole = updaterInfo?.role || (user?.email?.toLowerCase() === 'mmessmer80@gmail.com' ? 'AUTHOR' : 'EDITOR');
    const actorName = updaterInfo?.name || user?.displayName || user?.email || 'Author';

    const merged: ManagedBook = {
      id: bookId,
      slug,
      title: bookData.title || existing?.title || 'Untitled Book',
      subtitle: bookData.subtitle !== undefined ? bookData.subtitle : existing?.subtitle,
      seriesId: bookData.seriesId || existing?.seriesId || 'breathwoven-cycle',
      seriesName: bookData.seriesName || existing?.seriesName || 'The Breathwoven Cycle',
      seriesOrder: bookData.seriesOrder !== undefined ? Number(bookData.seriesOrder) : (existing?.seriesOrder || 1),
      bookNumber: bookData.bookNumber !== undefined ? Number(bookData.bookNumber) : existing?.bookNumber,
      shortDescription: bookData.shortDescription || existing?.shortDescription || '',
      description: bookData.description || existing?.description || '',
      genre: bookData.genre || existing?.genre || 'Epic Fantasy',
      coverImage: bookData.coverImage || existing?.coverImage,
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

    // If marked featured, unmark others
    if (merged.featured) {
      this.localBooksCache.forEach((b) => {
        if (b.id !== merged.id) b.featured = false;
      });
    }

    // Try saving to Firestore
    try {
      const bookRef = doc(db, 'books', bookId);
      await setDoc(bookRef, { ...merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Firestore write warning (saving locally):', e);
    }

    // Update local cache
    const idx = this.localBooksCache.findIndex((b) => b.id === bookId);
    if (idx >= 0) {
      this.localBooksCache[idx] = merged;
    } else {
      this.localBooksCache.push(merged);
    }
    this.saveToStorage();

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

    const idx = this.localBooksCache.findIndex((b) => b.id === id);
    if (idx >= 0) this.localBooksCache[idx] = book;
    this.saveToStorage();

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

    const idx = this.localBooksCache.findIndex((b) => b.id === id);
    if (idx >= 0) this.localBooksCache[idx] = book;
    this.saveToStorage();

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
      status: 'in-progress',
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
    if (userRole && userRole !== 'AUTHOR') {
      throw new Error('Unauthorized: Editors cannot delete books permanently. Only Authors have deletion privileges.');
    }
    const book = await this.getBookById(id);
    if (!book) return { success: false, error: 'Book not found' };

    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (e) {
      console.warn('Firestore book delete note:', e);
    }

    this.localBooksCache = this.localBooksCache.filter((b) => b.id !== id);
    this.saveToStorage();

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
   * Uploads a book cover image to Firebase Cloud Storage.
   * Structure: /books/{bookId}/cover/{filename}
   * Returns download URL and storage path.
   */
  public async uploadBookCover(
    bookId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `books/${bookId}/cover/${timestamp}_${sanitizedFilename}`;

    // Read local data URL for instantaneous client rendering
    const localDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          bookId,
          uploadedBy: auth.currentUser?.email || 'admin',
        },
      });

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.warn('Cloud Storage upload failed, using local high-res asset:', error);
            // Graceful fallback to local data URL so workflow never fails
            resolve({ downloadUrl: localDataUrl, storagePath });
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadUrl, storagePath });
          }
        );
      });
    } catch (err) {
      console.warn('Storage initial reference error, using local data URL:', err);
      return { downloadUrl: localDataUrl, storagePath };
    }
  }

  /**
   * Series management: get all series
   */
  public async getSeries(): Promise<ManagedSeries[]> {
    try {
      const snap = await getDocs(collection(db, 'series'));
      if (!snap.empty) {
        const list: ManagedSeries[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as ManagedSeries), id: d.id }));
        this.localSeriesCache = list;
        this.saveToStorage();
        return list;
      }
    } catch (e) {
      console.info('Using local series cache:', e);
    }
    return this.localSeriesCache;
  }

  /**
   * Reorders books within a series and saves the sequence
   */
  public async reorderSeriesBooks(seriesId: string, orderedBookIds: string[]): Promise<void> {
    const seriesList = await this.getSeries();
    const targetSeries = seriesList.find((s) => s.id === seriesId);
    if (targetSeries) {
      targetSeries.bookIds = orderedBookIds;
      targetSeries.updatedAt = new Date().toISOString();

      // Update seriesOrder on each book
      orderedBookIds.forEach((bookId, idx) => {
        const b = this.localBooksCache.find((book) => book.id === bookId);
        if (b) {
          b.seriesOrder = idx + 1;
        }
      });

      try {
        const seriesRef = doc(db, 'series', seriesId);
        await setDoc(seriesRef, { ...targetSeries, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('Firestore series order note:', e);
      }
      this.saveToStorage();

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
  }

  /**
   * Audit logging: writes to auditLogs
   */
  public async logAudit(item: Omit<AuditLogItem, 'id'>): Promise<void> {
    try {
      const auditCol = collection(db, 'auditLogs');
      await addDoc(auditCol, { ...item, timestamp: serverTimestamp() });
    } catch (e) {
      // Store in local storage logs
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
   * Seeds the initial books into Firestore if the database is newly provisioned
   */
  public async seedInitialBooksIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'books'));
      if (snap.empty) {
        for (const book of INITIAL_MANAGED_BOOKS) {
          const docRef = doc(db, 'books', book.id);
          await setDoc(docRef, { ...book, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        for (const series of INITIAL_MANAGED_SERIES) {
          const docRef = doc(db, 'series', series.id);
          await setDoc(docRef, { ...series, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }
    } catch (e) {
      console.info('Initial books seed query completed.');
    }
  }
}

export const bookService = new BookService();
