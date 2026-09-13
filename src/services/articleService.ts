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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Article, ArticleStatus, ReviewNote } from '../types';
import { ARTICLES } from '../data/articles';
import { AUTHORS } from '../data/authors';

const ARTICLES_COLLECTION = 'articles';

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
function blocksToHtml(article: Article): string {
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

// Seed initial articles if Firestore collection is empty and user is authenticated as co-founder
let isSeeded = false;
export async function seedFirestoreArticlesIfNeeded(): Promise<void> {
  if (isSeeded) return;
  // Only attempt seeding if authenticated
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
      }
    }
    isSeeded = true;
  } catch (err) {
    console.warn('Could not seed initial articles to Firestore:', err);
  }
}

// Fetch all articles from Firestore (with optional fallback)
export async function getArticlesFromFirestore(filter?: {
  status?: ArticleStatus;
  authorId?: string;
  category?: string;
  tag?: string;
  includeAllStatuses?: boolean;
}): Promise<Article[]> {
  try {
    const colRef = collection(db, ARTICLES_COLLECTION);
    
    // For unauthenticated users or standard public readers, query only PUBLISHED articles
    // to strictly satisfy Firestore security rule: resource.data.status == 'PUBLISHED'
    let q;
    if (filter?.status) {
      q = query(colRef, where('status', '==', filter.status));
    } else if (filter?.includeAllStatuses && auth.currentUser) {
      q = colRef;
    } else {
      q = query(colRef, where('status', '==', 'PUBLISHED'));
    }

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      let articles: Article[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Article;
        articles.push({
          ...data,
          id: docSnap.id,
          status: data.status || 'PUBLISHED',
          readingTimeMinutes: data.readingTimeMinutes || Number(data.readingTime) || 3,
        });
      });

      // Filter in-memory for flexibility
      if (filter?.status) {
        articles = articles.filter((a) => a.status === filter.status);
      }
      if (filter?.authorId) {
        const target = filter.authorId === 'dr-shivam' ? 'dr-shivam-singh-thakur' : filter.authorId;
        articles = articles.filter(
          (a) => a.authorId === target || (target === 'dr-shivam-singh-thakur' && a.authorId === 'dr-shivam')
        );
      }
      if (filter?.category) {
        articles = articles.filter((a) => a.category === filter.category);
      }
      if (filter?.tag) {
        articles = articles.filter((a) => a.tags?.includes(filter.tag!));
      }

      // Sort by updatedDate / publishedDate desc
      articles.sort((a, b) => {
        const dateA = new Date(a.updatedDate || a.publishedDate || 0).getTime();
        const dateB = new Date(b.updatedDate || b.publishedDate || 0).getTime();
        return dateB - dateA;
      });

      return articles;
    }
  } catch (err) {
    console.warn('Error fetching articles from Firestore, using in-memory data:', err);
  }

  // Fallback to static articles
  let fallback = ARTICLES.map((a) => ({
    ...a,
    status: 'PUBLISHED' as ArticleStatus,
    content: blocksToHtml(a),
    readingTime: a.readingTimeMinutes,
    version: 1,
  }));

  if (filter?.authorId) {
    const target = filter.authorId === 'dr-shivam' ? 'dr-shivam-singh-thakur' : filter.authorId;
    fallback = fallback.filter(
      (a) => a.authorId === target || (target === 'dr-shivam-singh-thakur' && a.authorId === 'dr-shivam')
    );
  }
  if (filter?.category) {
    fallback = fallback.filter((a) => a.category === filter.category);
  }
  if (filter?.tag) {
    fallback = fallback.filter((a) => a.tags?.includes(filter.tag!));
  }

  return fallback;
}

// Get single article by slug
export async function getArticleBySlugFromFirestore(slug: string): Promise<Article | undefined> {
  await seedFirestoreArticlesIfNeeded();
  try {
    const colRef = collection(db, ARTICLES_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = docSnap.data() as Article;
      return {
        ...data,
        id: docSnap.id,
        status: data.status || 'PUBLISHED',
      };
    }
  } catch (err) {
    console.warn('Error querying slug from Firestore:', err);
  }

  const staticMatch = ARTICLES.find((a) => a.slug === slug);
  if (staticMatch) {
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
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...(snap.data() as Article),
        id: snap.id,
      };
    }
  } catch (err) {
    console.warn('Error querying article by ID:', err);
  }

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

// Save or update an article in Firestore
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

  const docRef = doc(db, ARTICLES_COLLECTION, articleId);

  // Check if article already exists to preserve fields
  let existing: Article | undefined;
  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      existing = existingSnap.data() as Article;
    }
  } catch (e) {
    // ignore
  }

  const status: ArticleStatus = articleData.status || existing?.status || 'DRAFT';

  const fullArticle: Article = {
    id: articleId,
    slug,
    title,
    subtitle: articleData.subtitle || existing?.subtitle || '',
    excerpt: articleData.excerpt || articleData.subtitle || plainText.slice(0, 160).replace(/<[^>]*>/g, '') || '',
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

  try {
    await setDoc(docRef, fullArticle, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `articles/${articleId}`);
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
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `articles/${articleId}`);
    return;
  }
  if (!snap.exists()) {
    throw new Error('Article not found');
  }

  const existing = snap.data() as Article;
  const nowIso = new Date().toISOString();
  const updatePayload: Partial<Article> = {
    status: newStatus,
    updatedDate: nowIso,
  };

  if (newStatus === 'SUBMITTED FOR REVIEW' && !existing.submittedAt) {
    updatePayload.submittedAt = nowIso;
  }

  if (newStatus === 'PUBLISHED') {
    updatePayload.publishedAt = nowIso;
    updatePayload.publishedDate = nowIso;
    if (options?.reviewerName) {
      updatePayload.reviewer = options.reviewerName;
      updatePayload.reviewedDate = nowIso;
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
    updatePayload.internalNotes = [...(existing.internalNotes || []), newNote];
  }

  try {
    await updateDoc(docRef, updatePayload as any);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `articles/${articleId}`);
  }
}

// Add an internal review note (never exposed publicly)
export async function addInternalNoteToArticle(
  articleId: string,
  noteText: string,
  authorId: string,
  authorName: string
): Promise<ReviewNote> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `articles/${articleId}`);
    throw err;
  }
  if (!snap.exists()) throw new Error('Article not found');

  const existing = snap.data() as Article;
  const newNote: ReviewNote = {
    id: `note-${Date.now()}`,
    authorId,
    authorName,
    note: noteText,
    createdAt: new Date().toISOString(),
    statusAtNote: existing.status,
  };

  const updatedNotes = [...(existing.internalNotes || []), newNote];
  try {
    await updateDoc(docRef, { internalNotes: updatedNotes });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `articles/${articleId}`);
  }
  return newNote;
}

// Delete article from Firestore
export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
  }
}
