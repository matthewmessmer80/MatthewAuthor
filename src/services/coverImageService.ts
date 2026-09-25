const STORAGE_KEY_COVERS = 'mem_author_book_covers_v1';

export interface BookCoverState {
  [bookId: string]: string; // base64 data URL or asset URL
}

class CoverImageService {
  private listeners: Array<() => void> = [];

  public getCovers(): BookCoverState {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COVERS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public getCover(bookId: string): string | null {
    const covers = this.getCovers();
    return covers[bookId] || null;
  }

  public setCover(bookId: string, dataUrl: string): void {
    const covers = this.getCovers();
    covers[bookId] = dataUrl;
    try {
      localStorage.setItem(STORAGE_KEY_COVERS, JSON.stringify(covers));
      this.notify();
    } catch (e) {
      console.warn('Failed to save cover image to storage', e);
    }
  }

  public removeCover(bookId: string): void {
    const covers = this.getCovers();
    delete covers[bookId];
    try {
      localStorage.setItem(STORAGE_KEY_COVERS, JSON.stringify(covers));
      this.notify();
    } catch (e) {
      console.warn('Failed to remove cover from storage', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const coverImageService = new CoverImageService();
