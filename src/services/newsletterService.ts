import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  NewsletterSettings,
  NewsletterSubscriber,
  NewsletterAnalyticsEvent,
  WelcomeEmailStatus,
  WelcomeEmailType,
} from '../types';
import { welcomeEmailService } from './welcomeEmailService';

const SUBSCRIBERS_COLLECTION = 'subscribers';
const STORAGE_KEY_SUBSCRIBERS = 'mem_author_newsletter_subscribers_v1';
const STORAGE_KEY_SETTINGS = 'mem_author_newsletter_settings_v1';
const STORAGE_KEY_ANALYTICS = 'mem_author_newsletter_analytics_v1';
const STORAGE_KEY_DELETED_SUBS = 'mem_author_newsletter_deleted_subscribers_v1';
const STORAGE_KEY_SEEDED_SUBS = 'mem_author_newsletter_seeded_subscribers_v1';

const DEFAULT_SETTINGS: NewsletterSettings = {
  newsletterEnabled: true,
  newsletterProvider: 'development',
  newsletterListId: 'dev_list_breathwoven_readers',
  newsletterFromName: 'Matthew E. Messmer',
  newsletterReplyTo: 'contact@matthewemessmer.com',
  newsletterConsentText: 'I agree to receive occasional news and updates from Matthew E. Messmer.',
  newsletterSuccessMessage: "Welcome to the journey. You'll hear from Matthew when there's something worth sharing.",
  newsletterErrorMessage: "We couldn't complete your subscription right now. Please try again in a moment.",
  exitIntentEnabled: false,
};

const SEED_SUBSCRIBERS: NewsletterSubscriber[] = [
  {
    id: 'sub_seed_1',
    firstName: 'Eleanor',
    email: 'e.vance.reader@example.com',
    dateSubscribed: '2026-09-14T14:22:00Z',
    status: 'active',
    source: 'homepage',
  },
  {
    id: 'sub_seed_2',
    firstName: 'Marcus',
    email: 'marcus.t.fellowship@example.com',
    dateSubscribed: '2026-09-18T09:41:00Z',
    status: 'active',
    source: 'abyssal_current',
  },
  {
    id: 'sub_seed_3',
    firstName: 'Gwendolyn',
    email: 'gwen.threads@example.org',
    dateSubscribed: '2026-09-22T19:15:00Z',
    status: 'active',
    source: 'book_page',
  },
];

export interface SubscribeResult {
  status: 'success' | 'duplicate' | 'error' | 'disabled';
  title: string;
  message: string;
  subscriber?: NewsletterSubscriber;
}

type SubscriberListener = (subscribers: NewsletterSubscriber[]) => void;

