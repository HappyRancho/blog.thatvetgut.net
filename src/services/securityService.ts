/**
 * ThatVetGuy CMS - Editorial Security & Authentication Service
 * Username & Password Based Access Control with Customizable Passwords
 * for all six Co-Founders and accredited veterinary contributors.
 */

import { Author } from '../types';

export interface MemberSecurityRecord {
  authorId: string;
  name: string;
  username: string;
  aliases: string[];
  email: string;
  role: 'CO_FOUNDER' | 'CONTRIBUTOR';
  defaultPassword: string;
  hint: string;
}

// Master Administrator Emergency Recovery Key (exclusive to Lead Admin)
export const MASTER_ADMIN_KEY = 'TVG-FOUNDER-ADMIN-2025';

// Pre-configured Co-Founder & Staff Accounts with Usernames and Initial Passwords
export const DEFAULT_MEMBER_CREDENTIALS: Record<string, MemberSecurityRecord> = {
  'dr-chirag-patidar': {
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
    username: 'chirag',
    aliases: [
      'chirag',
      'drchirag',
      'dr-chirag',
      'chiragpatidar',
      'drchiragpatidar',
      'dr-chirag-patidar',
      'chiragpatidar0369@gmail.com',
      'chirag@thatvetguy.net',
      'drchiragpatidar@gmail.com',
    ],
    email: 'chiragpatidar0369@gmail.com',
    role: 'CO_FOUNDER',
    defaultPassword: 'Chirag@3690',
    hint: 'Username: chirag | Default Password: Chirag@3690 (or CP-3690)',
  },
  'dr-amaan-ahmed': {
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
    username: 'amaan',
    aliases: [
      'amaan',
      'dramaan',
      'dr-amaan',
      'amaanahmed',
      'dr-amaan-ahmed',
      'amaan@thatvetguy.net',
      'amaan.ahmed@thatvetguy.net',
    ],
    email: 'amaan.ahmed@thatvetguy.net',
    role: 'CO_FOUNDER',
    defaultPassword: 'Amaan@7860',
    hint: 'Username: amaan | Default Password: Amaan@7860 (or AA-7860)',
  },
  'dr-shivam-singh-thakur': {
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
    username: 'shivam',
    aliases: [
      'shivam',
      'drshivam',
      'dr-shivam',
      'shivamthakur',
      'dr-shivam-singh-thakur',
      'shivam@thatvetguy.net',
      'shivam.singh@thatvetguy.net',
    ],
    email: 'shivam.singh@thatvetguy.net',
    role: 'CO_FOUNDER',
    defaultPassword: 'Shivam@1008',
    hint: 'Username: shivam | Default Password: Shivam@1008 (or ST-1008)',
  },
  'dr-ritesh-verma': {
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
    username: 'ritesh',
    aliases: [
      'ritesh',
      'drritesh',
      'dr-ritesh',
      'riteshverma',
      'dr-ritesh-verma',
      'ritesh@thatvetguy.net',
      'ritesh.verma@thatvetguy.net',
    ],
    email: 'ritesh.verma@thatvetguy.net',
    role: 'CO_FOUNDER',
    defaultPassword: 'Ritesh@2025',
    hint: 'Username: ritesh | Default Password: Ritesh@2025 (or RV-2025)',
  },
  'dr-deepesh-mathur': {
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
    username: 'deepesh_m',
    aliases: [
      'deepesh_m',
      'deepeshm',
      'drdeepesh_m',
      'deepesh.mathur',
      'dr-deepesh-mathur',
      'deepesh.mathur@thatvetguy.net',
    ],
    email: 'deepesh.mathur@thatvetguy.net',
    role: 'CO_FOUNDER',
    defaultPassword: 'DeepeshM@5544',
    hint: 'Username: deepesh_m | Default Password: DeepeshM@5544 (or DM-5544)',
  },
  'dr-deepesh-chaware': {
    authorId: 'dr-deepesh-chaware',
    name: 'Dr. Deepesh Chaware',
    username: 'deepesh_c',
    aliases: [
      'deepesh_c',
      'deepeshc',
      'drdeepesh_c',
      'deepesh.chaware',
      'dr-deepesh-chaware',
      'deepesh.chaware@thatvetguy.net',
    ],
    email: 'deepesh.chaware@thatvetguy.net',
    role: 'CO_FOUNDER',
    defaultPassword: 'DeepeshC@8899',
    hint: 'Username: deepesh_c | Default Password: DeepeshC@8899 (or DC-8899)',
  },
};

export const DEFAULT_CONTRIBUTOR_PASSWORD = 'ThatVetGuy@2025';
export const LEGACY_CONTRIBUTOR_PASSCODE = 'TVG-CONTRIB-2025';

const STORAGE_PASSWORD_PREFIX = 'tvg_user_password_';
const STORAGE_UPDATED_PREFIX = 'tvg_user_password_updated_';
const LOCKOUT_KEY = 'tvg_auth_lockout_until';
const ATTEMPTS_KEY = 'tvg_auth_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout

/**
 * Resolve an author from input username, email, slug, or ID
 */
