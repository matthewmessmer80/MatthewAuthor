import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, AUTHOR_ADMIN_EMAILS } from './firebase';
import configJson from '../../firebase-applet-config.json';

export interface SiteSettings {
  // Identity & Branding
  authorName: string;
  siteTitle: string;
  tagline: string;

  // Contact Information
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  websiteUrl?: string;

  // Retail & Social Distribution Links
  amazonAuthorUrl?: string;
  goodreadsUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;

  // Administrative Gmail Integration (NO credentials/passwords stored)
  gmailIntegration?: GmailIntegrationSettings;

  // Metadata
  updatedAt?: string;
  updatedBy?: string;
}

export interface GmailIntegrationSettings {
  account: string;
  status: 'connected' | 'not_connected' | 'needs_renewal';
  connectedAt?: string;
  connectedBy?: string;
  lastVerifiedAt?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  authorName: 'Matthew E. Messmer',
  siteTitle: 'Matthew E. Messmer | Author | Stories Woven Through Time',
  tagline: 'Fantasy author crafting intricate worlds woven through honor, family, and metaphysical threads.',
  contactEmail: 'contact@matthewemessmer.com',
  contactPhone: '',
  contactAddress: 'Texas, United States',
  websiteUrl: 'https://matthewemessmer.com',
  amazonAuthorUrl: 'https://www.amazon.com/author/matthewemessmer',
  goodreadsUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  gmailIntegration: {
    account: 'breathwovenproductions@gmail.com',
    status: 'not_connected',
  },
};

export const SITE_SETTINGS_COLLECTION = 'siteSettings';
export const SITE_SETTINGS_DOC_ID = 'general';
const LOCAL_STORAGE_SETTINGS_KEY = 'mmessmer_author_site_settings_v1';

class SiteSettingsService {
  private settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
  private listeners: Array<(settings: SiteSettings) => void> = [];
  private unsubscribeSnapshot: Unsubscribe | null = null;
  private initialized = false;

  constructor() {
    this.loadInitialCache();
    this.initRealtimeListener();
  }

