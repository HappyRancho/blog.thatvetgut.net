import {
  normalizeLinkedInUrl,
  slugify,
  type Article,
  emptyArticle,
} from "./domain";
import { auth } from "./auth-context";
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
  if (body) {
    for (const img of body.querySelectorAll("img")) {
      const source =
        img.getAttribute("src") ||
        img.getAttribute("data-delayed-url") ||
        img.getAttribute("data-src") ||
        "";
      try {
        const full = new URL(source, url).href;
        if (
          !source ||
          !/^https:/.test(full) ||
          !img.getAttribute("alt")?.trim()
        ) {
          img.remove();
          continue;
        }
        img.setAttribute("src", full);
      } catch {
        img.remove();
      }
    }
  }
  const content = body ? sanitize(body.innerHTML) : "";
  if (!body)
    throw new Error(
      "LinkedIn returned only a preview. The complete article must be publicly accessible to import it.",
    );
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
  _allowProxy = false,
) {
  const canonical = normalizeLinkedInUrl(url);
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in before importing.");
  const response = await fetch("/api/linkedin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: canonical }),
    signal: AbortSignal.timeout(45000),
    credentials: "omit",
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "LinkedIn import could not be completed.");
  return parseLinkedInHtml(result.html, canonical, authorId);
}
