import { MediaImage, useInlineMedia } from "../components/MediaImage";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, Share2, Clock, ShieldCheck, X, Copy } from "lucide-react";
import { useCatalog } from "../lib/contexts";
import { configured } from "../lib/firebase";
import { getPublication } from "../lib/repository";
import {
  readingTime,
  safeUrl,
  dateISO,
  dateLabel,
  type Publication,
} from "../lib/domain";
import { sanitize } from "../lib/sanitize";
import { categoryName } from "../data/editorial";
import { SEO, Disclaimer, Loading, Empty } from "../components/Layout";
import { ArticleCard } from "../components/ArticleCard";
export default function ArticlePage() {
  const { slug = "" } = useParams();
  const { items, authors } = useCatalog();
  const seed = items.find((p) => p.article.id === slug);
  const [item, setItem] = useState<Publication | null>(seed || null);
  const [loading, setLoading] = useState(!seed);
  const [error, setError] = useState("");
  const [large, setLarge] = useState(false);
  const [saved, setSaved] = useState(false);
  const [share, setShare] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(!items.some((p) => p.article.id === slug));
    if (items.some((p) => p.article.id === slug))
      setItem(items.find((p) => p.article.id === slug)!);
    setError("");
    async function fetchArticle() {
      try {
        const found = configured
          ? await getPublication(slug)
          : (await import("../data/launch-drafts")).launchDrafts
              .filter((a) => a.id === slug)
              .map((article) => ({
                article,
                revision: 1,
                reviewerUid: "",
                reviewerAuthorId: "",
                reviewedAt: "",
                publishedAt: null,
              }))[0] || null;
        if (active) setItem(found);
      } catch {
        if (active)
          setError(
            "This article could not be loaded. Please refresh to try again.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchArticle();
    try {
      setSaved(
        (
          JSON.parse(localStorage.getItem("tvg-bookmarks") || "[]") as string[]
        ).includes(slug),
      );
    } catch {
      setSaved(false);
    }
    return () => {
      active = false;
    };
  }, [slug]);
  const body = useMemo(() => {
    if (!item)
      return { html: "", headings: [] as { id: string; text: string }[] };
    const doc = new DOMParser().parseFromString(
      sanitize(item.article.content),
      "text/html",
    );
    const headings = Array.from(doc.querySelectorAll("h2")).map((el, i) => {
      el.id = `section-${i + 1}`;
      return { id: el.id, text: el.textContent || "" };
    });
    return { html: doc.body.innerHTML, headings };
  }, [item]);
  const resolvedBody = useInlineMedia(body.html);
  useEffect(() => {
    if (!share) return;
    const dialog = document.getElementById("share-dialog") as HTMLDialogElement;
    dialog?.showModal();
    return () => dialog?.close();
  }, [share]);
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="container section error" role="alert">
        {error}
      </div>
    );
  if (!item)
    return (
      <div className="container section">
        <SEO
          title="Article unavailable"
          description="This article is not currently published."
          noindex
        />
        <Empty
          title="This article is not available."
          text="It may have been withdrawn for review, or the address may be incorrect."
        />
      </div>
    );
  const a = item.article;
  const author = authors.find((x) => x.id === a.authorId);
  const related = items
    .filter(
      (p) =>
        p.article.id !== a.id &&
        (p.article.category === a.category ||
          p.article.tags.some((t) => a.tags.includes(t))),
    )
    .slice(0, 3);
  const url =
    (import.meta.env.VITE_SITE_URL || window.location.origin).replace(
      /\/$/,
      "",
    ) + `/article/${a.id}`;
  const toggle = () => {
    try {
      let ids = JSON.parse(localStorage.getItem("tvg-bookmarks") || "[]");
      if (!Array.isArray(ids)) ids = [];
      localStorage.setItem(
        "tvg-bookmarks",
        JSON.stringify(
          saved ? ids.filter((id: string) => id !== slug) : [...ids, slug],
        ),
      );
      setSaved(!saved);
    } catch {
      setMessage("This browser could not save the bookmark.");
    }
  };
  return (
    <article>
      <SEO
        title={a.seoTitle || a.title}
        description={a.seoDescription || a.subtitle}
        image={a.image}
        article={item}
      />
      <div className="article-heading container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={`/category/${a.category}`}>{categoryName(a.category)}</Link>
        </nav>
        <Link className="eyebrow" to={`/category/${a.category}`}>
          {categoryName(a.category)}
        </Link>
        <h1>{a.title}</h1>
        <p className="standfirst">{a.subtitle}</p>
        <div className="article-attribution">
          <div>
            <Link to={`/author/${a.authorId}`}>
              <strong>{author?.name}</strong>
            </Link>
            <span>{author?.qualifications}</span>
            {author?.image && (
              <MediaImage
                className="byline-photo"
                src={safeUrl(author.image, true)}
                alt=""
                width={44}
                height={44}
              />
            )}
          </div>
          <span>
            <Clock size={16} /> {readingTime(a.content)} min read
          </span>
          <span>{a.audience}</span>
        </div>
        {dateLabel(item.publishedAt) && (
          <p className="publication-date">
            Published {dateLabel(item.publishedAt)}
            {dateISO(item.updatedAt) &&
            dateISO(item.updatedAt) !== dateISO(item.publishedAt)
              ? " · Updated " + dateLabel(item.updatedAt)
              : ""}
          </p>
        )}
        {!configured ? (
          <div className="review-badge pending">
            Launch draft · Clinical review pending · Not a published veterinary
            recommendation
          </div>
        ) : dateISO(item.reviewedAt) &&
          authors.some((p) => p.id === item.reviewerAuthorId) ? (
          <div className="review-badge">
            <ShieldCheck size={17} /> Reviewed by{" "}
            {authors.find((p) => p.id === item.reviewerAuthorId)?.name || ""} ·{" "}
            {dateLabel(item.reviewedAt)} · Revision {item.revision}
          </div>
        ) : null}
      </div>
      {a.image && safeUrl(a.image, true) && (
        <figure className="article-cover container">
          <MediaImage src={safeUrl(a.image, true)} alt={a.imageAlt} />
        </figure>
      )}
      <div className="reading-layout container">
        <aside className="toc">
          <span className="eyebrow">In this article</span>
          {body.headings.map((h) => (
            <a key={h.id} href={`#${h.id}`}>
              {h.text}
            </a>
          ))}
          <div className="reading-tools">
            <button
              onClick={() => setLarge(!large)}
              aria-pressed={large}
              aria-label="Toggle larger article text"
            >
              A{large ? "−" : "+"}
            </button>
            <button
              onClick={toggle}
              aria-pressed={saved}
              aria-label={saved ? "Remove bookmark" : "Bookmark article"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
            <button onClick={() => setShare(true)} aria-label="Share article">
              <Share2 size={18} />
            </button>
          </div>
          <p role="status">{message}</p>
        </aside>
        <div>
          <div
            className={large ? "prose large" : "prose"}
            dangerouslySetInnerHTML={{ __html: resolvedBody }}
          />
          <Disclaimer />
          {a.references.length > 0 && (
            <section className="references">
              <h2>Read the evidence</h2>
              <p className="muted">
                Sources for further reading. Recommendations should be
                interpreted in their clinical and local context.
              </p>
              {a.references.map((r, i) => (
                <details key={i}>
                  <summary>
                    {i + 1}. {r.title}
                    {r.year ? ` (${r.year})` : ""}
                  </summary>
                  <p>
                    <a
                      href={safeUrl(r.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open source
                    </a>
                    {r.doi && <span> · DOI: {r.doi}</span>}
                  </p>
                </details>
              ))}
            </section>
          )}
          {a.sourceUrl && safeUrl(a.sourceUrl) && (
            <p className="muted">
              Adapted from{" "}
              <a
                href={safeUrl(a.sourceUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                the contributor’s LinkedIn publication
              </a>
              .
            </p>
          )}
          <div className="article-tags">
            {a.tags.map((t) => (
              <Link key={t} to={`/tag/${encodeURIComponent(t)}`}>
                {t}
              </Link>
            ))}
          </div>
          {author && (
            <details className="author-box">
              <summary>
                About {author.name} · {author.qualifications}
              </summary>
              <p>{author.bio}</p>
              <p>{author.affiliation}</p>
              <Link to={`/author/${author.id}`}>View full profile</Link>
            </details>
          )}
          <p className="muted">
            Spot a clinical error or a source that needs updating?{" "}
            <Link to="/contact">Request an editorial correction.</Link>
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section container">
          <div className="section-title">
            <h2>Continue your reading.</h2>
          </div>
          <div className="article-grid">
            {related.map((p) => (
              <ArticleCard key={p.article.id} item={p} />
            ))}
          </div>
        </section>
      )}
      {share && (
        <dialog
          id="share-dialog"
          onCancel={() => setShare(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShare(false);
          }}
        >
          <div className="dialog-title">
            <h2>Share this reading</h2>
            <button
              className="icon-button"
              onClick={() => setShare(false)}
              aria-label="Close sharing"
            >
              <X />
            </button>
          </div>
          <div className="share-links">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              X / Twitter
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(a.title + " " + url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
          <input
            aria-label="Article link"
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setMessage("Link copied.");
              } catch {
                setMessage("Select and copy the link above.");
              }
            }}
          >
            <Copy size={16} />
            Copy link
          </button>
          <p role="status">{message}</p>
        </dialog>
      )}
    </article>
  );
}
