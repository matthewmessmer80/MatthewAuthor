import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { DiscussionThread, UserRole } from '../types';

const DISCUSSIONS_COLLECTION = 'discussions';
const LOCAL_STORAGE_DISCUSSIONS_KEY = 'mmessmer_author_discussions_cache';

const INITIAL_SEEDED_DISCUSSIONS: DiscussionThread[] = [
  {
    id: 'disc-welcome-lounge',
    title: 'Welcome to the Matthew E. Messmer Reader Lounge!',
    category: 'General Discussion',
    content:
      'Welcome to our dedicated reader community space! Here you can connect with fellow readers, share your favorite quotes, discuss ongoing theories about The Breathwoven Cycle and The Abyssal Current, and engage directly with the author and editors. Please keep our community welcoming and thoughtful!',
    authorId: 'author-default-root',
    authorName: 'Matthew E. Messmer',
    authorRole: 'AUTHOR',
    createdAt: '2024-08-01T12:00:00Z',
    replyCount: 3,
    rulesAgreed: true,
    pinned: true,
  },
  {
    id: 'disc-severance-rite-theories',
    title: 'Theories on the Severance Rite & The First Weavers',
    category: 'The Breathwoven Cycle',
    content:
      'In Chapter 14 of The King\'s Severance, the severance blade is described as vibrating with the harmonic tension of memory itself. Does anyone else think the First Weavers didn\'t just record history, but actually severed timelines to prevent something worse from awakening? Let\'s compile the clues from the text!',
    authorId: 'reader-samuel-k',
    authorName: 'Samuel Kaye',
    authorRole: 'READER',
    createdAt: '2024-08-15T15:30:00Z',
    replyCount: 5,
    rulesAgreed: true,
    pinned: false,
  },
  {
    id: 'disc-workshop-craft-chat',
    title: 'Workshop Artifacts: Turning Fictional Seals into Woodcraft Keepsakes',
    category: 'Craft & Workshop',
    content:
      'Seeing the physical laser-engraved seals of House Vance and the Loom sigils made me appreciate how tactile Matthew\'s worldbuilding is. Who else has a favorite fictional emblem they would love to see carved in Texas walnut or cherry?',
    authorId: 'editor-elena-vane',
    authorName: 'Elena Vane',
    authorRole: 'EDITOR',
    createdAt: '2024-09-01T10:15:00Z',
    replyCount: 2,
    rulesAgreed: true,
    pinned: false,
  },
];

type DiscussionListener = (discussions: DiscussionThread[]) => void;

class DiscussionService {
  private discussions: DiscussionThread[] = [];
  private listeners: Set<DiscussionListener> = new Set();
  private initialized = false;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DISCUSSIONS_KEY);
      if (stored) {
        this.discussions = JSON.parse(stored);
      } else {
        this.discussions = [...INITIAL_SEEDED_DISCUSSIONS];
        this.saveLocally();
      }
    } catch {
      this.discussions = [...INITIAL_SEEDED_DISCUSSIONS];
    }

    this.fetchFromFirestore();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_DISCUSSIONS_KEY, JSON.stringify(this.discussions));
    } catch {}
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn([...this.discussions]));
  }

  subscribe(listener: DiscussionListener): () => void {
    this.listeners.add(listener);
    listener([...this.discussions]);
    return () => this.listeners.delete(listener);
  }

  private async fetchFromFirestore(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, DISCUSSIONS_COLLECTION));
      if (!snap.empty) {
        const list: DiscussionThread[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as DiscussionThread), id: d.id }));
        this.discussions = list;
        this.saveLocally();
        this.notify();
      } else if (!this.initialized) {
        this.initialized = true;
        for (const disc of INITIAL_SEEDED_DISCUSSIONS) {
          try {
            await setDoc(doc(db, DISCUSSIONS_COLLECTION, disc.id), disc);
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not sync discussions from Firestore (using local cache):', err);
    }
  }

  async getDiscussions(): Promise<DiscussionThread[]> {
    if (this.discussions.length === 0) {
      this.discussions = [...INITIAL_SEEDED_DISCUSSIONS];
    }
    return [...this.discussions].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getDiscussionById(id: string): DiscussionThread | undefined {
    return this.discussions.find((d) => d.id === id);
  }

  /**
   * Create a new community discussion thread.
   * Requirement: When creating a discussion, users must explicitly check an agreement box
   * acknowledging community rules (No hate speech, bullying, harassment, spam, or advertising).
   * Readers and above can create new discussion threads.
   */
  async createDiscussion(params: {
    title: string;
    category: string;
    content: string;
    authorId: string;
    authorName: string;
    authorEmail?: string;
    authorAvatar?: string;
    authorRole: UserRole;
    rulesAgreed: boolean;
  }): Promise<{ success: boolean; thread?: DiscussionThread; error?: string }> {
    if (!params.rulesAgreed) {
      return {
        success: false,
        error: 'You must explicitly agree to the community rules before creating a discussion thread.',
      };
    }

    if (!params.title.trim()) {
      return { success: false, error: 'Discussion title is required.' };
    }

    if (!params.content.trim()) {
      return { success: false, error: 'Discussion content is required.' };
    }

    const newThread: DiscussionThread = {
      id: `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: params.title.trim(),
      category: params.category || 'General Discussion',
      content: params.content.trim(),
      authorId: params.authorId,
      authorName: params.authorName,
      authorEmail: params.authorEmail,
      authorAvatar: params.authorAvatar,
      authorRole: params.authorRole || 'READER',
      createdAt: new Date().toISOString(),
      replyCount: 0,
      rulesAgreed: true,
      pinned: false,
    };

    this.discussions.unshift(newThread);
    this.saveLocally();
    this.notify();

    try {
      await setDoc(doc(db, DISCUSSIONS_COLLECTION, newThread.id), newThread);
    } catch (err) {
      console.warn('Could not save discussion to Firestore (saved locally):', err);
    }

    return { success: true, thread: newThread };
  }

  /**
   * Delete a discussion thread.
   * Editors and Authors retain administrative delete privileges.
   */
  async deleteDiscussion(
    discussionId: string,
    userRole: UserRole,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const isEditorOrAuthor = userRole === 'EDITOR' || userRole === 'AUTHOR';
    const disc = this.discussions.find((d) => d.id === discussionId);

    if (!disc) {
      return { success: false, error: 'Discussion thread not found.' };
    }

    // Only the author of the thread, or an Editor / Author, can delete
    if (!isEditorOrAuthor && disc.authorId !== userId) {
      return {
        success: false,
        error: 'Permission denied: Only Editors, Authors, or the original thread author can delete this discussion.',
      };
    }

    const idx = this.discussions.findIndex((d) => d.id === discussionId);
    if (idx >= 0) {
      this.discussions.splice(idx, 1);
      this.saveLocally();
      this.notify();
    }

    try {
      await deleteDoc(doc(db, DISCUSSIONS_COLLECTION, discussionId));
    } catch (err) {
      console.warn('Could not delete discussion in Firestore (deleted locally):', err);
    }

    return { success: true };
  }

  /**
   * Increment reply count
   */
  async incrementReplyCount(discussionId: string): Promise<void> {
    const disc = this.discussions.find((d) => d.id === discussionId);
    if (disc) {
      disc.replyCount = (disc.replyCount || 0) + 1;
      this.saveLocally();
      this.notify();

      try {
        await updateDoc(doc(db, DISCUSSIONS_COLLECTION, discussionId), {
          replyCount: disc.replyCount,
        });
      } catch {}
    }
  }
}

export const discussionService = new DiscussionService();
