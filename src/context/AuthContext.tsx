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
  verifyCredentials,
  changeUserPassword,
  adminSetUserPassword,
  resetPasswordWithMasterKey,
  getPasswordStatus,
  recordFailedAttempt,
  resetFailedAttempts,
  getLockoutRemainingSeconds,
  DEFAULT_MEMBER_CREDENTIALS,
  MASTER_ADMIN_KEY,
} from '../services/securityService';
import { logAuditEvent } from '../services/auditService';

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
  loginWithCredentials: (
    usernameOrEmail: string,
    password: string
  ) => { success: boolean; message: string; remainingSeconds?: number };
  loginWithPasscode: (
    authorIdOrEmail: string,
    passcode: string
  ) => { success: boolean; message: string; remainingSeconds?: number };
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; message: string };
  adminUpdateMemberPassword: (
    authorId: string,
    newPassword: string
  ) => { success: boolean; message: string };
  updatePasscode: (authorId: string, newPasscode: string) => boolean;
  resetPasswordWithKey: (
    usernameOrEmail: string,
    recoveryKey: string,
    newPassword: string
  ) => { success: boolean; message: string };
  getPasswordStatus: (authorId: string) => { isCustom: boolean; lastUpdated: string | null };
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

  // Username & Password Authentication
  const loginWithCredentials = useCallback(
    (
      usernameOrEmail: string,
      passwordInput: string
    ): { success: boolean; message: string; remainingSeconds?: number } => {
      setAuthError(null);

      // Check lockout status
      const remainingSecs = getLockoutRemainingSeconds();
      if (remainingSecs > 0) {
        const lockMsg = `Security lock active: Too many failed attempts. Please wait ${remainingSecs} seconds before trying again.`;
        setAuthError(lockMsg);
        return { success: false, message: lockMsg, remainingSeconds: remainingSecs };
      }

      if (!usernameOrEmail || !usernameOrEmail.trim()) {
        const err = 'Please enter your username or registered email.';
        setAuthError(err);
        return { success: false, message: err };
      }

      if (!passwordInput || !passwordInput.trim()) {
        const err = 'Please enter your account password.';
        setAuthError(err);
        return { success: false, message: err };
      }

      const verifyResult = verifyCredentials(usernameOrEmail, passwordInput, allAuthors);
      if (!verifyResult.valid || !verifyResult.authorId) {
        const attemptResult = recordFailedAttempt();
        if (attemptResult.locked) {
          const lockMsg = `Security Alert: 5 incorrect password attempts. Account temporarily locked for ${attemptResult.remainingSeconds}s.`;
          setAuthError(lockMsg);
          return {
            success: false,
            message: lockMsg,
            remainingSeconds: attemptResult.remainingSeconds,
          };
        }
        const err = `${verifyResult.error || 'Invalid credentials.'} (${attemptResult.attemptsLeft} attempt(s) remaining before security lockout)`;
        setAuthError(err);
        return { success: false, message: err };
      }

      const matched =
        allAuthors.find(
          (a) => a.id === verifyResult.authorId || a.slug === verifyResult.authorId
        ) || resolveAuthorLocally(verifyResult.authorId);

      if (!matched) {
        const err = 'User profile was not found in the local directory.';
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

      // Security audit log
      logAuditEvent(
        'LOGIN',
        { id: matched.id, name: matched.name, role: matched.role },
        `User signed in with credentials as ${matched.role}`
      ).catch(() => {});

      setAuthError(null);
      return {
        success: true,
        message: `Welcome back, ${matched.name}! Authenticated as ${
          matched.role === 'CO_FOUNDER' ? 'Co-Founder & Administrator' : 'Accredited Contributor'
        }.`,
      };
    },
    [resolveAuthorLocally, allAuthors]
  );

  // Backward-compatible alias for passcode
  const loginWithPasscode = useCallback(
    (
      authorIdOrEmail: string,
      passcode: string
    ): { success: boolean; message: string; remainingSeconds?: number } => {
      return loginWithCredentials(authorIdOrEmail, passcode);
    },
    [loginWithCredentials]
  );

  // Change Password for currently signed in user
  const changePassword = useCallback(
    (currentPassword: string, newPassword: string): { success: boolean; message: string } => {
      if (!currentAuthor) {
        return { success: false, message: 'You must be signed in to change your password.' };
      }
      const res = changeUserPassword(currentAuthor.id, currentPassword, newPassword);
      if (res.success) {
        logAuditEvent(
          'PASSWORD_CHANGE',
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `User updated their personal password`
        ).catch(() => {});
      }
      return res;
    },
    [currentAuthor]
  );

  // Admin changing password for any member
  const adminUpdateMemberPassword = useCallback(
    (authorId: string, newPassword: string): { success: boolean; message: string } => {
      const res = adminSetUserPassword(authorId, newPassword);
      if (res.success && currentAuthor) {
        logAuditEvent(
          'PASSWORD_CHANGE',
          { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
          `Administrator updated password for member "${authorId}"`
        ).catch(() => {});
      }
      return res;
    },
    [currentAuthor]
  );

  const updatePasscode = useCallback((authorId: string, newPasscode: string): boolean => {
    const res = adminSetUserPassword(authorId, newPasscode);
    return res.success;
  }, []);

  // Reset password using Emergency Master Admin Key
  const resetPasswordWithKey = useCallback(
    (
      usernameOrEmail: string,
      recoveryKey: string,
      newPassword: string
    ): { success: boolean; message: string } => {
      return resetPasswordWithMasterKey(usernameOrEmail, recoveryKey, newPassword, allAuthors);
    },
    [allAuthors]
  );

  const getPasscodeHint = useCallback((authorId: string): string => {
    const cred = DEFAULT_MEMBER_CREDENTIALS[authorId];
    return cred ? cred.hint : 'Enter your password';
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
          'Domain not authorized in Firebase Auth. To enable Google login on your live domain, add "blog.thatvetguy.net" to Firebase Console > Authentication > Settings > Authorized domains. For now, please use the 1-Click Quick Access buttons below!'
        );
      } else {
        setAuthError(
          err.message || 'Google sign-in could not be completed. Please use Member Passcode Verification.'
        );
      }
    }
  };

  const logout = async () => {
    if (currentAuthor) {
      logAuditEvent(
        'LOGOUT',
        { id: currentAuthor.id, name: currentAuthor.name, role: currentAuthor.role },
        `User signed out`
      ).catch(() => {});
    }
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
        loginWithCredentials,
        loginWithPasscode,
        changePassword,
        adminUpdateMemberPassword,
        updatePasscode,
        resetPasswordWithKey,
        getPasswordStatus,
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
