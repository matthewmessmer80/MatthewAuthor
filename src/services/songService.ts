import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Song, SongStatus, SongExternalLink } from '../types';
import { optimizeCoverImage } from '../utils/imageOptimizer';

const SONGS_COLLECTION = 'songs';
const STORAGE_KEY_SONGS = 'mem_songs_library_cache_v1';
const STORAGE_KEY_SEEDED = 'mem_songs_library_seeded_v1';
const STORAGE_KEY_DELETED = 'mem_songs_library_deleted_v1';

export const INITIAL_SONGS: Song[] = [
  {
    id: 'song-different-roads',
    title: 'Different Roads, Same Family',
    artist: 'Matthew E. Messmer',
    category: 'Original Country & Acoustic',
    description: 'An original track exploring shared roots, divergent paths, and family bonds.',
    lyrics: `Different roads, same dusty boots
Traveling far from where we grew our roots
Though miles and shadows stretch in between
We still remember the places we’ve seen

Take the high ridge, take the winding bend
Every trail leads home in the end.`,
    audioUrl: '',
    coverImage: '/images/different-roads-cover.jpg',
    releaseDate: '2026-05-12',
    status: 'Published',
    isPublic: true,
    featured: true,
    displayOrder: 1,
    tags: ['Original', 'Acoustic', 'Country', 'Family Roots'],
    externalLinks: [
      { platform: 'YouTube', url: 'https://youtube.com' },
      { platform: 'Spotify', url: 'https://spotify.com' },
    ],
    youtubeUrl: 'https://youtube.com',
    spotifyUrl: 'https://spotify.com',
    releaseNote: 'Original acoustic composition exploring how different paths converge around shared lineage.',
    createdAt: '2026-05-12T12:00:00Z',
    updatedAt: '2026-05-12T12:00:00Z',
    createdBy: 'Matthew E. Messmer',
  },
  {
    id: 'song-some-family-finds-you',
    title: 'Some Family Finds You',
    artist: 'Matthew E. Messmer',
    category: 'Dedication Track',
    description: 'A heartfelt tribute dedicated to my sister Dawn, celebrating resilience and reconnections.',
    dedication: 'Dedicated with love to my sister Dawn — celebrating unbreakable bonds across time and distance.',
    lyrics: `Some blood is born in the quiet light
Some stars appear in the darkest night
Through years of silence and wandering through
Some family finds you, and pulls you through.

To the sister who stood where the storm began
Holding the thread in an open hand.`,
    audioUrl: '',
    coverImage: '/images/some-family-finds-you-cover.jpg',
    releaseDate: '2026-08-20',
    status: 'Published',
    isPublic: true,
    featured: true,
    displayOrder: 2,
    tags: ['Dedication', 'Sister Dawn', 'Acoustic', 'Tribute'],
    externalLinks: [
      { platform: 'YouTube', url: 'https://youtube.com' },
      { platform: 'SoundCloud', url: 'https://soundcloud.com' },
    ],
    youtubeUrl: 'https://youtube.com',
    soundcloudUrl: 'https://soundcloud.com',
    releaseNote: 'Dedicated with love to my sister Dawn — celebrating unbreakable bonds across time and distance.',
    createdAt: '2026-08-20T12:00:00Z',
    updatedAt: '2026-08-20T12:00:00Z',
    createdBy: 'Matthew E. Messmer',
  },
];

type SongListener = (songs: Song[]) => void;

