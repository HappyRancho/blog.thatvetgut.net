import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuthorizedPhoneRecord {
  authorId: string;
  name: string;
  role: string;
  status: string;
  maskedPhone?: string;
  phoneHash?: string;
}

/**
 * Normalizes phone numbers consistently into international E.164 format.
 * Automatically resolves common Indian formats (+91, 10-digit mobile, 0-prefixed 10-digit).
 */
export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // 10-digit Indian standard (e.g. 9876543210 -> +919876543210)
  if (/^\d{10}$/.test(cleaned)) {
    return '+91' + cleaned;
  }

  // 11-digit with leading 0 (e.g. 09876543210 -> +919876543210)
  if (/^0\d{10}$/.test(cleaned)) {
    return '+91' + cleaned.slice(1);
  }

  // Prepend '+' if missing
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Safely masks a phone number for display in the UI without exposing the full digits.
 * Example: +919876543210 -> +91 ••••• ••210
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 6) return '••••••';
  const prefix = normalized.slice(0, 3);
  const suffix = normalized.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

/**
 * Computes SHA-256 hash of normalized phone number using browser Web Crypto API.
 */
export async function hashPhoneNumber(phone: string): Promise<string> {
  const normalized = normalizePhoneNumber(phone);
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Browser environment without crypto.subtle
  }
  return '';
}

/**
 * Official ThatVetGuy Co-Founders with their registered phone numbers.
 * Provides immediate verification and ensures staff are never locked out
 * due to network latency, offline mode, or Firestore connection issues.
 */
export const OFFICIAL_CO_FOUNDERS: Record<string, AuthorizedPhoneRecord> = {
  '+919826337391': {
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
  '+919893087892': {
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
  '+918305969001': {
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
  '+918823058797': {
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
  '+918239487081': {
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
  '+916263275093': {
    authorId: 'dr-deepesh-chaware',
    name: 'Dr. Deepesh Chaware',
    role: 'CO_FOUNDER',
    status: 'ACTIVE',
  },
};

/**
 * Checks whether an entered phone number belongs to an authorized Co-Founder
 * by querying the built-in Co-Founder registry and the protected Firestore
 * authorization collection (`/authorized_phones`).
 * Returns authorization status and author profile binding.
 */
export async function checkPhoneAuthorization(
  rawPhone: string
): Promise<{ authorized: boolean; record?: AuthorizedPhoneRecord }> {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized || normalized.length < 8) {
    return { authorized: false };
  }

  // 1. Instant check against official ThatVetGuy Co-Founders registry
  if (OFFICIAL_CO_FOUNDERS[normalized]) {
    const record = OFFICIAL_CO_FOUNDERS[normalized];
    return {
      authorized: true,
      record: {
        ...record,
        maskedPhone: maskPhoneNumber(normalized),
      },
    };
  }

  // Also match by 10-digit suffix in case of international carrier formatting variations
  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const last10 = digitsOnly.slice(-10);
    for (const [phone, record] of Object.entries(OFFICIAL_CO_FOUNDERS)) {
      if (phone.endsWith(last10)) {
        return {
          authorized: true,
          record: {
            ...record,
            maskedPhone: maskPhoneNumber(normalized),
          },
        };
      }
    }
  }

  // 2. Query Firestore /authorized_phones for dynamic/custom accounts
  try {
    const hash = await hashPhoneNumber(normalized);
    const cleanKey = `p_${normalized.replace('+', '')}`;
    const encoded = encodeURIComponent(normalized);

    const candidateKeys = [normalized, cleanKey, hash, encoded].filter(Boolean);

    for (const key of candidateKeys) {
      try {
        const snap = await getDoc(doc(db, 'authorized_phones', key));
        if (snap.exists()) {
          const data = snap.data() as AuthorizedPhoneRecord;
          if (data.status === 'ACTIVE' && data.role === 'CO_FOUNDER') {
            return {
              authorized: true,
              record: {
                ...data,
                maskedPhone: data.maskedPhone || maskPhoneNumber(normalized),
              },
            };
          }
        }
      } catch {
        // Individual key error, try next candidate
      }
    }
  } catch (err) {
    console.warn('[PhoneAuthService] Firestore verification error:', err);
  }

  return { authorized: false };
}