class NewsletterService {
  private subscribers: NewsletterSubscriber[] = [];
  private listeners: Set<SubscriberListener> = new Set();
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private getDeletedIds(): Set<string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DELETED_SUBS);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  }

  private addDeletedId(id: string): void {
    try {
      const set = this.getDeletedIds();
      set.add(id);
      localStorage.setItem(STORAGE_KEY_DELETED_SUBS, JSON.stringify(Array.from(set)));
    } catch {}
  }

  private loadState(): void {
    const deleted = this.getDeletedIds();
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
      const isSeeded = localStorage.getItem(STORAGE_KEY_SEEDED_SUBS);
      if (data) {
        const parsed: NewsletterSubscriber[] = JSON.parse(data);
        this.subscribers = parsed.filter((s) => !deleted.has(s.id));
      } else if (!isSeeded) {
        this.subscribers = SEED_SUBSCRIBERS.filter((s) => !deleted.has(s.id));
        this.saveStorageSubscribers(this.subscribers);
      } else {
        this.subscribers = [];
      }
    } catch {
      this.subscribers = SEED_SUBSCRIBERS.filter((s) => !deleted.has(s.id));
    }

    this.initRealtime();
  }

  private saveStorageSubscribers(subscribers: NewsletterSubscriber[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(subscribers));
      localStorage.setItem(STORAGE_KEY_SEEDED_SUBS, 'true');
    } catch (e) {
      console.warn('Failed to persist subscribers to localStorage', e);
    }
  }

  private notify(): void {
    const copy = [...this.subscribers];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (e) {
        console.error('Subscriber listener error:', e);
      }
    });
  }

  public subscribeListener(listener: SubscriberListener): () => void {
    this.listeners.add(listener);
    listener([...this.subscribers]);
    return () => this.listeners.delete(listener);
  }

  private initRealtime(): void {
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, SUBSCRIBERS_COLLECTION),
        async (snapshot) => {
          const deleted = this.getDeletedIds();

          if (snapshot.empty) {
            const isSeeded = localStorage.getItem(STORAGE_KEY_SEEDED_SUBS);
            if (!isSeeded) {
              await this.seedInitialToFirestore();
              return;
            }
            // If already seeded and empty, author has removed all
            this.subscribers = [];
            this.saveStorageSubscribers([]);
            this.notify();
            return;
          }

          const list: NewsletterSubscriber[] = [];
          snapshot.forEach((d) => {
            if (deleted.has(d.id)) return;
            const data = d.data();
            list.push({
              id: d.id,
              firstName: data.firstName || 'Reader',
              lastName: data.lastName,
              username: data.username,
              userId: data.userId,
              email: data.email || '',
              dateSubscribed: data.dateSubscribed || data.createdAt || new Date().toISOString(),
              status: data.status === 'unsubscribed' ? 'unsubscribed' : 'active',
              source: data.source || 'website',
              welcomeEmailStatus: data.welcomeEmailStatus || 'NOT_APPLICABLE',
              welcomeEmailType: data.welcomeEmailType,
              welcomeEmailSentAt: data.welcomeEmailSentAt,
              welcomeEmailEventId: data.welcomeEmailEventId,
              welcomeEmailError: data.welcomeEmailError,
            });
          });

          this.subscribers = list;
          this.saveStorageSubscribers(list);
          this.notify();
        },
        (error) => {
          console.warn('Subscribers realtime snapshot warning:', error);
        }
      );
    } catch (e) {
      console.warn('Subscribers realtime init warning:', e);
    }
  }

  private async seedInitialToFirestore(): Promise<void> {
    try {
      const deleted = this.getDeletedIds();
      for (const sub of SEED_SUBSCRIBERS) {
        if (deleted.has(sub.id)) continue;
        const ref = doc(db, SUBSCRIBERS_COLLECTION, sub.id);
        await setDoc(
          ref,
          {
            ...sub,
            consentGiven: true,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      localStorage.setItem(STORAGE_KEY_SEEDED_SUBS, 'true');
    } catch (e) {
      console.warn('Subscribers initial seed warning:', e);
    }
  }

  public getSettings(): NewsletterSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) {
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public updateSettings(partial: Partial<NewsletterSettings>): NewsletterSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update newsletter settings', e);
    }
    return updated;
  }

  public checkSubscription(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const list = this.getSubscribers();
    return list.some((sub) => sub.email.toLowerCase() === cleanEmail && sub.status === 'active');
  }

  public async subscribe(params: {
    firstName: string;
    email: string;
    source: string;
    consent: boolean;
  }): Promise<SubscribeResult> {
    const settings = this.getSettings();

    if (!settings.newsletterEnabled) {
      return {
        status: 'disabled',
        title: 'Subscriptions Paused',
        message: 'Newsletter signups are temporarily paused by the author.',
      };
    }

    const cleanFirst = params.firstName.trim();
    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Validation
    if (!cleanEmail) {
      return {
        status: 'error',
        title: 'Missing Email',
        message: 'Please enter your email address.',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        status: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      };
    }

    // 2. Check duplicate
    const subscribers = this.getSubscribers();
    const existing = subscribers.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing && existing.status === 'active') {
      this.recordAnalytics({
        event: 'newsletter_submitted',
        source: params.source,
        metadata: { duplicate: true },
      });
      return {
        status: 'duplicate',
        title: "You're already part of the journey.",
        message: "That email is already subscribed to Matthew's newsletter.",
        subscriber: existing,
      };
    }

    await new Promise((res) => setTimeout(res, 250));

    // 3. Create or Reactivate subscriber record
    const id = existing?.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSubscriber: NewsletterSubscriber = {
      ...(existing || {}),
      id,
      firstName: cleanFirst || existing?.firstName || 'Reader',
      email: cleanEmail,
      dateSubscribed: existing?.dateSubscribed || new Date().toISOString(),
      status: 'active',
      source: existing?.source || params.source || 'newsletter_signup',
      welcomeEmailStatus: existing?.welcomeEmailStatus || 'PENDING',
      welcomeEmailType: existing?.welcomeEmailType || 'NEWSLETTER_WELCOME',
    };

    // Authoritative Firestore write
    try {
      const docRef = doc(db, SUBSCRIBERS_COLLECTION, id);
      await setDoc(
        docRef,
        {
          ...newSubscriber,
          consentGiven: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore subscriber save warning:', err);
    }

    let updatedList: NewsletterSubscriber[];
    if (existing) {
      updatedList = subscribers.map((s) => (s.id === existing.id ? newSubscriber : s));
    } else {
      updatedList = [newSubscriber, ...subscribers];
    }

    this.subscribers = updatedList;
    this.saveStorageSubscribers(updatedList);
    this.notify();

    // 4. Trigger Automatic Newsletter Welcome Email (Idempotent)
    // Only sends if not already received
    try {
      welcomeEmailService
        .sendWelcomeEmail({
          email: cleanEmail,
          firstName: cleanFirst || newSubscriber.firstName,
          lastName: newSubscriber.lastName,
          username: newSubscriber.username,
          type: 'NEWSLETTER_WELCOME',
          subscriberId: id,
          userId: newSubscriber.userId,
          triggerSource: params.source || 'newsletter_signup',
        })
        .catch((err) => {
          console.warn('Welcome email background send warning:', err);
        });
    } catch (err) {
      console.warn('Welcome email trigger warning:', err);
    }

    this.recordAnalytics({
      event: 'newsletter_success',
      source: params.source,
      metadata: { provider: settings.newsletterProvider },
    });

    return {
      status: 'success',
      title: "You're In!",
      message:
        settings.newsletterSuccessMessage ||
        "Welcome to the journey. You'll hear from Matthew when there's something worth sharing.",
      subscriber: newSubscriber,
    };
  }

  /**
   * Automatic Newsletter Subscription when a website account is created.
   * Requirement:
   * - One combined welcome email (ACCOUNT_AND_NEWSLETTER_WELCOME)
   * - No duplicate subscriber records
   * - Idempotent against retries and refreshes
   */
  public async subscribeFromRegistration(params: {
    userId: string;
    email: string;
    firstName: string;
    lastName?: string;
    username?: string;
  }): Promise<{ subscriber: NewsletterSubscriber; welcomeEmailSent: boolean }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanFirst = params.firstName.trim();
    const cleanLast = params.lastName?.trim() || '';
    const cleanUser = params.username?.trim() || '';

    const subscribers = this.getSubscribers();
    const existing = subscribers.find((s) => s.email.toLowerCase() === cleanEmail);

    let targetSubscriber: NewsletterSubscriber;

    if (existing) {
      // 1. Link account to existing subscriber record
      targetSubscriber = {
        ...existing,
        userId: params.userId,
        lastName: cleanLast || existing.lastName,
        username: cleanUser || existing.username,
        status: 'active',
      };

      try {
        const docRef = doc(db, SUBSCRIBERS_COLLECTION, existing.id);
        await setDoc(
          docRef,
          {
            userId: params.userId,
            lastName: cleanLast || existing.lastName || '',
            username: cleanUser || existing.username || '',
            status: 'active',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore existing subscriber link warning:', err);
      }

      const updatedList = subscribers.map((s) => (s.id === existing.id ? targetSubscriber : s));
      this.subscribers = updatedList;
      this.saveStorageSubscribers(updatedList);
      this.notify();
    } else {
      // 2. Create brand-new subscriber record
      const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      targetSubscriber = {
        id,
        userId: params.userId,
        firstName: cleanFirst || 'Reader',
        lastName: cleanLast,
        username: cleanUser,
        email: cleanEmail,
        dateSubscribed: new Date().toISOString(),
        status: 'active',
        source: 'website_registration',
        welcomeEmailStatus: 'PENDING',
        welcomeEmailType: 'ACCOUNT_AND_NEWSLETTER_WELCOME',
      };

      try {
        const docRef = doc(db, SUBSCRIBERS_COLLECTION, id);
        await setDoc(
          docRef,
          {
            ...targetSubscriber,
            consentGiven: true,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore new subscriber save warning:', err);
      }

      this.subscribers = [targetSubscriber, ...subscribers];
      this.saveStorageSubscribers(this.subscribers);
      this.notify();
    }

    // 3. Dispatch ONE Combined Welcome Email (idempotent, checks if already sent)
    let welcomeEmailSent = false;
    try {
      const emailResult = await welcomeEmailService.sendWelcomeEmail({
        email: cleanEmail,
        firstName: cleanFirst || cleanUser || 'Reader',
        lastName: cleanLast,
        username: cleanUser,
        type: 'ACCOUNT_AND_NEWSLETTER_WELCOME',
        subscriberId: targetSubscriber.id,
        userId: params.userId,
        triggerSource: 'website_registration',
      });
      welcomeEmailSent = emailResult.success && !emailResult.alreadySent;
    } catch (err) {
      console.warn('Combined welcome email dispatch warning:', err);
    }

    return { subscriber: targetSubscriber, welcomeEmailSent };
  }

  public unsubscribe(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const subscribers = this.getSubscribers();
    let found = false;
    const updated = subscribers.map((s) => {
      if (s.email.toLowerCase() === cleanEmail) {
        found = true;
        // Also update in Firestore if possible
        try {
          const docRef = doc(db, SUBSCRIBERS_COLLECTION, s.id);
          setDoc(docRef, { status: 'unsubscribed', unsubscribedAt: serverTimestamp() }, { merge: true });
        } catch {}
        return { ...s, status: 'unsubscribed' as const };
      }
      return s;
    });
    if (found) {
      this.subscribers = updated;
      this.saveStorageSubscribers(updated);
      this.notify();
    }
    return found;
  }

  public async deleteSubscriber(id: string): Promise<void> {
    this.addDeletedId(id);

    // 1. Authoritative Firestore deletion
    try {
      const docRef = doc(db, SUBSCRIBERS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteSubscriber warning:', e);
    }

    // 2. Memory & local storage update
    this.subscribers = this.subscribers.filter((s) => s.id !== id);
    this.saveStorageSubscribers(this.subscribers);
    this.notify();
  }

  public getSubscribers(): NewsletterSubscriber[] {
    const deleted = this.getDeletedIds();
    return this.subscribers.filter((s) => !deleted.has(s.id));
  }

  public async refreshSubscribers(): Promise<NewsletterSubscriber[]> {
    const deleted = this.getDeletedIds();
    try {
      const snap = await getDocs(collection(db, SUBSCRIBERS_COLLECTION));
      if (!snap.empty) {
        const list: NewsletterSubscriber[] = [];
        snap.forEach((d) => {
          if (!deleted.has(d.id)) {
            const data = d.data();
            list.push({
              id: d.id,
              firstName: data.firstName || 'Reader',
              lastName: data.lastName,
              username: data.username,
              userId: data.userId,
              email: data.email || '',
              dateSubscribed: data.dateSubscribed || data.createdAt || new Date().toISOString(),
              status: data.status === 'unsubscribed' ? 'unsubscribed' : 'active',
              source: data.source || 'website',
              welcomeEmailStatus: data.welcomeEmailStatus || 'NOT_APPLICABLE',
              welcomeEmailType: data.welcomeEmailType,
              welcomeEmailSentAt: data.welcomeEmailSentAt,
              welcomeEmailEventId: data.welcomeEmailEventId,
              welcomeEmailError: data.welcomeEmailError,
            });
          }
        });
        this.subscribers = list;
        this.saveStorageSubscribers(list);
        this.notify();
        return list;
      }
    } catch {}
    return this.getSubscribers();
  }

  public getStats() {
    const subscribers = this.getSubscribers();
    const active = subscribers.filter((s) => s.status === 'active');
    const settings = this.getSettings();

    const lastSub = subscribers.length > 0 ? subscribers[0].dateSubscribed : null;

    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: active.length,
      provider: settings.newsletterProvider,
      isDevelopmentMode: settings.newsletterProvider === 'development',
      newsletterEnabled: settings.newsletterEnabled,
      lastSubscription: lastSub,
    };
  }

  public recordAnalytics(data: {
    event: NewsletterAnalyticsEvent['event'];
    source: string;
    metadata?: Record<string, unknown>;
  }): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ANALYTICS);
      const list: NewsletterAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
      const item: NewsletterAnalyticsEvent = {
        event: data.event,
        timestamp: new Date().toISOString(),
        source: data.source,
        metadata: data.metadata,
      };
      list.unshift(item);
      localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  public exportSubscribersCSV(): string {
    const subs = this.getSubscribers();
    const headers = ['First Name', 'Email', 'Date Subscribed', 'Status', 'Source'];
    const rows = subs.map((s) => [
      `"${s.firstName.replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"${s.dateSubscribed}"`,
      `"${s.status}"`,
      `"${s.source}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const newsletterService = new NewsletterService();