class SongService {
  private songs: Song[] = [];
  private listeners: Set<SongListener> = new Set();
  private initialized = false;
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.loadState();
  }

  private getDeletedIds(): Set<string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DELETED);
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
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
    } catch {}
  }

  private loadState(): void {
    const deletedIds = this.getDeletedIds();
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SONGS);
      const isSeeded = localStorage.getItem(STORAGE_KEY_SEEDED);

      if (stored !== null) {
        const parsed: Song[] = JSON.parse(stored);
        this.songs = parsed.filter((s) => !deletedIds.has(s.id));
      } else if (!isSeeded) {
        // Fresh initial visit: seed initial tracks
        this.songs = INITIAL_SONGS.filter((s) => !deletedIds.has(s.id));
        this.saveLocally();
      } else {
        this.songs = [];
      }
    } catch {
      this.songs = INITIAL_SONGS.filter((s) => !deletedIds.has(s.id));
    }

    this.initRealtime();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(this.songs));
      localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch {}
  }

  private notify(): void {
    const sorted = [...this.songs].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    this.listeners.forEach((listener) => {
      try {
        listener(sorted);
      } catch (err) {
        console.error('Song listener error:', err);
      }
    });
  }

  public subscribe(listener: SongListener): () => void {
    this.listeners.add(listener);
    const sorted = [...this.songs].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    listener(sorted);
    return () => this.listeners.delete(listener);
  }

  public getCachedSongs(): Song[] {
    return [...this.songs].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  private initRealtime(): void {
    try {
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, SONGS_COLLECTION),
        async (snapshot) => {
          this.initialized = true;
          const deletedIds = this.getDeletedIds();

          if (snapshot.empty) {
            // Check if seeded in Firestore before
            const isSeeded = localStorage.getItem(STORAGE_KEY_SEEDED);
            if (!isSeeded) {
              // Seed initial songs to Firestore once
              await this.seedInitialToFirestore();
              return;
            }
            // If already seeded in the past and empty, respect empty collection
            this.songs = [];
            this.saveLocally();
            this.notify();
            return;
          }

          const list: Song[] = [];
          snapshot.forEach((d) => {
            if (deletedIds.has(d.id)) return;
            const data = d.data() as Partial<Song>;
            list.push({
              id: d.id,
              title: data.title || 'Untitled Song',
              artist: data.artist || 'Matthew E. Messmer',
              category: data.category || 'Soundtrack Companion',
              description: data.description || '',
              lyrics: data.lyrics || '',
              dedication: data.dedication || '',
              audioUrl: data.audioUrl || '',
              coverImage: data.coverImage || '',
              releaseDate: data.releaseDate || '',
              status: (data.status as SongStatus) || 'Draft',
              isPublic: data.isPublic !== undefined ? data.isPublic : true,
              featured: !!data.featured,
              displayOrder: data.displayOrder !== undefined ? data.displayOrder : 99,
              tags: data.tags || [],
              externalLinks: data.externalLinks || [],
              youtubeUrl: data.youtubeUrl || '',
              spotifyUrl: data.spotifyUrl || '',
              soundcloudUrl: data.soundcloudUrl || '',
              bandcampUrl: data.bandcampUrl || '',
              releaseNote: data.dedication || data.releaseNote || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              createdBy: data.createdBy || 'Matthew E. Messmer',
              updatedBy: data.updatedBy,
            });
          });

          this.songs = list;
          this.saveLocally();
          this.notify();
        },
        (error) => {
          console.warn('Realtime songs subscription warning:', error);
        }
      );
    } catch (e) {
      console.warn('Failed to initialize realtime songs listener:', e);
    }
  }

  private async seedInitialToFirestore(): Promise<void> {
    try {
      const deletedIds = this.getDeletedIds();
      for (const song of INITIAL_SONGS) {
        if (deletedIds.has(song.id)) continue;
        const ref = doc(db, SONGS_COLLECTION, song.id);
        await setDoc(ref, song, { merge: true });
      }
      localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    } catch (e) {
      console.warn('Firestore songs initial seed fallback:', e);
    }
  }

  public async getSongs(): Promise<Song[]> {
    try {
      const snap = await getDocs(collection(db, SONGS_COLLECTION));
      const deletedIds = this.getDeletedIds();
      if (!snap.empty) {
        const list: Song[] = [];
        snap.forEach((d) => {
          if (deletedIds.has(d.id)) return;
          list.push({ ...(d.data() as Song), id: d.id });
        });
        list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        this.songs = list;
        this.saveLocally();
        this.notify();
        return list;
      }
    } catch (e) {
      // Return cached
    }
    return this.getCachedSongs();
  }

  public async saveSong(songData: Partial<Song>): Promise<Song> {
    const user = auth.currentUser;
    const isNew = !songData.id;
    const id = songData.id || `song-${Date.now()}`;
    const existing = this.songs.find((s) => s.id === id);

    // Build consolidated external links
    const externalLinks: SongExternalLink[] = [];
    const yt = songData.youtubeUrl !== undefined ? songData.youtubeUrl : existing?.youtubeUrl;
    const sp = songData.spotifyUrl !== undefined ? songData.spotifyUrl : existing?.spotifyUrl;
    const sc = songData.soundcloudUrl !== undefined ? songData.soundcloudUrl : existing?.soundcloudUrl;
    const bc = songData.bandcampUrl !== undefined ? songData.bandcampUrl : existing?.bandcampUrl;

    if (yt?.trim()) externalLinks.push({ platform: 'YouTube', url: yt.trim() });
    if (sp?.trim()) externalLinks.push({ platform: 'Spotify', url: sp.trim() });
    if (sc?.trim()) externalLinks.push({ platform: 'SoundCloud', url: sc.trim() });
    if (bc?.trim()) externalLinks.push({ platform: 'Bandcamp', url: bc.trim() });

    // Explicit requirement: newly created songs default to 'Draft' unless author explicitly chose
    const defaultStatus: SongStatus = isNew ? 'Draft' : (existing?.status || 'Draft');
    const finalStatus: SongStatus = songData.status || defaultStatus;

    const merged: Song = {
      id,
      title: songData.title?.trim() || existing?.title || 'Untitled Song',
      artist: songData.artist?.trim() || existing?.artist || 'Matthew E. Messmer',
      category: songData.category?.trim() || existing?.category || 'Soundtrack Companion',
      description: songData.description !== undefined ? songData.description : (existing?.description || ''),
      lyrics: songData.lyrics !== undefined ? songData.lyrics : (existing?.lyrics || ''),
      dedication: songData.dedication !== undefined ? songData.dedication : (existing?.dedication || ''),
      audioUrl: songData.audioUrl !== undefined ? songData.audioUrl : (existing?.audioUrl || ''),
      coverImage: songData.coverImage !== undefined ? songData.coverImage : (existing?.coverImage || ''),
      releaseDate: songData.releaseDate !== undefined ? songData.releaseDate : (existing?.releaseDate || ''),
      status: finalStatus,
      isPublic: songData.isPublic !== undefined ? songData.isPublic : (existing?.isPublic !== undefined ? existing.isPublic : true),
      featured: songData.featured !== undefined ? songData.featured : (existing?.featured || false),
      displayOrder:
        songData.displayOrder !== undefined
          ? songData.displayOrder
          : existing?.displayOrder !== undefined
          ? existing.displayOrder
          : this.songs.length + 1,
      tags: songData.tags !== undefined ? songData.tags : (existing?.tags || []),
      externalLinks: externalLinks.length > 0 ? externalLinks : (existing?.externalLinks || []),
      youtubeUrl: yt || '',
      spotifyUrl: sp || '',
      soundcloudUrl: sc || '',
      bandcampUrl: bc || '',
      releaseNote:
        songData.dedication !== undefined
          ? songData.dedication
          : (existing?.dedication || existing?.releaseNote || ''),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: existing?.createdBy || user?.email || 'Matthew E. Messmer',
      updatedBy: user?.email || 'Author',
    };

    // 1. Authoritative Firestore write
    try {
      const docRef = doc(db, SONGS_COLLECTION, id);
      await setDoc(docRef, { ...merged, serverUpdatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Firestore song write warning:', err);
    }

    // 2. Memory & local cache update
    const idx = this.songs.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.songs[idx] = merged;
    } else {
      this.songs.push(merged);
    }

    this.saveLocally();
    this.notify();
    return merged;
  }

  public async deleteSong(id: string): Promise<void> {
    this.addDeletedId(id);

    // 1. Authoritative Firestore deletion
    try {
      const docRef = doc(db, SONGS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore song deletion warning:', err);
    }

    // 2. Local state update
    this.songs = this.songs.filter((s) => s.id !== id);
    this.saveLocally();
    this.notify();
  }

  public async reorderSongs(reorderedIds: string[]): Promise<void> {
    const updatedSongs: Song[] = [];

    for (let index = 0; index < reorderedIds.length; index++) {
      const id = reorderedIds[index];
      const song = this.songs.find((s) => s.id === id);
      if (song) {
        const updated = { ...song, displayOrder: index + 1, updatedAt: new Date().toISOString() };
        updatedSongs.push(updated);

        // Update in Firestore in background
        try {
          const docRef = doc(db, SONGS_COLLECTION, id);
          setDoc(docRef, { displayOrder: index + 1 }, { merge: true });
        } catch {}
      }
    }

    this.songs = updatedSongs;
    this.saveLocally();
    this.notify();
  }

  public async uploadCoverArtwork(file: File): Promise<string> {
    try {
      const optimized = await optimizeCoverImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        format: 'image/webp',
      });
      return optimized.dataUrl;
    } catch {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  public async uploadAudioFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const songService = new SongService();
