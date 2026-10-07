import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReaderMessage } from '../types';

const MESSAGES_COLLECTION = 'messages';
const LOCAL_STORAGE_MESSAGES_KEY = 'mmessmer_author_reader_messages';

export type MessageListener = (messages: ReaderMessage[]) => void;

class MessageService {
  private messages: ReaderMessage[] = [];
  private listeners: Set<MessageListener> = new Set();
  private unsubscribeSnapshot: Unsubscribe | null = null;
  private hasInitializedRealtime = false;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy hardcoded test mock items
          this.messages = parsed.filter(
            (m: any) => m && m.id !== 'msg-1' && m.id !== 'msg-2'
          );
        } else {
          this.messages = [];
        }
      } else {
        this.messages = [];
      }
    } catch {
      this.messages = [];
    }

    this.saveState();
    this.initRealtime();
  }

  private saveState(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(this.messages));
    } catch {}
  }

  private notify(): void {
    const copy = [...this.messages];
    this.listeners.forEach((fn) => {
      try {
        fn(copy);
      } catch (err) {
        console.error('Error notifying message listener:', err);
      }
    });
  }

  subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current cached state
    listener([...this.messages]);
    if (!this.hasInitializedRealtime) {
      this.initRealtime();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  initRealtime(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, MESSAGES_COLLECTION),
        (snap) => {
          this.hasInitializedRealtime = true;
          const firestoreList: ReaderMessage[] = [];
          snap.forEach((d) => {
            const data = d.data();
            firestoreList.push({
              ...(data as ReaderMessage),
              id: d.id,
              status: (data.status as any) || (data.isRead === false ? 'unread' : 'read'),
            });
          });

          firestoreList.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          this.messages = firestoreList;
          this.saveState();
          this.notify();
        },
        (err) => {
          // Log permission restrictions when not authenticated as editor/author
          console.warn('Realtime messages listener unavailable (or permission restricted):', err.message);
        }
      );
    } catch (err) {
      console.warn('Could not initialize realtime messages listener:', err);
    }
  }

  async sendMessage(data: {
    name: string;
    email: string;
    inquiryType: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; error?: string }> {
    const newMessage: ReaderMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      inquiryType: data.inquiryType || 'reader',
      subject: data.subject.trim() || 'Reader Correspondence',
      message: data.message.trim(),
      createdAt: new Date().toISOString(),
      status: 'unread',
    };

    this.messages.unshift(newMessage);
    this.saveState();
    this.notify();

    try {
      await setDoc(doc(db, MESSAGES_COLLECTION, newMessage.id), newMessage);
    } catch (err) {
      console.warn('Could not save message to Firestore (saved locally):', err);
    }

    return { success: true };
  }

  async getMessages(): Promise<ReaderMessage[]> {
    try {
      const snap = await getDocs(collection(db, MESSAGES_COLLECTION));
      const firestoreList: ReaderMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        firestoreList.push({
          ...(data as ReaderMessage),
          id: d.id,
          status: (data.status as any) || (data.isRead === false ? 'unread' : 'read'),
        });
      });
      firestoreList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.messages = firestoreList;
      this.saveState();
      this.notify();
    } catch (err) {
      console.warn('Could not fetch messages from Firestore (using cached state):', err);
    }

    return [...this.messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUnreadCount(): number {
    return this.messages.filter((m) => {
      if (m.status === 'archived') return false;
      return m.status === 'unread' || (m as any).isRead === false;
    }).length;
  }

  async markAsRead(messageId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg && (msg.status === 'unread' || (msg as any).isRead === false)) {
      msg.status = 'read';
      (msg as any).isRead = true;
      this.saveState();
      this.notify();
      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
          status: 'read',
          isRead: true,
        });
      } catch {}
    }
  }

  async replyToMessage(
    messageId: string,
    replyNotes: string,
    repliedBy: string
  ): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = 'replied';
      msg.replyNotes = replyNotes;
      msg.repliedBy = repliedBy;
      msg.repliedAt = new Date().toISOString();
      (msg as any).isRead = true;
      this.saveState();
      this.notify();

      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
          status: 'replied',
          replyNotes,
          repliedBy,
          repliedAt: msg.repliedAt,
          isRead: true,
        });
      } catch {}
    }
  }

  async archiveMessage(messageId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = 'archived';
      this.saveState();
      this.notify();
      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), { status: 'archived' });
      } catch {}
    }
  }

  /**
   * Permanently deletes a reader message from Firestore and local cache.
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      this.messages.splice(idx, 1);
      this.saveState();
      this.notify();
    }

    try {
      await deleteDoc(doc(db, MESSAGES_COLLECTION, messageId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete message from Firestore';
      console.warn('Could not delete message from Firestore (removed locally):', msg);
    }

    return { success: true };
  }
}

export const messageService = new MessageService();

