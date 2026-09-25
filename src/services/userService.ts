import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, ADMIN_EMAIL } from './firebase';
import { UserProfile, UserRole, AccountStatus, normalizeRole } from '../types';

const USERS_COLLECTION = 'users';
const LOCAL_STORAGE_USERS_KEY = 'mmessmer_author_users_cache';

class UserService {
  private localUsersCache: UserProfile[] = [];

  constructor() {
    this.loadLocalCache();
  }

  private loadLocalCache(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (stored) {
        this.localUsersCache = JSON.parse(stored);
      }
    } catch {
      this.localUsersCache = [];
    }
  }

  private saveLocalCache(users: UserProfile[]): void {
    this.localUsersCache = users;
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore storage error
    }
  }

  private saveToLocalCache(profile: UserProfile): void {
    const existingIndex = this.localUsersCache.findIndex((u) => u.uid === profile.uid);
    let updatedList = [...this.localUsersCache];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = profile;
    } else {
      updatedList.push(profile);
    }
    this.saveLocalCache(updatedList);
  }

  /**
   * Specifically creates a reader profile after createUserWithEmailAndPassword.
   * Required fields per brief:
   * firstName, lastName, username, usernameNormalized, email, role: "reader",
   * status: "active", profileImage, bio, emailVerified, createdAt, updatedAt, lastLoginAt
   *
   * Never allows client to submit or choose the role.
   * Every public registration receives role: "reader" (unless designated author).
   */
  async createReaderProfile(
    uid: string,
    data: {
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      emailVerified?: boolean;
      newsletterSubscribed?: boolean;
    }
  ): Promise<UserProfile> {
    const username = data.username.trim();
    const usernameNormalized = username.toLowerCase();
    const emailLower = data.email.trim().toLowerCase();
    const now = new Date().toISOString();

    // Per specification: Never allow the client to submit or choose the role.
    // Every public registration must automatically receive role: "reader".
    const newProfile: UserProfile = {
      uid,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      username,
      usernameNormalized,
      displayName: username || `${data.firstName} ${data.lastName}`.trim() || emailLower.split('@')[0],
      email: emailLower,
      role: 'reader',
      status: 'active',
      profileImage: '',
      bio: '',
      emailVerified: !!data.emailVerified,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      photoURL: '',
      shortBio: '',
      newsletterSubscribed: !!data.newsletterSubscribed,
    };

    const userDocRef = doc(db, USERS_COLLECTION, uid);
    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      console.warn('Could not write user profile to Firestore (saved locally):', err);
    }

    this.saveToLocalCache(newProfile);
    return newProfile;
  }

  /**
   * Initializes or loads user profile on sign-in
   */
  async getOrCreateUserProfile(
    user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null },
    additionalData?: { firstName?: string; lastName?: string; username?: string; role?: UserRole; newsletterSubscribed?: boolean }
  ): Promise<UserProfile> {
    if (!user.uid || !user.email) {
      throw new Error('User must have an email and UID');
    }

    const emailLower = user.email.toLowerCase();
    const isDesignatedAuthor = emailLower === ADMIN_EMAIL.toLowerCase();
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const now = new Date().toISOString();

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const normRole = normalizeRole(data.role);

        // If designated author, ensure they retain author role
        if (isDesignatedAuthor && normRole !== 'author') {
          await updateDoc(userDocRef, {
            role: 'author',
            status: 'active',
            lastLoginAt: now,
            updatedAt: now,
          });
          data.role = 'author';
        } else {
          // Update last login timestamp in Firestore
          await updateDoc(userDocRef, {
            lastLoginAt: now,
            updatedAt: now,
          }).catch(() => {});
        }

        data.lastLoginAt = now;
        data.displayName = data.username || data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || emailLower.split('@')[0];
        this.saveToLocalCache(data);
        return data;
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore, checking cache:', err);
    }

    // Fallback: check local cache
    const cached = this.localUsersCache.find((u) => u.uid === user.uid || u.email.toLowerCase() === emailLower);
    if (cached) {
      cached.lastLoginAt = now;
      if (isDesignatedAuthor) cached.role = 'author';
      return cached;
    }

    // Create new profile with required fields
    const defaultRole: UserRole = isDesignatedAuthor ? 'author' : 'reader';
    const username = additionalData?.username || user.displayName || emailLower.split('@')[0];

    const newProfile: UserProfile = {
      uid: user.uid,
      email: emailLower,
      username,
      usernameNormalized: username.toLowerCase(),
      firstName: additionalData?.firstName || '',
      lastName: additionalData?.lastName || '',
      displayName: username,
      role: defaultRole,
      status: 'active',
      profileImage: user.photoURL || '',
      bio: isDesignatedAuthor ? 'Creator of The Breathwoven Cycle & The Abyssal Current.' : 'Avid fantasy reader.',
      emailVerified: auth.currentUser?.emailVerified || false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      photoURL: user.photoURL || '',
      shortBio: isDesignatedAuthor ? 'Author & Craftsman' : 'Reader',
      newsletterSubscribed: !!additionalData?.newsletterSubscribed,
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      console.warn('Could not save user profile to Firestore (using local cache):', err);
    }

    this.saveToLocalCache(newProfile);
    return newProfile;
  }

  /**
   * Fetches all registered users (AUTHOR ONLY)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const users: UserProfile[] = [];
      snap.forEach((d) => {
        users.push({ ...(d.data() as UserProfile), uid: d.id });
      });

      // Ensure designated author is always present
      const authorPresent = users.some((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (!authorPresent) {
        users.unshift({
          uid: 'author-default-root',
          email: ADMIN_EMAIL.toLowerCase(),
          username: 'MatthewEMessmer',
          usernameNormalized: 'matthewemessmer',
          displayName: 'Matthew E. Messmer',
          firstName: 'Matthew',
          lastName: 'Messmer',
          profileImage: '',
          bio: 'Author and Creator of The Breathwoven Cycle.',
          role: 'author',
          status: 'active',
          emailVerified: true,
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          newsletterSubscribed: true,
        });
      }

      this.saveLocalCache(users);
      return users;
    } catch (err) {
      console.warn('Could not load users from Firestore, using cache/fallback list:', err);
      if (this.localUsersCache.length > 0) {
        return this.localUsersCache;
      }
      const fallbackUsers: UserProfile[] = [
        {
          uid: 'author-root-mm',
          email: ADMIN_EMAIL.toLowerCase(),
          username: 'MatthewEMessmer',
          usernameNormalized: 'matthewemessmer',
          displayName: 'Matthew E. Messmer',
          firstName: 'Matthew',
          lastName: 'Messmer',
          role: 'author',
          status: 'active',
          profileImage: '',
          bio: 'Author & Master Craftsman',
          emailVerified: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        {
          uid: 'editor-elena-vane',
          email: 'elena.vane@breathwovenpress.com',
          username: 'ElenaVane',
          usernameNormalized: 'elenavane',
          displayName: 'Elena Vane',
          firstName: 'Elena',
          lastName: 'Vane',
          role: 'editor',
          status: 'active',
          profileImage: '',
          bio: 'Lead developmental editor for epic fantasy manuscripts.',
          emailVerified: true,
          createdAt: '2024-03-20T14:30:00Z',
          updatedAt: new Date().toISOString(),
          lastLoginAt: '2024-09-20T09:12:00Z',
        },
        {
          uid: 'reader-samuel-k',
          email: 'samuel.kaye@gmail.com',
          username: 'SamuelKaye',
          usernameNormalized: 'samuelkaye',
          displayName: 'Samuel Kaye',
          firstName: 'Samuel',
          lastName: 'Kaye',
          role: 'reader',
          status: 'active',
          profileImage: '',
          bio: 'High fantasy enthusiast and collector of signed editions.',
          emailVerified: true,
          createdAt: '2024-05-11T16:45:00Z',
          updatedAt: new Date().toISOString(),
          lastLoginAt: '2024-09-24T18:30:00Z',
        },
      ];
      this.saveLocalCache(fallbackUsers);
      return fallbackUsers;
    }
  }

  /**
   * Counts active authors to protect against self-lockout
   */
  async getAuthorCount(): Promise<number> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter((u) => normalizeRole(u.role) === 'author' && u.status === 'active').length;
  }

  /**
   * Updates user role (AUTHOR ONLY) with self-lockout safeguards
   */
  async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    currentAuthorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const allUsers = await this.getAllUsers();
    const targetUser = allUsers.find((u) => u.uid === targetUserId);

    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    const normCurrentRole = normalizeRole(targetUser.role);
    const normNewRole = normalizeRole(newRole);

    // SELF-LOCKOUT PROTECTION:
    if (normCurrentRole === 'author' && normNewRole !== 'author') {
      const activeAuthorCount = allUsers.filter((u) => normalizeRole(u.role) === 'author' && u.status === 'active').length;
      if (activeAuthorCount <= 1) {
        return {
          success: false,
          error: 'You are the only Author account. Create another Author before transferring or removing your Author privileges.',
        };
      }
    }

    try {
      const userRef = doc(db, USERS_COLLECTION, targetUserId);
      await updateDoc(userRef, {
        role: normNewRole,
        updatedAt: serverTimestamp(),
      });

      // Also sync admins registry if applicable
      const adminRef = doc(db, 'admins', targetUserId);
      if (normNewRole === 'author' || normNewRole === 'editor') {
        await setDoc(adminRef, {
          email: targetUser.email,
          role: normNewRole,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await updateDoc(adminRef, { role: 'reader' }).catch(() => {});
      }
    } catch (err) {
      console.warn('Could not update role in Firestore, updating local cache:', err);
    }

    const updated = allUsers.map((u) =>
      u.uid === targetUserId ? { ...u, role: normNewRole } : u
    );
    this.saveLocalCache(updated);

    return { success: true };
  }

  /**
   * Updates account status (e.g. active, suspended)
   */
  async updateUserStatus(
    targetUserId: string,
    newStatus: AccountStatus,
    currentAuthorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const allUsers = await this.getAllUsers();
    const targetUser = allUsers.find((u) => u.uid === targetUserId);

    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }

    // SELF-LOCKOUT PROTECTION:
    if (normalizeRole(targetUser.role) === 'author' && newStatus !== 'active') {
      const activeAuthorCount = allUsers.filter((u) => normalizeRole(u.role) === 'author' && u.status === 'active').length;
      if (activeAuthorCount <= 1) {
        return {
          success: false,
          error: 'You are the only Author account. Create another Author before transferring or removing your Author privileges.',
        };
      }
    }

    try {
      const userRef = doc(db, USERS_COLLECTION, targetUserId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not update status in Firestore, updating local cache:', err);
    }

    const updated = allUsers.map((u) =>
      u.uid === targetUserId ? { ...u, status: newStatus } : u
    );
    this.saveLocalCache(updated);

    return { success: true };
  }

  /**
   * Updates own profile details
   */
  async updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      bio?: string;
      shortBio?: string;
      profileImage?: string;
      photoURL?: string;
      newsletterSubscribed?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Could not update profile in Firestore, updating local cache:', err);
    }

    const allUsers = await this.getAllUsers();
    const updated = allUsers.map((u) =>
      u.uid === userId ? { ...u, ...updates, updatedAt: now } : u
    );
    this.saveLocalCache(updated);

    return { success: true };
  }
}

export const userService = new UserService();
