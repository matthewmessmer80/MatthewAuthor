import { NewsletterSettings, NewsletterSubscriber, NewsletterAnalyticsEvent } from '../types';

const STORAGE_KEY_SUBSCRIBERS = 'mem_author_newsletter_subscribers_v1';
const STORAGE_KEY_SETTINGS = 'mem_author_newsletter_settings_v1';
const STORAGE_KEY_ANALYTICS = 'mem_author_newsletter_analytics_v1';

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

class NewsletterService {
  private getStorageSubscribers(): NewsletterSubscriber[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(SEED_SUBSCRIBERS));
        return SEED_SUBSCRIBERS;
      }
      return JSON.parse(data) as NewsletterSubscriber[];
    } catch {
      return SEED_SUBSCRIBERS;
    }
  }

  private saveStorageSubscribers(subscribers: NewsletterSubscriber[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(subscribers));
    } catch (e) {
      console.warn('Failed to persist subscribers to localStorage', e);
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
    const list = this.getStorageSubscribers();
    return list.some(sub => sub.email.toLowerCase() === cleanEmail && sub.status === 'active');
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
    const subscribers = this.getStorageSubscribers();
    const existing = subscribers.find(s => s.email.toLowerCase() === cleanEmail);

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
      };
    }

    // Artificial tiny latency for realistic network feel (250ms)
    await new Promise(res => setTimeout(res, 350));

    // 3. Create or reactivate subscriber
    const newSubscriber: NewsletterSubscriber = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firstName: cleanFirst || 'Reader',
      email: cleanEmail,
      dateSubscribed: new Date().toISOString(),
      status: 'active',
      source: params.source || 'website',
    };

    let updatedList: NewsletterSubscriber[];
    if (existing) {
      updatedList = subscribers.map(s =>
        s.email.toLowerCase() === cleanEmail
          ? { ...newSubscriber, id: s.id }
          : s
      );
    } else {
      updatedList = [newSubscriber, ...subscribers];
    }

    this.saveStorageSubscribers(updatedList);

    this.recordAnalytics({
      event: 'newsletter_success',
      source: params.source,
      metadata: { provider: settings.newsletterProvider },
    });

    return {
      status: 'success',
      title: "You're In!",
      message: settings.newsletterSuccessMessage || "Welcome to the journey. You'll hear from Matthew when there's something worth sharing.",
      subscriber: newSubscriber,
    };
  }

  public unsubscribe(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const subscribers = this.getStorageSubscribers();
    let found = false;
    const updated = subscribers.map(s => {
      if (s.email.toLowerCase() === cleanEmail) {
        found = true;
        return { ...s, status: 'unsubscribed' as const };
      }
      return s;
    });
    if (found) {
      this.saveStorageSubscribers(updated);
    }
    return found;
  }

  public deleteSubscriber(id: string): void {
    const subscribers = this.getStorageSubscribers();
    const filtered = subscribers.filter(s => s.id !== id);
    this.saveStorageSubscribers(filtered);
  }

  public getSubscribers(): NewsletterSubscriber[] {
    return this.getStorageSubscribers();
  }

  public getStats() {
    const subscribers = this.getStorageSubscribers();
    const active = subscribers.filter(s => s.status === 'active');
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
      // Keep up to last 100 events
      list.unshift(item);
      localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  public exportSubscribersCSV(): string {
    const subs = this.getStorageSubscribers();
    const headers = ['First Name', 'Email', 'Date Subscribed', 'Status', 'Source'];
    const rows = subs.map(s => [
      `"${s.firstName.replace(/"/g, '""')}"`,
      `"${s.email.replace(/"/g, '""')}"`,
      `"${s.dateSubscribed}"`,
      `"${s.status}"`,
      `"${s.source}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const newsletterService = new NewsletterService();
