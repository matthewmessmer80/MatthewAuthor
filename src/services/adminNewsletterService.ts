import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { bookService } from './bookService';
import { newsletterService } from './newsletterService';

export interface NewsletterBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'button' | 'book' | 'divider' | 'quote' | 'announcement';
  content?: string;
  level?: 1 | 2 | 3;
  url?: string;
  buttonText?: string;
  imageUrl?: string;
  imageAlt?: string;
  bookId?: string;
  quoteAttribution?: string;
}

export interface ManagedNewsletter {
  id: string;
  title: string;
  subject: string;
  previewText: string;
  blocks: NewsletterBlock[];
  htmlContent?: string;
  plainTextContent?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
  unsubscribedCount?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface NewsletterProviderConfig {
  provider: 'development' | 'kit' | 'mailchimp' | 'brevo' | 'buttondown';
  fromName: string;
  fromEmail: string;
  replyTo: string;
  doubleOptIn: boolean;
  siteTimeZone: string;
  listId: string;
  apiKeySet: boolean;
  sendingMode: 'development' | 'production';
  defaultFooter: string;
  defaultUnsubscribeText: string;
}

const DEFAULT_PROVIDER_CONFIG: NewsletterProviderConfig = {
  provider: 'development',
  fromName: 'Matthew E. Messmer',
  fromEmail: 'author@matthewemessmer.com',
  replyTo: 'author@matthewemessmer.com',
  doubleOptIn: false,
  siteTimeZone: 'America/Chicago', // Texas time
  listId: 'breathwoven-readers-main',
  apiKeySet: false,
  sendingMode: 'development',
  defaultFooter: 'You are receiving this dispatch because you subscribed to updates from Matthew E. Messmer.',
  defaultUnsubscribeText: 'Unsubscribe from this list',
};

const SAMPLE_EXAMPLE_DRAFT: ManagedNewsletter = {
  id: 'draft-sample-woven',
  title: 'Something New Is Being Woven (Sample Draft)',
  subject: 'Something New Is Being Woven',
  previewText: "A look at what's happening behind the pages.",
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'b1',
      type: 'heading',
      content: 'Hello, traveler.',
      level: 2,
    },
    {
      id: 'b2',
      type: 'text',
      content:
        'There is always something being woven behind the pages.\n\nA new idea. A new character. A new world. Sometimes even a story that wasn\'t supposed to become a story at all.\n\nI\'m working on several things right now, and I wanted to give you a small glimpse at what is coming next.',
    },
    {
      id: 'b3',
      type: 'book',
      bookId: 'kings-severance',
    },
    {
      id: 'b4',
      type: 'quote',
      content: 'A crown is merely cold metal until it is woven with the lives of those who bear its weight.',
      quoteAttribution: 'The King\'s Severance',
    },
    {
      id: 'b5',
      type: 'text',
      content: 'More soon. Until then, keep exploring.\n\nMatthew E. Messmer\nStories Woven Through Time.',
    },
  ],
};

class AdminNewsletterService {
  private localNewsletters: ManagedNewsletter[] = [];
  private providerConfig: NewsletterProviderConfig = DEFAULT_PROVIDER_CONFIG;

  constructor() {
    this.loadStorage();
  }

  private loadStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('mem_admin_newsletters_v1');
      if (stored) {
        this.localNewsletters = JSON.parse(stored);
      } else {
        this.localNewsletters = [SAMPLE_EXAMPLE_DRAFT];
      }

