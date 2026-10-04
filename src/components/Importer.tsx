import { auth } from "../lib/auth-context";
import { useState } from "react";
import { importLinkedIn } from "../lib/linkedin";
import { duplicateSource } from "../lib/repository";
import {
  emptyArticle,
  normalizeLinkedInUrl,
  slugify,
  type Article,
} from "../lib/domain";
import { sanitize } from "../lib/sanitize";
export function Importer({
  authorId,
  onImport,
  onClose,
}: {
  authorId: string;
  onImport: (a: Article) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [html, setHtml] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<Article | null>(null);
  const check = async () => {
    const canonical = normalizeLinkedInUrl(url);
    if (await duplicateSource(canonical))
      throw new Error(
        "This source URL already exists in the CMS. Open the existing manuscript instead.",
      );
    return canonical;
  };
  return (
    <section className="panel">
      <div className="section-title">
        <h2>Import from LinkedIn</h2>
        <button className="secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <p>
        Import your own public article, or material you have permission to
        republish. Every import needs clinical review.
      </p>
      <label>
        LinkedIn article URL
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSource(null);
          }}
          type="url"
          placeholder="https://www.linkedin.com/pulse/…"
        />
      </label>
      <button
        disabled={busy || !url}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const canonical = await check();
            const result = await importLinkedIn(canonical, authorId);
            setSource(result.article);
            setTitle(result.article.title);
            setBody(result.article.content);
            setHtml(true);
            setMessage(result.warning);
          } catch (err) {
            setMessage(
              err instanceof Error
                ? err.message
                : "Import failed. Paste the content below.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Reading public page…" : "Try URL import"}
      </button>
      <p role="status" className="notice">
        {message}
      </p>
      <details open={!!source} className="import-review">
        <summary>
          {source
            ? "Review the imported article"
            : "Alternative: use your original text if LinkedIn blocks access"}
        </summary>
        <h3>
          {source
            ? "Check before opening the editor"
            : "Use content you have permission to publish"}
        </h3>
        <label>
          Title
          <input
            value={title}
            maxLength={180}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={html}
            onChange={(e) => setHtml(e.target.checked)}
          />
          Pasted content is HTML
        </label>
        <label>
          Article content
          <textarea
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button
          disabled={busy || !title.trim() || !body.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              const canonical = await check();
              let content = body;
              if (!html) {
                const el = document.createElement("div");
                el.textContent = body;
                content = `<p>${el.innerHTML.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
              }
              onImport({
                ...emptyArticle(authorId),
                ...source,
                id: slugify(title),
                title,
                content: sanitize(content),
                sourceUrl: canonical,
                importedAt: new Date().toISOString(),
                importedBy: auth?.currentUser?.uid || "",
              });
            } catch (err) {
              setMessage(
                err instanceof Error ? err.message : "Could not prepare draft.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Open in draft editor
        </button>
      </details>
      <p className="muted">
        URL extraction is best effort: LinkedIn may block it or return only a
        preview. Review each section against the original. The importer runs on
        your existing Cloudflare Worker and never publishes automatically.
      </p>
    </section>
  );
}
