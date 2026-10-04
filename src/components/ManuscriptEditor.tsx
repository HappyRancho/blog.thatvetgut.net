import { useState, useEffect, lazy, Suspense } from "react";
import type { Article, Manuscript } from "../lib/domain";
import { emptyArticle, slugify, safeUrl } from "../lib/domain";
import { useCatalog } from "../lib/contexts";
import { useAuth } from "../lib/auth-context";
import { categories } from "../data/editorial";
import { saveDraft } from "../lib/repository";
const RichEditor = lazy(() =>
  import("./RichEditor").then((m) => ({ default: m.RichEditor })),
);
import { sanitize } from "../lib/sanitize";
import { ImageField } from "./ImageField";
import { useInlineMedia } from "./MediaImage";
export function ManuscriptEditor({
  manuscript,
  initial,
  onSaved,
  onClose,
}: {
  manuscript?: Manuscript;
  initial?: Article;
  onSaved: (saved: Manuscript) => void;
  onClose: () => void;
}) {
  const { user, member } = useAuth();
  const { authors } = useCatalog();
  const [a, setA] = useState<Article>(
    manuscript?.article || initial || emptyArticle(member!.authorId),
  );
  const [manual, setManual] = useState(!!manuscript || !!initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [revision, setRevision] = useState(manuscript?.revision);
  const [savedMessage, setSavedMessage] = useState("");
  const previewContent = useInlineMedia(sanitize(a.content));
  useEffect(() => {
    const guard = (e: MouseEvent) => {
      const link = (e.target as Element)?.closest?.("a[href]");
      if (
        dirty &&
        link &&
        !link.getAttribute("href")?.startsWith("#") &&
        !window.confirm("Leave this article and discard unsaved edits?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty]);
  const set = <K extends keyof Article>(key: K, value: Article[K]) => {
    setDirty(true);
    setA((old) => ({ ...old, [key]: value }));
  };
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">
            {manuscript
              ? `Revision ${manuscript.revision} · ${manuscript.status}`
              : "New manuscript"}
          </span>
          <h2>
            {manuscript ? "Edit manuscript" : "Start with a good question."}
          </h2>
        </div>
        <button
          className="secondary"
          onClick={() => {
            if (!dirty || window.confirm("Discard unsaved changes?")) onClose();
          }}
        >
          Close editor
        </button>
      </div>
      {manuscript?.status === "PUBLISHED" && (
        <p className="alert">
          Saving changes withdraws the published version and starts a new draft
          for clinical review.
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const saved = await saveDraft(a, user!.uid, revision);
            setRevision(saved.revision);
            setManual(true);
            setDirty(false);
            setSavedMessage("Draft saved to Firebase.");
            onSaved(saved);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="editor-grid">
          <div className="form-stack">
            <label>
              Title
              <input
                required
                maxLength={180}
                value={a.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setDirty(true);
                  setA((old) => ({
                    ...old,
                    title,
                    id: manual ? old.id : slugify(title),
                  }));
                }}
              />
            </label>
            <label>
              Subtitle / clinical summary
              <textarea
                maxLength={500}
                rows={3}
                value={a.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
              />
            </label>
            <div className="section-title">
              <h3>Article body</h3>
              <button
                type="button"
                className="secondary"
                onClick={() => setPreview(!preview)}
              >
                {preview ? "Return to editor" : "Preview formatting"}
              </button>
            </div>
            {preview ? (
              <div
                className="prose panel"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <Suspense
                fallback={<p role="status">Opening the writing tools…</p>}
              >
                <RichEditor
                  value={a.content}
                  ownerId={a.id}
                  onUploadStart={() => setManual(true)}
                  onChange={(value) => set("content", value)}
                />
              </Suspense>
            )}
            <h3>Sources & references</h3>
            {a.references.map((r, i) => (
              <fieldset key={i} className="reference-editor">
                <legend>Reference {i + 1}</legend>
                {(["title", "url", "year", "doi"] as const).map((key) => (
                  <label key={key}>
                    {key === "doi" ? "DOI (optional)" : key}
                    <input
                      type={key === "url" ? "url" : "text"}
                      value={r[key] || ""}
                      onChange={(e) =>
                        set(
                          "references",
                          a.references.map((ref, n) =>
                            n === i ? { ...ref, [key]: e.target.value } : ref,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    set(
                      "references",
                      a.references.filter((_, n) => n !== i),
                    )
                  }
                >
                  Remove source
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                set("references", [
                  ...a.references,
                  { title: "", url: "", year: "" },
                ])
              }
            >
              Add reference
            </button>
          </div>
          <aside className="form-stack editor-settings">
            <h3>Publication details</h3>
            <label>
              URL slug
              <input
                value={a.id}
                readOnly={
                  !!revision ||
                  (manual && /\/media\//.test(a.image + a.content))
                }
                onChange={(e) => {
                  setManual(true);
                  set("id", slugify(e.target.value));
                }}
              />
              <small>
                {manuscript
                  ? "The URL stays stable after the first save."
                  : "Letters, numbers and hyphens. Must be unique."}
              </small>
            </label>
            <label>
              Author
              <select
                value={a.authorId}
                onChange={(e) => set("authorId", e.target.value)}
              >
                {authors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Specialty
              <select
                value={a.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Audience
              <select
                value={a.audience}
                onChange={(e) =>
                  set("audience", e.target.value as Article["audience"])
                }
              >
                <option>Pet parents</option>
                <option>Veterinary professionals</option>
              </select>
            </label>
            <label>
              Tags (comma-separated)
              <input
                value={a.tags.join(", ")}
                onChange={(e) =>
                  set(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .slice(0, 15),
                  )
                }
              />
            </label>
            <ImageField
              value={a.image}
              alt={a.imageAlt}
              ownerType="article"
              ownerId={a.id}
              onUploadStart={() => setManual(true)}
              onChange={(url) => set("image", url)}
            />
            <label>
              Image description
              <input
                maxLength={300}
                value={a.imageAlt}
                onChange={(e) => set("imageAlt", e.target.value)}
              />
            </label>
            <h3>Search appearance</h3>
            <label>
              SEO title
              <input
                maxLength={180}
                value={a.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </label>
            <label>
              SEO description
              <textarea
                maxLength={500}
                value={a.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </label>
            {a.sourceUrl && (
              <p>
                Imported from{" "}
                <a
                  href={safeUrl(a.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            )}
          </aside>
        </div>
        <div className="save-bar">
          <span role="status">
            {busy
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : savedMessage || "No unsaved edits"}
          </span>
          <button disabled={busy}>
            {busy ? "Saving to Firebase…" : "Save draft"}
          </button>
        </div>
        <p className="error" role="alert">
          {error}
        </p>
      </form>
    </section>
  );
}
