import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Author, UserRole } from '../types';
import { AUTHORS } from '../data/authors';

// Initial pre-configured Co-Founder profiles based on official data
export const INITIAL_CO_FOUNDERS: Author[] = [
  ...AUTHORS,
];

// Approved Co-Founder emails mapping
export const APPROVED_EMAILS_MAP: Record<string, string> = {
  'chiragpatidar0369@gmail.com': 'dr-chirag-patidar',
  'chirag@thatvetguy.net': 'dr-chirag-patidar',
  'amaan@thatvetguy.net': 'dr-amaan-ahmed',
  'shivam@thatvetguy.net': 'dr-shivam-singh-thakur',
  'ritesh@thatvetguy.net': 'dr-ritesh-verma',
  'deepesh.mathur@thatvetguy.net': 'dr-deepesh-mathur',
  'deepesh.chaware@thatvetguy.net': 'dr-deepesh-chaware',
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentAuthor: Author | null;
  loading: boolean;
  isAuthorized: boolean;
  isCoFounder: boolean;
  isContributor: boolean;
  canPublish: boolean;
  canReview: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  simulateCoFounderLogin: (authorId: string) => Promise<void>;
  refreshAuthorProfile: () => Promise<void>;
  allAuthors: Author[];
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [allAuthors, setAllAuthors] = useState<Author[]>(INITIAL_CO_FOUNDERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSessionOverride, setActiveSessionOverride] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tvg_active_author_id');
    }
    return null;
  });

  // Seed initial co-founders into Firestore if users collection is empty
  const seedFirestoreUsersIfNeeded = useCallback(async () => {
    try {
      const usersColRef = collection(db, 'users');
      const snap = await getDocs(usersColRef);
      if (snap.empty) {
        // Seed all 6 Co-Founders
        for (const author of INITIAL_CO_FOUNDERS) {
          const userDocRef = doc(db, 'users', author.id);
          await setDoc(userDocRef, {
            ...author,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Could not seed users to Firestore (permissions or offline):', err);
    }
  }, []);

  // Fetch all authors from Firestore or fallback
  const fetchAllAuthors = useCallback(async () => {
    try {
      const usersColRef = collection(db, 'users');
      const snap = await getDocs(usersColRef);
      if (!snap.empty) {
        const list: Author[] = [];
        snap.forEach((d) => {
          const data = d.data() as Author;
          list.push({ ...data, id: d.id });
        });
        setAllAuthors(list);
        return list;
      }
    } catch (err) {
      console.warn('Error fetching authors from Firestore:', err);
    }
    setAllAuthors(INITIAL_CO_FOUNDERS);
    return INITIAL_CO_FOUNDERS;
  }, []);

  // Resolve author profile from email or authorId
  const resolveAuthor = useCallback(
    async (email: string | null, authorIdOverride?: string | null): Promise<Author | null> => {
      const authors = await fetchAllAuthors();

      // If active session override is specified, use that author
      if (authorIdOverride) {
        const found = authors.find((a) => a.id === authorIdOverride || a.slug === authorIdOverride);
        if (found) return found;
      }

      if (!email) return null;

      const normalizedEmail = email.toLowerCase().trim();

      // Check approved mapping
      const mappedAuthorId = APPROVED_EMAILS_MAP[normalizedEmail];
      if (mappedAuthorId) {
        const found = authors.find((a) => a.id === mappedAuthorId || a.slug === mappedAuthorId);
        if (found) return found;
      }

      // Check by email directly on authors
      const directMatch = authors.find(
        (a) => a.socials.email && a.socials.email.toLowerCase() === normalizedEmail
      );
      if (directMatch) return directMatch;

      // Check if user is created in Firestore by email
      try {
        const snap = await getDocs(collection(db, 'users'));
        for (const d of snap.docs) {
          const data = d.data() as Author;
          if (data.socials?.email?.toLowerCase() === normalizedEmail) {
            return { ...data, id: d.id };
          }
        }
      } catch (e) {
        // ignore
      }

      return null;
    },
    [fetchAllAuthors]
  );

  const refreshAuthorProfile = useCallback(async () => {
    if (activeSessionOverride) {
      const authFound = await resolveAuthor(null, activeSessionOverride);
      if (authFound) {
        setCurrentAuthor(authFound);
        setIsAuthorized(true);
        return;
      }
    }

    if (firebaseUser?.email) {
      const authFound = await resolveAuthor(firebaseUser.email);
      if (authFound) {
        setCurrentAuthor(authFound);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    }
  }, [activeSessionOverride, firebaseUser, resolveAuthor]);

  useEffect(() => {
    seedFirestoreUsersIfNeeded();
    fetchAllAuthors();
  }, [seedFirestoreUsersIfNeeded, fetchAllAuthors]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthError(null);

      // Check if session override is active (for testing co-founders or local preview)
      if (activeSessionOverride) {
        const authFound = await resolveAuthor(null, activeSessionOverride);
        if (authFound) {
          setCurrentAuthor(authFound);
          setIsAuthorized(true);
          setLoading(false);
          return;
        }
      }

      if (user && user.email) {
        const matched = await resolveAuthor(user.email);
        if (matched) {
          setCurrentAuthor(matched);
          setIsAuthorized(true);
          // Sync with Firestore user record
          try {
            await setDoc(
              doc(db, 'users', matched.id),
              {
                uid: user.uid,
                email: user.email,
                lastLoginAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Could not update user lastLoginAt:', e);
          }
        } else {
          setCurrentAuthor(null);
          setIsAuthorized(false);
          setAuthError(
            `Access restricted: The Google account (${user.email}) is not an approved ThatVetGuy Co-Founder or Contributor.`
          );
        }
      } else {
        if (!activeSessionOverride) {
          setCurrentAuthor(null);
          setIsAuthorized(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeSessionOverride, resolveAuthor]);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        const matched = await resolveAuthor(user.email);
        if (!matched) {
          setAuthError(
            `Access restricted: The Google account (${user.email}) is not an approved ThatVetGuy Co-Founder or Contributor.`
          );
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Popup blocked by browser. Please allow popups or use the direct Co-Founder access option below.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google. Please try again.');
      }
      throw err;
    }
  };

  const simulateCoFounderLogin = async (authorId: string) => {
    setActiveSessionOverride(authorId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tvg_active_author_id', authorId);
    }
    const matched = await resolveAuthor(null, authorId);
    if (matched) {
      setCurrentAuthor(matched);
      setIsAuthorized(true);
      setAuthError(null);
    }
  };

  const logout = async () => {
    setActiveSessionOverride(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tvg_active_author_id');
    }
    setCurrentAuthor(null);
    setIsAuthorized(false);
    setAuthError(null);
    await signOut(auth);
  };

  const clearAuthError = () => setAuthError(null);

  const isCoFounder = currentAuthor?.role === 'CO_FOUNDER';
  const isContributor = currentAuthor?.role === 'CONTRIBUTOR';
  const canPublish = isCoFounder; // All six Co-Founders have equal publishing authority
  const canReview = isCoFounder; // All six Co-Founders have review & approval authority

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentAuthor,
        loading,
        isAuthorized,
        isCoFounder,
        isContributor,
        canPublish,
        canReview,
        loginWithGoogle,
        logout,
        simulateCoFounderLogin,
        refreshAuthorProfile,
        allAuthors,
        authError,
        clearAuthError,
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
