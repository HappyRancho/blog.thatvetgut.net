import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Author } from '../types';
import {
  getAuthorIdForEmail,
  getAuthorsFromFirestore,
  getCachedAuthors,
  updateAuthorProfileInFirestore,
} from '../services/authorService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentAuthor: Author | null;
  loading: boolean;
  isAuthorized: boolean;
  authError: string | null;
  allAuthors: Author[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerCoFounder: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentAuthorProfile: (updates: Partial<Author>) => Promise<Author>;
  refreshAuthors: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [allAuthors, setAllAuthors] = useState<Author[]>(getCachedAuthors());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refresh authors catalog from Firestore
  const refreshAuthors = useCallback(async () => {
    try {
      const authors = await getAuthorsFromFirestore();
      setAllAuthors(authors);
      // If current author is set, update with freshest data
      if (currentAuthor) {
        const fresh = authors.find((a) => a.id === currentAuthor.id);
        if (fresh) setCurrentAuthor(fresh);
      }
    } catch (e) {
      console.warn('Could not refresh authors:', e);
    }
  }, [currentAuthor]);

  useEffect(() => {
    void refreshAuthors();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (!user) {
        setFirebaseUser(null);
        setCurrentAuthor(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(user);

      // Verify that this Firebase User belongs to an authorized Co-Founder
      const userEmail = (user.email || '').trim().toLowerCase();
      let authorId = getAuthorIdForEmail(userEmail);

      // Also check Firestore /cms_users/{uid} in case of custom account association
      if (!authorId && user.uid) {
        try {
          const cmsUserDoc = await getDoc(doc(db, 'cms_users', user.uid));
          if (cmsUserDoc.exists()) {
            authorId = cmsUserDoc.data().authorId || null;
          }
        } catch (err) {
          console.warn('[Auth] cms_users lookup notice:', err);
        }
      }

      if (!authorId) {
        // User is authenticated with Firebase, but NOT in the authorized Co-Founder roster
        console.warn(`[Auth] User ${user.email} (${user.uid}) is not authorized.`);
        setAuthError('Your account does not have access to the CMS.');
        setCurrentAuthor(null);
        setLoading(false);
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        return;
      }

      // Fetch latest authors to match profile
      const authors = await getAuthorsFromFirestore();
      const matched = authors.find((a) => a.id === authorId);

      if (matched && isMounted) {
        setCurrentAuthor(matched);
        setAuthError(null);

        // Record/sync session in Firestore cms_users collection
        try {
          await setDoc(
            doc(db, 'cms_users', user.uid),
            {
              uid: user.uid,
              authorId: matched.id,
              email: userEmail,
              name: matched.name,
              role: 'CO_FOUNDER',
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch {
          // Optional sync failure does not block session
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in with Email and Password
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const authorId = getAuthorIdForEmail(cleanEmail);

    if (!authorId) {
      setLoading(false);
      setAuthError('Your account does not have access to the CMS.');
      throw new Error('Your account does not have access to the CMS.');
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      setLoading(false);
      let userFriendlyMessage = 'Sign in failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        userFriendlyMessage = 'Invalid email or password. If you have not created your password yet, use "Set Password".';
      } else if (err.code === 'auth/wrong-password') {
        userFriendlyMessage = 'Incorrect password. You can reset your password below.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMessage = 'Too many failed login attempts. Please wait a few moments or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = 'Network error. Please verify your internet connection.';
      }
      setAuthError(userFriendlyMessage);
      throw new Error(userFriendlyMessage);
    }
  }, []);

  // Register a new password for an authorized Co-Founder
  const registerCoFounder = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const authorId = getAuthorIdForEmail(cleanEmail);

    if (!authorId) {
      setLoading(false);
      const msg = 'Registration is restricted strictly to authorized ThatVetGuy Co-Founders.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (password.length < 6) {
      setLoading(false);
      const msg = 'Password must be at least 6 characters long.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: any) {
      setLoading(false);
      if (err.code === 'auth/email-already-in-use') {
        // If already exists, advise logging in or resetting password
        const msg = 'An account already exists for this email. Please sign in or use "Reset Password".';
        setAuthError(msg);
        throw new Error(msg);
      }
      const msg = err.message || 'Could not complete registration.';
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // Sign in with Google (SSO)
  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setLoading(false);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return; // User intentionally closed popup
      }
      if (err.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'blog.thatvetguy.net';
        const msg = `Domain authorization needed: "${host}" is not yet registered in Firebase Authentication. Please use email & password login.`;
        setAuthError(msg);
        throw new Error(msg);
      }
      const msg = err.message || 'Google sign-in could not be completed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // Send Password Reset Email
  const sendPasswordReset = useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const authorId = getAuthorIdForEmail(cleanEmail);

    if (!authorId) {
      throw new Error('Your account does not have access to the CMS.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  }, []);

  // Complete Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setFirebaseUser(null);
    setCurrentAuthor(null);
    setAuthError(null);
    setLoading(false);
  }, []);

  // Update Co-Founder's OWN author profile
  const updateCurrentAuthorProfile = useCallback(
    async (updates: Partial<Author>): Promise<Author> => {
      if (!currentAuthor) {
        throw new Error('You must be signed in to edit your author profile.');
      }
      const updated = await updateAuthorProfileInFirestore(currentAuthor.id, updates);
      setCurrentAuthor(updated);
      setAllAuthors((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      return updated;
    },
    [currentAuthor]
  );

  const isAuthorized = Boolean(firebaseUser && currentAuthor);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentAuthor,
        loading,
        isAuthorized,
        authError,
        allAuthors,
        loginWithEmail,
        registerCoFounder,
        loginWithGoogle,
        sendPasswordReset,
        logout,
        updateCurrentAuthorProfile,
        refreshAuthors,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
