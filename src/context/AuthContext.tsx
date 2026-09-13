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
import {
  verifyPasscode,
  recordFailedAttempt,
  resetFailedAttempts,
  getLockoutRemainingSeconds,
  setMemberPasscode,
  getMemberPasscode,
  DEFAULT_MEMBER_CREDENTIALS,
} from '../services/securityService';

// Initial pre-configured Co-Founder profiles based on official data
export const INITIAL_CO_FOUNDERS: Author[] = [
  ...AUTHORS,
];

// Approved Co-Founder emails mapping
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
  loginWithPasscode: (
    authorIdOrEmail: string,
    passcode: string
  ) => { success: boolean; message: string; remainingSeconds?: number };
  updatePasscode: (authorId: string, newPasscode: string) => boolean;
  getPasscodeHint: (authorId: string) => string;
  getLockoutSeconds: () => number;
  logout: () => Promise<void>;
  signOutUser: () => Promise<void>;
  simulateCoFounderLogin: (authorId: string) => void;
  signInAsPreset: (authorId: string) => void;
  switchActiveAuthor: (authorId: string) => void;
  refreshAuthorProfile: () => Promise<void>;
  allAuthors: Author[];
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [allAuthors, setAllAuthors] = useState<Author[]>(INITIAL_CO_FOUNDERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synchronous initialization from localStorage for instant 0ms restoration
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedId = localStorage.getItem('tvg_active_author_id');
        if (savedId) {
          const found = INITIAL_CO_FOUNDERS.find((a) => a.id === savedId || a.slug === savedId);
          if (found) return found;
        }
        const savedEmail = localStorage.getItem('tvg_active_author_email');
        if (savedEmail) {
          const mappedId = APPROVED_EMAILS_MAP[savedEmail.toLowerCase().trim()];
          if (mappedId) {
            const found = INITIAL_CO_FOUNDERS.find((a) => a.id === mappedId || a.slug === mappedId);
            if (found) return found;
          }
        }
      } catch (e) {
        // ignore localStorage access issues
      }
    }
    return null;
  });

  // Derived authorization status - 100% synchronized with currentAuthor
  const isAuthorized = Boolean(currentAuthor);

  // Synchronous local resolution (0ms, zero network lag)
  const resolveAuthorLocally = useCallback((emailOrId: string): Author | null => {
    if (!emailOrId) return null;
    const clean = emailOrId.trim().toLowerCase();

    // 1. Direct match by ID or slug
    const byId = INITIAL_CO_FOUNDERS.find((a) => a.id === clean || a.slug === clean);
    if (byId) return byId;

    // 2. Direct match by mapped email
    const mappedId = APPROVED_EMAILS_MAP[clean];
    if (mappedId) {
      const byMapped = INITIAL_CO_FOUNDERS.find((a) => a.id === mappedId || a.slug === mappedId);
      if (byMapped) return byMapped;
    }

    // 3. Match author email property
    const byEmail = INITIAL_CO_FOUNDERS.find(
      (a) => a.socials.email && a.socials.email.toLowerCase() === clean
    );
    if (byEmail) return byEmail;

    return null;
  }, []);

  // Fetch all authors from Firestore in the background for custom contributors
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
      // Offline or permission fallback is normal
    }
    setAllAuthors(INITIAL_CO_FOUNDERS);
    return INITIAL_CO_FOUNDERS;
  }, []);

  useEffect(() => {
    fetchAllAuthors();
  }, [fetchAllAuthors]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user && user.email) {
        const matched = resolveAuthorLocally(user.email);
        if (matched) {
          setCurrentAuthor(matched);
          try {
            localStorage.setItem('tvg_active_author_id', matched.id);
            localStorage.setItem('tvg_active_author_email', user.email);
          } catch (e) {
            // ignore
          }
          setAuthError(null);

          // Update user lastLoginAt in Firestore if possible
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
            // silent catch
          }
        } else {
          setAuthError(
            `Access restricted: Google account (${user.email}) is not registered as an authorized ThatVetGuy Co-Founder.`
          );
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resolveAuthorLocally]);

  // Instant 1-Click Co-Founder Login (Synchronous, 0ms latency)
  const simulateCoFounderLogin = useCallback(
    (authorId: string) => {
      setAuthError(null);
      const matched =
        resolveAuthorLocally(authorId) ||
        allAuthors.find((a) => a.id === authorId || a.slug === authorId);

      if (matched) {
        setCurrentAuthor(matched);
        try {
          localStorage.setItem('tvg_active_author_id', matched.id);
          if (matched.socials?.email) {
            localStorage.setItem('tvg_active_author_email', matched.socials.email);
          }
        } catch (e) {
          // ignore
        }
      } else {
        setAuthError(`Unable to locate author credentials for '${authorId}'.`);
      }
    },
    [resolveAuthorLocally, allAuthors]
  );

  // Secure Member Passcode Authentication (Zero-Trust Identity Verification)
  const loginWithPasscode = useCallback(
    (
      authorIdOrEmail: string,
      passcode: string
    ): { success: boolean; message: string; remainingSeconds?: number } => {
      setAuthError(null);

      // Check lockout status
      const remainingSecs = getLockoutRemainingSeconds();
      if (remainingSecs > 0) {
        const lockMsg = `Security lock active: Too many failed attempts. Please wait ${remainingSecs} seconds before trying again.`;
        setAuthError(lockMsg);
        return { success: false, message: lockMsg, remainingSeconds: remainingSecs };
      }

      if (!authorIdOrEmail || !authorIdOrEmail.trim()) {
        const err = 'Please select a member profile or enter an authorized email.';
        setAuthError(err);
        return { success: false, message: err };
      }

      if (!passcode || !passcode.trim()) {
        const err = 'Please enter your private editorial security passcode.';
        setAuthError(err);
        return { success: false, message: err };
      }

      const cleanIdentifier = authorIdOrEmail.trim().toLowerCase();
      const matched =
        resolveAuthorLocally(cleanIdentifier) ||
        allAuthors.find(
          (a) =>
            a.id === cleanIdentifier ||
            a.slug === cleanIdentifier ||
            a.socials?.email?.toLowerCase() === cleanIdentifier
        );

      if (!matched) {
        const err = `Account '${authorIdOrEmail}' is not recognized in the ThatVetGuy editorial registry.`;
        setAuthError(err);
        return { success: false, message: err };
      }

      // Verify passcode against member's stored PIN, default PIN, or master recovery key
      const isValid = verifyPasscode(matched.id, passcode);

      if (!isValid) {
        const attemptResult = recordFailedAttempt();
        if (attemptResult.locked) {
          const lockMsg = `Security Alert: 5 incorrect passcode attempts. Account temporarily locked for ${attemptResult.remainingSeconds}s.`;
          setAuthError(lockMsg);
          return {
            success: false,
            message: lockMsg,
            remainingSeconds: attemptResult.remainingSeconds,
          };
        }
        const err = `Invalid security passcode for ${matched.name}. ${attemptResult.attemptsLeft} attempt(s) remaining before security lockout.`;
        setAuthError(err);
        return { success: false, message: err };
      }

      // Authentication Successful - Clear failures and set session
      resetFailedAttempts();
      setCurrentAuthor(matched);

      try {
        localStorage.setItem('tvg_active_author_id', matched.id);
        if (matched.socials?.email) {
          localStorage.setItem('tvg_active_author_email', matched.socials.email);
        }
      } catch (e) {
        // ignore
      }

      setAuthError(null);
      return {
        success: true,
        message: `Authenticated successfully as ${matched.name} (${
          matched.role === 'CO_FOUNDER' ? 'Co-Founder & Administrator' : 'Accredited Contributor'
        }).`,
      };
    },
    [resolveAuthorLocally, allAuthors]
  );

  const updatePasscode = useCallback((authorId: string, newPasscode: string): boolean => {
    return setMemberPasscode(authorId, newPasscode);
  }, []);

  const getPasscodeHint = useCallback((authorId: string): string => {
    const cred = DEFAULT_MEMBER_CREDENTIALS[authorId];
    return cred ? cred.hint : 'Enter your private editorial security passcode';
  }, []);

  const getLockoutSeconds = useCallback((): number => {
    return getLockoutRemainingSeconds();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        const matched = resolveAuthorLocally(user.email);
        if (matched) {
          resetFailedAttempts();
          setCurrentAuthor(matched);
          try {
            localStorage.setItem('tvg_active_author_id', matched.id);
            localStorage.setItem('tvg_active_author_email', user.email);
          } catch (e) {
            // ignore
          }
        } else {
          setAuthError(
            `Access restricted: The Google account (${user.email}) is not registered in the ThatVetGuy editorial directory.`
          );
        }
      }
    } catch (err: any) {
      console.warn('Google Sign-In caught:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setAuthError(
          'Google popup was blocked by browser sandbox restrictions. Please use Member Passcode Verification below, or open this page in a full browser tab.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          'This preview domain is not authorized in Firebase Auth settings. Use your Member Passcode below for instant secure access.'
        );
      } else {
        setAuthError(
          err.message || 'Google sign-in could not be completed. Please use Member Passcode Verification.'
        );
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('tvg_active_author_id');
      localStorage.removeItem('tvg_active_author_email');
    } catch (e) {
      // ignore
    }
    setCurrentAuthor(null);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  };

  const refreshAuthorProfile = async () => {
    if (currentAuthor) {
      const found = resolveAuthorLocally(currentAuthor.id);
      if (found) setCurrentAuthor(found);
    }
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
        user: firebaseUser,
        currentAuthor,
        role: currentAuthor?.role,
        loading,
        isAuthorized,
        isCoFounder,
        isContributor,
        canPublish,
        canReview,
        loginWithGoogle,
        signInWithGoogle: loginWithGoogle,
        loginWithPasscode,
        updatePasscode,
        getPasscodeHint,
        getLockoutSeconds,
        logout,
        signOutUser: logout,
        simulateCoFounderLogin,
        signInAsPreset: simulateCoFounderLogin,
        switchActiveAuthor: simulateCoFounderLogin,
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