export function resolveAuthorByUsername(
  usernameOrEmail: string,
  allAuthors: Author[] = []
): { authorId: string; name: string; role: 'CO_FOUNDER' | 'CONTRIBUTOR'; email?: string } | null {
  if (!usernameOrEmail) return null;
  const clean = usernameOrEmail.trim().toLowerCase();

  // 1. Check direct configured Co-Founders by username, alias, email, or authorId
  for (const [authorId, cred] of Object.entries(DEFAULT_MEMBER_CREDENTIALS)) {
    if (
      cred.username.toLowerCase() === clean ||
      cred.email.toLowerCase() === clean ||
      authorId.toLowerCase() === clean ||
      cred.aliases.some((alias) => alias.toLowerCase() === clean)
    ) {
      return {
        authorId: cred.authorId,
        name: cred.name,
        role: cred.role,
        email: cred.email,
      };
    }
  }

  // 2. Check allAuthors dynamic list (e.g. Firestore contributors)
  const matchedAuthor = allAuthors.find((a) => {
    const aId = a.id.toLowerCase();
    const aSlug = (a.slug || '').toLowerCase();
    const aEmail = (a.socials?.email || '').toLowerCase();
    const aName = a.name.toLowerCase();
    return (
      aId === clean ||
      aSlug === clean ||
      aEmail === clean ||
      aName === clean ||
      aName.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
    );
  });

  if (matchedAuthor) {
    return {
      authorId: matchedAuthor.id,
      name: matchedAuthor.name,
      role: matchedAuthor.role === 'CO_FOUNDER' ? 'CO_FOUNDER' : 'CONTRIBUTOR',
      email: matchedAuthor.socials?.email,
    };
  }

  return null;
}

/**
 * Retrieves the currently active password for a member (custom or default)
 */
export function getMemberPassword(authorId: string): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${STORAGE_PASSWORD_PREFIX}${authorId}`);
      if (saved) return saved;
      // Also check legacy passcode key
      const legacy = localStorage.getItem(`tvg_sec_pin_${authorId}`);
      if (legacy) return legacy;
    } catch (e) {
      // ignore
    }
  }
  const rec = DEFAULT_MEMBER_CREDENTIALS[authorId];
  return rec ? rec.defaultPassword : DEFAULT_CONTRIBUTOR_PASSWORD;
}

/**
 * Check if the member has changed their default password
 */
export function getPasswordStatus(authorId: string): { isCustom: boolean; lastUpdated: string | null } {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${STORAGE_PASSWORD_PREFIX}${authorId}`);
      const updated = localStorage.getItem(`${STORAGE_UPDATED_PREFIX}${authorId}`);
      return {
        isCustom: !!saved,
        lastUpdated: updated || null,
      };
    } catch (e) {
      // ignore
    }
  }
  return { isCustom: false, lastUpdated: null };
}

/**
 * Verifies if the username and password are correct
 */
export function verifyCredentials(
  usernameOrEmail: string,
  inputPassword: string,
  allAuthors: Author[] = []
): { valid: boolean; authorId?: string; authorName?: string; error?: string } {
  if (!usernameOrEmail || !usernameOrEmail.trim()) {
    return { valid: false, error: 'Please enter your username or registered email.' };
  }
  if (!inputPassword || !inputPassword.trim()) {
    return { valid: false, error: 'Please enter your account password.' };
  }

  const cleanPass = inputPassword.trim();
  const authorMatch = resolveAuthorByUsername(usernameOrEmail, allAuthors);

  if (!authorMatch) {
    return {
      valid: false,
      error: `Username or email '${usernameOrEmail}' was not recognized. Please check your credentials or contact the Lead Administrator.`,
    };
  }

  // 1. Emergency Master Admin Key matches for any recognized member
  if (cleanPass === MASTER_ADMIN_KEY) {
    return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
  }

  // 2. Check Custom Changed Password from storage
  const activePassword = getMemberPassword(authorMatch.authorId);
  if (activePassword && cleanPass === activePassword) {
    return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
  }

  // 3. Check Default Member Password
  const defaultRec = DEFAULT_MEMBER_CREDENTIALS[authorMatch.authorId];
  if (defaultRec && cleanPass === defaultRec.defaultPassword) {
    return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
  }

  // 4. Check Legacy Passcode formats (e.g. CP-3690) for continuity
  if (defaultRec) {
    const legacyPasscode = defaultRec.defaultPassword.replace('@', '-');
    if (cleanPass.toUpperCase() === legacyPasscode.toUpperCase()) {
      return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
    }
    // Check specific known PINs
    const pinMap: Record<string, string> = {
      'dr-chirag-patidar': 'CP-3690',
      'dr-amaan-ahmed': 'AA-7860',
      'dr-shivam-singh-thakur': 'ST-1008',
      'dr-ritesh-verma': 'RV-2025',
      'dr-deepesh-mathur': 'DM-5544',
      'dr-deepesh-chaware': 'DC-8899',
    };
    if (pinMap[authorMatch.authorId] && cleanPass.toUpperCase() === pinMap[authorMatch.authorId]) {
      return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
    }
  }

  // 5. Check Contributor Default Passwords
  if (
    cleanPass === DEFAULT_CONTRIBUTOR_PASSWORD ||
    cleanPass.toUpperCase() === LEGACY_CONTRIBUTOR_PASSCODE
  ) {
    return { valid: true, authorId: authorMatch.authorId, authorName: authorMatch.name };
  }

  return {
    valid: false,
    error: `Incorrect password for ${authorMatch.name}. Please check your password or use 'Forgot / Reset Password'.`,
  };
}

