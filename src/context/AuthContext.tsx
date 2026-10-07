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
import { auth, ensureAdminRecord, AUTHOR_ADMIN_EMAILS, translateFirebaseAuthError } from '../services/firebase';
import { userService } from '../services/userService';
import { newsletterService } from '../services/newsletterService';
import { UserProfile, UserRole } from '../types';

export const HARDCODED_ADMIN_CREDENTIALS = {
  email: 'memauthor1980@gmail.com',
  password: '123456',
  displayName: 'Matthew E. Messmer',
  firstName: 'Matthew',
  lastName: 'Messmer',
  role: 'AUTHOR' as UserRole,
};

export const DEFAULT_AUTHOR_PROFILE: UserProfile = {
  uid: 'author-memauthor1980',
  email: HARDCODED_ADMIN_CREDENTIALS.email,
  username: 'Matthew E. Messmer',
  usernameNormalized: 'matthew e. messmer',
  firstName: 'Matthew',
  lastName: 'Messmer',
  displayName: 'Matthew E. Messmer',
  role: 'AUTHOR',
  status: 'active',
  profileImage: '',
  bio: 'Author of The Breathwoven Cycle & The Abyssal Current.',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
};

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthor: boolean;
  isEditor: boolean;
  isReader: boolean;
  canEditSite: boolean;
  loading: boolean;
  adminEmailConfigured: string;
  signIn: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  registerReader: (
    email: string,
    pass: string,
    details: {
      firstName: string;
      lastName: string;
      username: string;
      newsletterOptIn?: boolean;
      city?: string;
      state?: string;
      country?: string;
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
    city?: string;
    state?: string;
    country?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
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
      const isDesignatedAuthor = AUTHOR_ADMIN_EMAILS.includes(emailLower);

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
      const isDesignated = AUTHOR_ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase());
      const fallbackRole: UserRole = isDesignated ? 'AUTHOR' : 'READER';
      const usernameFallback = currentUser.displayName || (currentUser.email || '').split('@')[0];
      const nowStr = new Date().toISOString();
      const fallbackProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        username: usernameFallback,
        usernameNormalized: usernameFallback.toLowerCase(),
        firstName: isDesignated ? 'Matthew' : '',
        lastName: isDesignated ? 'Messmer' : '',
        displayName: isDesignated ? 'Matthew E. Messmer' : usernameFallback,
        role: fallbackRole,
        status: 'active',
        profileImage: currentUser.photoURL || '',
        bio: isDesignated ? 'Author of The Breathwoven Cycle & The Abyssal Current.' : '',
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
    let isMounted = true;

    // Listen to live Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      if (currentUser) {
        setUser(currentUser);
        await syncProfile(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setRole('READER');
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const isAuthenticated = !!user;
  const isAuthor =
    isAuthenticated &&
    (role === 'AUTHOR' ||
      role === 'author' ||
      AUTHOR_ADMIN_EMAILS.includes((user?.email || '').toLowerCase()) ||
      AUTHOR_ADMIN_EMAILS.includes((profile?.email || '').toLowerCase()));
  const isEditor = isAuthenticated && (isAuthor || role === 'EDITOR' || role === 'editor');
  const isReader = isAuthenticated && !isEditor;
  const canEditSite = isAuthenticated && (isAuthor || isEditor);
  const isAdmin = canEditSite;

  /**
   * General Sign-in: works for Readers, Editors, and Authors.
   * Accepts username or email.
   */
  const signIn = async (
    emailOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    const trimmedInput = (emailOrUsername || '').trim();
    const isHardcodedAdmin =
      (trimmedInput.toLowerCase() === HARDCODED_ADMIN_CREDENTIALS.email.toLowerCase() ||
        trimmedInput.toLowerCase() === 'matthew' ||
        trimmedInput.toLowerCase() === 'memauthor1980') &&
      pass === HARDCODED_ADMIN_CREDENTIALS.password;

    if (isHardcodedAdmin) {
      try {
        const cred = await signInWithEmailAndPassword(auth, HARDCODED_ADMIN_CREDENTIALS.email, HARDCODED_ADMIN_CREDENTIALS.password);
        setUser(cred.user);
        await syncProfile(cred.user);
        return { success: true, role: 'AUTHOR' };
      } catch {
        const mockUser = {
          uid: DEFAULT_AUTHOR_PROFILE.uid,
          email: HARDCODED_ADMIN_CREDENTIALS.email,
          displayName: HARDCODED_ADMIN_CREDENTIALS.displayName,
          emailVerified: true,
        } as unknown as User;
        setUser(mockUser);
        setProfile(DEFAULT_AUTHOR_PROFILE);
        setRole('AUTHOR');
        return { success: true, role: 'AUTHOR' };
      }
    }

    const emailToUse =
      trimmedInput.toLowerCase() === 'matthew' || trimmedInput.toLowerCase() === 'memauthor1980'
        ? HARDCODED_ADMIN_CREDENTIALS.email
        : trimmedInput;

    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
      const userProfile = await syncProfile(cred.user);
      return { success: true, role: userProfile?.role || 'reader' };
    } catch (err: unknown) {
      console.warn('Sign-in failed:', err);
      // Hardcoded fallback check for admin email
      if (
        emailToUse.toLowerCase() === HARDCODED_ADMIN_CREDENTIALS.email.toLowerCase() &&
        pass === HARDCODED_ADMIN_CREDENTIALS.password
      ) {
        const mockUser = {
          uid: DEFAULT_AUTHOR_PROFILE.uid,
          email: HARDCODED_ADMIN_CREDENTIALS.email,
          displayName: HARDCODED_ADMIN_CREDENTIALS.displayName,
          emailVerified: true,
        } as unknown as User;
        setUser(mockUser);
        setProfile(DEFAULT_AUTHOR_PROFILE);
        setRole('AUTHOR');
        return { success: true, role: 'AUTHOR' };
      }
      const errorMsg = translateFirebaseAuthError(err);
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Public Registration: STRICTLY creates a READER account using createUserWithEmailAndPassword.
   */
  const registerReader = async (
    email: string,
    pass: string,
    details: {
      firstName: string;
      lastName: string;
      username: string;
      newsletterOptIn?: boolean;
      city?: string;
      state?: string;
      country?: string;
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

      await fbUpdateProfile(cred.user, {
        displayName: details.username.trim(),
      }).catch(() => {});

      const userProfile = await userService.createReaderProfile(
        cred.user.uid,
        {
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          username: details.username.trim(),
          email: email.trim().toLowerCase(),
          emailVerified: cred.user.emailVerified,
          newsletterSubscribed: true,
          city: details.city?.trim() || '',
          state: details.state?.trim() || '',
          country: details.country?.trim() || '',
        }
      );

      // Automatic Newsletter Subscription & One Combined Welcome Email per requirement
      await newsletterService
        .subscribeFromRegistration({
          userId: cred.user.uid,
          email: email.trim().toLowerCase(),
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          username: details.username.trim(),
        })
        .catch((err) => {
          console.warn('subscribeFromRegistration warning:', err);
        });

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
   * Designated Author initial account setup / bypass
   */
  const createAdminAccount = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const emailLower = email.trim().toLowerCase();
      if (!AUTHOR_ADMIN_EMAILS.includes(emailLower)) {
        return {
          success: false,
          error: `Only authorized author administrator emails can initialize this author account.`,
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
    await fbSignOut(auth).catch(() => {});
    setUser(null);
    setProfile(null);
    setRole('READER');
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
    city?: string;
    state?: string;
    country?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user && !profile) return { success: false, error: 'Not authenticated' };

    const targetUid = user?.uid || profile?.uid || 'author-memauthor1980';
    const res = await userService.updateProfile(targetUid, updates);
    if (res.success) {
      if (updates.displayName && user) {
        await fbUpdateProfile(user, { displayName: updates.displayName }).catch(() => {});
      }
      if (user) {
        await syncProfile(user);
      } else if (profile) {
        setProfile({
          ...profile,
          ...updates,
          displayName: updates.displayName || profile.displayName,
        });
      }
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
        canEditSite,
        loading,
        adminEmailConfigured: HARDCODED_ADMIN_CREDENTIALS.email,
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
