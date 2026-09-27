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

export interface UnauthorizedDomainInfo {
  domain: string;
  projectId: string;
  consoleUrl: string;
}

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
  loginWithGoogleRedirect: () => Promise<void>;
  signInWithEditorialKey: (authorId: string, key: string) => boolean;
  signInAsPreset: (authorId: string) => boolean;
  simulateCoFounderLogin: (authorId: string) => boolean;
  logout: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshAuthorProfile: () => Promise<void>;
  allAuthors: Author[];
  authError: string | null;
  unauthorizedDomainInfo: UnauthorizedDomainInfo | null;
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
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<UnauthorizedDomainInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'blog.thatvetguy.net') {
        return {
          domain: host,
          projectId: 'adroit-bus-1ghtt',
          consoleUrl: 'https://console.firebase.google.com/project/adroit-bus-1ghtt/authentication/settings',
        };
      }
    }
    return null;
  });

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

  // Restore stored session if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuthorId = localStorage.getItem('tvg_active_author_id');
      if (savedAuthorId) {
        const found = allAuthors.find((a) => a.id === savedAuthorId || a.slug === savedAuthorId);
        if (found) {
          setCurrentAuthor(found);
        }
      }
    }
  }, [allAuthors]);

  useEffect(() => {
    let active = true;
    const finishRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error('[ThatVetGuy Auth] Redirect result error:', error);
        if (active) {
          const code = (error as { code?: string }).code;
          if (code === 'auth/unauthorized-domain') {
            const host = typeof window !== 'undefined' ? window.location.hostname : 'blog.thatvetguy.net';
            setUnauthorizedDomainInfo({
              domain: host,
              projectId: 'adroit-bus-1ghtt',
              consoleUrl: 'https://console.firebase.google.com/project/adroit-bus-1ghtt/authentication/settings',
            });
          }
          setAuthError(getGoogleSignInError(error));
        }
      }
    };
    void finishRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);

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
      if (typeof window !== 'undefined') {
        localStorage.setItem('tvg_active_author_id', matched.id);
      }
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
      console.error('[ThatVetGuy Auth] Sign-in popup error:', error);
      const code = (error as { code?: string }).code;
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'blog.thatvetguy.net';
        setUnauthorizedDomainInfo({
          domain: host,
          projectId: 'adroit-bus-1ghtt',
          consoleUrl: 'https://console.firebase.google.com/project/adroit-bus-1ghtt/authentication/settings',
        });
        setAuthError(`Domain authorization required: "${host}" is not yet in the Firebase authorized domains list.`);
        return;
      }
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('[ThatVetGuy Auth] Fallback redirect error:', redirectErr);
          setAuthError(getGoogleSignInError(redirectErr));
          return;
        }
      }
      setAuthError(getGoogleSignInError(error));
    }
  }, []);

  const loginWithGoogleRedirect = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: unknown) {
      console.error('[ThatVetGuy Auth] Direct redirect error:', error);
      const code = (error as { code?: string }).code;
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'blog.thatvetguy.net';
        setUnauthorizedDomainInfo({
          domain: host,
          projectId: 'adroit-bus-1ghtt',
          consoleUrl: 'https://console.firebase.google.com/project/adroit-bus-1ghtt/authentication/settings',
        });
      }
      setAuthError(getGoogleSignInError(error));
    }
  }, []);

  const signInWithEditorialKey = useCallback((authorId: string, key: string): boolean => {
    setAuthError(null);
    const cleanKey = key.trim().toLowerCase();
    // Valid editorial team passkeys
    if (cleanKey !== 'thatvetguy2026' && cleanKey !== 'tvg2026' && cleanKey !== 'thatvetguy') {
      setAuthError('Invalid Editorial Passkey. Please verify your clinical team credentials.');
      return false;
    }

    const author = allAuthors.find((a) => a.id === authorId || a.slug === authorId);
    if (!author) {
      setAuthError('Selected Co-Founder profile was not found in the editorial roster.');
      return false;
    }

    setCurrentAuthor(author);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tvg_active_author_id', author.id);
    }
    setLoading(false);
    return true;
  }, [allAuthors]);

  const logout = useCallback(async () => {
    setCurrentAuthor(null);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tvg_active_author_id');
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }, []);

  const isAuthorized = Boolean((firebaseUser && currentAuthor) || currentAuthor);
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
      loginWithGoogleRedirect,
      signInWithEditorialKey,
      signInAsPreset: (authorId: string) => signInWithEditorialKey(authorId, 'thatvetguy2026'),
      simulateCoFounderLogin: (authorId: string) => signInWithEditorialKey(authorId, 'thatvetguy2026'),
      logout,
      signOutUser: logout,
      refreshAuthorProfile: async () => { await fetchAllAuthors(); },
      allAuthors,
      authError,
      unauthorizedDomainInfo,
      clearAuthError: () => setAuthError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

function getGoogleSignInError(error: unknown): string {
  const code = (error as { code?: string }).code;
  const msg = (error as { message?: string }).message || '';
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'blog.thatvetguy.net';
    return `Domain authorization required: "${host}" is not authorized in Firebase Authentication.`;
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completion. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by browser. Please allow popups or use the Redirect option.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network request failed. Please check your internet connection.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Console. Please verify Authentication providers.';
  }
  if (msg) {
    return `Google sign-in error: ${msg.replace(/Firebase:\s*/, '')}`;
  }
  return 'Google sign-in could not be completed. Please try again or use the Co-Founder Editorial Passkey.';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
