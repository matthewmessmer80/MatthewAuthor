import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReaderMessage } from '../types';

const MESSAGES_COLLECTION = 'messages';
const LOCAL_STORAGE_MESSAGES_KEY = 'mmessmer_author_reader_messages';

const INITIAL_SEEDED_MESSAGES: ReaderMessage[] = [
  {
    id: 'msg-1',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@readerguild.org',
    inquiryType: 'reader',
    subject: 'Book Club Discussion Guide for The King\'s Severance',
    message: 'Hello Matthew, our speculative fiction book club in Austin is reading The King\'s Severance next month. Do you offer an official reading guide or list of discussion questions for the loom and tapestry motifs?',
    createdAt: '2024-09-21T14:15:00Z',
    status: 'unread',
  },
  {
    id: 'msg-2',
    name: 'Marcus Brody',
    email: 'marcus.brody@texashistorypress.com',
    inquiryType: 'event',
    subject: 'Virtual Author Guest Speaker Invitation - November',
    message: 'Greetings Matthew. We would love to host you for a 45-minute virtual conversation regarding the intersection of physical craft and worldbuilding in epic fantasy. Let us know your availability.',
    createdAt: '2024-09-18T09:30:00Z',
    status: 'read',
    replyNotes: 'Reviewing November writing milestones before confirming.',
  },
];

class MessageService {
  private messages: ReaderMessage[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      if (stored) {
        this.messages = JSON.parse(stored);
      } else {
        this.messages = [...INITIAL_SEEDED_MESSAGES];
        this.saveState();
      }
    } catch {
      this.messages = [...INITIAL_SEEDED_MESSAGES];
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(this.messages));
    } catch {}
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
      if (!snap.empty) {
        const firestoreList: ReaderMessage[] = [];
        snap.forEach((d) => firestoreList.push({ ...(d.data() as ReaderMessage), id: d.id }));
        firestoreList.forEach((fm) => {
          const idx = this.messages.findIndex((m) => m.id === fm.id);
          if (idx >= 0) this.messages[idx] = fm;
          else this.messages.push(fm);
        });
        this.saveState();
      }
    } catch {}

    return [...this.messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAsRead(messageId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg && msg.status === 'unread') {
      msg.status = 'read';
      this.saveState();
      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), { status: 'read' });
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
      this.saveState();

      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), {
          status: 'replied',
          replyNotes,
          repliedBy,
          repliedAt: msg.repliedAt,
        });
      } catch {}
    }
  }

  async archiveMessage(messageId: string): Promise<void> {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = 'archived';
      this.saveState();
      try {
        await updateDoc(doc(db, MESSAGES_COLLECTION, messageId), { status: 'archived' });
      } catch {}
    }
  }
}

export const messageService = new MessageService();
