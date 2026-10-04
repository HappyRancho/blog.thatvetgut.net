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
  importedAt?: string;
  importedBy?: string;
};
export type Manuscript = {
  article: Article;
  authorUid: string;
  status: Status;
  revision: number;
  reviewerUid: string;
  reviewerAuthorId: string;
  reviewedAt: unknown;
  updatedAt: string;
  reviewNote: string;
};
export type Publication = {
  article: Article;
  revision: number;
  reviewerUid: string;
  reviewerAuthorId: string;
  reviewedAt: unknown;
  publishedAt: unknown;
  updatedAt?: unknown;
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
  portfolio?: string;
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
    if (/^\/(?!\/)/.test(raw) && !/[\\\x00-\x20]/.test(raw)) return raw;
    if (/[\\\x00-\x20]/.test(raw)) return "";
    const url = new URL(raw);
    if (url.username || url.password) return "";
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
    !/^\/(pulse|posts|newsletters|feed\/update)\/[^\s]+$/.test(url.pathname) ||
    /%2f|%5c|%00|%0a|%0d/i.test(url.pathname) ||
    /[\\\x00-\x20]/.test(raw.trim())
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
  const categoryIds = [
    "pet-health",
    "veterinary-medicine",
    "animal-nutrition",
    "preventive-care",
    "emergency-critical-care",
    "one-health",
    "animal-welfare",
    "livestock-large-animals",
  ];
  const authorIds = [
    "dr-chirag-patidar",
    "dr-amaan-ahmed",
    "dr-shivam-singh-thakur",
    "dr-ritesh-verma",
    "dr-deepesh-mathur",
    "dr-deepesh-chaware",
  ];
  if (!categoryIds.includes(a.category) || !authorIds.includes(a.authorId))
    errors.push("Choose a recognised specialty and founder.");
  if (
    a.subtitle.length > 500 ||
    a.seoTitle.length > 180 ||
    a.seoDescription.length > 500
  )
    errors.push("Shorten the summary or search metadata.");
  if (
    a.tags.length > 15 ||
    a.tags.some((t) => typeof t !== "string" || t.length > 60)
  )
    errors.push("Use up to 15 tags, each shorter than 60 characters.");
  if (a.references.length > 50) errors.push("Use no more than 50 references.");
  if (a.sourceUrl) {
    try {
      normalizeLinkedInUrl(a.sourceUrl);
    } catch {
      errors.push("The source must be a valid LinkedIn URL.");
    }
  }
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

export function dateISO(value: unknown): string {
  try {
    const v = value as { toDate?: () => Date; seconds?: number };
    const d =
      typeof value === "string"
        ? new Date(value)
        : v?.toDate
          ? v.toDate()
          : typeof v?.seconds === "number"
            ? new Date(v.seconds * 1000)
            : null;
    return d && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
  } catch {
    return "";
  }
}
export function dateLabel(value: unknown) {
  const iso = dateISO(value);
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
}
export async function sourceKey(url: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizeLinkedInUrl(url)),
  );
  return [...new Uint8Array(bytes)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
