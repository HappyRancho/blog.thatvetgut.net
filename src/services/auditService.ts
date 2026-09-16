/**
 * Security & CMS Audit Log Service
 * Tracks key administrative actions: login, publish, edit, review, delete, status change.
 * Stores in Firestore 'audit_logs' collection with fallback to browser local storage.
 */

import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuditLogEntry {
  id?: string;
  action: 'LOGIN' | 'LOGOUT' | 'ARTICLE_CREATE' | 'ARTICLE_UPDATE' | 'ARTICLE_PUBLISH' | 'ARTICLE_SUBMIT' | 'ARTICLE_DELETE' | 'STATUS_CHANGE' | 'PROFILE_SWITCH' | 'PASSWORD_CHANGE' | 'IMPORT_LINKEDIN';
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  details: string;
  targetId?: string;
  targetTitle?: string;
  timestamp: string;
}

const AUDIT_COLLECTION = 'audit_logs';
const LOCAL_AUDIT_KEY = 'thatvetguy_cms_audit_logs';

export async function logAuditEvent(
  action: AuditLogEntry['action'],
  performedBy: { id: string; name: string; role: string },
  details: string,
  target?: { id?: string; title?: string }
): Promise<void> {
  const entry: AuditLogEntry = {
    action,
    performedBy,
    details,
    targetId: target?.id,
    targetTitle: target?.title,
    timestamp: new Date().toISOString(),
  };

  // 1. Try writing to Firestore audit_logs collection
  try {
    const colRef = collection(db, AUDIT_COLLECTION);
    await addDoc(colRef, entry);
  } catch {
    // Non-blocking fallback to local storage
  }

  // 2. Always maintain in localStorage for immediate client-side auditing
  try {
    const existingRaw = localStorage.getItem(LOCAL_AUDIT_KEY);
    const logs: AuditLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    logs.unshift(entry);
    if (logs.length > 200) {
      logs.splice(200);
    }
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota errors
  }
}

export async function getRecentAuditLogs(maxLogs: number = 50): Promise<AuditLogEntry[]> {
  // Try firestore first
  try {
    const colRef = collection(db, AUDIT_COLLECTION);
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxLogs));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
    }
  } catch {
    // Fall back to local storage
  }

  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw).slice(0, maxLogs) : [];
  } catch {
    return [];
  }
}
