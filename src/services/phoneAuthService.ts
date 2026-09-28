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
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks whether an entered phone number belongs to an authorized Co-Founder
 * by querying the protected Firestore authorization structure (`/authorized_phones`).
 * Returns authorization status and author profile binding.
 */
export async function checkPhoneAuthorization(
  rawPhone: string
): Promise<{ authorized: boolean; record?: AuthorizedPhoneRecord }> {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized || normalized.length < 8) {
    return { authorized: false };
  }

  try {
    const hash = await hashPhoneNumber(normalized);
    const cleanKey = `p_${normalized.replace('+', '')}`;
    const encoded = encodeURIComponent(normalized);

    // New records use the normalized E.164 number as their document ID. Keep
    // the legacy keys as a migration fallback for existing allowlist records.
    const candidateKeys = [normalized, cleanKey, hash, encoded];

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
    console.warn('[PhoneAuthService] Verification error:', err);
  }

  return { authorized: false };
}
