import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  EmailEvent,
  WelcomeEmailType,
  WelcomeEmailStatus,
  WelcomeEmailTemplate,
  WelcomeTemplateVersion,
} from '../types';

const TEMPLATES_COLLECTION = 'emailTemplates';
const EMAIL_EVENTS_COLLECTION = 'emailEvents';
const MAIL_COLLECTION = 'mail';
const STORAGE_KEY_EVENTS = 'mem_email_events_cache_v1';
const STORAGE_KEY_TEMPLATES = 'mem_email_templates_cache_v1';
const STORAGE_KEY_VERSIONS = 'mem_email_template_versions_v1';

export interface SendWelcomeEmailParams {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  type: WelcomeEmailType;
  subscriberId: string;
  userId?: string;
  triggerSource?: string;
  customTemplate?: {
    subject: string;
    body: string;
  };
}

export interface WelcomeEmailResult {
  success: boolean;
  alreadySent?: boolean;
  eventId: string;
  status: WelcomeEmailStatus;
  message: string;
  subject?: string;
  error?: string;
}

export const DEFAULT_TEMPLATES: Record<WelcomeEmailType, WelcomeEmailTemplate> = {
  NEWSLETTER_WELCOME: {
    id: 'NEWSLETTER_WELCOME',
    type: 'NEWSLETTER_WELCOME',
    title: 'Newsletter Welcome',
    description: 'Dispatched automatically when a visitor subscribes to the newsletter',
    subject: 'Welcome to Stories Woven Through Time',
    body: `Hello {{firstName}},

Thank you for joining Stories Woven Through Time.

You've signed up to receive occasional updates about:
• New book releases and publication announcements
• Short stories and universe dispatches
• Author news and behind-the-scenes worldbuilding
• Companion soundtrack and audio releases

I'm glad to have you along for the journey.

— Matthew E. Messmer
Stories Woven Through Time`,
    updatedAt: '2026-10-01T00:00:00.000Z',
    updatedBy: 'author_default',
    updatedByName: 'Matthew E. Messmer',
    isCustomized: false,
  },
  ACCOUNT_AND_NEWSLETTER_WELCOME: {
    id: 'ACCOUNT_AND_NEWSLETTER_WELCOME',
    type: 'ACCOUNT_AND_NEWSLETTER_WELCOME',
    title: 'Account + Newsletter Welcome',
    description: 'Dispatched automatically when a reader registers a website account',
    subject: 'Welcome to Stories Woven Through Time',
    body: `Welcome, {{firstName}}.

Thank you for joining Stories Woven Through Time.

Your account has been created, and you've also been added to the author's newsletter so you can hear about new books, stories, releases, and updates.

You'll be able to explore the books, stories, worlds, and companion soundtrack vault on the site, while receiving occasional updates about new releases and creative projects.

We're glad you're here.

— Matthew E. Messmer
Stories Woven Through Time`,
    updatedAt: '2026-10-01T00:00:00.000Z',
    updatedBy: 'author_default',
    updatedByName: 'Matthew E. Messmer',
    isCustomized: false,
  },
};

// In-memory locking map to collapse concurrent double-submissions
const inFlightPromises = new Map<string, Promise<WelcomeEmailResult>>();

/**
 * Supported personalization variables
 */
export const ALLOWED_PERSONALIZATION_VARIABLES = [
  'firstName',
  'lastName',
  'username',
  'email',
  'accountUrl',
  'unsubscribeUrl',
] as const;

/**
 * Validates text for unknown personalization variables like {{firstNam}} or {{unknownVariable}}
 */
export function validateTemplateVariables(text: string): {
  valid: boolean;
  unknownVariables: string[];
} {
  const matches = text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  const unknown: string[] = [];
  const allowedSet = new Set<string>(
    ALLOWED_PERSONALIZATION_VARIABLES.map((v) => v.toLowerCase())
  );

  for (const match of matches) {
    const varName = match[1];
    if (!allowedSet.has(varName.toLowerCase())) {
      if (!unknown.includes(varName)) {
        unknown.push(varName);
      }
    }
  }

  return {
    valid: unknown.length === 0,
    unknownVariables: unknown,
  };
}

/**
 * Replaces personalization variables in template strings.
 * Supported variables:
 * - {{firstName}}
 * - {{lastName}}
 * - {{username}}
 * - {{email}}
 * - {{accountUrl}}
 * - {{unsubscribeUrl}}
 */
