import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Story, PublicationState } from '../types';
import { STORIES as INITIAL_SEEDED_STORIES } from '../data/authorData';

const STORIES_COLLECTION = 'stories';
const LOCAL_STORAGE_STORIES_KEY = 'mmessmer_author_stories_cache_v2';
const LOCAL_STORAGE_SEEDED_KEY = 'mmessmer_author_stories_seeded_v2';

type StoryListener = (stories: Story[]) => void;

class StoryService {
  private stories: Story[] = [];
  private listeners: Set<StoryListener> = new Set();
  private initialized = false;
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_STORIES_KEY);
      const isSeeded = localStorage.getItem(LOCAL_STORAGE_SEEDED_KEY);

      if (stored !== null) {
        // If cache exists (even if empty array []), respect it
        this.stories = JSON.parse(stored);
      } else if (!isSeeded) {
        // Only on fresh first-time visit, initialize with seeded stories
        this.stories = [...INITIAL_SEEDED_STORIES];
        this.saveLocally();
      } else {
        // Already seeded in the past, but cache is empty
        this.stories = [];
      }
    } catch {
      this.stories = [];
    }

    this.initRealtime();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_STORIES_KEY, JSON.stringify(this.stories));
      localStorage.setItem(LOCAL_STORAGE_SEEDED_KEY, 'true');
    } catch {}
  }

  private notify(): void {
    const copy = [...this.stories];
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('Story listener error:', err);
      }
    });
  }

  subscribe(listener: StoryListener): () => void {
    this.listeners.add(listener);
    listener([...this.stories]);
    return () => this.listeners.delete(listener);
  }

  private initRealtime(): void {
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, STORIES_COLLECTION),
        (snapshot) => {
          this.initialized = true;

          if (snapshot.empty) {
            // When collection is empty, author has deleted all stories or none exist.
            // NEVER automatically re-seed! Respect the empty collection.
            this.stories = [];
            this.saveLocally();
            this.notify();
            return;
          }

          const list: Story[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Partial<Story>;
            list.push({
              id: d.id,
              slug: data.slug || d.id,
              title: data.title || 'Untitled Story',
              subtitle: data.subtitle,
              universe: data.universe || 'Standalone Short Story',
              summary: data.summary || '',
              content: Array.isArray(data.content)
                ? data.content
                : typeof data.content === 'string'
                ? (data.content as string).split('\n\n').filter(Boolean)
                : [],
              readTime: data.readTime || '5 min read',
              datePublished: data.datePublished || 'Canon',
              publicationState: (data.publicationState as PublicationState) || 'PUBLIC',
              seo: data.seo,
            });
          });

          this.stories = list;
          this.saveLocally();
          this.notify();
        },
        (error) => {
          console.warn('Realtime stories listener notice:', error);
          this.fetchInitialOnce();
        }
      );
    } catch (err) {
      this.fetchInitialOnce();
    }
  }

  public async restoreInitialStories(isAuthor: boolean): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Only users with the Author role can restore default stories.',
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SEEDED_KEY, 'true');
    }
    this.stories = [...INITIAL_SEEDED_STORIES];
    this.saveLocally();
    this.notify();

    for (const st of INITIAL_SEEDED_STORIES) {
      try {
        await setDoc(doc(db, STORIES_COLLECTION, st.id), st);
      } catch (err) {
        console.warn('Could not seed initial story to Firestore:', err);
      }
    }

    return { success: true };
  }

  private async fetchInitialOnce(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, STORIES_COLLECTION));
      this.initialized = true;

      if (snap.empty) {
        // When collection is empty, author has deleted all stories. Keep empty.
        this.stories = [];
        this.saveLocally();
        this.notify();
        return;
      }

      const list: Story[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Story), id: d.id });
      });
      this.stories = list;
      this.saveLocally();
      this.notify();
    } catch (err) {
      console.warn('Could not fetch stories from Firestore:', err);
    }
  }

  async getStories(): Promise<Story[]> {
    return [...this.stories];
  }

  getStoryBySlug(slug: string): Story | undefined {
    return this.stories.find((s) => s.slug === slug || s.id === slug);
  }

  getStoryById(id: string): Story | undefined {
    return this.stories.find((s) => s.id === id);
  }

  /**
   * Restrict creation strictly to users with the AUTHOR role.
   * Editors can update existing stories.
   */
  async saveStory(
    story: Partial<Story> & { title: string },
    isAuthor: boolean,
    isEditor: boolean = false
  ): Promise<{ success: boolean; story?: Story; error?: string }> {
    const isNew = !story.id || !this.stories.some((s) => s.id === story.id);
    if (isNew && !isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Short story creation is strictly restricted to users with the Author role.',
      };
    }

    if (!isNew && !isAuthor && !isEditor) {
      return {
        success: false,
        error: 'Permission denied: Only users with the Author or Editor role can modify short stories.',
      };
    }

    if (!story.title.trim()) {
      return { success: false, error: 'Short story title is required.' };
    }

    const id = story.id || `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = story.slug || story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const savedStory: Story = {
      id,
      slug,
      title: story.title.trim(),
      subtitle: story.subtitle?.trim(),
      universe: story.universe?.trim() || 'Standalone Short Story',
      summary: story.summary?.trim() || '',
      content: Array.isArray(story.content)
        ? story.content
        : typeof story.content === 'string'
        ? (story.content as string).split('\n\n').filter(Boolean)
        : [],
      readTime: story.readTime?.trim() || '5 min read',
      datePublished: story.datePublished || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      publicationState: story.publicationState || 'PUBLIC',
      seo: story.seo,
    };

    const idx = this.stories.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.stories[idx] = savedStory;
    } else {
      this.stories.unshift(savedStory);
    }

    this.saveLocally();
    this.notify();

    try {
      await setDoc(doc(db, STORIES_COLLECTION, id), savedStory);
    } catch (err) {
      console.warn('Could not save story to Firestore (saved locally):', err);
    }

    return { success: true, story: savedStory };
  }

  /**
   * Restrict deletion strictly to users with the AUTHOR role.
   */
  async deleteStory(
    storyId: string,
    isAuthor: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Short story deletion is strictly restricted to users with the Author role.',
      };
    }

    const idx = this.stories.findIndex((s) => s.id === storyId);
    if (idx === -1) {
      return { success: false, error: 'Story not found.' };
    }

    // Remove in memory
    this.stories.splice(idx, 1);
    this.saveLocally();
    this.notify();

    // Remove from Firestore
    try {
      await deleteDoc(doc(db, STORIES_COLLECTION, storyId));
    } catch (err) {
      console.warn('Could not delete story from Firestore (removed locally):', err);
    }

    return { success: true };
  }

  /**
   * Delete all short stories permanently (Author only).
   */
  async deleteAllStories(isAuthor: boolean): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Short story deletion is strictly restricted to users with the Author role.',
      };
    }

    const idsToDelete = this.stories.map((s) => s.id);
    this.stories = [];
    this.saveLocally();
    this.notify();

    for (const id of idsToDelete) {
      try {
        await deleteDoc(doc(db, STORIES_COLLECTION, id));
      } catch (err) {
        console.warn(`Could not delete story ${id} from Firestore:`, err);
      }
    }

    return { success: true };
  }
}

export const storyService = new StoryService();
