import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Author } from '../types';
import {
  getAuthorsFromFirestore,
  getCachedAuthors,
  updateAuthorProfileInFirestore,
} from '../services/authorService';
import {
  checkPhoneAuthorization,
  maskPhoneNumber,
  normalizePhoneNumber,
} from '../services/phoneAuthService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentAuthor: Author | null;
  loading: boolean;
  isAuthorized: boolean;
  authError: string | null;
  allAuthors: Author[];
  pendingPhone: string | null;
  maskedPhone: string | null;
  confirmationResult: ConfirmationResult | null;
  sendPhoneOtp: (phoneNumber: string, containerId?: string) => Promise<{ confirmationResult: ConfirmationResult; maskedPhone: string }>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  resendPhoneOtp: (containerId?: string) => Promise<void>;
  resetPhoneAuth: () => void;
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

  // Phone OTP Flow State
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);

  // Refresh authors catalog from Firestore
  const refreshAuthors = useCallback(async () => {
    try {
      const authors = await getAuthorsFromFirestore();
      setAllAuthors(authors);
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

      // Verify Firebase UID + authorized CMS user record + active status
      try {
        const cmsUserDoc = await getDoc(doc(db, 'cms_users', user.uid));
        let authorId: string | null = null;
        let isRecordActive = false;

        if (cmsUserDoc.exists()) {
          const data = cmsUserDoc.data();
          if (data.status === 'ACTIVE' && data.role === 'CO_FOUNDER') {
            authorId = data.authorId || null;
            isRecordActive = true;
          }
        }

        // If not found in cms_users yet, verify phone number against authorized phone allowlist
        if (!authorId && user.phoneNumber) {
          const authCheck = await checkPhoneAuthorization(user.phoneNumber);
          if (authCheck.authorized && authCheck.record) {
            authorId = authCheck.record.authorId;
            isRecordActive = true;

            // Link UID to cms_users
            try {
              await setDoc(
                doc(db, 'cms_users', user.uid),
                {
                  uid: user.uid,
                  phoneNumber: user.phoneNumber,
                  authorId: authorId,
                  name: authCheck.record.name,
                  role: 'CO_FOUNDER',
                  status: 'ACTIVE',
                  lastLoginAt: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (err) {
              console.warn('[Auth] cms_users record creation notice:', err);
            }
          }
        }

        if (!authorId || !isRecordActive) {
          // User is authenticated in Firebase, but NOT an authorized active Co-Founder
          console.warn(`[Auth] User ${user.phoneNumber || user.uid} is not authorized.`);
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
        }
      } catch (err) {
        console.warn('[Auth] Authorization verification notice:', err);
        setAuthError('Your account does not have access to the CMS.');
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

  // Send Firebase Phone Authentication OTP
  const sendPhoneOtp = useCallback(
    async (rawPhone: string, containerId = 'recaptcha-container') => {
      setAuthError(null);
      setLoading(true);

      const normalized = normalizePhoneNumber(rawPhone);
      if (!normalized || normalized.length < 8) {
        setLoading(false);
        const err = 'Please enter a valid phone number.';
        setAuthError(err);
        throw new Error(err);
      }

      // CRITICAL: Check whether the phone number belongs to an authorized Co-Founder BEFORE sending OTP
      const authCheck = await checkPhoneAuthorization(normalized);
      if (!authCheck.authorized || !authCheck.record) {
        setLoading(false);
        const err = 'Your phone number is not authorized to access this CMS.';
        setAuthError(err);
        throw new Error(err);
      }

      try {
        // Setup reCAPTCHA verifier
        let verifier = (window as any).recaptchaVerifier;
        if (!verifier) {
          verifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              console.warn('reCAPTCHA expired, please try again.');
            },
          });
          (window as any).recaptchaVerifier = verifier;
        }

        // Send OTP via Firebase Authentication
        const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
        setConfirmationResult(confirmation);
        setPendingPhone(normalized);
        const masked = maskPhoneNumber(normalized);
        setMaskedPhone(masked);
        setLoading(false);
        return { confirmationResult: confirmation, maskedPhone: masked };
      } catch (err: any) {
        setLoading(false);
        console.error('[Auth] signInWithPhoneNumber error:', err);

        // Reset verifier on error
        try {
          (window as any).recaptchaVerifier?.clear();
          (window as any).recaptchaVerifier = null;
        } catch {
          // ignore
        }

        let userFriendlyMsg = 'Failed to send OTP. Please check the phone number and try again.';
        if (err.code === 'auth/invalid-phone-number') {
          userFriendlyMsg = 'The phone number format is invalid.';
        } else if (err.code === 'auth/too-many-requests') {
          userFriendlyMsg = 'Too many requests. Please wait a few moments before trying again.';
        } else if (err.code === 'auth/quota-exceeded') {
          userFriendlyMsg = 'SMS quota exceeded. Please contact the administrator.';
        } else if (err.code === 'auth/captcha-check-failed') {
          userFriendlyMsg = 'Security verification failed. Please refresh the page and try again.';
        } else if (err.code === 'auth/unauthorized-domain') {
          userFriendlyMsg = 'This domain is not yet authorized in Firebase Console for Phone Authentication.';
        } else if (err.message) {
          userFriendlyMsg = err.message;
        }

        setAuthError(userFriendlyMsg);
        throw new Error(userFriendlyMsg);
      }
    },
    []
  );

  // Verify entered OTP code
  const verifyPhoneOtp = useCallback(
    async (otp: string) => {
      setAuthError(null);
      setLoading(true);

      if (!confirmationResult) {
        setLoading(false);
        const err = 'No active OTP verification session. Please request a new OTP.';
        setAuthError(err);
        throw new Error(err);
      }

      const cleanOtp = otp.trim().replace(/\D/g, '');
      if (cleanOtp.length !== 6) {
        setLoading(false);
        const err = 'Please enter a valid 6-digit OTP code.';
        setAuthError(err);
        throw new Error(err);
      }

      try {
        // Firebase verifies OTP
        const userCredential = await confirmationResult.confirm(cleanOtp);
        const user = userCredential.user;

        // Verify authenticated Firebase UID + authorized CMS user record + active status
        const verifiedPhone = user.phoneNumber || pendingPhone;
        if (!verifiedPhone) {
          throw new Error('Phone number could not be verified.');
        }

        const authCheck = await checkPhoneAuthorization(verifiedPhone);
        if (!authCheck.authorized || !authCheck.record) {
          await signOut(auth);
          throw new Error('Your account does not have access to the CMS.');
        }

        const { authorId, name } = authCheck.record;

        // Verify or create cms_users/{uid}
        const cmsUserRef = doc(db, 'cms_users', user.uid);
        const cmsUserSnap = await getDoc(cmsUserRef);

        if (cmsUserSnap.exists()) {
          const cmsData = cmsUserSnap.data();
          if (cmsData.status !== 'ACTIVE' || cmsData.role !== 'CO_FOUNDER') {
            await signOut(auth);
            throw new Error('Your account does not have access to the CMS.');
          }
        } else {
          // Bind Firebase UID to authorized Co-Founder record
          await setDoc(
            cmsUserRef,
            {
              uid: user.uid,
              phoneNumber: verifiedPhone,
              authorId: authorId,
              name: name,
              role: 'CO_FOUNDER',
              status: 'ACTIVE',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Match current author
        const authors = await getAuthorsFromFirestore();
        const matchedAuthor = authors.find((a) => a.id === authorId);
        if (matchedAuthor) {
          setCurrentAuthor(matchedAuthor);
        }

        setFirebaseUser(user);
        setConfirmationResult(null);
        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        let msg = 'Failed to verify OTP. Please check the code and try again.';
        if (err.code === 'auth/invalid-verification-code') {
          msg = 'Invalid OTP code. Please enter the correct 6-digit code.';
        } else if (err.code === 'auth/code-expired') {
          msg = 'This OTP code has expired. Please click Resend OTP to get a new code.';
        } else if (err.message) {
          msg = err.message;
        }
        setAuthError(msg);
        throw new Error(msg);
      }
    },
    [confirmationResult, pendingPhone]
  );

  // Resend OTP
  const resendPhoneOtp = useCallback(
    async (containerId = 'recaptcha-container') => {
      if (!pendingPhone) {
        throw new Error('No phone number specified to resend OTP.');
      }
      await sendPhoneOtp(pendingPhone, containerId);
    },
    [pendingPhone, sendPhoneOtp]
  );

  // Reset phone authentication flow back to Screen 1
  const resetPhoneAuth = useCallback(() => {
    setConfirmationResult(null);
    setPendingPhone(null);
    setMaskedPhone(null);
    setAuthError(null);
    try {
      (window as any).recaptchaVerifier?.clear();
      (window as any).recaptchaVerifier = null;
    } catch {
      // ignore
    }
  }, []);

  // Logout - completely ends CMS session
  const logout = useCallback(async () => {
    setLoading(true);
    resetPhoneAuth();
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    } finally {
      setFirebaseUser(null);
      setCurrentAuthor(null);
      setAuthError(null);
      setLoading(false);
    }
  }, [resetPhoneAuth]);

  // Update current author profile
  const updateCurrentAuthorProfile = useCallback(
    async (updates: Partial<Author>): Promise<Author> => {
      if (!currentAuthor) {
        throw new Error('No authenticated author to update.');
      }
      const updated = await updateAuthorProfileInFirestore(currentAuthor.id, updates);
      setCurrentAuthor(updated);
      setAllAuthors((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      return updated;
    },
    [currentAuthor]
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

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
        pendingPhone,
        maskedPhone,
        confirmationResult,
        sendPhoneOtp,
        verifyPhoneOtp,
        resendPhoneOtp,
        resetPhoneAuth,
        logout,
        updateCurrentAuthorProfile,
        refreshAuthors,
        clearAuthError,
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
