import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Author, UserRole } from '../types';
import { AUTHORS } from '../data/authors';

export const INITIAL_CO_FOUNDERS: Author[] = [...AUTHORS];

/** The CMS roster is deliberately explicit; a matching email is required after Google authentication. */
export const APPROVED_EMAILS_MAP: Record<string, string> = {
  'chiragpatidar0369@gmail.com': 'dr-chirag-patidar',
  'chirag@thatvetguy.net': 'dr-chirag-patidar',
  'drchiragpatidar@gmail.com': 'dr-chirag-patidar',
  'amaan@thatvetguy.net': 'dr-amaan-ahmed',
  'amaan.ahmed@thatvetguy.net': 'dr-amaan-ahmed',
  'shivam@thatvetguy.net': 'dr-shivam-singh-thakur',
  'shivam.singh@thatvetguy.net': 'dr-shivam-singh-thakur',
  'ritesh@thatvetguy.net': 'dr-ritesh-verma',
  'ritesh.verma@thatvetguy.net': 'dr-ritesh-verma',
  'deepesh.mathur@thatvetguy.net': 'dr-deepesh-mathur',
  'deepesh.chaware@thatvetguy.net': 'dr-deepesh-chaware',
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: FirebaseUser | null;
  currentAuthor: Author | null;
  role: UserRole | undefined;
  loading: boolean;
  isAuthorized: boolean;
  isCoFounder: boolean;
  isContributor: boolean;
  canPublish: boolean;
  canReview: boolean;
  loginWithGoogle: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshAuthorProfile: () => Promise<void>;
  allAuthors: Author[];
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mergeAuthors(remoteAuthors: Author[]): Author[] {
  const byId = new Map(INITIAL_CO_FOUNDERS.map((author) => [author.id, author]));
  remoteAuthors.forEach((author) => {
    const existing = byId.get(author.id);
    byId.set(author.id, existing ? { ...existing, ...author, socials: { ...existing.socials, ...author.socials } } : author);
  });
  return [...byId.values()];
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [allAuthors, setAllAuthors] = useState<Author[]>(INITIAL_CO_FOUNDERS);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const resolveAuthor = useCallback((email: string, authors: Author[]): Author | null => {
    const normalizedEmail = email.trim().toLowerCase();
    const rosterId = APPROVED_EMAILS_MAP[normalizedEmail];
    if (rosterId) return authors.find((author) => author.id === rosterId) ?? null;
    return authors.find((author) => author.socials?.email?.toLowerCase() === normalizedEmail) ?? null;
  }, []);

  const fetchAllAuthors = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const remoteAuthors = snapshot.docs
        .map((snapshotDoc) => ({ ...snapshotDoc.data(), id: snapshotDoc.data().authorId || snapshotDoc.id } as Author))
        .filter((author) => author.name && author.role);
      const merged = mergeAuthors(remoteAuthors);
      setAllAuthors(merged);
      return merged;
    } catch {
      return INITIAL_CO_FOUNDERS;
    }
  }, []);

  useEffect(() => {
    void fetchAllAuthors();
  }, [fetchAllAuthors]);

  useEffect(() => {
    let active = true;
    const finishRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        if (active) setAuthError(getGoogleSignInError(error));
      }
    };
    void finishRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      setCurrentAuthor(null);

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const authors = await fetchAllAuthors();
      const matched = resolveAuthor(user.email, authors);
      if (!active) return;

      if (!matched) {
        setAuthError(`Access restricted: ${user.email} is not in the ThatVetGuy editorial roster.`);
        setLoading(false);
        await signOut(auth);
        return;
      }

      setCurrentAuthor(matched);
      setAuthError(null);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          authorId: matched.id,
          email: user.email.toLowerCase(),
          name: matched.name,
          role: matched.role,
          lastLoginAt: serverTimestamp(),
        }, { merge: true });
      } catch {
        // Authentication remains valid when the optional profile timestamp cannot be written.
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchAllAuthors, resolveAuthor]);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError(getGoogleSignInError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    setCurrentAuthor(null);
    setAuthError(null);
    await signOut(auth);
  }, []);

  const isAuthorized = Boolean(firebaseUser && currentAuthor);
  const isCoFounder = currentAuthor?.role === 'CO_FOUNDER';
  const isContributor = currentAuthor?.role === 'CONTRIBUTOR';

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user: firebaseUser,
      currentAuthor,
      role: currentAuthor?.role,
      loading,
      isAuthorized,
      isCoFounder,
      isContributor,
      canPublish: isCoFounder,
      canReview: isCoFounder,
      loginWithGoogle,
      signInWithGoogle: loginWithGoogle,
      logout,
      signOutUser: logout,
      refreshAuthorProfile: async () => { await fetchAllAuthors(); },
      allAuthors,
      authError,
      clearAuthError: () => setAuthError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

function getGoogleSignInError(error: unknown): string {
  const code = (error as { code?: string }).code;
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Google sign-in. Add it in Firebase Authentication before trying again.';
  }
  if (code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled before it completed.';
  return 'Google sign-in could not be completed. Please try again or contact the CMS administrator.';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
