/**
 * LinkedIn Veterinary Content Importer Service
 * Parses LinkedIn posts, newsletters, and articles into ThatVetGuy clinical draft manuscripts.
 * Extracts title, subtitle, headings, body HTML, tags, takeaways, and formats citations.
 * Automatically sanitizes output HTML to ensure security.
 */

import { Article, ArticleContentBlock, ArticleStatus } from '../types';
import { generateSlug, calculateReadingTime } from './articleService';
import { sanitizeHtml, stripHtmlToText } from '../lib/sanitizer';

export interface LinkedInImportResult {
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  tags: string[];
  contentHtml: string;
  contentBlocks: ArticleContentBlock[];
  excerpt: string;
  featuredImage?: string;
  sourceUrl?: string;
  readingTimeMinutes: number;
}

/**
 * Parses raw LinkedIn text, markdown, or pasted HTML into structured clinical manuscript format
 */
export function parseLinkedInPost(rawInput: string, sourceUrl?: string): LinkedInImportResult {
  const cleanInput = rawInput.trim();
  if (!cleanInput) {
    throw new Error('Please provide text or HTML from your LinkedIn post or article.');
  }

  // Detect whether input is rich HTML or plain text/markdown
  const isHtml = /<[a-z][\s\S]*>/i.test(cleanInput);

  let title = '';
  let subtitle = '';
  let bodyLines: string[] = [];
  let extractedTags: string[] = [];
  let extractedImage = '';

  // Look for image URLs in input
  const imgMatch = cleanInput.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)/i);
  if (imgMatch) {
    extractedImage = imgMatch[0];
  }

  if (isHtml) {
    // Parse using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanInput, 'text/html');

    // Look for h1, h2, or first bold paragraph for title
    const firstH1 = doc.querySelector('h1');
    const firstH2 = doc.querySelector('h2');
    const firstStrong = doc.querySelector('strong, b');

    if (firstH1 && firstH1.textContent?.trim()) {
      title = firstH1.textContent.trim();
      firstH1.remove();
    } else if (firstH2 && firstH2.textContent?.trim()) {
      title = firstH2.textContent.trim();
      firstH2.remove();
    } else if (firstStrong && (firstStrong.textContent?.trim().length || 0) < 120) {
      title = firstStrong.textContent?.trim() || '';
      firstStrong.remove();
    }

    // Extract tags from #hashtags in doc
    const textContent = doc.body.textContent || '';
    const hashtagMatches = textContent.match(/#[a-zA-Z0-9_]+/g);
    if (hashtagMatches) {
      extractedTags = Array.from(
        new Set(hashtagMatches.map((h) => h.replace('#', '').toLowerCase()))
      ).slice(0, 6);
    }

    // Process doc body paragraphs
    const paragraphs = Array.from(doc.querySelectorAll('p, div, li, h3, h4, blockquote'));
    for (const p of paragraphs) {
      const text = p.textContent?.trim() || '';
      if (!title && text.length > 5 && text.length < 120) {
        title = text;
        continue;
      }
      if (title && !subtitle && text.length > 20 && text.length < 240) {
        subtitle = text;
      }
    }

    // Sanitize HTML body
    let sanitized = sanitizeHtml(doc.body.innerHTML);
    if (!title) {
      title = 'Clinical Veterinary Insights from LinkedIn';
    }

    // Guess category from text keywords
    const category = detectCategory(textContent);

    return {
      title,
      subtitle: subtitle || 'Clinical summary adapted from LinkedIn veterinary insights.',
      slug: generateSlug(title),
      category,
      tags: extractedTags.length > 0 ? extractedTags : ['veterinary-medicine', 'clinical-practice'],
      contentHtml: sanitized,
      contentBlocks: [
        { type: 'paragraph', content: stripHtmlToText(sanitized).slice(0, 500) }
      ],
      excerpt: subtitle || stripHtmlToText(sanitized).slice(0, 160) + '...',
      featuredImage: extractedImage || undefined,
      sourceUrl: sourceUrl?.trim() || undefined,
      readingTimeMinutes: calculateReadingTime(stripHtmlToText(sanitized)),
    };
  }

  // Plain text / Markdown LinkedIn post parser
  // LinkedIn posts often start with a punchy hook or title on line 1
  const lines = cleanInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Extract hashtags at end or throughout
  const fullText = cleanInput;
  const hashMatches = fullText.match(/#[a-zA-Z0-9_]+/g);
  if (hashMatches) {
    extractedTags = Array.from(
      new Set(hashMatches.map((h) => h.replace('#', '').toLowerCase()))
    ).slice(0, 6);
  }

  // Find candidate title
  let lineIdx = 0;
  if (lines.length > 0) {
    // Check if first line looks like a title/hook
    title = lines[0].replace(/^#+\s*/, '').replace(/^[🚨📌💡🐕🐈🐎🐾🩺📋]\s*/, '').trim();
    lineIdx = 1;

    // If first line was short or emoji only, check second line
    if (title.length < 10 && lines.length > 1) {
      title = `${title} ${lines[1]}`.trim();
      lineIdx = 2;
    }
  }

  if (!title) {
    title = 'Veterinary Case Discussion & Clinical Insights';
  }

  // Find candidate subtitle / hook
  if (lines.length > lineIdx) {
    const candidateSub = lines[lineIdx].replace(/^[•\-–]\s*/, '').trim();
    if (candidateSub.length > 15 && !candidateSub.startsWith('#')) {
      subtitle = candidateSub;
      lineIdx++;
    }
  }

  // Process remaining lines into paragraphs, headings, bullet lists, or takeaways
  const paragraphs: string[] = [];
  const takeaways: string[] = [];
  let inTakeaways = false;

  for (let i = lineIdx; i < lines.length; i++) {
    const line = lines[i];

    // Filter standalone hashtag-only lines
    if (/^(#[a-zA-Z0-9_]+\s*)+$/.test(line)) {
      continue;
    }

    // Check for "Takeaways" or "Key Lessons" headers
    if (
      /^(key takeaways|takeaways|summary|clinical pearls|in conclusion|lessons learned):?/i.test(
        line
      )
    ) {
      inTakeaways = true;
      continue;
    }

    if (inTakeaways) {
      takeaways.push(line.replace(/^[•\-\*0-9\.]+\s*/, ''));
      continue;
    }

    // Check for markdown headings
    if (line.startsWith('## ') || line.startsWith('### ')) {
      paragraphs.push(`<h3>${escapeHtml(line.replace(/^#+\s*/, ''))}</h3>`);
      continue;
    }

    // Bullet points
    if (/^[•\-\*]\s+/.test(line)) {
      paragraphs.push(`<li>${escapeHtml(line.replace(/^[•\-\*]\s+/, ''))}</li>`);
      continue;
    }

    // Numbered list
    if (/^[0-9]+\.\s+/.test(line)) {
      paragraphs.push(`<li>${escapeHtml(line.replace(/^[0-9]+\.\s+/, ''))}</li>`);
      continue;
    }

    // Regular paragraph
    paragraphs.push(`<p>${escapeHtml(line)}</p>`);
  }

  // Wrap list items nicely
  let formattedHtml = paragraphs.join('\n');
  formattedHtml = formattedHtml
    .replace(/(<li>.*?<\/li>\s*)+/gs, (match) => `<ul class="list-disc pl-6 space-y-1.5 my-3">${match}</ul>`);

  if (takeaways.length > 0) {
    formattedHtml += `
      <div class="my-6 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5">
        <h4 class="font-bold text-emerald-950 text-sm uppercase tracking-wider mb-2">Key Clinical Takeaways</h4>
        <ul class="list-disc pl-5 space-y-1 text-emerald-950 text-sm">
          ${takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n')}
        </ul>
      </div>
    `;
  }

  // Add source attribution callout if provided
  if (sourceUrl) {
    formattedHtml += `
      <p class="text-xs text-stone-500 italic mt-6 pt-4 border-t border-stone-200">
        Originally shared on LinkedIn: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-emerald-900 underline font-medium">View Original Post</a>
      </p>
    `;
  }

  const sanitized = sanitizeHtml(formattedHtml);
  const category = detectCategory(cleanInput);

  return {
    title,
    subtitle: subtitle || 'Clinical review and veterinary practice insights adapted from LinkedIn.',
    slug: generateSlug(title),
    category,
    tags: extractedTags.length > 0 ? extractedTags : ['veterinary-medicine', 'clinical-protocols'],
    contentHtml: sanitized,
    contentBlocks: [
      { type: 'paragraph', content: stripHtmlToText(sanitized).slice(0, 500) }
    ],
    excerpt: subtitle || stripHtmlToText(sanitized).slice(0, 160) + '...',
    featuredImage: extractedImage || undefined,
    sourceUrl: sourceUrl?.trim() || undefined,
    readingTimeMinutes: calculateReadingTime(stripHtmlToText(sanitized)),
  };
}

/**
 * Intelligent categorization based on veterinary keywords
 */
function detectCategory(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes('surgery') ||
    lower.includes('surgical') ||
    lower.includes('orthopedic') ||
    lower.includes('laparoscopy') ||
    lower.includes('incision')
  ) {
    return 'surgery-critical-care';
  }

  if (
    lower.includes('canine') ||
    lower.includes('feline') ||
    lower.includes('dog') ||
    lower.includes('cat') ||
    lower.includes('internal medicine') ||
    lower.includes('cardiology') ||
    lower.includes('dermatology')
  ) {
    return 'companion-animals';
  }

  if (
    lower.includes('bovine') ||
    lower.includes('equine') ||
    lower.includes('horse') ||
    lower.includes('cattle') ||
    lower.includes('cow') ||
    lower.includes('dairy') ||
    lower.includes('ruminant')
  ) {
    return 'large-animal-livestock';
  }

  if (
    lower.includes('wildlife') ||
    lower.includes('conservation') ||
    lower.includes('zoological') ||
    lower.includes('exotic') ||
    lower.includes('avian') ||
    lower.includes('reptile')
  ) {
    return 'wildlife-conservation';
  }

  if (
    lower.includes('pathology') ||
    lower.includes('biopsy') ||
    lower.includes('histopathology') ||
    lower.includes('diagnostic') ||
    lower.includes('cytology') ||
    lower.includes('laboratory')
  ) {
    return 'pathology-diagnostics';
  }

  if (
    lower.includes('parvovirus') ||
    lower.includes('rabies') ||
    lower.includes('zoonotic') ||
    lower.includes('vaccine') ||
    lower.includes('epidemiology') ||
    lower.includes('one health')
  ) {
    return 'infectious-diseases';
  }

  return 'clinical-practice';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
