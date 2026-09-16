import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Article, ArticleStatus, ReviewNote } from '../types';
import { ARTICLES } from '../data/articles';
import { AUTHORS } from '../data/authors';

const ARTICLES_COLLECTION = 'articles';
const LOCAL_ARTICLES_KEY = 'tvg_articles_store';
const LOCAL_DELETED_ARTICLES_KEY = 'tvg_deleted_articles';

// Helper to calculate word count and reading time
export function calculateReadingTime(text: string): number {
  if (!text) return 3;
  // Strip HTML tags for word counting
  const plain = text.replace(/<[^>]*>/g, ' ');
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Generate URL-friendly slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Convert legacy contentBlocks to HTML string if needed
export function blocksToHtml(article: Article): string {
  if (article.content) return article.content;
  if (!article.contentBlocks) return '';

  return article.contentBlocks
    .map((b) => {
      switch (b.type) {
        case 'heading2':
          return `<h2>${b.content || ''}</h2>`;
        case 'heading3':
          return `<h3>${b.content || ''}</h3>`;
        case 'quote':
          return `<blockquote><p>${b.content || ''}</p>${b.quoteAuthor ? `<cite>— ${b.quoteAuthor}</cite>` : ''}</blockquote>`;
        case 'callout':
          return `<div class="callout ${b.calloutType || 'note'}"><p>${b.content || ''}</p></div>`;
        case 'takeaways':
          return `<div class="takeaways"><h3>Key Clinical Takeaways</h3><p>${b.content || ''}</p></div>`;
        case 'table':
          if (b.tableData) {
            const headers = b.tableData.headers.map((h) => `<th>${h}</th>`).join('');
            const rows = b.tableData.rows
              .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
              .join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
          }
          return '';
        case 'image':
          return `<figure><img src="${b.imageUrl || ''}" alt="${b.imageAlt || ''}" /><figcaption>${b.imageCaption || ''}</figcaption></figure>`;
        case 'paragraph':
        default:
          return `<p>${b.content || ''}</p>`;
      }
    })
    .join('\n');
}

// Local Storage Unified Store Management
export function getLocalArticles(): Article[] {
  try {
    const raw = localStorage.getItem(LOCAL_ARTICLES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function getDeletedArticleIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_ARTICLES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLocalArticle(article: Article): void {
  try {
    const current = getLocalArticles();
    const existingIndex = current.findIndex(
      (a) => a.id === article.id || (a.slug && a.slug === article.slug)
    );
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...article };
    } else {
      current.unshift(article);
    }
    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(current));

    // Remove from deleted list if re-saved
    const deleted = getDeletedArticleIds().filter((id) => id !== article.id);
    localStorage.setItem(LOCAL_DELETED_ARTICLES_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.warn('Failed to save article to local storage store:', e);
  }
}

export function deleteLocalArticle(articleId: string): void {
  try {
    const current = getLocalArticles().filter((a) => a.id !== articleId);
    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(current));

    const deleted = getDeletedArticleIds();
    if (!deleted.includes(articleId)) {
      deleted.push(articleId);
      localStorage.setItem(LOCAL_DELETED_ARTICLES_KEY, JSON.stringify(deleted));
    }
  } catch (e) {
    console.warn('Failed to delete article from local storage store:', e);
  }
}

// Seed initial articles if Firestore collection is empty
let isSeeded = false;
export async function seedFirestoreArticlesIfNeeded(): Promise<void> {
  if (isSeeded) return;
  if (!auth.currentUser) return;

  try {
    const colRef = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(query(colRef, where('status', '==', 'PUBLISHED')));
    if (snapshot.empty) {
      console.log('Seeding initial clinical articles to Firestore...');
      for (const article of ARTICLES) {
        const author = AUTHORS.find((a) => a.id === article.authorId);
        const htmlContent = blocksToHtml(article);

        const newDocRef = doc(db, ARTICLES_COLLECTION, article.id);
        const articleData: Article = {
          ...article,
          status: 'PUBLISHED',
          content: htmlContent,
          authorName: author?.name || 'ThatVetGuy Co-Founder',
          authorProfile: {
            name: author?.name || 'ThatVetGuy Co-Founder',
            designation: author?.designation || 'Co-Founder, ThatVetGuy',
            professionalRole: author?.professionalRole || '',
            avatarUrl: author?.avatarUrl || '',
          },
          createdAt: article.publishedDate || new Date().toISOString(),
          updatedAt: article.updatedDate || new Date().toISOString(),
          publishedAt: article.publishedDate || new Date().toISOString(),
          readingTime: article.readingTimeMinutes || 4,
          canonicalUrl: `https://www.thatvetguy.net/article/${article.slug}`,
          version: 1,
          internalNotes: [],
        };

        await setDoc(newDocRef, articleData, { merge: true });
        saveLocalArticle(articleData);
      }
    }
    isSeeded = true;
  } catch (err) {
    console.warn('Could not seed initial articles to Firestore:', err);
  }
}

// Force seed all default articles to Firestore (used by Co-Founder sync button)
export async function forceSeedAllArticlesToFirestore(): Promise<{ count: number; error?: string }> {
  try {
    let seeded = 0;
    for (const article of ARTICLES) {
      const author = AUTHORS.find((a) => a.id === article.authorId);
      const htmlContent = blocksToHtml(article);

      const newDocRef = doc(db, ARTICLES_COLLECTION, article.id);
      const articleData: Article = {
        ...article,
        status: 'PUBLISHED',
        content: htmlContent,
        authorName: author?.name || 'ThatVetGuy Co-Founder',
        authorProfile: {
          name: author?.name || 'ThatVetGuy Co-Founder',
          designation: author?.designation || 'Co-Founder, ThatVetGuy',
          professionalRole: author?.professionalRole || '',
          avatarUrl: author?.avatarUrl || '',
        },
        createdAt: article.publishedDate || new Date().toISOString(),
        updatedAt: article.updatedDate || new Date().toISOString(),
        publishedAt: article.publishedDate || new Date().toISOString(),
        readingTime: article.readingTimeMinutes || 4,
        canonicalUrl: `https://www.thatvetguy.net/article/${article.slug}`,
        version: 1,
        internalNotes: [],
      };

      await setDoc(newDocRef, articleData, { merge: true });
      saveLocalArticle(articleData);
      seeded++;
    }
    return { count: seeded };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Unknown Firestore error' };
  }
}

// Push all locally stored articles to Firestore
export async function syncLocalArticlesToFirestore(): Promise<{ synced: number; error?: string }> {
  try {
    const local = getLocalArticles();
    let count = 0;
    for (const art of local) {
      const docRef = doc(db, ARTICLES_COLLECTION, art.id);
      await setDoc(docRef, art, { merge: true });
      count++;
    }
    return { synced: count };
  } catch (err: any) {
    return { synced: 0, error: err.message || 'Failed to sync local articles' };
  }
}

// Fetch all articles combining Firestore, Local Storage, and Static Data
export async function getArticlesFromFirestore(filter?: {
  status?: ArticleStatus;
  authorId?: string;
  category?: string;
  tag?: string;
  includeAllStatuses?: boolean;
}): Promise<Article[]> {
  const deletedIds = new Set(getDeletedArticleIds());
  const articleMap = new Map<string, Article>();

  // 1. Initialize with static articles as baseline
  for (const a of ARTICLES) {
    if (deletedIds.has(a.id)) continue;
    articleMap.set(a.id, {
      ...a,
      status: 'PUBLISHED' as ArticleStatus,
      content: blocksToHtml(a),
      readingTime: a.readingTimeMinutes,
      version: 1,
    });
  }

  // 2. Overlay any locally created/edited articles from local storage
  const localArticles = getLocalArticles();
  for (const localArt of localArticles) {
    if (deletedIds.has(localArt.id)) continue;
    articleMap.set(localArt.id, localArt);
  }

  // 3. Query Firestore for cloud live updates
  try {
    const colRef = collection(db, ARTICLES_COLLECTION);
    let q;
    if (filter?.status) {
      q = query(colRef, where('status', '==', filter.status));
    } else if (filter?.includeAllStatuses && auth.currentUser) {
      q = colRef;
    } else {
      // Satisfies firestore security rules for public unauthenticated readers
      q = query(colRef, where('status', '==', 'PUBLISHED'));
    }

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Article;
        const id = docSnap.id;
        if (deletedIds.has(id)) return;

        const mergedArt: Article = {
          ...data,
          id,
          status: data.status || 'PUBLISHED',
          readingTimeMinutes: data.readingTimeMinutes || Number(data.readingTime) || 3,
        };
        articleMap.set(id, mergedArt);
        // Also keep local store in sync
        saveLocalArticle(mergedArt);
      });
    }
  } catch (err) {
    console.warn('Firestore articles fetch returned notice, serving merged catalog:', err);
  }

  let result = Array.from(articleMap.values());

  // 4. Filter according to criteria
  if (filter?.status) {
    result = result.filter((a) => a.status === filter.status);
  } else if (!filter?.includeAllStatuses) {
    // Default to published articles for public viewers
    result = result.filter((a) => a.status === 'PUBLISHED');
  }

  if (filter?.authorId) {
    const target = filter.authorId === 'dr-shivam' ? 'dr-shivam-singh-thakur' : filter.authorId;
    result = result.filter(
      (a) => a.authorId === target || (target === 'dr-shivam-singh-thakur' && a.authorId === 'dr-shivam')
    );
  }

  if (filter?.category && filter.category !== 'all') {
    result = result.filter((a) => a.category === filter.category);
  }

  if (filter?.tag && filter.tag !== 'all') {
    result = result.filter((a) => a.tags?.includes(filter.tag!));
  }

  // Sort by updatedDate / publishedDate desc
  result.sort((a, b) => {
    const dateA = new Date(a.updatedDate || a.publishedDate || 0).getTime();
    const dateB = new Date(b.updatedDate || b.publishedDate || 0).getTime();
    return dateB - dateA;
  });

  return result;
}

