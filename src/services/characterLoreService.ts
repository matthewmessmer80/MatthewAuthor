import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';
import { Character, LoreEntry, PublicationState } from '../types';
import { optimizeCoverImage } from '../utils/imageOptimizer';

const CHARACTERS_COLLECTION = 'characters';
const LORE_COLLECTION = 'lore';

const LOCAL_STORAGE_CHARACTERS_KEY = 'mmessmer_author_characters_v2';
const LOCAL_STORAGE_LORE_KEY = 'mmessmer_author_lore_v2';
const LOCAL_STORAGE_LORE_CATEGORIES_KEY = 'mmessmer_author_lore_categories_v2';

export const DEFAULT_LORE_CATEGORIES = [
  'Locations',
  'History',
  'Cultures',
  'Magic',
  'Technology',
  'Organizations',
  'Artifacts',
  'Creatures',
  'Events',
  'Other',
];

const SEEDED_CHARACTERS: Character[] = [
  {
    id: 'char-lysander-vane',
    name: 'Lysander Vane',
    title: 'Crown Sentinel / Threadbearer',
    role: 'Crown Sentinel / Threadbearer',
    shortDescription: 'A disciplined sworn guardian who discovers the golden strand binding the emperor’s lineage has fractured, plunging the Archipelago into silent metaphysical war.',
    biography: 'Lysander Vane served fifteen winters in the High Spire of Val-Mora before witnessing the first unweaving. Bound by ancestral oath to protect the Imperial thread, he carries the ceremonial twin loom-daggers of the Sunken Needle.',
    appearance: 'Tall, weathered, clad in silver-threaded storm-gray gambeson with indigo mantle. Deep calloused fingers from drawing resonant loom strings.',
    personality: 'Stoic, observant, fiercely loyal to people rather than hollow crowns.',
    abilities: 'Resonance sight, thread-attunement, close-quarters duel craft.',
    affiliations: 'High Spire of Val-Mora, Crown Guard',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    imageAltText: 'Portrait of Lysander Vane, Sentinel of Val-Mora',
    seriesId: 'breathwoven-cycle',
    bookIds: ['kings-severance', 'blue-moon-child'],
    tags: ['Sentinel', 'Val-Mora', 'Threadbearer', 'Protagonist'],
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'lysander-vane',
    createdAt: new Date(2025, 0, 10).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
  {
    id: 'char-ilara-needle',
    name: 'Ilara of the Sunken Needle',
    title: 'Loom Artisan & Fugitive',
    role: 'Loom Artisan & Fugitive',
    shortDescription: 'Born with silver strands dancing behind her pupils, she possesses the forbidden craft to re-stitch torn memories and mend fractures in the metaphysical veil.',
    biography: 'Cast out from the orthodox Guild of Spindlewrights after refusing to seal the sorrow of the reef clans, Ilara lives in the tidal caves beneath the southern shoals.',
    appearance: 'Slender, swift, with eyes shifting from sea-glass gray to shimmering silver under moonlight. Wears oiled leather wraps and coral-carved shuttles at her waist.',
    personality: 'Inquisitive, empathetic, unyielding against imperial dogma.',
    abilities: 'Memory re-weaving, temporal fracture detection, fiber mending.',
    affiliations: 'Weavers of the Outer Reefs',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    imageAltText: 'Ilara of the Sunken Needle holding a weaver shuttle',
    seriesId: 'breathwoven-cycle',
    bookIds: ['weavers-lullaby', 'kings-severance'],
    tags: ['Weaver', 'Outcast', 'Artisan', 'Metaphysics'],
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'ilara-sunken-needle',
    createdAt: new Date(2025, 1, 14).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
  {
    id: 'char-captain-marcus-miller',
    name: 'Captain Marcus Miller',
    title: 'Expedition Commander',
    role: 'Expedition Commander',
    shortDescription: 'A retired Navy Master-at-Arms whose oceanic charts uncover an anomalous deep-sea current where hydrostatic pressure compresses temporal flow.',
    biography: 'Having logged forty years upon surface frigates and abyssal bathyscaphes, Marcus Miller accepted a classified commission to steer the Tiefenland into the uncharted Marianis Rift.',
    appearance: 'Broad-shouldered, silver-bearded, scarred knuckles, dressed in heavy naval woolens and brass chronometer harness.',
    personality: 'Methodical, calm under catastrophic pressure, protective of his crew.',
    abilities: 'Deep oceanic navigation, sub-surface acoustics, command leadership.',
    affiliations: 'Nadir Research Vessel ORP Tiefenland',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    imageAltText: 'Captain Marcus Miller in naval commander attire',
    seriesId: 'abyssal-current',
    bookIds: ['abyssal-current'],
    tags: ['Commander', 'Submariner', 'Abyssal Current', 'Navy'],
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'captain-marcus-miller',
    createdAt: new Date(2025, 2, 20).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
];

const SEEDED_LORE: LoreEntry[] = [
  {
    id: 'lore-breathwoven-thread',
    title: 'The Breathwoven Thread',
    description: 'The invisible metaphysical filament connecting life, lineage, and emotional memory across Val-Mora.',
    content: 'The invisible metaphysical filament connecting life, lineage, and emotional memory across the archipelago of Val-Mora. When severed, all societal covenants bound to that bond instantly decay, leaving memories scattered like cut wool upon water. The art of thread-spinning was first chronicled during the First Spindle Epoch.',
    category: 'Magic',
    tags: ['Metaphysics', 'Threads', 'Val-Mora', 'Canon'],
    relatedSeriesId: 'breathwoven-cycle',
    relatedBookIds: ['kings-severance', 'blue-moon-child', 'weavers-lullaby'],
    relatedCharacterIds: ['char-lysander-vane', 'char-ilara-needle'],
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'the-breathwoven-thread',
    createdAt: new Date(2025, 0, 5).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
  {
    id: 'lore-archipelago-spires',
    title: 'Archipelago of Spires',
    description: 'A vast ring of vertical limestone needles rising hundreds of cubits from mist-shrouded oceans.',
    content: 'A vast ring of vertical limestone needles rising hundreds of cubits from mist-shrouded oceans, linked only by high suspension bridges and woven aerial cable cars. The lower foundations are hollowed out into labyrinthine sea-docks, while the upper peaks host the skyward observatories of the Imperial Court.',
    category: 'Locations',
    tags: ['Geography', 'Archipelago', 'Val-Mora', 'Worldbuilding'],
    relatedSeriesId: 'breathwoven-cycle',
    relatedBookIds: ['kings-severance', 'weavers-lullaby'],
    relatedCharacterIds: ['char-lysander-vane'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200',
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'archipelago-of-spires',
    createdAt: new Date(2025, 0, 15).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
  {
    id: 'lore-compressed-depths',
    title: 'The Compressed Depths',
    description: 'At depths exceeding four thousand fathoms, time dilates downward in the abyssal trenches.',
    content: 'At depths exceeding four thousand fathoms, hydrostatic pressure compresses not merely matter, but temporal flow itself. Submariners descending into the abyssal trenches experience minutes while decades pass on the surface. Navigation through the deep currents requires continuous chronometer recalibration and temporal alloy plating.',
    category: 'Technology',
    tags: ['Naval Tech', 'Temporal Flow', 'Deep Sea', 'Currents'],
    relatedSeriesId: 'abyssal-current',
    relatedBookIds: ['abyssal-current'],
    relatedCharacterIds: ['char-captain-marcus-miller'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'the-compressed-depths',
    createdAt: new Date(2025, 1, 1).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
  {
    id: 'lore-ignis-kor',
    title: 'Ignis-Kor: The Subterranean Forge',
    description: 'An ancient geothermal foundry carved directly into basalt seabed vents.',
    content: 'An ancient geothermal foundry carved directly into basalt seabed vents, capable of casting temporal alloys resistant to deep oceanic compression. Built centuries before surface civilization mapped the seafloor, its roaring magma bellows remain perpetually maintained by an enigmatic order of bathymetric smiths.',
    category: 'Locations',
    tags: ['Forge', 'Geothermal', 'Basalt', 'Alloy'],
    relatedSeriesId: 'abyssal-current',
    relatedBookIds: ['ignis-kor', 'abyssal-current'],
    relatedCharacterIds: ['char-captain-marcus-miller'],
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
    publicationState: 'PUBLIC' as PublicationState,
    slug: 'ignis-kor-subterranean-forge',
    createdAt: new Date(2025, 1, 20).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system-seed',
  },
];

type CharacterListener = (characters: Character[]) => void;
type LoreListener = (lore: LoreEntry[]) => void;

class CharacterLoreService {
  private characters: Character[] = [];
  private lore: LoreEntry[] = [];
  private loreCategories: string[] = [...DEFAULT_LORE_CATEGORIES];

  private characterListeners: Set<CharacterListener> = new Set();
  private loreListeners: Set<LoreListener> = new Set();
  private initialized = false;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const storedCategories = localStorage.getItem(LOCAL_STORAGE_LORE_CATEGORIES_KEY);
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed)) {
          this.loreCategories = Array.from(new Set([...DEFAULT_LORE_CATEGORIES, ...parsed]));
        }
      }

      const storedChars = localStorage.getItem(LOCAL_STORAGE_CHARACTERS_KEY);
      if (storedChars) {
        this.characters = JSON.parse(storedChars);
      } else {
        this.characters = [...SEEDED_CHARACTERS];
      }

      const storedLore = localStorage.getItem(LOCAL_STORAGE_LORE_KEY);
      if (storedLore) {
        this.lore = JSON.parse(storedLore);
      } else {
        this.lore = [...SEEDED_LORE];
      }
      this.saveLocally();
    } catch {
      this.characters = [...SEEDED_CHARACTERS];
      this.lore = [...SEEDED_LORE];
    }

    this.initRealtime();
  }

  private saveLocally(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHARACTERS_KEY, JSON.stringify(this.characters));
      localStorage.setItem(LOCAL_STORAGE_LORE_KEY, JSON.stringify(this.lore));
      localStorage.setItem(LOCAL_STORAGE_LORE_CATEGORIES_KEY, JSON.stringify(this.loreCategories));
    } catch {}
  }

  private notifyCharacters(): void {
    const copy = [...this.characters];
    this.characterListeners.forEach((fn) => fn(copy));
  }

  private notifyLore(): void {
    const copy = [...this.lore];
    this.loreListeners.forEach((fn) => fn(copy));
  }

  subscribeCharacters(listener: CharacterListener): () => void {
    this.characterListeners.add(listener);
    listener([...this.characters]);
    return () => this.characterListeners.delete(listener);
  }

  subscribeLore(listener: LoreListener): () => void {
    this.loreListeners.add(listener);
    listener([...this.lore]);
    return () => this.loreListeners.delete(listener);
  }

  private initRealtime(): void {
    // Characters listener
    try {
      onSnapshot(
        collection(db, CHARACTERS_COLLECTION),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Character[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Partial<Character>;
              list.push({
                id: d.id,
                name: data.name || 'Unnamed Character',
                title: data.title || data.role,
                role: data.role || data.title,
                shortDescription: data.shortDescription || '',
                biography: data.biography,
                appearance: data.appearance,
                personality: data.personality,
                abilities: data.abilities,
                affiliations: data.affiliations,
                imageUrl: data.imageUrl,
                imageAltText: data.imageAltText,
                seriesId: data.seriesId,
                bookIds: Array.isArray(data.bookIds) ? data.bookIds : [],
                tags: Array.isArray(data.tags) ? data.tags : [],
                publicationState: (data.publicationState as PublicationState) || 'PUBLIC',
                slug: data.slug || d.id,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
              });
            });
            list.sort((a, b) => a.name.localeCompare(b.name));
            this.characters = list;
            this.saveLocally();
            this.notifyCharacters();
          } else {
            this.characters = [];
            this.saveLocally();
            this.notifyCharacters();
          }
        },
        () => {
          this.fetchInitialCharactersOnce();
        }
      );
    } catch {
      this.fetchInitialCharactersOnce();
    }

    // Lore listener
    try {
      onSnapshot(
        collection(db, LORE_COLLECTION),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: LoreEntry[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Partial<LoreEntry>;
              list.push({
                id: d.id,
                title: data.title || 'Untitled Lore',
                description: data.description || '',
                content: data.content || '',
                category: data.category || 'History',
                tags: Array.isArray(data.tags) ? data.tags : [],
                relatedSeriesId: data.relatedSeriesId,
                relatedBookIds: Array.isArray(data.relatedBookIds) ? data.relatedBookIds : [],
                relatedCharacterIds: Array.isArray(data.relatedCharacterIds) ? data.relatedCharacterIds : [],
                imageUrl: data.imageUrl,
                publicationState: (data.publicationState as PublicationState) || 'PUBLIC',
                slug: data.slug || d.id,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
              });
            });
            list.sort((a, b) => a.title.localeCompare(b.title));
            this.lore = list;
            this.saveLocally();
            this.notifyLore();
          } else {
            this.lore = [];
            this.saveLocally();
            this.notifyLore();
          }
        },
        () => {
          this.fetchInitialLoreOnce();
        }
      );
    } catch {
      this.fetchInitialLoreOnce();
    }
  }

  private async fetchInitialCharactersOnce(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, CHARACTERS_COLLECTION));
      if (!snap.empty) {
        const list: Character[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Character), id: d.id }));
        this.characters = list;
        this.saveLocally();
        this.notifyCharacters();
      } else {
        this.characters = [];
        this.saveLocally();
        this.notifyCharacters();
      }
    } catch {}
  }

  private async fetchInitialLoreOnce(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, LORE_COLLECTION));
      if (!snap.empty) {
        const list: LoreEntry[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as LoreEntry), id: d.id }));
        this.lore = list;
        this.saveLocally();
        this.notifyLore();
      } else {
        this.lore = [];
        this.saveLocally();
        this.notifyLore();
      }
    } catch {}
  }

  private async seedInitialCharacters(): Promise<void> {
    this.initialized = true;
    for (const char of SEEDED_CHARACTERS) {
      try {
        await setDoc(doc(db, CHARACTERS_COLLECTION, char.id), char);
      } catch {}
    }
  }

  private async seedInitialLore(): Promise<void> {
    for (const l of SEEDED_LORE) {
      try {
        await setDoc(doc(db, LORE_COLLECTION, l.id), l);
      } catch {}
    }
  }

  // ==================== CHARACTERS CRUD ====================

  async getAllCharacters(): Promise<Character[]> {
    return [...this.characters];
  }

  async getPublicCharacters(): Promise<Character[]> {
    return this.characters.filter((c) => {
      const state = (c.publicationState || 'PUBLIC').toUpperCase();
      return state === 'PUBLIC' || state === 'TEASER';
    });
  }

  getCharacterById(id: string): Character | undefined {
    return this.characters.find((c) => c.id === id);
  }

  async saveCharacter(
    char: Partial<Character> & { name: string },
    isAuthor: boolean,
    isEditor: boolean = false,
    userProfile?: { name?: string; email?: string }
  ): Promise<{ success: boolean; character?: Character; error?: string }> {
    const isNew = !char.id || !this.characters.some((c) => c.id === char.id);

    if (isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You must be an Author or Editor to create characters.' };
    }

    if (!isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You do not have permissions to modify characters.' };
    }

    if (!char.name || !char.name.trim()) {
      return { success: false, error: 'Character name is required.' };
    }

    const existing = !isNew ? this.characters.find((c) => c.id === char.id) : null;
    const nowIso = new Date().toISOString();
    const id = existing ? existing.id : (char.id || `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const slug = char.slug?.trim() || char.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const savedCharacter: Character = {
      id,
      name: char.name.trim(),
      title: char.title?.trim() || char.role?.trim() || '',
      role: char.role?.trim() || char.title?.trim() || '',
      shortDescription: char.shortDescription?.trim() || '',
      biography: char.biography?.trim() || '',
      appearance: char.appearance?.trim() || '',
      personality: char.personality?.trim() || '',
      abilities: char.abilities?.trim() || '',
      affiliations: char.affiliations?.trim() || '',
      imageUrl: char.imageUrl?.trim() || undefined,
      imageAltText: char.imageAltText?.trim() || `${char.name.trim()} portrait`,
      seriesId: char.seriesId || undefined,
      bookIds: Array.isArray(char.bookIds) ? char.bookIds : [],
      tags: Array.isArray(char.tags) ? char.tags : [],
      publicationState: char.publicationState || 'PUBLIC',
      slug,
      seoTitle: char.seoTitle?.trim() || `${char.name.trim()} | Character Profile`,
      seoDescription: char.seoDescription?.trim() || char.shortDescription?.trim() || '',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      createdBy: existing?.createdBy || userProfile?.email || 'author',
      updatedBy: userProfile?.email || (isAuthor ? 'author' : 'editor'),
    };

    const idx = this.characters.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.characters[idx] = savedCharacter;
    } else {
      this.characters.unshift(savedCharacter);
    }

    this.saveLocally();
    this.notifyCharacters();

    // Persist in-place to Firestore
    try {
      await setDoc(doc(db, CHARACTERS_COLLECTION, id), savedCharacter);
    } catch (error) {
      console.warn('Firestore setDoc notice for characters:', error);
      try {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `characters/${id}`);
      } catch (e) {}
    }

    return { success: true, character: savedCharacter };
  }

  async deleteCharacter(
    characterId: string,
    isAuthor: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Deleting characters is strictly restricted to the Author.',
      };
    }

    const idx = this.characters.findIndex((c) => c.id === characterId);
    if (idx === -1) {
      return { success: false, error: 'Character not found.' };
    }

    this.characters.splice(idx, 1);
    this.saveLocally();
    this.notifyCharacters();

    try {
      await deleteDoc(doc(db, CHARACTERS_COLLECTION, characterId));
    } catch (error) {
      console.warn('Firestore deleteDoc notice for characters:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `characters/${characterId}`);
      } catch (e) {}
    }

    return { success: true };
  }

  // ==================== LORE CRUD ====================

  getLoreCategories(): string[] {
    return [...this.loreCategories];
  }

  addLoreCategory(catName: string): void {
    const clean = catName.trim();
    if (clean && !this.loreCategories.includes(clean)) {
      this.loreCategories.push(clean);
      this.saveLocally();
    }
  }

  async getAllLore(): Promise<LoreEntry[]> {
    return [...this.lore];
  }

  async getPublicLore(): Promise<LoreEntry[]> {
    return this.lore.filter((l) => {
      const state = (l.publicationState || 'PUBLIC').toUpperCase();
      return state === 'PUBLIC' || state === 'TEASER';
    });
  }

  getLoreById(id: string): LoreEntry | undefined {
    return this.lore.find((l) => l.id === id);
  }

  async saveLore(
    loreItem: Partial<LoreEntry> & { title: string },
    isAuthor: boolean,
    isEditor: boolean = false,
    userProfile?: { name?: string; email?: string }
  ): Promise<{ success: boolean; lore?: LoreEntry; error?: string }> {
    const isNew = !loreItem.id || !this.lore.some((l) => l.id === loreItem.id);

    if (isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You must be an Author or Editor to create worldbuilding lore.' };
    }

    if (!isNew && !isAuthor && !isEditor) {
      return { success: false, error: 'Permission denied: You do not have permissions to modify lore entries.' };
    }

    if (!loreItem.title || !loreItem.title.trim()) {
      return { success: false, error: 'Lore entry title is required.' };
    }

    if (loreItem.category) {
      this.addLoreCategory(loreItem.category);
    }

    const existing = !isNew ? this.lore.find((l) => l.id === loreItem.id) : null;
    const nowIso = new Date().toISOString();
    const id = existing ? existing.id : (loreItem.id || `lore-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const slug = loreItem.slug?.trim() || loreItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const savedLore: LoreEntry = {
      id,
      title: loreItem.title.trim(),
      description: loreItem.description?.trim() || '',
      content: loreItem.content || '',
      category: loreItem.category || 'History',
      tags: Array.isArray(loreItem.tags) ? loreItem.tags : [],
      relatedSeriesId: loreItem.relatedSeriesId || undefined,
      relatedBookIds: Array.isArray(loreItem.relatedBookIds) ? loreItem.relatedBookIds : [],
      relatedCharacterIds: Array.isArray(loreItem.relatedCharacterIds) ? loreItem.relatedCharacterIds : [],
      imageUrl: loreItem.imageUrl?.trim() || undefined,
      publicationState: loreItem.publicationState || 'PUBLIC',
      slug,
      seoTitle: loreItem.seoTitle?.trim() || `${loreItem.title.trim()} | World Lore`,
      seoDescription: loreItem.seoDescription?.trim() || loreItem.description?.trim() || '',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      createdBy: existing?.createdBy || userProfile?.email || 'author',
      updatedBy: userProfile?.email || (isAuthor ? 'author' : 'editor'),
    };

    const idx = this.lore.findIndex((l) => l.id === id);
    if (idx >= 0) {
      this.lore[idx] = savedLore;
    } else {
      this.lore.unshift(savedLore);
    }

    this.saveLocally();
    this.notifyLore();

    // Persist in-place to Firestore
    try {
      await setDoc(doc(db, LORE_COLLECTION, id), savedLore);
    } catch (error) {
      console.warn('Firestore setDoc notice for lore:', error);
      try {
        handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `lore/${id}`);
      } catch (e) {}
    }

    return { success: true, lore: savedLore };
  }

  async deleteLore(
    loreId: string,
    isAuthor: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Deleting worldbuilding lore is strictly restricted to the Author.',
      };
    }

    const idx = this.lore.findIndex((l) => l.id === loreId);
    if (idx === -1) {
      return { success: false, error: 'Lore entry not found.' };
    }

    this.lore.splice(idx, 1);
    this.saveLocally();
    this.notifyLore();

    try {
      await deleteDoc(doc(db, LORE_COLLECTION, loreId));
    } catch (error) {
      console.warn('Firestore deleteDoc notice for lore:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `lore/${loreId}`);
      } catch (e) {}
    }

    return { success: true };
  }

  /**
   * Upload image for character or lore to Firebase Storage.
   */
  async uploadImage(file: File): Promise<string> {
    let optimizedDataUrl: string;
    let uploadBlob: Blob = file;

    try {
      const optimized = await optimizeCoverImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
      });
      optimizedDataUrl = optimized.dataUrl;
      uploadBlob = optimized.blob;
    } catch {
      optimizedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `worldbuilding/${Date.now()}_${sanitizedName}`;

    try {
      const storageReference = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageReference, uploadBlob, {
        contentType: uploadBlob.type || 'image/webp',
      });

      return new Promise<string>((resolve) => {
        let isDone = false;

        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try {
              uploadTask.cancel();
            } catch {}
            resolve(optimizedDataUrl);
          }
        }, 2000);

        uploadTask.on(
          'state_changed',
          () => {},
          (error) => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timer);
              resolve(optimizedDataUrl);
            }
          },
          async () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timer);
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch {
                resolve(optimizedDataUrl);
              }
            }
          }
        );
      });
    } catch (err) {
      return optimizedDataUrl;
    }
  }
}

export const characterLoreService = new CharacterLoreService();
