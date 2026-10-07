/**
 * Cover Image Service
 * 
 * Provides unified helper utilities for book covers.
 * CRITICAL ARCHITECTURE RULE:
 * There is exactly ONE authoritative source of truth for book covers:
 * the `coverImage` field in the authoritative Book document (Firestore / bookService).
 * 
 * This service does NOT maintain a competing localStorage database.
 * Any legacy localStorage cache is purged to ensure no stale data can override Firestore.
 */

import { bookService } from './bookService';

const STORAGE_KEY_COVERS = 'mem_author_book_covers_v1';

class CoverImageService {
  constructor() {
    // Purge any stale legacy localStorage database so it never overrides Firestore
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_COVERS);
      } catch {
        // ignore storage errors
      }
    }
  }

  /**
   * Retrieves the authoritative cover image for a book directly from the authoritative bookService.
   */
  public getCover(bookId: string): string | null {
    if (!bookId) return null;
    const book = bookService.getCachedBookById(bookId);
    return book?.coverImage || null;
  }

  /**
   * Sets the authoritative cover image for a book by updating the authoritative book record.
   */
  public setCover(bookId: string, urlOrDataUrl: string): void {
    if (!bookId) return;
    bookService.updateBookCover(bookId, urlOrDataUrl).catch((err) => {
      console.warn('Failed to update book cover in authoritative bookService:', err);
    });
  }

  /**
   * Removes the cover image by setting it to empty in the authoritative book record.
   */
  public removeCover(bookId: string): void {
    if (!bookId) return;
    bookService.updateBookCover(bookId, '').catch((err) => {
      console.warn('Failed to remove book cover in authoritative bookService:', err);
    });
  }

  /**
   * Subscribes to cover changes by subscribing directly to the authoritative bookService.
   */
  public subscribe(listener: () => void): () => void {
    return bookService.subscribe(listener);
  }
}

export const coverImageService = new CoverImageService();
