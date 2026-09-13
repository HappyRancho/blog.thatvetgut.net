/**
 * ThatVetGuy CMS - Editorial Security & Member Passcode Service
 * Provides secure credential verification, brute-force defense, and access key management
 * for all six Co-Founders and accredited contributors.
 */

export interface MemberSecurityRecord {
  authorId: string;
  name: string;
  email: string;
  role: 'CO_FOUNDER' | 'CONTRIBUTOR';
  // Default secure passcodes (customizable in Admin Settings)
  passcode: string;
  hint: string;
}

// Master Administrator Emergency Recovery Key (exclusive to Lead Admin)
export const MASTER_ADMIN_KEY = 'TVG-FOUNDER-ADMIN-2025';

// Default secure passcodes for each member
export const DEFAULT_MEMBER_CREDENTIALS: Record<string, MemberSecurityRecord> = {
  'dr-chirag-patidar': {
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
    email: 'chiragpatidar0369@gmail.com',
    role: 'CO_FOUNDER',
    passcode: 'CP-3690',
    hint: 'CP-**** (Dr. Chirag Patidar Private PIN)',
  },
  'dr-amaan-ahmed': {
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
    email: 'amaan.ahmed@thatvetguy.net',
    role: 'CO_FOUNDER',
    passcode: 'AA-7860',
    hint: 'AA-**** (Dr. Amaan Ahmed Private PIN)',
  },
  'dr-shivam-singh-thakur': {
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
    email: 'shivam.singh@thatvetguy.net',
    role: 'CO_FOUNDER',
    passcode: 'ST-1008',
    hint: 'ST-**** (Dr. Shivam Singh Thakur Private PIN)',
  },
  'dr-ritesh-verma': {
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
    email: 'ritesh.verma@thatvetguy.net',
    role: 'CO_FOUNDER',
    passcode: 'RV-2025',
    hint: 'RV-**** (Dr. Ritesh Verma Private PIN)',
  },
  'dr-deepesh-mathur': {
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
    email: 'deepesh.mathur@thatvetguy.net',
    role: 'CO_FOUNDER',
    passcode: 'DM-5544',
    hint: 'DM-**** (Dr. Deepesh Mathur Private PIN)',
  },
  'dr-deepesh-chaware': {
    authorId: 'dr-deepesh-chaware',
    name: 'Dr. Deepesh Chaware',
    email: 'deepesh.chaware@thatvetguy.net',
    role: 'CO_FOUNDER',
    passcode: 'DC-8899',
    hint: 'DC-**** (Dr. Deepesh Chaware Private PIN)',
  },
};

export const DEFAULT_CONTRIBUTOR_PASSCODE = 'TVG-CONTRIB-2025';

const STORAGE_KEYS_PREFIX = 'tvg_sec_pin_';
const LOCKOUT_KEY = 'tvg_auth_lockout_until';
const ATTEMPTS_KEY = 'tvg_auth_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

/**
 * Retrieves the currently active passcode for a member (customized or default)
 */
export function getMemberPasscode(authorId: string): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEYS_PREFIX}${authorId}`);
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
  }
  const rec = DEFAULT_MEMBER_CREDENTIALS[authorId];
  return rec ? rec.passcode : DEFAULT_CONTRIBUTOR_PASSCODE;
}

/**
 * Updates a member's passcode
 */
export function setMemberPasscode(authorId: string, newPasscode: string): boolean {
  if (!newPasscode || newPasscode.trim().length < 4) {
    return false;
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEYS_PREFIX}${authorId}`, newPasscode.trim());
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Check if the login is currently locked due to too many failed attempts
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
 * Record a failed attempt and trigger lockout if limit is reached
 */
export function recordFailedAttempt(): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  if (typeof window === 'undefined') {
    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }
  try {
    const current = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_KEY, current.toString());

    if (current >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
      return { locked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
    }

    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - current };
  } catch (e) {
    return { locked: false, remainingSeconds: 0, attemptsLeft: 1 };
  }
}

/**
 * Reset failed attempts upon successful authentication
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

/**
 * Verifies if the provided passcode is valid for the author or matches master key
 */
export function verifyPasscode(authorId: string, inputPasscode: string): boolean {
  if (!inputPasscode) return false;
  const clean = inputPasscode.trim();

  // 1. Check Master Key
  if (clean === MASTER_ADMIN_KEY) {
    return true;
  }

  // 2. Check Member-Specific Passcode
  const expected = getMemberPasscode(authorId);
  if (clean.toLowerCase() === expected.toLowerCase()) {
    return true;
  }

  // 3. Check Default Credentials
  const def = DEFAULT_MEMBER_CREDENTIALS[authorId];
  if (def && clean.toLowerCase() === def.passcode.toLowerCase()) {
    return true;
  }

  // 4. Contributor general passcode
  if (clean.toUpperCase() === DEFAULT_CONTRIBUTOR_PASSCODE) {
    return true;
  }

  return false;
}