// Get single article by slug (checks Local Store, Firestore, then Static Data)
export async function getArticleBySlugFromFirestore(slug: string): Promise<Article | undefined> {
  const deletedIds = new Set(getDeletedArticleIds());

  // 1. Check local storage store first (handles instant live preview of edits)
  const localMatch = getLocalArticles().find((a) => a.slug === slug);
  if (localMatch && !deletedIds.has(localMatch.id)) {
    return localMatch;
  }

  // 2. Query Firestore with proper security rule constraints
  try {
    const colRef = collection(db, ARTICLES_COLLECTION);
    // Unauthenticated readers must query where status == PUBLISHED to satisfy security rules
    const q = auth.currentUser
      ? query(colRef, where('slug', '==', slug))
      : query(colRef, where('slug', '==', slug), where('status', '==', 'PUBLISHED'));

    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data() as Article;
      if (!deletedIds.has(docSnap.id)) {
        const art: Article = {
          ...data,
          id: docSnap.id,
          status: data.status || 'PUBLISHED',
        };
        saveLocalArticle(art);
        return art;
      }
    }

    // Also check direct document ID in case slug == id
    const docRef = doc(db, ARTICLES_COLLECTION, slug);
    const directSnap = await getDoc(docRef);
    if (directSnap.exists() && !deletedIds.has(directSnap.id)) {
      const art = {
        ...(directSnap.data() as Article),
        id: directSnap.id,
      };
      saveLocalArticle(art);
      return art;
    }
  } catch (err) {
    console.warn('Firestore query by slug noticed:', err);
  }

  // 3. Fallback to static articles
  const staticMatch = ARTICLES.find((a) => a.slug === slug);
  if (staticMatch && !deletedIds.has(staticMatch.id)) {
    return {
      ...staticMatch,
      status: 'PUBLISHED',
      content: blocksToHtml(staticMatch),
    };
  }

  return undefined;
}

