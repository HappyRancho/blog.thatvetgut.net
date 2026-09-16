/**
 * Robust HTML & Content Sanitizer for ThatVetGuy CMS
 * Treats all article inputs and imported content as untrusted.
 * Strips script, iframe, object, embed, style, form, input, base, meta,
 * removes all inline javascript: URLs, and event handlers (on* attributes).
 * Enforces strict URL validation for links and images.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'blockquote', 'cite', 'q',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'a', 'img', 'figure', 'figcaption',
  'div', 'span', 'code', 'pre', 'sub', 'sup'
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel', 'class', 'id']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'class', 'id']),
  div: new Set(['class', 'id']),
  span: new Set(['class', 'id']),
  table: new Set(['class', 'id', 'border', 'cellpadding', 'cellspacing']),
  th: new Set(['class', 'id', 'scope', 'colspan', 'rowspan', 'align']),
  td: new Set(['class', 'id', 'colspan', 'rowspan', 'align']),
  figure: new Set(['class', 'id']),
  figcaption: new Set(['class', 'id']),
  blockquote: new Set(['class', 'id', 'cite']),
  p: new Set(['class', 'id']),
  h1: new Set(['class', 'id']),
  h2: new Set(['class', 'id']),
  h3: new Set(['class', 'id']),
  h4: new Set(['class', 'id']),
  h5: new Set(['class', 'id']),
  h6: new Set(['class', 'id']),
  ul: new Set(['class', 'id']),
  ol: new Set(['class', 'id', 'start', 'type']),
  li: new Set(['class', 'id', 'value']),
  code: new Set(['class', 'id']),
  pre: new Set(['class', 'id']),
};

/**
 * Normalizes a URL string by stripping control characters and normalizing encoded characters
 */
function normalizeUrlString(raw: string): string {
  if (!raw) return '';
  // Strip control characters, whitespace, and zero-width spaces
  let clean = raw.replace(/[\x00-\x1F\x7F-\x9F\s\u200B-\u200D\uFEFF]/g, '');
  try {
    // Attempt decoding percent-encoded control chars or protocols
    clean = decodeURIComponent(clean);
  } catch {
    // If malformed URI, continue with clean string
  }
  return clean.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');
}

/**
 * Validates whether a Link URL (href) is safe (http, https, mailto, tel, anchor)
 * Strictly rejects javascript:, data:, vbscript:, and file:
 */
export function isSafeLinkUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  const normalized = normalizeUrlString(rawUrl);

  // Explicitly reject dangerous executable schemes
  if (/^(javascript|vbscript|data|file|about|blob):/i.test(normalized)) {
    return false;
  }

  // Allow relative URLs starting with / or anchor links #
  if (normalized.startsWith('/') || normalized.startsWith('#')) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates whether an Image URL (src) is safe:
 * Allows http, https, relative paths, and safe base64 images (JPEG, PNG, WEBP, GIF).
 * Strictly forbids SVG data URLs (to prevent embedded XML/JS scripts), HTML data URLs, and javascript:
 */
export function isSafeImageUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  const normalized = normalizeUrlString(rawUrl);

  // Reject executable protocols
  if (/^(javascript|vbscript|file|about):/i.test(normalized)) {
    return false;
  }

  // Safe data URLs for raster images
  if (/^data:image\/(jpeg|png|webp|gif);base64,/i.test(normalized)) {
    return true;
  }

  // Explicitly reject data:image/svg+xml or data:text/html which can execute script
  if (/^data:/i.test(normalized)) {
    return false;
  }

  // Allow relative image paths
  if (normalized.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Backward-compatible generic URL check
 */
export function isSafeUrl(rawUrl: string): boolean {
  return isSafeLinkUrl(rawUrl);
}

/**
 * Strips untrusted tags, event handlers, and dangerous protocols using DOMParser
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
  if (typeof window === 'undefined') {
    // Basic regex fallback if running in non-browser context
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"']*/gi, '#');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  function cleanNode(node: Node) {
    const childNodes = Array.from(node.childNodes);
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 1. Remove disallowed elements completely
        if (!ALLOWED_TAGS.has(tagName)) {
          // If it's an executable/form/embed container, eradicate completely
          if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base', 'applet'].includes(tagName)) {
            el.remove();
            continue;
          }
          // Otherwise unwrap safe text contents
          const textNode = doc.createTextNode(el.textContent || '');
          el.parentNode?.replaceChild(textNode, el);
          continue;
        }

        // 2. Filter attributes
        const allowedAttrsForTag = ALLOWED_ATTRS[tagName] || new Set(['class', 'id']);
        const attrNames = el.getAttributeNames();

        for (const attrName of attrNames) {
          const lowerAttr = attrName.toLowerCase();

          // Disallow event handlers like onload, onclick, onerror, onmouseover
          if (lowerAttr.startsWith('on')) {
            el.removeAttribute(attrName);
            continue;
          }

          // Disallow if not in allowlist
          if (!allowedAttrsForTag.has(lowerAttr)) {
            el.removeAttribute(attrName);
            continue;
          }

          // Validate link hrefs
          if (tagName === 'a' && lowerAttr === 'href') {
            const val = el.getAttribute(attrName) || '';
            if (!isSafeLinkUrl(val)) {
              el.removeAttribute(attrName);
              continue;
            }
            // Enforce secure external links
            el.setAttribute('rel', 'noopener noreferrer');
          }

          // Validate image srcs
          if (tagName === 'img' && lowerAttr === 'src') {
            const val = el.getAttribute(attrName) || '';
            if (!isSafeImageUrl(val)) {
              el.removeAttribute(attrName);
              continue;
            }
          }
        }

        // Recursively clean children
        cleanNode(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        // Strip comments
        child.remove();
      }
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

/**
 * Strips all HTML to produce safe plain text
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
}

/**
 * Sanitizes plain string inputs (such as titles, excerpts, tags)
 */
export function sanitizePlainText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove any HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
    .trim();
}
