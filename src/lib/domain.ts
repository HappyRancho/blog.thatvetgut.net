export const STATUSES = [
  "DRAFT",
  "SUBMITTED FOR REVIEW",
  "UNDER REVIEW",
  "CHANGES REQUESTED",
  "APPROVED",
  "PUBLISHED",
  "UNPUBLISHED",
] as const;
export type Status = (typeof STATUSES)[number];
export type Reference = {
  title: string;
  url: string;
  year: string;
  doi?: string;
};
export type Article = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  authorId: string;
  content: string;
  image: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  references: Reference[];
  sourceUrl: string;
  audience: "Pet parents" | "Veterinary professionals";
};
export type Manuscript = {
  article: Article;
  authorUid: string;
  status: Status;
  revision: number;
  reviewerUid: string;
  reviewerAuthorId: string;
  reviewedAt: string;
  updatedAt: string;
  reviewNote: string;
};
export type Publication = {
  article: Article;
  revision: number;
  reviewerUid: string;
  reviewerAuthorId: string;
  reviewedAt: string;
  publishedAt: unknown;
};
export type Author = {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  bio: string;
  expertise: string[];
  affiliation: string;
  image: string;
  linkedin: string;
};
export type Member = {
  authorId: string;
  role: "CO_FOUNDER";
  status: "ACTIVE" | "INACTIVE";
};
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}
export function readingTime(html: string) {
  return Math.max(
    1,
    Math.ceil(
      html
        .replace(/<[^>]*>/g, " ")
        .trim()
        .split(/\s+/).length / 220,
    ),
  );
}
export function safeUrl(raw: string, image = false): string {
  try {
    if (/^\/(?!\/)/.test(raw)) return raw;
    const url = new URL(raw);
    return url.protocol === "https:" || (!image && url.protocol === "http:")
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function normalizeLinkedInUrl(raw: string) {
  const url = new URL(raw.trim());
  if (
    url.protocol !== "https:" ||
    !/^(www\.)?linkedin\.com$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    !/^\/(pulse|posts|newsletters|feed\/update)\/.+/.test(url.pathname)
  )
    throw new Error(
      "Use a public linkedin.com article, post or newsletter URL.",
    );
  return "https://www.linkedin.com" + url.pathname.replace(/\/+$/, "");
}
export function canTransition(from: Status, to: Status, isAuthor: boolean) {
  if (to === "DRAFT") return true;
  const pairs: Partial<Record<Status, Status[]>> = {
    DRAFT: ["SUBMITTED FOR REVIEW"],
    "CHANGES REQUESTED": ["SUBMITTED FOR REVIEW"],
    "SUBMITTED FOR REVIEW": ["UNDER REVIEW"],
    "UNDER REVIEW": ["CHANGES REQUESTED", "APPROVED"],
    APPROVED: ["PUBLISHED"],
    PUBLISHED: ["UNPUBLISHED"],
    UNPUBLISHED: ["PUBLISHED"],
  };
  return (
    !!pairs[from]?.includes(to) &&
    (!["UNDER REVIEW", "APPROVED", "CHANGES REQUESTED"].includes(to) ||
      !isAuthor)
  );
}
export function emptyArticle(authorId: string): Article {
  return {
    id: "",
    title: "",
    subtitle: "",
    category: "pet-health",
    tags: [],
    authorId,
    content: "",
    image: "",
    imageAlt: "",
    seoTitle: "",
    seoDescription: "",
    references: [],
    sourceUrl: "",
    audience: "Pet parents",
  };
}
export function validateArticle(a: Article, forReview = false): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id) || a.id.length > 100)
    errors.push("Use a URL slug with lowercase letters, numbers and hyphens.");
  if (a.title.trim().length < 8 || a.title.length > 180)
    errors.push("Add a title between 8 and 180 characters.");
  if (a.content.length > 150000) errors.push("Article body is too long.");
  if (a.image && !safeUrl(a.image, true))
    errors.push("Use an HTTPS image URL or a local asset path.");
  if (a.image && !a.imageAlt.trim())
    errors.push("Describe the featured image for screen readers.");
  if (forReview && a.content.replace(/<[^>]*>/g, "").trim().length < 200)
    errors.push("Add the complete article before submitting for review.");
  if (forReview && !a.references.length)
    errors.push("Add at least one source before clinical review.");
  if (a.references.some((r) => !r.title.trim() || !safeUrl(r.url)))
    errors.push("Each reference needs a title and a valid URL.");
  return errors;
}
