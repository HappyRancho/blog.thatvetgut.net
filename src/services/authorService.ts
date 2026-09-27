import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Author } from '../types';
import { AUTHORS } from '../data/authors';

const AUTHORS_COLLECTION = 'authors';
const LOCAL_AUTHORS_KEY = 'tvg_authors_cache';

// Get cached authors from local storage
export function getCachedAuthors(): Author[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUTHORS_KEY);
    if (!raw) return [...AUTHORS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default AUTHORS to guarantee all fields exist
      const map = new Map(AUTHORS.map((a) => [a.id, a]));
      parsed.forEach((p: Author) => {
        const existing = map.get(p.id);
        map.set(p.id, existing ? { ...existing, ...p } : p);
      });
      return Array.from(map.values());
    }
    return [...AUTHORS];
  } catch {
    return [...AUTHORS];
  }
}

// Save authors to local storage cache
export function setCachedAuthors(authors: Author[]): void {
  try {
    localStorage.setItem(LOCAL_AUTHORS_KEY, JSON.stringify(authors));
  } catch (e) {
    console.warn('Could not cache authors to localStorage:', e);
  }
}

// Fetch all authors from Firestore (with automatic fallback/seed to default AUTHORS)
export async function getAuthorsFromFirestore(): Promise<Author[]> {
  try {
    const colRef = collection(db, AUTHORS_COLLECTION);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      // First run: seed initial 6 co-founders to Firestore
      console.log('[AuthorService] Seeding 6 Co-Founders to Firestore...');
      for (const author of AUTHORS) {
        try {
          const docRef = doc(db, AUTHORS_COLLECTION, author.id);
          await setDoc(docRef, author, { merge: true });
        } catch (err) {
          console.warn(`[AuthorService] Seeding author ${author.id} notice:`, err);
        }
      }
      setCachedAuthors(AUTHORS);
      return [...AUTHORS];
    }

    const firestoreAuthors: Author[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Author;
      firestoreAuthors.push({
        ...data,
        id: docSnap.id,
      });
    });

    // Merge with static AUTHORS so no data is missing
    const authorMap = new Map(AUTHORS.map((a) => [a.id, a]));
    firestoreAuthors.forEach((fa) => {
      const base = authorMap.get(fa.id);
      authorMap.set(fa.id, base ? { ...base, ...fa } : fa);
    });

    const merged = Array.from(authorMap.values());
    setCachedAuthors(merged);
    return merged;
  } catch (err) {
    console.warn('[AuthorService] Could not fetch authors from Firestore, using cache:', err);
    return getCachedAuthors();
  }
}

// Get single author by ID or slug (sync from cache, then async refresh)
export function getAuthorByIdOrSlug(idOrSlug: string, authorList?: Author[]): Author | undefined {
  const list = authorList || getCachedAuthors();
  if (idOrSlug === 'dr-shivam') {
    return list.find((a) => a.id === 'dr-shivam-singh-thakur');
  }
  return list.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
}

// Update an author profile in Firestore
export async function updateAuthorProfileInFirestore(
  authorId: string,
  updates: Partial<Author>
): Promise<Author> {
  const currentList = getCachedAuthors();
  const existing = currentList.find((a) => a.id === authorId) || AUTHORS.find((a) => a.id === authorId);

  if (!existing) {
    throw new Error(`Author with ID "${authorId}" does not exist.`);
  }

  const updatedAuthor: Author = {
    ...existing,
    ...updates,
    id: authorId,
    // Ensure critical Co-Founder fields cannot be overwritten to invalid values
    role: 'CO_FOUNDER',
    designation: updates.designation || 'Co-Founder, ThatVetGuy',
    socials: {
      ...existing.socials,
      ...updates.socials,
    },
  };

  // 1. Immediately update local cache so changes appear instantly on public pages
  const updatedList = currentList.map((a) => (a.id === authorId ? updatedAuthor : a));
  if (!updatedList.some((a) => a.id === authorId)) {
    updatedList.push(updatedAuthor);
  }
  setCachedAuthors(updatedList);

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, AUTHORS_COLLECTION, authorId);
    await setDoc(docRef, updatedAuthor, { merge: true });
    console.log(`[AuthorService] Author profile for ${authorId} successfully saved to Firestore.`);
  } catch (err) {
    console.error(`[AuthorService] Firestore save error for ${authorId}:`, err);
    throw new Error(`Failed to save author profile to cloud database: ${err instanceof Error ? err.message : String(err)}`);
  }

  return updatedAuthor;
}
