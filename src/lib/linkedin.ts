import {
  normalizeLinkedInUrl,
  slugify,
  type Article,
  emptyArticle,
} from "./domain";
import { sanitize, plain } from "./sanitize";
export function parseLinkedInHtml(
  html: string,
  sourceUrl: string,
  authorId: string,
): { article: Article; warning: string } {
  const url = normalizeLinkedInUrl(sourceUrl);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = (
    doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    doc.querySelector("h1")?.textContent ||
    ""
  ).trim();
  if (!title || /sign in|log in|authwall|security verification/i.test(title))
    throw new Error(
      "LinkedIn returned a login screen or an unreadable page. Paste the article below.",
    );
  const summary =
    doc
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content") || "";
  const body = doc.querySelector(
    ".article-main__content, .reader-article-content, .attributed-text-segment-list, article",
  );
  const content = body
    ? sanitize(body.innerHTML)
    : `<p>${sanitize(summary)}</p>`;
  if (plain(content).trim().length < 60)
    throw new Error(
      "No useful article content was returned. Paste the text or HTML below.",
    );
  const tags = [
    ...new Set(
      (plain(content).match(/#[\p{L}\p{N}_]+/gu) || []).map((t) =>
        t.slice(1).toLowerCase(),
      ),
    ),
  ].slice(0, 15);
  return {
    article: {
      ...emptyArticle(authorId),
      id: slugify(title),
      title: title.slice(0, 180),
      subtitle: plain(summary).slice(0, 500),
      content,
      sourceUrl: url,
      tags,
    },
    warning: body
      ? "Check the imported text against the original, add references and obtain clinical review before publishing."
      : "Only a summary was found. Paste the full article before submitting for review.",
  };
}
export async function importLinkedIn(
  url: string,
  authorId: string,
  allowProxy: boolean,
) {
  const canonical = normalizeLinkedInUrl(url);
  const endpoints = allowProxy
    ? [
        canonical,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(canonical)}`,
      ]
    : [canonical];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(10000),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (html.length > 2000000) throw new Error("Page is too large.");
      return parseLinkedInHtml(html, canonical, authorId);
    } catch {
      /* Try next permitted route. */
    }
  }
  throw new Error(
    "LinkedIn blocked URL extraction or the page could not be reached. Paste the article text or HTML to continue; the source URL will be kept.",
  );
}
