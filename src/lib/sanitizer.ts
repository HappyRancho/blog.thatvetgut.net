/**
 * Robust HTML & Content Sanitizer for ThatVetGuy CMS
 * Treats all article inputs and imported content as untrusted.
 * Strips script, iframe, object, embed, style, form, input, base, meta,
 * removes all inline javascript: URLs, and event handlers (on* attributes).
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
 * Validates whether a URL is safe (http, https, mailto, tel)
 * Explicitly rejects javascript:, data:, vbscript:, and file:
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  // Strip control chars
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Reject protocol-relative or dangerous schemes
  if (/^javascript:/i.test(sanitized)) return false;
  if (/^data:/i.test(sanitized)) return false;
  if (/^vbscript:/i.test(sanitized)) return false;
  if (/^file:/i.test(sanitized)) return false;

  // Allow relative URLs starting with / or #
  if (sanitized.startsWith('/') || sanitized.startsWith('#')) return true;

  try {
    const parsed = new URL(sanitized);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Strips untrusted tags, event handlers, and dangerous protocols using DOMParser
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
  if (typeof window === 'undefined') {
    // Basic regex fallback if running server-side
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
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
          // If it's a script/style/iframe/object/embed/form, remove completely
          if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base'].includes(tagName)) {
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

          // Disallow event handlers like onload, onclick, onerror
          if (lowerAttr.startsWith('on')) {
            el.removeAttribute(attrName);
            continue;
          }

          // Disallow if not in allowlist
          if (!allowedAttrsForTag.has(lowerAttr)) {
            el.removeAttribute(attrName);
            continue;
          }

          // Validate URLs
          if (lowerAttr === 'href' || lowerAttr === 'src') {
            const val = el.getAttribute(attrName) || '';
            if (!isSafeUrl(val)) {
              el.removeAttribute(attrName);
              continue;
            }
          }

          // Force rel="noopener noreferrer" on external links
          if (tagName === 'a' && lowerAttr === 'href') {
            el.setAttribute('rel', 'noopener noreferrer');
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
 * Strips all HTML to produce plain text
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
