import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Import local provisioned configuration
import configJson from '../../firebase-applet-config.json';

const rawConfig = configJson as Record<string, any>;

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {} as Record<string, any>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || configJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || configJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || configJson.appId,
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);

// Use custom database ID if provisioned, else default
export const db: Firestore = rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

export const storage: FirebaseStorage = getStorage(app);

export const ADMIN_EMAIL = env.VITE_ADMIN_EMAIL || 'memauthor1980@gmail.com';
export const AUTHOR_ADMIN_EMAILS = [
  'memauthor1980@gmail.com',
  'memauthor1980@gamil.com',
  'mmessmer80@gmail.com',
  ADMIN_EMAIL.toLowerCase(),
];

// Test connection on boot per Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Translates Firebase Authentication error codes into user-friendly messages.
 * Never displays raw Firebase errors to end users.
 */
export function translateFirebaseAuthError(err: unknown): string {
  const errObj = err as { code?: string; message?: string } | null;
  const code = (errObj?.code || '').toLowerCase();
  const rawMessage = (errObj?.message || '').toLowerCase();

  // 1. auth/operation-not-allowed
  if (code === 'auth/operation-not-allowed' || rawMessage.includes('operation-not-allowed') || rawMessage.includes('operation not allowed')) {
    return 'Email and password sign-in is not currently enabled for this website. Please contact the site administrator.';
  }

  // 2. auth/invalid-credential
  if (code === 'auth/invalid-credential' || rawMessage.includes('invalid-credential') || rawMessage.includes('invalid credential')) {
    return 'The email address or password is incorrect.';
  }

  // 3. auth/user-not-found
  if (code === 'auth/user-not-found' || rawMessage.includes('user-not-found') || rawMessage.includes('user not found')) {
    return "We couldn't find an account with that email address.";
  }

  // 4. auth/wrong-password
  if (code === 'auth/wrong-password' || rawMessage.includes('wrong-password') || rawMessage.includes('wrong password')) {
    return 'The email address or password is incorrect.';
  }

  // 5. auth/email-already-in-use
  if (code === 'auth/email-already-in-use' || rawMessage.includes('email-already-in-use') || rawMessage.includes('already in use') || rawMessage.includes('already exists')) {
    return 'An account already exists with this email address.';
  }

  // 6. auth/weak-password
  if (code === 'auth/weak-password' || rawMessage.includes('weak-password') || rawMessage.includes('weak password')) {
    return 'Please choose a stronger password.';
  }

  // 7. auth/too-many-requests
  if (code === 'auth/too-many-requests' || rawMessage.includes('too-many-requests') || rawMessage.includes('too many attempts') || rawMessage.includes('too many requests')) {
    return 'Too many attempts were made. Please wait a moment and try again.';
  }

  // Additional safety translations
  if (code === 'auth/invalid-email' || rawMessage.includes('invalid-email') || rawMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (code === 'auth/network-request-failed' || rawMessage.includes('network')) {
    return 'Network request failed. Please check your internet connection.';
  }

  return 'An error occurred during authentication. Please try again.';
}

/**
 * Diagnostic status for Author/Admin area
 */
export interface FirebaseDiagnosticReport {
  projectConfigExists: boolean;
  projectId: string;
  authDomain: string;
  authInitialized: boolean;
  emailPasswordProviderAvailable: boolean;
  firestoreInitialized: boolean;
  firestoreDatabaseId: string;
  currentUser: string | null;
  currentUserUid: string | null;
  currentUserVerified: boolean;
}

export function getFirebaseDiagnosticInfo(): FirebaseDiagnosticReport {
  return {
    projectConfigExists: Boolean(firebaseConfig.projectId),
    projectId: firebaseConfig.projectId || 'Unknown',
    authDomain: firebaseConfig.authDomain || 'Unknown',
    authInitialized: Boolean(auth),
    emailPasswordProviderAvailable: true,
    firestoreInitialized: Boolean(db),
    firestoreDatabaseId: rawConfig.firestoreDatabaseId || '(default)',
    currentUser: auth.currentUser?.email || null,
    currentUserUid: auth.currentUser?.uid || null,
    currentUserVerified: Boolean(auth.currentUser?.emailVerified),
  };
}

/**
 * Checks if the current Firebase user has administrator authorization
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.email) return false;

  const emailLower = user.email.toLowerCase();

  // 1. Direct match with configured administrator emails
  if (AUTHOR_ADMIN_EMAILS.includes(emailLower)) {
    return true;
  }

  // 2. Custom Claims check
  try {
    const idTokenResult = await user.getIdTokenResult(true);
    if (idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('Failed to fetch user token claims:', err);
  }

  // 3. Firestore admins collection document check
  try {
    const adminDocRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminDocRef);
    if (snap.exists() && (snap.data()?.role === 'admin' || AUTHOR_ADMIN_EMAILS.includes((snap.data()?.email || '').toLowerCase()))) {
      return true;
    }
  } catch (err) {
    console.warn('Failed to query admins collection in Firestore:', err);
  }

  return false;
}

/**
 * Initializes the root administrator record in Firestore if needed
 */
export async function ensureAdminRecord(user: User): Promise<void> {
  if (!user || !user.email) return;
  const emailLower = user.email.toLowerCase();
  if (AUTHOR_ADMIN_EMAILS.includes(emailLower)) {
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      await setDoc(
        adminDocRef,
        {
          email: emailLower,
          role: 'admin',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Note: Could not ensure admin doc in Firestore (may need rules permission):', e);
    }
  }
}
