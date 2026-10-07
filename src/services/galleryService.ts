import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';
import { GalleryItem, PublicationState } from '../types';
import { CRAFT_ARTWORKS } from '../data/authorData';
import { optimizeCoverImage } from '../utils/imageOptimizer';

const GALLERY_COLLECTION = 'gallery';
const LOCAL_STORAGE_GALLERY_KEY = 'mmessmer_author_gallery_v2';
const LOCAL_STORAGE_CATEGORIES_KEY = 'mmessmer_gallery_custom_categories_v2';
const LOCAL_STORAGE_GALLERY_SEEDED_KEY = 'mmessmer_author_gallery_seeded_v2';

export const DEFAULT_GALLERY_CATEGORIES = [
  'Books',
  'Fantasy',
  'Characters',
  'Worldbuilding',
  'Laser Engraving',
  'Behind the Scenes',
  'Author',
];

const SEEDED_GALLERY_ITEMS: GalleryItem[] = CRAFT_ARTWORKS.map((craft, idx) => {
  const images = [
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
  ];
  return {
    id: `gallery-seed-${craft.id}`,
    title: craft.title,
    description: craft.description,
    imageUrl: images[idx % images.length],
    altText: `${craft.title} - Handcrafted woodwork and engraving`,
    category: 'Laser Engraving',
    tags: [craft.motif, 'woodwork', 'handcrafted'],
    relatedBookId: craft.inspirationBookId,
    relatedSeriesId: 'breathwoven-cycle',
    featured: idx === 0,
    publicationState: 'PUBLIC' as PublicationState,
    dimensions: craft.dimensions,
    medium: craft.medium,
    createdAt: new Date(2025, idx, 15).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  };
});

type GalleryListener = (items: GalleryItem[]) => void;