export function replaceVariables(
  templateText: string,
  variables: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    accountUrl?: string;
    unsubscribeUrl?: string;
  }
): string {
  const cleanFirst = variables.firstName?.trim() || 'Reader';
  const cleanLast = variables.lastName?.trim() || '';
  const cleanUser = variables.username?.trim() || cleanFirst;
  const cleanEmail = variables.email?.trim() || '';
  const accountUrl = variables.accountUrl || 'https://matthewemessmer.com/account';
  const unsubscribeUrl =
    variables.unsubscribeUrl ||
    `https://matthewemessmer.com/#unsubscribe?email=${encodeURIComponent(cleanEmail)}`;

  return templateText
    .replace(/\{\{\s*firstName\s*\}\}/gi, cleanFirst)
    .replace(/\{\{\s*lastName\s*\}\}/gi, cleanLast)
    .replace(/\{\{\s*username\s*\}\}/gi, cleanUser)
    .replace(/\{\{\s*email\s*\}\}/gi, cleanEmail)
    .replace(/\{\{\s*accountUrl\s*\}\}/gi, accountUrl)
    .replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, unsubscribeUrl);
}

class WelcomeEmailService {
  private events: EmailEvent[] = [];
  private templates: Record<WelcomeEmailType, WelcomeEmailTemplate> = { ...DEFAULT_TEMPLATES };
  private versions: Record<WelcomeEmailType, WelcomeTemplateVersion[]> = {
    NEWSLETTER_WELCOME: [],
    ACCOUNT_AND_NEWSLETTER_WELCOME: [],
  };
  private eventListeners: Set<(events: EmailEvent[]) => void> = new Set();
  private templateListeners: Set<
    (templates: Record<WelcomeEmailType, WelcomeEmailTemplate>) => void
  > = new Set();
  private versionListeners: Set<
    (versions: Record<WelcomeEmailType, WelcomeTemplateVersion[]>) => void
  > = new Set();
  private unsubscribeEventsSnapshot: (() => void) | null = null;
  private unsubscribeTemplatesSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    // 1. Load cached events
    try {
      const storedEvents = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }
    } catch {}

    // 2. Load cached templates
    try {
      const storedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (storedTemplates) {
        const parsed = JSON.parse(storedTemplates);
        this.templates = {
          NEWSLETTER_WELCOME: {
            ...DEFAULT_TEMPLATES.NEWSLETTER_WELCOME,
            ...(parsed.NEWSLETTER_WELCOME || {}),
          },
          ACCOUNT_AND_NEWSLETTER_WELCOME: {
            ...DEFAULT_TEMPLATES.ACCOUNT_AND_NEWSLETTER_WELCOME,
            ...(parsed.ACCOUNT_AND_NEWSLETTER_WELCOME || {}),
          },
        };
      }
    } catch {}

    // 3. Load cached versions
    try {
      const storedVersions = localStorage.getItem(STORAGE_KEY_VERSIONS);
      if (storedVersions) {
        const parsed = JSON.parse(storedVersions);
        this.versions = {
          NEWSLETTER_WELCOME: parsed.NEWSLETTER_WELCOME || [],
          ACCOUNT_AND_NEWSLETTER_WELCOME: parsed.ACCOUNT_AND_NEWSLETTER_WELCOME || [],
        };
      }
    } catch {}

    this.initRealtime();
    this.fetchVersionsFromFirestore();
  }

  private saveEventsLocally(): void {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.events.slice(0, 100)));
    } catch {}
  }

  private saveTemplatesLocally(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(this.templates));
    } catch {}
  }

  private saveVersionsLocally(): void {
    try {
      localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(this.versions));
    } catch {}
  }

  private notifyEvents(): void {
    const sorted = [...this.events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.eventListeners.forEach((fn) => {
      try {
        fn(sorted);
      } catch (err) {
        console.error('WelcomeEmailService event listener error:', err);
      }
    });
  }

  private notifyTemplates(): void {
    const copy = { ...this.templates };
    this.templateListeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('WelcomeEmailService template listener error:', err);
      }
    });
  }

  private notifyVersions(): void {
    const copy = {
      NEWSLETTER_WELCOME: [...this.versions.NEWSLETTER_WELCOME],
      ACCOUNT_AND_NEWSLETTER_WELCOME: [...this.versions.ACCOUNT_AND_NEWSLETTER_WELCOME],
    };
    this.versionListeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('WelcomeEmailService version listener error:', err);
      }
    });
  }

  public subscribeEvents(listener: (events: EmailEvent[]) => void): () => void {
    this.eventListeners.add(listener);
    const sorted = [...this.events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    listener(sorted);
    return () => this.eventListeners.delete(listener);
  }

  public subscribeTemplates(
    listener: (templates: Record<WelcomeEmailType, WelcomeEmailTemplate>) => void
  ): () => void {
    this.templateListeners.add(listener);
    listener({ ...this.templates });
    return () => this.templateListeners.delete(listener);
  }

  public subscribeVersions(
    listener: (versions: Record<WelcomeEmailType, WelcomeTemplateVersion[]>) => void
  ): () => void {
    this.versionListeners.add(listener);
    listener({
      NEWSLETTER_WELCOME: [...this.versions.NEWSLETTER_WELCOME],
      ACCOUNT_AND_NEWSLETTER_WELCOME: [...this.versions.ACCOUNT_AND_NEWSLETTER_WELCOME],
    });
    return () => this.versionListeners.delete(listener);
  }

  public getCachedEvents(): EmailEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getTemplates(): Record<WelcomeEmailType, WelcomeEmailTemplate> {
    return { ...this.templates };
  }

  public getTemplate(type: WelcomeEmailType): WelcomeEmailTemplate {
    return this.templates[type] || DEFAULT_TEMPLATES[type];
  }

  public getVersions(type: WelcomeEmailType): WelcomeTemplateVersion[] {
    return [...(this.versions[type] || [])].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  /**
   * Fetches the authoritative template from Firestore with real-time in-memory fallback.
   */
  public async getAuthoritativeTemplate(type: WelcomeEmailType): Promise<WelcomeEmailTemplate> {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, type);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const loaded: WelcomeEmailTemplate = {
          id: type,
          type,
          title: data.title || DEFAULT_TEMPLATES[type].title,
          description: data.description || DEFAULT_TEMPLATES[type].description,
          subject: data.subject || DEFAULT_TEMPLATES[type].subject,
          body: data.body || DEFAULT_TEMPLATES[type].body,
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || 'author',
          updatedByName: data.updatedByName || 'Matthew E. Messmer',
          isCustomized: data.isCustomized ?? true,
        };
        this.templates[type] = loaded;
        this.saveTemplatesLocally();
        this.notifyTemplates();
        return loaded;
      }
    } catch (err) {
      console.warn('Direct Firestore template fetch warning (using cache):', err);
    }
    return this.getTemplate(type);
  }

  /**
   * Saves an Author-edited welcome email template to Firestore.
   * All future welcome emails will immediately use this newly saved version.
   */
  public async saveTemplate(
    template: {
      type: WelcomeEmailType;
      subject: string;
      body: string;
    },
    userUid: string,
    userDisplayName?: string
  ): Promise<WelcomeEmailTemplate> {
    const type = template.type;
    const nowIso = new Date().toISOString();
    const updatedName = userDisplayName?.trim() || 'Matthew E. Messmer';

    const updated: WelcomeEmailTemplate = {
      id: type,
      type,
      title: DEFAULT_TEMPLATES[type].title,
      description: DEFAULT_TEMPLATES[type].description,
      subject: template.subject.trim(),
      body: template.body.trim(),
      updatedAt: nowIso,
      updatedBy: userUid,
      updatedByName: updatedName,
      isCustomized: true,
    };

    // 1. Authoritative Firestore write
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, type);
      await setDoc(
        docRef,
        {
          ...updated,
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save version to subcollection
      const versionId = `ver_${Date.now()}`;
      const versionRef = doc(db, TEMPLATES_COLLECTION, type, 'versions', versionId);
      const versionRecord: WelcomeTemplateVersion = {
        id: versionId,
        templateType: type,
        subject: updated.subject,
        body: updated.body,
        savedAt: nowIso,
        savedBy: userUid,
        savedByName: updatedName,
        isDefault: false,
      };
      await setDoc(versionRef, {
        ...versionRecord,
        serverCreatedAt: serverTimestamp(),
      });

      // Update local versions
      this.versions[type] = [versionRecord, ...(this.versions[type] || [])];
      this.saveVersionsLocally();
      this.notifyVersions();
    } catch (err) {
      console.warn('Failed to persist template to Firestore, saved locally:', err);
      // Still maintain version locally
      const versionId = `ver_local_${Date.now()}`;
      const versionRecord: WelcomeTemplateVersion = {
        id: versionId,
        templateType: type,
        subject: updated.subject,
        body: updated.body,
        savedAt: nowIso,
        savedBy: userUid,
        savedByName: updatedName,
        isDefault: false,
      };
      this.versions[type] = [versionRecord, ...(this.versions[type] || [])];
      this.saveVersionsLocally();
      this.notifyVersions();
    }

    // 2. Update memory & localStorage
    this.templates[type] = updated;
    this.saveTemplatesLocally();
    this.notifyTemplates();

    return updated;
  }

  /**
   * Fetches historical versions for both templates from Firestore.
   */
  public async fetchVersionsFromFirestore(): Promise<void> {
    const types: WelcomeEmailType[] = ['NEWSLETTER_WELCOME', 'ACCOUNT_AND_NEWSLETTER_WELCOME'];
    for (const t of types) {
      try {
        const versionsCol = collection(db, TEMPLATES_COLLECTION, t, 'versions');
        const q = query(versionsCol, orderBy('savedAt', 'desc'), limit(25));
        const snap = await getDocs(q);
        const list: WelcomeTemplateVersion[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            templateType: t,
            subject: data.subject,
            body: data.body,
            savedAt: data.savedAt || new Date().toISOString(),
            savedBy: data.savedBy || '',
            savedByName: data.savedByName || 'Matthew E. Messmer',
            isDefault: data.isDefault ?? false,
          });
        });
        if (list.length > 0) {
          this.versions[t] = list;
        }
      } catch (err) {
        // Fallback to local cache if offline or rules block
      }
    }
    this.saveVersionsLocally();
    this.notifyVersions();
  }

  /**
   * Restores a specific historical version of a welcome template.
   */
  public async restoreVersion(
    version: WelcomeTemplateVersion,
    userUid: string,
    userDisplayName?: string
  ): Promise<WelcomeEmailTemplate> {
    const type = version.templateType;
    const nowIso = new Date().toISOString();
    const updatedName = userDisplayName?.trim() || 'Matthew E. Messmer';

    const restored: WelcomeEmailTemplate = {
      id: type,
      type,
      title: DEFAULT_TEMPLATES[type].title,
      description: DEFAULT_TEMPLATES[type].description,
      subject: version.subject,
      body: version.body,
      updatedAt: nowIso,
      updatedBy: userUid,
      updatedByName: updatedName,
      isCustomized: true,
    };

    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, type);
      await setDoc(
        docRef,
        {
          ...restored,
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Record this restore action as a new version entry
      const versionId = `ver_${Date.now()}`;
      const versionRef = doc(db, TEMPLATES_COLLECTION, type, 'versions', versionId);
      const versionRecord: WelcomeTemplateVersion = {
        id: versionId,
        templateType: type,
        subject: restored.subject,
        body: restored.body,
        savedAt: nowIso,
        savedBy: userUid,
        savedByName: `${updatedName} (Restored from ${new Date(version.savedAt).toLocaleDateString()})`,
        isDefault: false,
      };
      await setDoc(versionRef, {
        ...versionRecord,
        serverCreatedAt: serverTimestamp(),
      });

      this.versions[type] = [versionRecord, ...(this.versions[type] || [])];
      this.saveVersionsLocally();
      this.notifyVersions();
    } catch (err) {
      console.warn('Failed to restore version to Firestore, restored locally:', err);
    }

    this.templates[type] = restored;
    this.saveTemplatesLocally();
    this.notifyTemplates();

    return restored;
  }

  /**
   * Restores a template back to the initial author default version in Firestore.
   */
  public async restoreDefaultTemplate(
    type: WelcomeEmailType,
    userUid: string,
    userDisplayName?: string
  ): Promise<WelcomeEmailTemplate> {
    const nowIso = new Date().toISOString();
    const updatedName = userDisplayName?.trim() || 'Matthew E. Messmer';
    const pristine = DEFAULT_TEMPLATES[type];

    const restored: WelcomeEmailTemplate = {
      ...pristine,
      updatedAt: nowIso,
      updatedBy: userUid,
      updatedByName: updatedName,
      isCustomized: false,
    };

    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, type);
      await setDoc(
        docRef,
        {
          ...restored,
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save default restore as a version entry too
      const versionId = `ver_def_${Date.now()}`;
      const versionRef = doc(db, TEMPLATES_COLLECTION, type, 'versions', versionId);
      const versionRecord: WelcomeTemplateVersion = {
        id: versionId,
        templateType: type,
        subject: pristine.subject,
        body: pristine.body,
        savedAt: nowIso,
        savedBy: userUid,
        savedByName: `${updatedName} (Default Restored)`,
        isDefault: true,
      };
      await setDoc(versionRef, {
        ...versionRecord,
        serverCreatedAt: serverTimestamp(),
      });

      this.versions[type] = [versionRecord, ...(this.versions[type] || [])];
      this.saveVersionsLocally();
      this.notifyVersions();
    } catch (err) {
      console.warn('Failed to restore template to Firestore, restored locally:', err);
    }

    this.templates[type] = restored;
    this.saveTemplatesLocally();
    this.notifyTemplates();

    return restored;
  }

  private initRealtime(): void {
    // 1. Real-time Events
    try {
      this.unsubscribeEventsSnapshot = onSnapshot(
        collection(db, EMAIL_EVENTS_COLLECTION),
        (snapshot) => {
          const list: EmailEvent[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              eventId: data.eventId || d.id,
              userId: data.userId,
              subscriberId: data.subscriberId || '',
              recipientEmail: data.recipientEmail || '',
              recipientName: data.recipientName || 'Reader',
              emailType: data.emailType as WelcomeEmailType,
              subject: data.subject || 'Welcome to Stories Woven Through Time',
              deliveryStatus: data.deliveryStatus as 'PENDING' | 'SENT' | 'FAILED',
              providerMessageId: data.providerMessageId,
              error: data.error,
              createdAt: data.createdAt || new Date().toISOString(),
              sentAt: data.sentAt,
              retryCount: data.retryCount || 0,
              triggerSource: data.triggerSource,
            });
          });

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.events = list;
          this.saveEventsLocally();
          this.notifyEvents();
        },
        (err) => {
          console.warn('Realtime email events warning:', err);
        }
      );
    } catch (e) {
      console.warn('WelcomeEmailService realtime events init warning:', e);
    }

    // 2. Real-time Templates
    try {
      this.unsubscribeTemplatesSnapshot = onSnapshot(
        collection(db, TEMPLATES_COLLECTION),
        (snapshot) => {
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              const data = d.data();
              const type = (data.type || d.id) as WelcomeEmailType;
              if (type in DEFAULT_TEMPLATES) {
                this.templates[type] = {
                  id: type,
                  type,
                  title: data.title || DEFAULT_TEMPLATES[type].title,
                  description: data.description || DEFAULT_TEMPLATES[type].description,
                  subject: data.subject || DEFAULT_TEMPLATES[type].subject,
                  body: data.body || DEFAULT_TEMPLATES[type].body,
                  updatedAt: data.updatedAt || new Date().toISOString(),
                  updatedBy: data.updatedBy || 'author',
                  updatedByName: data.updatedByName || 'Matthew E. Messmer',
                  isCustomized: data.isCustomized ?? true,
                };
              }
            });
            this.saveTemplatesLocally();
            this.notifyTemplates();
          }
        },
        (err) => {
          console.warn('Realtime templates warning:', err);
        }
      );
    } catch (e) {
      console.warn('WelcomeEmailService realtime templates init warning:', e);
    }
  }

  /**
   * Deterministic event identifier based on email and email type
   */
  public generateEventId(email: string, type: WelcomeEmailType): string {
    const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const typeKey = type === 'ACCOUNT_AND_NEWSLETTER_WELCOME' ? 'acct_nl' : 'nl';
    return `wevt_${clean}_${typeKey}`;
  }

  /**
   * Checks whether a qualifying welcome email has already been dispatched.
   */
  public async hasAlreadyReceivedWelcome(
    email: string,
    targetType?: WelcomeEmailType
  ): Promise<{ alreadySent: boolean; existingEvent?: EmailEvent }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fast in-memory check
    const localExisting = this.events.find(
      (ev) =>
        ev.recipientEmail.toLowerCase() === cleanEmail &&
        ev.deliveryStatus === 'SENT' &&
        (targetType ? ev.emailType === targetType : true)
    );
    if (localExisting) {
      return { alreadySent: true, existingEvent: localExisting };
    }

    // 2. Authoritative Firestore check in emailEvents
    try {
      const q = query(
        collection(db, EMAIL_EVENTS_COLLECTION),
        where('recipientEmail', '==', cleanEmail)
      );
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const ev = d.data() as EmailEvent;
        if (ev.deliveryStatus === 'SENT') {
          if (!targetType || ev.emailType === targetType) {
            return { alreadySent: true, existingEvent: { ...ev, id: d.id } };
          }
        }
      }
    } catch (err) {
      console.warn('Firestore existing welcome check fallback:', err);
    }

    return { alreadySent: false };
  }

  /**
   * Generates email subject, HTML, and Plaintext templates using the Author-saved
   * template or an explicit custom draft.
   */
  public generateTemplates(
    recipientInfo: {
      firstName?: string;
      lastName?: string;
      username?: string;
      email: string;
    },
    type: WelcomeEmailType,
    customTemplate?: {
      subject: string;
      body: string;
    }
  ): { subject: string; html: string; text: string } {
    const t = customTemplate || this.getTemplate(type);

    const cleanFirst = recipientInfo.firstName?.trim() || 'Reader';
    const cleanLast = recipientInfo.lastName?.trim() || '';
    const cleanUser = recipientInfo.username?.trim() || cleanFirst;
    const cleanEmail = recipientInfo.email.trim();

    const unsubscribeUrl = `https://matthewemessmer.com/#unsubscribe?email=${encodeURIComponent(cleanEmail)}`;
    const accountUrl = `https://matthewemessmer.com/account`;

    const variables = {
      firstName: cleanFirst,
      lastName: cleanLast,
      username: cleanUser,
      email: cleanEmail,
      accountUrl,
      unsubscribeUrl,
    };

    // Replace variables in subject and body
    const resolvedSubject = replaceVariables(t.subject, variables);
    const resolvedBodyText = replaceVariables(t.body, variables);

    // Convert body text to formatted HTML paragraphs and lists
    const paragraphs = resolvedBodyText.split(/\n\s*\n/);
    const formattedHtmlBody = paragraphs
      .map((p) => {
        const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return '';

        // Check if list
        if (lines.every((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))) {
          const listItems = lines
            .map(
              (l) =>
                `<li style="margin-bottom: 6px;">${escapeHtml(l.replace(/^[•\-\*]\s*/, ''))}</li>`
            )
            .join('');
          return `<ul style="margin: 0 0 20px 20px; padding: 0; color: #aba597; line-height: 1.8;">${listItems}</ul>`;
        }

        const joinedText = lines.map((l) => escapeHtml(l)).join('<br />');
        return `<p style="margin: 0 0 18px 0; line-height: 1.75; color: #d6d0c2;">${joinedText}</p>`;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(resolvedSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5efeb;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0c0d12; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #12141f; border: 1px solid #282b3d; border-radius: 12px; overflow: hidden; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background: linear-gradient(180deg, #181a28 0%, #12141f 100%); border-bottom: 1px solid #232638; text-align: center;">
              <div style="font-family: 'Cinzel', Georgia, serif; font-size: 11px; letter-spacing: 3px; color: #c5a059; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">
                Stories Woven Through Time
              </div>
              <h1 style="font-family: 'Cinzel', Georgia, serif; font-size: 24px; line-height: 1.3; color: #f5efeb; margin: 0; font-weight: bold;">
                ${escapeHtml(resolvedSubject)}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px; font-family: Georgia, serif; font-size: 15px; color: #d6d0c2;">
              ${formattedHtmlBody}

              <!-- Signature -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #202334;">
                <div style="font-family: Georgia, serif; font-size: 17px; color: #f5efeb; font-weight: bold;">
                  Matthew E. Messmer
                </div>
                <div style="font-family: 'Cinzel', Georgia, serif; font-size: 12px; color: #8e887a; letter-spacing: 1px; margin-top: 2px;">
                  Stories Woven Through Time
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #090a0f; border-top: 1px solid #1c1e2b; font-size: 11px; line-height: 1.6; color: #6e695d; text-align: center;">
              <p style="margin: 0 0 8px 0;">
                Recipient: <strong style="color: #aba597;">${escapeHtml(cleanEmail)}</strong>
              </p>
              <p style="margin: 0;">
                <a href="${accountUrl}" style="color: #c5a059; text-decoration: none; margin-right: 16px;">View Account Profile</a>
                <a href="${unsubscribeUrl}" style="color: #8e887a; text-decoration: underline;">Unsubscribe from newsletter</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `${resolvedBodyText}

--------------------------------------------------
Recipient: ${cleanEmail}
Account Profile: ${accountUrl}
To unsubscribe: ${unsubscribeUrl}`;

    return { subject: resolvedSubject, html, text };
  }

  /**
   * Main dispatch method: Idempotent and concurrency-safe.
   * ALWAYS retrieves and uses the Author-saved template from Firestore.
   */
  public async sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<WelcomeEmailResult> {
    const cleanEmail = params.email.trim().toLowerCase();
    const lockKey = `${cleanEmail}:${params.type}`;

    if (inFlightPromises.has(lockKey)) {
      return inFlightPromises.get(lockKey)!;
    }

    const promise = this.executeSendWelcomeEmail(params, cleanEmail);
    inFlightPromises.set(lockKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      inFlightPromises.delete(lockKey);
    }
  }

  private async executeSendWelcomeEmail(
    params: SendWelcomeEmailParams,
    cleanEmail: string
  ): Promise<WelcomeEmailResult> {
    const eventId = this.generateEventId(cleanEmail, params.type);

    // 1. Strict Idempotency Check
    const { alreadySent, existingEvent } = await this.hasAlreadyReceivedWelcome(
      cleanEmail,
      params.type
    );

    if (alreadySent && existingEvent) {
      console.info(
        `[WelcomeEmailService] Duplicate prevented for ${cleanEmail} (${params.type}). Already sent under event ${existingEvent.eventId}.`
      );
      return {
        success: true,
        alreadySent: true,
        eventId: existingEvent.eventId,
        status: 'SENT',
        subject: existingEvent.subject,
        message: 'Welcome email was already sent previously for this recipient.',
      };
    }

    // 2. Authoritative template retrieval (or author custom draft for test sending)
    const template = params.customTemplate
      ? {
          ...this.getTemplate(params.type),
          subject: params.customTemplate.subject,
          body: params.customTemplate.body,
        }
      : await this.getAuthoritativeTemplate(params.type);

    // 3. Format templates with recipient variables
    const templates = this.generateTemplates(
      {
        firstName: params.firstName,
        lastName: params.lastName,
        username: params.username,
        email: cleanEmail,
      },
      params.type,
      template
    );

    const nowIso = new Date().toISOString();

    // 4. Create email event record
    const eventRecord: EmailEvent = {
      id: eventId,
      eventId,
      userId: params.userId || undefined,
      subscriberId: params.subscriberId,
      recipientEmail: cleanEmail,
      recipientName: params.firstName?.trim() || 'Reader',
      emailType: params.type,
      subject: templates.subject,
      deliveryStatus: 'SENT',
      createdAt: nowIso,
      sentAt: nowIso,
      retryCount: 0,
      triggerSource: params.triggerSource || 'signup',
      providerMessageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    try {
      // 5. Queue into Firebase Trigger Email collection (/mail)
      const mailDocId = `mail_${eventId}_${Date.now()}`;
      const mailRef = doc(db, MAIL_COLLECTION, mailDocId);
      await setDoc(mailRef, {
        to: [cleanEmail],
        message: {
          subject: templates.subject,
          text: templates.text,
          html: templates.html,
        },
        eventId,
        type: params.type,
        createdAt: serverTimestamp(),
      });

      // 6. Record event in emailEvents
      const eventRef = doc(db, EMAIL_EVENTS_COLLECTION, eventId);
      await setDoc(
        eventRef,
        {
          ...eventRecord,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update local events cache
      const existingIdx = this.events.findIndex((e) => e.eventId === eventId);
      if (existingIdx >= 0) {
        this.events[existingIdx] = eventRecord;
      } else {
        this.events.unshift(eventRecord);
      }
      this.saveEventsLocally();
      this.notifyEvents();

      // 7. Update authoritative subscriber document
      if (params.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', params.subscriberId);
          await updateDoc(subRef, {
            welcomeEmailStatus: 'SENT',
            welcomeEmailType: params.type,
            welcomeEmailSentAt: nowIso,
            welcomeEmailEventId: eventId,
          });
        } catch (subErr) {
          console.warn('Subscriber record welcome status update warning:', subErr);
        }
      }

      return {
        success: true,
        alreadySent: false,
        eventId,
        status: 'SENT',
        subject: templates.subject,
        message: `Welcome email (${params.type}) successfully queued and sent to ${cleanEmail}.`,
      };
    } catch (err: any) {
      console.error('Welcome email dispatch error:', err);

      eventRecord.deliveryStatus = 'FAILED';
      eventRecord.error = err.message || 'Unknown email dispatch error';

      try {
        const eventRef = doc(db, EMAIL_EVENTS_COLLECTION, eventId);
        await setDoc(
          eventRef,
          {
            ...eventRecord,
            deliveryStatus: 'FAILED',
            error: eventRecord.error,
            serverUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        if (params.subscriberId) {
          const subRef = doc(db, 'subscribers', params.subscriberId);
          await updateDoc(subRef, {
            welcomeEmailStatus: 'FAILED',
            welcomeEmailError: eventRecord.error,
          }).catch(() => {});
        }
      } catch {}

      this.saveEventsLocally();
      this.notifyEvents();

      return {
        success: false,
        eventId,
        status: 'FAILED',
        error: eventRecord.error,
        message: `Welcome email failed to dispatch: ${eventRecord.error}`,
      };
    }
  }

  /**
   * Safe retry mechanism for failed welcome emails.
   */
  public async retryWelcomeEmail(eventId: string): Promise<WelcomeEmailResult> {
    const existing = this.events.find((e) => e.eventId === eventId);
    if (!existing) {
      throw new Error(`Email event not found for ID: ${eventId}`);
    }

    if (existing.deliveryStatus === 'SENT') {
      return {
        success: true,
        alreadySent: true,
        eventId,
        status: 'SENT',
        message: 'Email was already successfully sent. Duplicate sending prevented.',
      };
    }

    const template = await this.getAuthoritativeTemplate(existing.emailType);
    const templates = this.generateTemplates(
      {
        firstName: existing.recipientName,
        email: existing.recipientEmail,
      },
      existing.emailType,
      template
    );

    const nowIso = new Date().toISOString();
    const mailDocId = `mail_retry_${eventId}_${Date.now()}`;

    try {
      const mailRef = doc(db, MAIL_COLLECTION, mailDocId);
      await setDoc(mailRef, {
        to: [existing.recipientEmail],
        message: {
          subject: templates.subject,
          text: templates.text,
          html: templates.html,
        },
        eventId,
        type: existing.emailType,
        isRetry: true,
        createdAt: serverTimestamp(),
      });

      const providerMessageId = `msg_retry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const updatedRetryCount = (existing.retryCount || 0) + 1;

      existing.deliveryStatus = 'SENT';
      existing.sentAt = nowIso;
      existing.providerMessageId = providerMessageId;
      existing.error = undefined;
      existing.retryCount = updatedRetryCount;

      const eventRef = doc(db, EMAIL_EVENTS_COLLECTION, eventId);
      await setDoc(
        eventRef,
        {
          deliveryStatus: 'SENT',
          sentAt: nowIso,
          providerMessageId,
          error: null,
          retryCount: updatedRetryCount,
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (existing.subscriberId) {
        try {
          const subRef = doc(db, 'subscribers', existing.subscriberId);
          await updateDoc(subRef, {
            welcomeEmailStatus: 'SENT',
            welcomeEmailSentAt: nowIso,
            welcomeEmailEventId: eventId,
            welcomeEmailError: null,
          });
        } catch {}
      }

      this.saveEventsLocally();
      this.notifyEvents();

      return {
        success: true,
        eventId,
        status: 'SENT',
        subject: templates.subject,
        message: `Welcome email successfully retried and sent to ${existing.recipientEmail}.`,
      };
    } catch (err: any) {
      existing.error = err.message || 'Retry failed';
      this.saveEventsLocally();
      this.notifyEvents();

      return {
        success: false,
        eventId,
        status: 'FAILED',
        error: existing.error,
        message: `Retry attempt failed: ${existing.error}`,
      };
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const welcomeEmailService = new WelcomeEmailService();
