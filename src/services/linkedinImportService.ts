import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLocalArticles, generateSlug, calculateReadingTime } from './articleService';

export interface LinkedInImportData {
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  sourceUrl: string;
  sourcePlatform: 'LinkedIn';
  importedAt: string;
  tags: string[];
  readingTimeMinutes: number;
}

// Validates LinkedIn URL format
export function isValidLinkedInUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  // Validates pulse, posts, or articles on LinkedIn
  return /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:pulse|posts|feed\/update|newsletters)\/[a-zA-Z0-9_\-.~%]+/i.test(clean);
}

// Checks if the LinkedIn URL has already been imported
export async function checkDuplicateLinkedInUrl(url: string): Promise<boolean> {
  const cleanUrl = url.trim().toLowerCase();

  // 1. Check local articles
  const localArticles = getLocalArticles();
  if (localArticles.some((a) => (a.sourceUrl || '').trim().toLowerCase() === cleanUrl)) {
    return true;
  }

  // 2. Check Firestore
  try {
    const colRef = collection(db, 'articles');
    const q = query(colRef, where('sourceUrl', '==', url.trim()));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.warn('[LinkedInImport] Duplicate check query notice:', err);
    return false;
  }
}

// Extracts publicly accessible article from a LinkedIn URL
export async function extractLinkedInArticle(url: string): Promise<LinkedInImportData> {
  const cleanUrl = url.trim();

  if (!isValidLinkedInUrl(cleanUrl)) {
    throw new Error('Please enter a valid public LinkedIn article or newsletter URL (e.g. https://www.linkedin.com/pulse/...)');
  }

  // Check for duplicates
  const isDuplicate = await checkDuplicateLinkedInUrl(cleanUrl);
  if (isDuplicate) {
    throw new Error('This LinkedIn article URL has already been imported into ThatVetGuy CMS.');
  }

  let html = '';

  // Attempt extraction through CORS-friendly reader endpoints
  const fetchEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    cleanUrl,
  ];

  let lastError: string | null = null;
  for (const endpoint of fetchEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (res.status === 999 || res.status === 403 || res.status === 401) {
        lastError = 'LinkedIn has blocked automated extraction for this URL (anti-bot / login wall). Please verify the article is publicly accessible without login.';
        continue;
      }

      if (res.ok) {
        html = await res.text();
        if (html && html.length > 500) {
          break;
        }
      }
    } catch (e: any) {
      lastError = e.message || 'Network request failed';
    }
  }

  if (!html || html.length < 200) {
    throw new Error(
      lastError ||
      'Unable to extract public content from this LinkedIn URL. LinkedIn may be blocking non-authenticated readers or requiring a login verification.'
    );
  }

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Check if page redirected to a login wall
  const pageTitle = doc.querySelector('title')?.textContent || '';
  if (
    pageTitle.toLowerCase().includes('sign in') ||
    pageTitle.toLowerCase().includes('log in') ||
    pageTitle.toLowerCase().includes('authwall')
  ) {
    throw new Error(
      'LinkedIn redirected this URL to a sign-in screen (AuthWall). This article cannot be extracted automatically because it is not public.'
    );
  }

  // Extract metadata
  const ogTitle =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc.querySelector('h1')?.textContent?.trim() ||
    pageTitle.replace(/\|.*$/, '').trim();

  const ogDesc =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    '';

  const ogImage =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    '';

  if (!ogTitle || ogTitle.length < 5) {
    throw new Error('Could not extract a valid article title from this LinkedIn URL.');
  }

  // Extract article body content
  const articleContainer =
    doc.querySelector('article') ||
    doc.querySelector('.article-main__content') ||
    doc.querySelector('.reader-article-content') ||
    doc.querySelector('.attributed-text-segment-list') ||
    doc.querySelector('main');

  let bodyHtml = '';
  if (articleContainer) {
    // Clean unwanted elements
    articleContainer.querySelectorAll('script, style, iframe, button, nav, footer, header').forEach((el) => el.remove());
    bodyHtml = articleContainer.innerHTML.trim();
  }

  // Fallback to description if body is empty
  if (!bodyHtml || bodyHtml.length < 50) {
    if (ogDesc) {
      bodyHtml = `<p>${ogDesc}</p>`;
    } else {
      throw new Error('Could not extract article content. The LinkedIn article content may be hidden behind an interactive login.');
    }
  }

  const plainText = bodyHtml.replace(/<[^>]*>/g, ' ');
  const cleanTitle = ogTitle.trim();
  const cleanSubtitle = ogDesc.trim().slice(0, 300);

  // Extract tags from hashtags in description or text
  const hashtags = (plainText.match(/#[a-zA-Z0-9_]+/g) || [])
    .map((h) => h.replace('#', '').toLowerCase())
    .slice(0, 5);

  const tags = hashtags.length > 0 ? hashtags : ['veterinary-medicine', 'clinical-insights'];

  return {
    title: cleanTitle,
    subtitle: cleanSubtitle,
    slug: generateSlug(cleanTitle),
    content: bodyHtml,
    excerpt: cleanSubtitle || plainText.slice(0, 160) + '...',
    featuredImage: ogImage || undefined,
    sourceUrl: cleanUrl,
    sourcePlatform: 'LinkedIn',
    importedAt: new Date().toISOString(),
    tags,
    readingTimeMinutes: calculateReadingTime(plainText),
  };
}