// Get single article by ID
export async function getArticleByIdFromFirestore(id: string): Promise<Article | undefined> {
  const deletedIds = new Set(getDeletedArticleIds());
  if (deletedIds.has(id)) return undefined;

  // 1. Check local storage
  const localMatch = getLocalArticles().find((a) => a.id === id);
  if (localMatch) return localMatch;

  // 2. Query Firestore
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const art = {
        ...(snap.data() as Article),
        id: snap.id,
      };
      saveLocalArticle(art);
      return art;
    }
  } catch (err) {
    console.warn('Error querying article by ID from Firestore:', err);
  }

  // 3. Fallback to static articles
  const staticMatch = ARTICLES.find((a) => a.id === id);
  if (staticMatch) {
    return {
      ...staticMatch,
      status: 'PUBLISHED',
      content: blocksToHtml(staticMatch),
    };
  }

  return undefined;
}

// Save or update an article in Firestore & Local Storage
export async function saveArticleToFirestore(
  articleData: Partial<Article>,
  currentAuthorProfile?: {
    id: string;
    name: string;
    designation: string;
    professionalRole?: string;
    avatarUrl?: string;
  }
): Promise<Article> {
  const articleId = articleData.id || `tvg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const nowIso = new Date().toISOString();

  const title = articleData.title?.trim() || 'Untitled Article';
  const slug = articleData.slug?.trim() || generateSlug(title);
  const plainText = articleData.content || '';
  const calculatedMins = calculateReadingTime(plainText);

  // Check if article already exists locally or in Firestore to preserve fields
  let existing: Article | undefined = getLocalArticles().find((a) => a.id === articleId || a.slug === slug);
  if (!existing) {
    existing = ARTICLES.find((a) => a.id === articleId || a.slug === slug);
  }

  const status: ArticleStatus = articleData.status || existing?.status || 'DRAFT';

  const fullArticle: Article = {
    id: articleId,
    slug,
    title,
    subtitle: articleData.subtitle !== undefined ? articleData.subtitle : (existing?.subtitle || ''),
    excerpt:
      articleData.excerpt ||
      articleData.subtitle ||
      plainText.slice(0, 160).replace(/<[^>]*>/g, '') ||
      existing?.excerpt ||
      '',
    featuredImage:
      articleData.featuredImage ||
      existing?.featuredImage ||
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200',
    imageAlt: articleData.imageAlt || existing?.imageAlt || title,
    imageCaption: articleData.imageCaption || existing?.imageCaption || '',
    category: articleData.category || existing?.category || 'pet-health',
    tags: articleData.tags || existing?.tags || ['preventive-care'],
    authorId: articleData.authorId || existing?.authorId || currentAuthorProfile?.id || 'dr-chirag-patidar',
    authorName: articleData.authorName || existing?.authorName || currentAuthorProfile?.name || 'ThatVetGuy Co-Founder',
    authorProfile: articleData.authorProfile || existing?.authorProfile || {
      name: currentAuthorProfile?.name || 'ThatVetGuy Co-Founder',
      designation: currentAuthorProfile?.designation || 'Co-Founder, ThatVetGuy',
      professionalRole: currentAuthorProfile?.professionalRole || '',
      avatarUrl: currentAuthorProfile?.avatarUrl || '',
    },
    reviewerId: articleData.reviewerId || existing?.reviewerId,
    reviewer: articleData.reviewer || existing?.reviewer,
    reviewedDate: articleData.reviewedDate || existing?.reviewedDate,
    publishedDate: status === 'PUBLISHED' ? (existing?.publishedDate || nowIso) : (existing?.publishedDate || ''),
    updatedDate: nowIso,
    createdAt: existing?.createdAt || nowIso,
    submittedAt: status === 'SUBMITTED FOR REVIEW' ? (existing?.submittedAt || nowIso) : existing?.submittedAt,
    publishedAt: status === 'PUBLISHED' ? (existing?.publishedAt || nowIso) : existing?.publishedAt,
    readingTimeMinutes: calculatedMins,
    readingTime: calculatedMins,
    status,
    content: articleData.content !== undefined ? articleData.content : (existing?.content || ''),
    contentBlocks: existing?.contentBlocks || [],
    references: articleData.references || existing?.references || [],
    seoTitle: articleData.seoTitle || `${title} | ThatVetGuy`,
    seoDescription: articleData.seoDescription || articleData.subtitle || '',
    canonicalUrl: articleData.canonicalUrl || `https://www.thatvetguy.net/article/${slug}`,
    socialImage: articleData.socialImage || articleData.featuredImage || existing?.featuredImage || '',
    version: (existing?.version || 0) + 1,
    internalNotes: articleData.internalNotes || existing?.internalNotes || [],
  };

  // 1. Immediately persist to Local Unified Store so changes reflect everywhere on the live blog
  saveLocalArticle(fullArticle);

  // 2. Persist to Firestore Cloud Database
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    await setDoc(docRef, fullArticle, { merge: true });
    console.log(`[Firestore] Article ${articleId} synced successfully to cloud.`);
  } catch (err) {
    console.warn(`[Firestore] Cloud sync pending: ${err instanceof Error ? err.message : String(err)}`);
    // Do not throw so local persistence ensures immediate live appearance
  }

  return fullArticle;
}