  /**
   * Load local cache first for instantaneous rendering.
   */
  private loadInitialCache(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...DEFAULT_SITE_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read site settings local cache:', e);
    }
  }

  /**
   * Persist current state to localStorage cache.
   */
  private saveLocalCache(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save site settings local cache:', e);
    }
  }

  /**
   * Listen to real-time updates from Firestore: siteSettings/general
   */
  private initRealtimeListener(): void {
    try {
      const docRef = doc(db, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC_ID);
      this.unsubscribeSnapshot = onSnapshot(
        docRef,
        (snap) => {
          this.initialized = true;
          if (snap.exists()) {
            const data = snap.data() as Partial<SiteSettings>;
            this.settings = {
              ...DEFAULT_SITE_SETTINGS,
              ...this.settings,
              ...data,
            };
            this.saveLocalCache();
            this.notify();
          }
        },
        (error) => {
          console.warn('Realtime siteSettings listener notice:', error);
          this.fetchInitialOnce();
        }
      );
    } catch {
      this.fetchInitialOnce();
    }
  }

  /**
   * Fallback fetch if realtime listener encounters issues.
   */
  public async fetchInitialOnce(): Promise<SiteSettings> {
    try {
      const docRef = doc(db, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC_ID);
      const snap = await getDoc(docRef);
      this.initialized = true;
      if (snap.exists()) {
        const data = snap.data() as Partial<SiteSettings>;
        this.settings = {
          ...DEFAULT_SITE_SETTINGS,
          ...this.settings,
          ...data,
        };
        this.saveLocalCache();
        this.notify();
      }
    } catch (err) {
      console.warn('Could not fetch siteSettings from Firestore:', err);
    }
    return this.settings;
  }

  /**
   * Synchronously get current site settings.
   */
  public getSettings(): SiteSettings {
    return { ...this.settings };
  }

  /**
   * Subscribe to live site settings updates.
   */
  public subscribe(listener: (settings: SiteSettings) => void): () => void {
    this.listeners.push(listener);
    listener(this.getSettings());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = this.getSettings();
    this.listeners.forEach((fn) => {
      try {
        fn(current);
      } catch (err) {
        console.error('Error notifying siteSettings listener:', err);
      }
    });
  }

  /**
   * Asynchronously saves site settings and contact information to Firestore:
   * Target: siteSettings/general
   * Uses setDoc with merge: true to update changed fields without wiping unrelated settings.
   */
  public async saveSettings(
    updates: Partial<SiteSettings>,
    isAuthorRole: boolean,
    userEmail?: string
  ): Promise<{ success: boolean; data?: SiteSettings; error?: string }> {
    const currentUid = auth.currentUser?.uid || 'unauthenticated';
    const currentUserEmail = auth.currentUser?.email || userEmail || '';
    const projectId = configJson.projectId;

    // Diagnostic logging per requirement Section 16
    console.log('[SiteSettings:Save] Initiating save operation:', {
      authenticatedUid: currentUid,
      authenticatedEmail: currentUserEmail,
      isAuthorRole,
      firebaseProjectId: projectId,
      firestoreCollection: SITE_SETTINGS_COLLECTION,
      firestoreDocId: SITE_SETTINGS_DOC_ID,
      fieldsToUpdate: Object.keys(updates),
    });

    // 1. Authorization validation: Only Author role can save site settings
    if (!isAuthorRole) {
      const authError = 'Permission denied: Modifying site settings is strictly restricted to the Author role.';
      console.warn('[SiteSettings:Save] Rejected authorization check:', authError);
      return { success: false, error: authError };
    }

    // 2. Validate contact email if provided
    if (updates.contactEmail !== undefined) {
      const emailTrimmed = updates.contactEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailTrimmed && !emailRegex.test(emailTrimmed)) {
        return { success: false, error: 'Please enter a valid primary contact email address.' };
      }
    }

    // 3. Prepare payload, preserving all existing settings
    const docRef = doc(db, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC_ID);
    const nowIso = new Date().toISOString();

    const payload: Partial<SiteSettings> = {
      ...updates,
      updatedAt: nowIso,
      updatedBy: currentUserEmail || 'author',
    };

    try {
      // 4. Perform Firestore write using setDoc with merge: true
      await setDoc(docRef, payload, { merge: true });

      // 5. Re-read the confirmed saved state directly from Firestore
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const confirmedData = snap.data() as Partial<SiteSettings>;
        this.settings = {
          ...this.settings,
          ...confirmedData,
        };
      } else {
        this.settings = {
          ...this.settings,
          ...payload,
        };
      }

      // 6. Update local cache and notify all components
      this.saveLocalCache();
      this.notify();

      console.log('[SiteSettings:Save] SUCCESS: Site settings persisted to Firestore.', {
        docPath: `${SITE_SETTINGS_COLLECTION}/${SITE_SETTINGS_DOC_ID}`,
        confirmedSettings: this.settings,
      });

      return { success: true, data: this.getSettings() };
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const errorCode = errorObj?.code || 'unknown';
      const errorMessage = errorObj?.message || 'Unknown Firestore error';

      console.error('[SiteSettings:Save] FIRESTORE WRITE FAILED:', {
        errorCode,
        errorMessage,
        docPath: `${SITE_SETTINGS_COLLECTION}/${SITE_SETTINGS_DOC_ID}`,
        projectId,
        authUid: currentUid,
      });

      let userFriendlyError = 'Unable to save contact information. Please try again.';
      if (errorCode === 'permission-denied') {
        userFriendlyError = 'Permission denied by Firestore security rules. Please ensure you are logged in as the Author.';
      } else if (errorCode === 'unavailable') {
        userFriendlyError = 'Firestore service temporarily unavailable. Please check your internet connection.';
      } else if (errorCode === 'invalid-argument') {
        userFriendlyError = 'Invalid field values provided. Please review your settings.';
      }

      return {
        success: false,
        error: `${userFriendlyError} (${errorCode})`,
      };
    }
  }
}

export const siteSettingsService = new SiteSettingsService();