/**
 * Change a user's password (requires verifying their current password or master key)
 */
export function changeUserPassword(
  authorId: string,
  currentPasswordInput: string,
  newPasswordInput: string
): { success: boolean; message: string } {
  if (!authorId) {
    return { success: false, message: 'Author ID is required to change password.' };
  }
  if (!newPasswordInput || newPasswordInput.trim().length < 6) {
    return {
      success: false,
      message: 'New password must be at least 6 characters long.',
    };
  }

  const cleanCurrent = currentPasswordInput ? currentPasswordInput.trim() : '';
  const cleanNew = newPasswordInput.trim();

  // Validate current password against existing active password or master key
  const activePassword = getMemberPassword(authorId);
  const defaultRec = DEFAULT_MEMBER_CREDENTIALS[authorId];
  const isMasterKey = cleanCurrent === MASTER_ADMIN_KEY;
  const isCurrentMatch = cleanCurrent === activePassword;
  const isDefaultMatch = defaultRec && cleanCurrent === defaultRec.defaultPassword;

  if (!isMasterKey && !isCurrentMatch && !isDefaultMatch) {
    return {
      success: false,
      message: 'The current password entered is incorrect. Please verify and try again.',
    };
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_PASSWORD_PREFIX}${authorId}`, cleanNew);
      localStorage.setItem(`${STORAGE_UPDATED_PREFIX}${authorId}`, new Date().toISOString());
      // Clean up old legacy PIN if present
      localStorage.setItem(`tvg_sec_pin_${authorId}`, cleanNew);
      return {
        success: true,
        message: 'Password updated successfully! Your new password will be required next time you log in.',
      };
    } catch (e) {
      return { success: false, message: 'Failed to persist password in browser storage.' };
    }
  }

  return { success: false, message: 'Window storage environment not available.' };
}

/**
 * Administrator setting a new password for any member (no current password needed)
 */
export function adminSetUserPassword(
  authorId: string,
  newPasswordInput: string
): { success: boolean; message: string } {
  if (!authorId) {
    return { success: false, message: 'Member ID is required.' };
  }
  if (!newPasswordInput || newPasswordInput.trim().length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }

  const cleanNew = newPasswordInput.trim();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_PASSWORD_PREFIX}${authorId}`, cleanNew);
      localStorage.setItem(`${STORAGE_UPDATED_PREFIX}${authorId}`, new Date().toISOString());
      localStorage.setItem(`tvg_sec_pin_${authorId}`, cleanNew);
      return {
        success: true,
        message: `Password updated successfully for member account.`,
      };
    } catch (e) {
      return { success: false, message: 'Failed to save member password.' };
    }
  }

  return { success: false, message: 'Storage not available.' };
}

/**
 * Reset password using Emergency Master Admin Key
 */
export function resetPasswordWithMasterKey(
  usernameOrEmail: string,
  masterKey: string,
  newPasswordInput: string,
  allAuthors: Author[] = []
): { success: boolean; message: string } {
  if (!masterKey || masterKey.trim() !== MASTER_ADMIN_KEY) {
    return {
      success: false,
      message: 'Invalid Master Administrator Recovery Key.',
    };
  }
  const resolved = resolveAuthorByUsername(usernameOrEmail, allAuthors);
  if (!resolved) {
    return {
      success: false,
      message: `Account '${usernameOrEmail}' was not found in the ThatVetGuy registry.`,
    };
  }

  return adminSetUserPassword(resolved.authorId, newPasswordInput);
}

/**
 * Check if login is currently locked due to brute-force protection
 */
export function getLockoutRemainingSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
  } catch (e) {
    // ignore
  }
  return 0;
}

/**
 * Record a failed attempt and trigger lockout if threshold is reached
 */
export function recordFailedAttempt(): {
  locked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  if (typeof window === 'undefined') {
    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }
  try {
    const current = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_KEY, current.toString());

    if (current >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
      return {
        locked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsLeft: 0,
      };
    }

    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - current };
  } catch (e) {
    return { locked: false, remainingSeconds: 0, attemptsLeft: 1 };
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetFailedAttempts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  } catch (e) {
    // ignore
  }
}

// Backward-compatible aliases
export const verifyPasscode = (authorId: string, passcode: string): boolean => {
  const res = verifyCredentials(authorId, passcode);
  return res.valid;
};
export const getMemberPasscode = getMemberPassword;
export const setMemberPasscode = (authorId: string, passcode: string): boolean => {
  const res = adminSetUserPassword(authorId, passcode);
  return res.success;
};
