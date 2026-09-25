import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, checkIsAdmin, ensureAdminRecord, ADMIN_EMAIL, translateFirebaseAuthError } from '../services/firebase';
import { userService } from '../services/userService';
import { newsletterService } from '../services/newsletterService';
import { UserProfile, UserRole, normalizeRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isReader: boolean;
  loading: boolean;
  adminEmailConfigured: string;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  registerReader: (
    email: string,
    pass: string,
    details: {
      firstName: string;
      lastName: string;
      username: string;
      newsletterOptIn?: boolean;
    }
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  createAdminAccount: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    shortBio?: string;
    photoURL?: string;
    newsletterSubscribed?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('READER');
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile & role whenever current user changes
  const syncProfile = async (currentUser: User | null): Promise<UserProfile | null> => {
    if (!currentUser) {
      setProfile(null);
      setRole('READER');
      return null;
    }

    try {
      const emailLower = (currentUser.email || '').toLowerCase();
      const isDesignatedAuthor = emailLower === ADMIN_EMAIL.toLowerCase();

      const userProfile = await userService.getOrCreateUserProfile({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
      });

      // Enforce author role for designated admin email
      if (isDesignatedAuthor) {
        userProfile.role = 'AUTHOR';
        await ensureAdminRecord(currentUser);
      }

      setProfile(userProfile);
      setRole(userProfile.role);
      return userProfile;
    } catch (err) {
      console.warn('Failed to sync user profile:', err);
      // Fallback
      const fallbackRole: UserRole = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'author' : 'reader';
      const usernameFallback = currentUser.displayName || (currentUser.email || '').split('@')[0];
      const nowStr = new Date().toISOString();
      const fallbackProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        username: usernameFallback,
        usernameNormalized: usernameFallback.toLowerCase(),
        firstName: '',
        lastName: '',
        displayName: usernameFallback,
        role: fallbackRole,
        status: 'active',
        profileImage: currentUser.photoURL || '',
        bio: '',
        emailVerified: currentUser.emailVerified,
        createdAt: nowStr,
        updatedAt: nowStr,
        lastLoginAt: nowStr,
      };
      setProfile(fallbackProfile);
      setRole(fallbackRole);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
        setRole('READER');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthor = role === 'AUTHOR' || (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const isEditor = isAuthor || role === 'EDITOR';
  const isReader = !!user;
  const isAdmin = isEditor; // Backward-compatibility: Editors and Authors have management access

  /**
   * General Sign-in: works for Readers, Editors, and Authors
   * Uses signInWithEmailAndPassword, retrieves profile, updates lastLoginAt, returns role.
   */
  const signIn = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userProfile = await syncProfile(cred.user);
      return { success: true, role: userProfile?.role || 'reader' };
    } catch (err: unknown) {
      console.warn('Sign-in failed:', err);
      const errorMsg = translateFirebaseAuthError(err);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Public Registration: STRICTLY creates a READER account using createUserWithEmailAndPassword.
   * Collects: First Name, Last Name, Username, Email, Password, Confirm Password.
   * Creates users/{uid} document with required fields.
   * Every public registration receives role: "reader".
   */
  const registerReader = async (
    email: string,
    pass: string,
    details: {
      firstName: string;
      lastName: string;
      username: string;
      newsletterOptIn?: boolean;
    }
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
      if (pass.length < 6) {
        return { success: false, error: 'Please choose a stronger password.' };
      }
      if (!details.username.trim()) {
        return { success: false, error: 'Please provide a username.' };
      }
      if (!details.firstName.trim()) {
        return { success: false, error: 'Please provide your first name.' };
      }
      if (!details.lastName.trim()) {
        return { success: false, error: 'Please provide your last name.' };
      }

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);

      // Set auth profile display name to username
      await fbUpdateProfile(cred.user, {
        displayName: details.username.trim(),
      }).catch(() => {});

      // Create Firestore document users/{uid} with role: "reader"
      const userProfile = await userService.createReaderProfile(
        cred.user.uid,
        {
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          username: details.username.trim(),
          email: email.trim().toLowerCase(),
          emailVerified: cred.user.emailVerified,
          newsletterSubscribed: details.newsletterOptIn,
        }
      );

      // If opted into newsletter, register subscriber
      if (details.newsletterOptIn) {
        newsletterService.subscribe({
          email: email.trim(),
          firstName: details.firstName.trim() || details.username.trim(),
          source: 'account_registration',
          consent: true,
        }).catch(() => {});
      }

      setProfile(userProfile);
      setRole('reader');
      return { success: true, role: 'reader' };
    } catch (err: unknown) {
      console.warn('Reader registration failed:', err);
      const errorMsg = translateFirebaseAuthError(err);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  /**
   * Designated Author initial account setup
   */
  const createAdminAccount = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return {
          success: false,
          error: `Only the designated author administrator email (${ADMIN_EMAIL}) can initialize this author account.`,
        };
      }
      if (pass.length < 6) {
        return {
          success: false,
          error: 'Please choose a stronger password.',
        };
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await fbUpdateProfile(cred.user, {
        displayName: 'Matthew E. Messmer',
      }).catch(() => {});

      const userProfile = await userService.getOrCreateUserProfile(
        {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: 'Matthew E. Messmer',
          photoURL: '',
        },
        {
          firstName: 'Matthew',
          lastName: 'Messmer',
          role: 'AUTHOR',
          newsletterSubscribed: true,
        }
      );

      await ensureAdminRecord(cred.user);
      setProfile(userProfile);
      setRole('AUTHOR');
      return { success: true };
    } catch (err: unknown) {
      console.warn('Admin account creation failed:', err);
      const errorMsg = translateFirebaseAuthError(err);
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
    setRole('reader');
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = translateFirebaseAuthError(err);
      return { success: false, error: errorMsg };
    }
  };

  const updateUserProfile = async (updates: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    shortBio?: string;
    photoURL?: string;
    newsletterSubscribed?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const res = await userService.updateProfile(user.uid, updates);
    if (res.success) {
      if (updates.displayName && user) {
        await fbUpdateProfile(user, { displayName: updates.displayName }).catch(() => {});
      }
      await syncProfile(user);
    }
    return res;
  };

  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    return syncProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isAuthor,
        isEditor,
        isReader,
        loading,
        adminEmailConfigured: ADMIN_EMAIL,
        signIn,
        registerReader,
        createAdminAccount,
        signOut,
        sendPasswordReset,
        updateUserProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