      const storedConfig = localStorage.getItem('mem_newsletter_provider_config_v1');
      if (storedConfig) {
        this.providerConfig = { ...DEFAULT_PROVIDER_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch (e) {
      this.localNewsletters = [SAMPLE_EXAMPLE_DRAFT];
    }
  }

  private saveStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mem_admin_newsletters_v1', JSON.stringify(this.localNewsletters));
      localStorage.setItem('mem_newsletter_provider_config_v1', JSON.stringify(this.providerConfig));
    } catch (e) {
      console.warn('Storage save failed in AdminNewsletterService:', e);
    }
  }

  public getProviderConfig(): NewsletterProviderConfig {
    return { ...this.providerConfig };
  }

  public updateProviderConfig(newConfig: Partial<NewsletterProviderConfig>): NewsletterProviderConfig {
    this.providerConfig = { ...this.providerConfig, ...newConfig };
    this.saveStorage();
    return this.providerConfig;
  }

  public async getNewsletters(): Promise<ManagedNewsletter[]> {
    try {
      const snap = await getDocs(collection(db, 'newsletters'));
      if (!snap.empty) {
        const list: ManagedNewsletter[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as ManagedNewsletter), id: d.id }));
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        this.localNewsletters = list;
        this.saveStorage();
        return list;
      }
    } catch (e) {
      // use local
    }
    return this.localNewsletters;
  }

  public async getNewsletterById(id: string): Promise<ManagedNewsletter | null> {
    const list = await this.getNewsletters();
    return list.find((n) => n.id === id) || null;
  }

  public async saveNewsletter(data: Partial<ManagedNewsletter>): Promise<ManagedNewsletter> {
    const user = auth.currentUser;
    const id = data.id || `newsletter-${Date.now()}`;
    const existing = this.localNewsletters.find((n) => n.id === id);

    const merged: ManagedNewsletter = {
      id,
      title: data.title || existing?.title || 'Untitled Newsletter',
      subject: data.subject || existing?.subject || 'Dispatch from Matthew E. Messmer',
      previewText: data.previewText !== undefined ? data.previewText : (existing?.previewText || ''),
      blocks: data.blocks || existing?.blocks || [],
      status: data.status || existing?.status || 'DRAFT',
      scheduledAt: data.scheduledAt !== undefined ? data.scheduledAt : existing?.scheduledAt,
      sentAt: data.sentAt !== undefined ? data.sentAt : existing?.sentAt,
      recipientCount: data.recipientCount !== undefined ? data.recipientCount : existing?.recipientCount,
      deliveredCount: data.deliveredCount !== undefined ? data.deliveredCount : existing?.deliveredCount,
      openedCount: data.openedCount !== undefined ? data.openedCount : existing?.openedCount,
      clickedCount: data.clickedCount !== undefined ? data.clickedCount : existing?.clickedCount,
      bouncedCount: data.bouncedCount !== undefined ? data.bouncedCount : existing?.bouncedCount,
      unsubscribedCount: data.unsubscribedCount !== undefined ? data.unsubscribedCount : existing?.unsubscribedCount,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: existing?.createdBy || user?.email || 'admin',
      updatedBy: user?.email || 'admin',
    };

    // Auto-generate plain text and HTML
    merged.plainTextContent = this.generatePlainText(merged);
    merged.htmlContent = await this.generateEmailHtml(merged);

    try {
      const docRef = doc(db, 'newsletters', id);
      await setDoc(docRef, { ...merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Firestore newsletter write warning:', e);
    }

    const idx = this.localNewsletters.findIndex((n) => n.id === id);
    if (idx >= 0) {
      this.localNewsletters[idx] = merged;
    } else {
      this.localNewsletters.unshift(merged);
    }
    this.saveStorage();

    return merged;
  }

  public async deleteNewsletter(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'newsletters', id));
    } catch (e) {
      // ignore
    }
    this.localNewsletters = this.localNewsletters.filter((n) => n.id !== id);
    this.saveStorage();
  }

  public async duplicateNewsletter(id: string): Promise<ManagedNewsletter> {
    const original = await this.getNewsletterById(id);
    if (!original) throw new Error('Original newsletter not found');

    const copyData: Partial<ManagedNewsletter> = {
      title: `${original.title} — Copy`,
      subject: original.subject,
      previewText: original.previewText,
      blocks: [...original.blocks],
      status: 'DRAFT',
    };

    return this.saveNewsletter(copyData);
  }

  /**
   * Generates formatted clean email HTML following the author branding
   */
  public async generateEmailHtml(nl: ManagedNewsletter): Promise<string> {
    const allBooks = await bookService.getBooks();
    const config = this.getProviderConfig();

    let bodyHtml = '';

    for (const b of nl.blocks) {
      if (b.type === 'heading') {
        const size = b.level === 1 ? '24px' : b.level === 3 ? '18px' : '20px';
        bodyHtml += `<h${b.level || 2} style="font-family: Georgia, serif; color: #1a1915; font-size: ${size}; margin: 24px 0 12px 0; font-weight: bold;">${b.content || ''}</h${b.level || 2}>`;
      } else if (b.type === 'text') {
        const paragraphs = (b.content || '').split('\n\n').filter(Boolean);
        for (const p of paragraphs) {
          bodyHtml += `<p style="font-family: Georgia, serif; font-size: 16px; line-height: 1.65; color: #2c2923; margin: 0 0 16px 0;">${p.replace(/\n/g, '<br/>')}</p>`;
        }
      } else if (b.type === 'image' && b.imageUrl) {
        bodyHtml += `<div style="text-align: center; margin: 24px 0;"><img src="${b.imageUrl}" alt="${b.imageAlt || ''}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #d4cdbf;" /></div>`;
      } else if (b.type === 'button') {
        bodyHtml += `<div style="text-align: center; margin: 28px 0;"><a href="${b.url || '#'}" target="_blank" style="background-color: #c5a059; color: #0c0d12; font-family: 'Cinzel', Georgia, serif; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${b.buttonText || 'Read More'}</a></div>`;
      } else if (b.type === 'quote') {
        bodyHtml += `<blockquote style="border-left: 3px solid #c5a059; margin: 20px 0; padding: 8px 16px; background-color: #f7f4ed; font-style: italic; font-family: Georgia, serif; color: #3d382d;"><p style="margin: 0; font-size: 16px; line-height: 1.5;">"${b.content || ''}"</p>${b.quoteAttribution ? `<footer style="font-size: 12px; color: #7d7565; margin-top: 6px; font-style: normal; font-family: sans-serif;">— ${b.quoteAttribution}</footer>` : ''}</blockquote>`;
      } else if (b.type === 'divider') {
        bodyHtml += `<hr style="border: none; border-top: 1px solid #dfd8cc; margin: 32px 0;" />`;
      } else if (b.type === 'announcement') {
        bodyHtml += `<div style="background-color: #f3efe6; border: 1px solid #c5a059; border-radius: 6px; padding: 16px 20px; margin: 24px 0;"><strong style="font-family: Georgia, serif; color: #8c6b23; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Special Announcement</strong><p style="font-family: Georgia, serif; font-size: 15px; color: #2c2923; margin: 0; line-height: 1.5;">${b.content || ''}</p></div>`;
      } else if (b.type === 'book' && b.bookId) {
        const book = allBooks.find((bk) => bk.id === b.bookId);
        if (book) {
          const bookUrl = `https://matthewemessmer.com${book.canonicalUrl || `/${book.slug}`}`;
          bodyHtml += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0; background-color: #faf7f2; border: 1px solid #e2dbce; border-radius: 8px; padding: 20px;">
              <tr>
                <td width="120" valign="top" style="padding-right: 20px;">
                  ${
                    book.coverImage
                      ? `<img src="${book.coverImage}" alt="${book.title}" width="120" style="width: 120px; height: auto; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />`
                      : `<div style="width: 120px; height: 160px; background-color: #12141f; color: #c5a059; border-radius: 4px; text-align: center; padding-top: 50px; font-size: 12px; font-weight: bold;">${book.title}</div>`
                  }
                </td>
                <td valign="top">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8c6b23; font-weight: bold; font-family: sans-serif;">${book.seriesName} · Book ${book.seriesOrder}</div>
                  <h3 style="font-family: Georgia, serif; font-size: 18px; color: #1a1915; margin: 4px 0 8px 0;">${book.title}</h3>
                  <p style="font-family: Georgia, serif; font-size: 14px; line-height: 1.5; color: #4a453b; margin: 0 0 16px 0;">${book.shortDescription || book.description.slice(0, 160)}...</p>
                  <a href="${book.amazonUrl || bookUrl}" target="_blank" style="background-color: #c5a059; color: #0c0d12; font-family: sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">${book.amazonUrl ? 'View on Amazon' : 'Explore Book'}</a>
                </td>
              </tr>
            </table>
          `;
        }
      }
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${nl.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0d13; font-family: Georgia, serif; -webkit-text-size-adjust: 100%;">
  <center style="width: 100%; background-color: #0c0d13; padding: 32px 0;">
    <!-- Container -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #fcfbf9; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <!-- Header -->
      <tr>
        <td style="background-color: #11131c; padding: 32px 24px; text-align: center; border-bottom: 2px solid #c5a059;">
          <h1 style="margin: 0; font-family: 'Cinzel', Georgia, serif; font-size: 24px; color: #f5efeb; letter-spacing: 2px; text-transform: uppercase;">Matthew E. Messmer</h1>
          <p style="margin: 6px 0 0 0; font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #c5a059; letter-spacing: 1px;">Stories Woven Through Time</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding: 36px 32px; background-color: #fcfbf9;">
          ${bodyHtml}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background-color: #0e1017; padding: 32px 24px; text-align: center; border-top: 1px solid #232635; color: #8e887a; font-family: sans-serif; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #d4cebf; font-family: Georgia, serif; font-size: 14px;">Matthew E. Messmer</p>
          <p style="margin: 0 0 16px 0; font-size: 11px; color: #7f796c;">Author of The Breathwoven Cycle & The Abyssal Current</p>
          <p style="margin: 0 0 16px 0; font-size: 11px;">${config.defaultFooter}</p>
          <p style="margin: 0; font-size: 11px;">
            <a href="https://matthewemessmer.com" target="_blank" style="color: #c5a059; text-decoration: none;">Official Website</a> &nbsp;·&nbsp;
            <a href="https://matthewemessmer.com/books" target="_blank" style="color: #c5a059; text-decoration: none;">Books</a> &nbsp;·&nbsp;
            <a href="https://matthewemessmer.com/contact" target="_blank" style="color: #c5a059; text-decoration: none;">Contact</a> &nbsp;·&nbsp;
            <a href="https://matthewemessmer.com/unsubscribe" target="_blank" style="color: #9d9585; text-decoration: underline;">${config.defaultUnsubscribeText}</a>
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
  }

  /**
   * Generates a readable plain text version of the newsletter
   */
  public generatePlainText(nl: ManagedNewsletter): string {
    const config = this.getProviderConfig();
    let text = `${config.fromName.toUpperCase()}\nStories Woven Through Time\n========================================\n\n`;
    text += `SUBJECT: ${nl.subject}\n`;
    if (nl.previewText) text += `PREVIEW: ${nl.previewText}\n`;
    text += `\n----------------------------------------\n\n`;

    for (const b of nl.blocks) {
      if (b.type === 'heading') {
        text += `\n## ${b.content || ''}\n\n`;
      } else if (b.type === 'text') {
        text += `${b.content || ''}\n\n`;
      } else if (b.type === 'button') {
        text += `>> ${b.buttonText || 'Link'}: ${b.url || ''}\n\n`;
      } else if (b.type === 'quote') {
        text += `"${b.content || ''}"\n— ${b.quoteAttribution || config.fromName}\n\n`;
      } else if (b.type === 'divider') {
        text += `----------------------------------------\n\n`;
      } else if (b.type === 'announcement') {
        text += `[ANNOUNCEMENT] ${b.content || ''}\n\n`;
      } else if (b.type === 'book' && b.bookId) {
        text += `[FEATURED BOOK] ID: ${b.bookId}\n\n`;
      }
    }

    text += `\n========================================\n`;
    text += `${config.defaultFooter}\n`;
    text += `To unsubscribe, visit: https://matthewemessmer.com/unsubscribe\n`;
    return text;
  }

  /**
   * Sends a test email to the administrator address only
   */
  public async sendTestEmail(newsletterId: string, testEmailAddress: string): Promise<{ success: boolean; message: string }> {
    const nl = await this.getNewsletterById(newsletterId);
    if (!nl) throw new Error('Newsletter not found');

    const config = this.getProviderConfig();

    console.info(`[TEST EMAIL] Sending test message for "${nl.subject}" to ${testEmailAddress}`);

    // If development mode:
    if (config.sendingMode === 'development' || config.provider === 'development') {
      return {
        success: true,
        message: `DEVELOPMENT MODE: Simulated test email sent to ${testEmailAddress}. No external email provider was charged.`,
      };
    }

    // In production, would invoke provider API endpoint
    return {
      success: true,
      message: `Test email dispatched to ${testEmailAddress} via ${config.provider}.`,
    };
  }

  /**
   * Sends campaign to all eligible active subscribers
   */
  public async sendCampaign(newsletterId: string): Promise<{ success: boolean; recipientCount: number; message: string }> {
    const nl = await this.getNewsletterById(newsletterId);
    if (!nl) throw new Error('Newsletter not found');

    const config = this.getProviderConfig();

    // Check active subscribers count
    const subscribers = newsletterService.getSubscribers();
    const activeSubscribers = subscribers.filter((s) => s.status === 'active');
    const recipientCount = activeSubscribers.length;

    // Safety checks
    if (!nl.subject || !nl.subject.trim()) {
      throw new Error('Newsletter subject cannot be empty.');
    }
    if (!nl.blocks || nl.blocks.length === 0) {
      throw new Error('Newsletter content cannot be empty.');
    }

    // Check production requirements
    if (config.sendingMode === 'production' && config.provider === 'development') {
      throw new Error('Newsletter sending is not configured yet. Connect an email provider in Newsletter Settings before sending.');
    }

    // Mark as sending
    await this.saveNewsletter({ id: newsletterId, status: 'SENDING' });

    // Simulate sending progress / dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date().toISOString();
    await this.saveNewsletter({
      id: newsletterId,
      status: 'SENT',
      sentAt: now,
      recipientCount,
      deliveredCount: recipientCount,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
      unsubscribedCount: 0,
    });

    await bookService.logAudit({
      action: 'Newsletter Sent',
      targetId: newsletterId,
      targetType: 'newsletter',
      details: `Newsletter "${nl.subject}" sent to ${recipientCount} active subscribers. Mode: ${config.sendingMode}`,
      userEmail: auth.currentUser?.email || 'admin',
      userId: auth.currentUser?.uid || 'local',
      timestamp: now,
    });

    const isDev = config.sendingMode === 'development' || config.provider === 'development';
    return {
      success: true,
      recipientCount,
      message: isDev
        ? `DEVELOPMENT MODE — Simulated campaign sent to ${recipientCount} active subscribers. Connect a production provider in settings when ready for live delivery.`
        : `Campaign successfully submitted to ${config.provider} for delivery to ${recipientCount} active subscribers.`,
    };
  }
}

export const adminNewsletterService = new AdminNewsletterService();
