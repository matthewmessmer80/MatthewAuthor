import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { HomepageContent } from '../types';

const SITE_CONTENT_COLLECTION = 'siteContent';
const HOMEPAGE_DOC_ID = 'homepage';
const LOCAL_STORAGE_SITE_CONTENT_KEY = 'mmessmer_author_homepage_content';

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroHeading: 'Stories Woven Through Time',
  heroSubtitle: 'Handcrafted Epics & Woodcraft Artifacts',
  heroDescription: 'Step into high fantasy worlds of memory, severed crowns, and ancient looms, complemented by physical laser-engraved artifacts crafted by author Matthew E. Messmer.',
  heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
  featuredBookId: 'kings-severance',
  featuredSeriesId: 'breathwoven',
  primaryCtaLabel: 'Explore The King\'s Severance',
  primaryCtaLink: '/the-kings-severance',
  secondaryCtaLabel: 'The Breathwoven Cycle',
  secondaryCtaLink: '/the-breathwoven-cycle',
  authorIntroHeading: 'About the Author & Craftsman',
  authorIntroBio: 'Matthew E. Messmer writes atmospheric fantasy where ancient oaths clash with human frailty. Working from his Texas workshop alongside his four children, Matthew unites epic storytelling with physical woodwork and engraving.',
  authorIntroQuote: 'Every narrative is a tapestry woven from memory, duty, and the quiet spaces between heartbeats.',
  newsletterHeading: 'Join the Journey',
  newsletterText: 'Receive exclusive early chapter previews, signed edition announcements, and hand-drawn maps directly from Matthew\'s study.',
  footerNote: 'Crafted with reverence for epic fantasy literature and traditional woodworking.',
  footerCopyright: '© 2026 Matthew E. Messmer. All rights reserved.',
  sections: {
    showFeaturedSeries: true,
    showBooksGrid: true,
    showStories: true,
    showNews: true,
    showCraft: true,
    showNewsletter: true,
  },
};

type Listener = (content: HomepageContent) => void;

class SiteContentService {
  private content: HomepageContent = { ...DEFAULT_HOMEPAGE_CONTENT };
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SITE_CONTENT_KEY);
      if (stored) {
        this.content = { ...DEFAULT_HOMEPAGE_CONTENT, ...JSON.parse(stored) };
      }
    } catch {
      this.content = { ...DEFAULT_HOMEPAGE_CONTENT };
    }
    // Also fetch from Firestore asynchronously
    this.fetchFromFirestore();
  }

  private async fetchFromFirestore(): Promise<void> {
    try {
      const snap = await getDoc(doc(db, SITE_CONTENT_COLLECTION, HOMEPAGE_DOC_ID));
      if (snap.exists()) {
        this.content = { ...DEFAULT_HOMEPAGE_CONTENT, ...(snap.data() as HomepageContent) };
        this.saveLocally();
        this.notify();
      }
    } catch {}
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_SITE_CONTENT_KEY, JSON.stringify(this.content));
    } catch {}
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.content));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.content);
    return () => this.listeners.delete(listener);
  }

  getContent(): HomepageContent {
    return { ...this.content };
  }

  async updateHomepageContent(updates: Partial<HomepageContent>): Promise<{ success: boolean; error?: string }> {
    this.content = {
      ...this.content,
      ...updates,
      sections: {
        ...this.content.sections,
        ...(updates.sections || {}),
      },
    };
    this.saveLocally();
    this.notify();

    try {
      await setDoc(doc(db, SITE_CONTENT_COLLECTION, HOMEPAGE_DOC_ID), {
        ...this.content,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not sync site content to Firestore (saved locally):', err);
    }

    return { success: true };
  }

  async resetToDefaults(): Promise<void> {
    this.content = { ...DEFAULT_HOMEPAGE_CONTENT };
    this.saveLocally();
    this.notify();
    try {
      await setDoc(doc(db, SITE_CONTENT_COLLECTION, HOMEPAGE_DOC_ID), this.content);
    } catch {}
  }
}

export const siteContentService = new SiteContentService();
