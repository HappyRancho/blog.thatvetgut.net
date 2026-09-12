import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Author, UserRole } from '../types';
import { AUTHORS } from '../data/authors';

const USERS_COLLECTION = 'users';

export async function getAllContributors(): Promise<Author[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: Author[] = [];
      snap.forEach((d) => {
        const data = d.data() as Author;
        list.push({ ...data, id: d.id });
      });
      return list;
    }
  } catch (err) {
    console.warn('Error getting contributors from Firestore:', err);
  }
  return AUTHORS;
}

export async function getContributorById(id: string): Promise<Author | undefined> {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as Author), id: snap.id };
    }
  } catch (err) {
    console.warn('Error getting contributor by ID:', err);
  }
  return AUTHORS.find((a) => a.id === id || a.slug === id);
}

export async function saveContributor(authorData: Partial<Author>): Promise<Author> {
  const id =
    authorData.id ||
    authorData.slug ||
    `author-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const slug =
    authorData.slug ||
    authorData.name
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-') ||
    id;

  const docRef = doc(db, USERS_COLLECTION, id);

  let existing: Author | undefined;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) existing = snap.data() as Author;
  } catch (e) {
    // ignore
  }

  const fullContributor: Author = {
    id,
    slug,
    name: authorData.name?.trim() || existing?.name || 'Veterinary Contributor',
    designation: authorData.designation?.trim() || existing?.designation || 'Contributor, ThatVetGuy',
    professionalRole: authorData.professionalRole?.trim() || existing?.professionalRole || 'Veterinary Contributor',
    role: (authorData.role || existing?.role || 'CONTRIBUTOR') as UserRole,
    qualifications: authorData.qualifications?.trim() || existing?.qualifications || 'BVSc & AH',
    bio: authorData.bio?.trim() || existing?.bio || '',
    avatarUrl:
      authorData.avatarUrl?.trim() ||
      existing?.avatarUrl ||
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
    expertise: authorData.expertise || existing?.expertise || ['Veterinary Medicine', 'Companion Animal Care'],
    clinicOrAffiliation: authorData.clinicOrAffiliation || existing?.clinicOrAffiliation || 'ThatVetGuy Collaborative',
    isActive: authorData.isActive !== undefined ? authorData.isActive : (existing?.isActive !== undefined ? existing.isActive : true),
    socials: {
      linkedin: authorData.socials?.linkedin || existing?.socials?.linkedin || '',
      instagram: authorData.socials?.instagram || existing?.socials?.instagram || '',
      twitter: authorData.socials?.twitter || existing?.socials?.twitter || '',
      website: authorData.socials?.website || existing?.socials?.website || 'https://www.thatvetguy.net',
      researchGate: authorData.socials?.researchGate || existing?.socials?.researchGate || '',
      email: authorData.socials?.email || existing?.socials?.email || '',
    },
  };

  await setDoc(docRef, fullContributor, { merge: true });
  return fullContributor;
}

export async function toggleContributorActive(id: string, currentStatus: boolean): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  await updateDoc(docRef, { isActive: !currentStatus });
}
