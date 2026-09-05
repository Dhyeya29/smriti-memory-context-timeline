import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import type { Memory } from './types';
import firebaseConfigFile from '../firebase-applet-config.json';

const metaEnv = (((import.meta as unknown) as { env?: Record<string, string> }).env || {});

// Resolve configuration from environment variables if provided, falling back to firebase-applet-config.json
export const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigFile.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigFile.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFile.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfigFile.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFile.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigFile.measurementId,
  oAuthClientId: metaEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfigFile.oAuthClientId,
  recaptchaSiteKey: metaEnv.VITE_FIREBASE_RECAPTCHA_SITE_KEY || firebaseConfigFile.recaptchaSiteKey,
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cloud Firestore: pass firestoreDatabaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Check if the application is currently running inside an iframe (e.g. AI Studio preview)
 */
export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Check if a redirect sign-in was completed and resolve it safely without throwing
 */
export async function checkRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error: any) {
    console.warn('Redirect result check:', error?.code, error?.message);
    return null;
  }
}

/**
 * Sign in using Google OAuth popup.
 *
 * In iframe environments (like Google AI Studio preview), popup authentication
 * is strictly used. Attempting signInWithRedirect inside an iframe causes the
 * iframe to navigate directly to accounts.google.com, which blocks iframed
 * requests and produces a Google 403 "You do not have access to this page" error.
 */
export async function signInWithGoogle(): Promise<User> {
  const inIframe = isInIframe();

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Google sign-in error:', error?.code, error?.message);

    // In an iframe, NEVER fall back to signInWithRedirect as it causes Google 403 in the iframe
    if (inIframe) {
      if (error.code === 'auth/popup-blocked') {
        const err = new Error(
          'Sign-in popup was blocked by your browser. Please allow popups for this site, or open the preview in a new tab.'
        );
        (err as any).code = 'auth/popup-blocked';
        throw err;
      }
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        const err = new Error('Sign-in was cancelled.');
        (err as any).code = error.code;
        throw err;
      }
      if (error.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        const err = new Error(
          `Domain "${currentHost}" is not yet in Firebase Authorized Domains. Add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains.`
        );
        (err as any).code = 'auth/unauthorized-domain';
        (err as any).domain = currentHost;
        throw err;
      }
      if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
        const err = new Error(
          'Authentication could not be completed inside the embedded preview frame (often caused by browser third-party cookie or cross-origin restrictions). Please use "Open in New Tab" for seamless sign-in.'
        );
        (err as any).code = error.code;
        throw err;
      }
      throw error;
    }

    // When running standalone (in a top-level browser tab), fall back to redirect if popup is blocked
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return new Promise(() => {}); // Browser navigates
      } catch (redirectErr) {
        throw redirectErr;
      }
    }

    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Get the current user's valid Firebase ID token for API calls
 */
export async function getValidIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }
  return await currentUser.getIdToken(true);
}

/**
 * Subscribe to the authenticated user's memories in real time
 * Path: users/{uid}/memories/{memoryId}
 */
export function subscribeToUserMemories(
  uid: string,
  onUpdate: (memories: Memory[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const memoriesRef = collection(db, 'users', uid, 'memories');
  const q = query(memoriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const memories: Memory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        memories.push({
          id: docSnap.id,
          userId: uid,
          title: data.title || 'Untitled Memory',
          approximateDate: data.approximateDate || '',
          category: data.category || 'General',
          whatHappened: data.whatHappened || '',
          importantContext: data.importantContext || '',
          goalsOrDecisions: data.goalsOrDecisions || '',
          whatChanged: data.whatChanged || '',
          whatRemainsUnclear: data.whatRemainsUnclear || '',
          keyLessons: data.keyLessons || [],
          tags: data.tags || [],
          conversation: data.conversation || [],
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
          userNotes: data.userNotes || ''
        });
      });
      onUpdate(memories);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Save a new or updated memory under users/{uid}/memories/{memoryId}
 */
export async function saveUserMemory(
  uid: string,
  memoryId: string,
  memoryData: Partial<Memory>
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'memories', memoryId);
  const now = Date.now();

  const dataToSave = {
    ...memoryData,
    id: memoryId,
    userId: uid,
    updatedAt: now,
    createdAt: memoryData.createdAt || now
  };

  await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Delete a memory under users/{uid}/memories/{memoryId}
 */
export async function deleteUserMemory(uid: string, memoryId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'memories', memoryId);
  await deleteDoc(docRef);
}