// Update article status with optional review note
export async function updateArticleStatusInFirestore(
  articleId: string,
  newStatus: ArticleStatus,
  options?: {
    note?: string;
    authorId?: string;
    authorName?: string;
    reviewerName?: string;
  }
): Promise<void> {
  const existing = await getArticleByIdFromFirestore(articleId);
  const nowIso = new Date().toISOString();

  if (existing) {
    const updated: Article = {
      ...existing,
      status: newStatus,
      updatedDate: nowIso,
    };
    if (newStatus === 'PUBLISHED') {
      updated.publishedAt = nowIso;
      updated.publishedDate = existing.publishedDate || nowIso;
      if (options?.reviewerName) {
        updated.reviewer = options.reviewerName;
        updated.reviewedDate = nowIso;
      }
    }
    if (options?.note) {
      const newNote: ReviewNote = {
        id: `note-${Date.now()}`,
        authorId: options.authorId || 'reviewer',
        authorName: options.authorName || options.reviewerName || 'ThatVetGuy Co-Founder',
        note: options.note,
        createdAt: nowIso,
        statusAtNote: newStatus,
      };
      updated.internalNotes = [...(existing.internalNotes || []), newNote];
    }
    saveLocalArticle(updated);
  }

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const updatePayload: any = {
      status: newStatus,
      updatedDate: nowIso,
    };
    if (newStatus === 'PUBLISHED') {
      updatePayload.publishedAt = nowIso;
      updatePayload.publishedDate = nowIso;
    }
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    console.warn('Firestore status update error:', err);
  }
}

// Add an internal review note (never exposed publicly)
export async function addInternalNoteToArticle(
  articleId: string,
  noteText: string,
  authorId: string,
  authorName: string
): Promise<ReviewNote> {
  const nowIso = new Date().toISOString();
  const existing = await getArticleByIdFromFirestore(articleId);

  const newNote: ReviewNote = {
    id: `note-${Date.now()}`,
    authorId,
    authorName,
    note: noteText,
    createdAt: nowIso,
    statusAtNote: existing?.status || 'DRAFT',
  };

  if (existing) {
    const updatedNotes = [...(existing.internalNotes || []), newNote];
    saveLocalArticle({ ...existing, internalNotes: updatedNotes });
  }

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const liveData = snap.data() as Article;
      const updatedNotes = [...(liveData.internalNotes || []), newNote];
      await updateDoc(docRef, { internalNotes: updatedNotes });
    }
  } catch (err) {
    console.warn('Could not sync internal note to Firestore:', err);
  }

  return newNote;
}

// Delete article from Firestore & Local Storage
export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  // 1. Delete from local storage and mark as deleted
  deleteLocalArticle(articleId);

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}