class GalleryService {
  private items: GalleryItem[] = [];
  private categories: string[] = [...DEFAULT_GALLERY_CATEGORIES];
  private listeners: Set<GalleryListener> = new Set();
  private initialized = false;
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const storedCategories = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed)) {
          this.categories = Array.from(new Set([...DEFAULT_GALLERY_CATEGORIES, ...parsed]));
        }
      }

      const stored = localStorage.getItem(LOCAL_STORAGE_GALLERY_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        this.items = [...SEEDED_GALLERY_ITEMS];
        this.saveLocally();
      }
    } catch {
      this.items = [...SEEDED_GALLERY_ITEMS];
    }

    this.initRealtime();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_GALLERY_KEY, JSON.stringify(this.items));
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(this.categories));
      localStorage.setItem(LOCAL_STORAGE_GALLERY_SEEDED_KEY, 'true');
    } catch {}
  }

  private notify(): void {
    const copy = [...this.items];
    this.listeners.forEach((fn) => fn(copy));
  }

  subscribe(listener: GalleryListener): () => void {
    this.listeners.add(listener);
    listener([...this.items]);
    return () => this.listeners.delete(listener);
  }

  private initRealtime(): void {
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, GALLERY_COLLECTION),
        (snapshot) => {
          const isSeeded = typeof window !== 'undefined'
            ? localStorage.getItem(LOCAL_STORAGE_GALLERY_SEEDED_KEY)
            : null;

          if (!snapshot.empty) {
            this.initialized = true;
            const list: GalleryItem[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Partial<GalleryItem>;
              list.push({
                id: d.id,
                title: data.title || 'Untitled Work',
                description: data.description || '',
                imageUrl: data.imageUrl || '',
                thumbnailUrl: data.thumbnailUrl,
                altText: data.altText || data.title || 'Artwork image',
                category: data.category || 'Books',
                tags: Array.isArray(data.tags) ? data.tags : [],
                relatedBookId: data.relatedBookId,
                relatedSeriesId: data.relatedSeriesId,
                relatedCharacterId: data.relatedCharacterId,
                relatedStoryId: data.relatedStoryId,
                featured: !!data.featured,
                publicationState: (data.publicationState as PublicationState) || 'PUBLIC',
                dimensions: data.dimensions,
                medium: data.medium,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                publishedAt: data.publishedAt,
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
              });
            });
            list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
            this.items = list;
            this.saveLocally();
            this.notify();
          } else {
            this.initialized = true;
            this.items = [];
            this.saveLocally();
            this.notify();
          }
        },
        (error) => {
          console.warn('Realtime gallery listener notice:', error);
          this.fetchInitialOnce();
        }
      );
    } catch (err) {
      this.fetchInitialOnce();
    }
  }

  private async fetchInitialOnce(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, GALLERY_COLLECTION));
      this.initialized = true;

      if (!snap.empty) {
        const list: GalleryItem[] = [];
        snap.forEach((d) => {
          list.push({ ...(d.data() as GalleryItem), id: d.id });
        });
        this.items = list;
        this.saveLocally();
        this.notify();
      } else {
        this.items = [];
        this.saveLocally();
        this.notify();
      }
    } catch {}
  }

  private async seedInitialItems(): Promise<void> {
    this.initialized = true;
    for (const item of SEEDED_GALLERY_ITEMS) {
      try {
        await setDoc(doc(db, GALLERY_COLLECTION, item.id), item);
      } catch {}
    }
  }

  async getAllItems(): Promise<GalleryItem[]> {
    return [...this.items];
  }

  async getPublicItems(): Promise<GalleryItem[]> {
    return this.items.filter((item) => {
      const state = (item.publicationState || 'PUBLIC').toUpperCase();
      return state === 'PUBLIC' || state === 'TEASER';
    });
  }

  getItemById(id: string): GalleryItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  getCategories(): string[] {
    return [...this.categories];
  }

  addCategory(categoryName: string): void {
    const clean = categoryName.trim();
    if (clean && !this.categories.includes(clean)) {
      this.categories.push(clean);
      this.saveLocally();
    }
  }

  /**
   * Upload an image to Firebase Storage and retrieve the download URL.
   * Do NOT store large raw image blobs in Firestore.
   */
  async uploadImage(
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<string> {
    onProgress?.(25);
    let optimizedDataUrl: string;
    let uploadBlob: Blob = file;

    try {
      const optimized = await optimizeCoverImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
      });
      optimizedDataUrl = optimized.dataUrl;
      uploadBlob = optimized.blob;
    } catch {
      optimizedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    onProgress?.(60);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `gallery/${Date.now()}_${sanitizedName}`;

    try {
      const storageReference = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageReference, uploadBlob, {
        contentType: uploadBlob.type || 'image/webp',
      });

      return new Promise<string>((resolve) => {
        let isDone = false;

        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            onProgress?.(100);
            resolve(optimizedDataUrl);
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
              clearTimeout(timer);
              onProgress?.(100);
              resolve(optimizedDataUrl);
            }
          },
          async () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timer);
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                onProgress?.(100);
                resolve(downloadUrl);
              } catch {
                onProgress?.(100);
                resolve(optimizedDataUrl);
              }
            }
          }
        );
      });
    } catch (err) {
      onProgress?.(100);
      return optimizedDataUrl;
    }
  }

  /**
   * Clean up old image from Firebase Storage if it was uploaded there.
   */
  async deleteStorageImageIfManaged(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return;
    }
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (e) {
      // Non-fatal if already deleted or permission restricted
      console.warn('Media cleanup notice:', e);
    }
  }

  /**
   * Save (Create or In-Place Edit) a Gallery Item.
   * Updating preserves document ID and createdAt, updates updatedAt.
   */
  async saveItem(
    item: Partial<GalleryItem> & { title: string; imageUrl: string },
    isAuthor: boolean,
    isEditor: boolean = false,
    userProfile?: { name?: string; email?: string }
  ): Promise<{ success: boolean; item?: GalleryItem; error?: string }> {
    const isNew = !item.id || !this.items.some((i) => i.id === item.id);

    if (isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You must be an Author or Editor to add gallery items.' };
    }

    if (!isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You do not have permission to edit gallery items.' };
    }

    if (!item.title || !item.title.trim()) {
      return { success: false, error: 'Gallery item title is required.' };
    }

    if (!item.imageUrl || !item.imageUrl.trim()) {
      return { success: false, error: 'An image is required for gallery items.' };
    }

    const existing = !isNew ? this.items.find((i) => i.id === item.id) : null;
    const nowIso = new Date().toISOString();

    const id = existing ? existing.id : (item.id || `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);

    // Ensure category is in category list
    if (item.category) {
      this.addCategory(item.category);
    }

    const savedItem: GalleryItem = {
      id,
      title: item.title.trim(),
      description: item.description?.trim() || '',
      imageUrl: item.imageUrl.trim(),
      thumbnailUrl: item.thumbnailUrl?.trim() || item.imageUrl.trim(),
      altText: item.altText?.trim() || `${item.title.trim()} gallery visual`,
      category: item.category || 'Books',
      tags: Array.isArray(item.tags) ? item.tags : [],
      relatedBookId: item.relatedBookId || undefined,
      relatedSeriesId: item.relatedSeriesId || undefined,
      relatedCharacterId: item.relatedCharacterId || undefined,
      relatedStoryId: item.relatedStoryId || undefined,
      featured: !!item.featured,
      publicationState: item.publicationState || 'PUBLIC',
      dimensions: item.dimensions || undefined,
      medium: item.medium || undefined,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      publishedAt: item.publishedAt || (item.publicationState === 'PUBLIC' ? nowIso : undefined),
      createdBy: existing?.createdBy || userProfile?.email || 'author',
      updatedBy: userProfile?.email || (isAuthor ? 'author' : 'editor'),
    };

    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      this.items[idx] = savedItem;
    } else {
      this.items.unshift(savedItem);
    }

    this.saveLocally();
    this.notify();

    // Persist to Firestore in-place (no duplicate documents)
    try {
      await setDoc(doc(db, GALLERY_COLLECTION, id), savedItem);
    } catch (error) {
      console.warn('Firestore setDoc notice for gallery:', error);
      try {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `gallery/${id}`);
      } catch (e) {}
    }

    return { success: true, item: savedItem };
  }

  /**
   * Delete a Gallery Item.
   * Strictly Author-only. Does NOT delete related book, series, character, or story!
   */
  async deleteItem(
    itemId: string,
    isAuthor: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Deleting Gallery items is strictly restricted to the Author.',
      };
    }

    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      return { success: false, error: 'Gallery item not found.' };
    }

    const itemToDelete = this.items[idx];

    // Clean up uploaded media if applicable
    if (itemToDelete.imageUrl) {
      this.deleteStorageImageIfManaged(itemToDelete.imageUrl);
    }

    this.items.splice(idx, 1);
    this.saveLocally();
    this.notify();

    try {
      await deleteDoc(doc(db, GALLERY_COLLECTION, itemId));
    } catch (error) {
      console.warn('Firestore deleteDoc notice for gallery:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `gallery/${itemId}`);
      } catch (e) {}
    }

    return { success: true };
  }
}

export const galleryService = new GalleryService();
