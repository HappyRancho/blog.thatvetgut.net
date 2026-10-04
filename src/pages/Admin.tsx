import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  FilePlus,
  Download,
  LayoutDashboard,
  Users,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useCatalog } from "../lib/contexts";
import { useAuth, AuthProvider, authMessage, auth } from "../lib/auth-context";
import { configured, database } from "../lib/firebase";
import {
  manuscripts,
  transition,
  deleteDraft,
  saveDraft,
  saveProfile,
} from "../lib/repository";
import {
  type Manuscript,
  type Article,
  type Author,
  STATUSES,
  safeUrl,
  dateLabel,
} from "../lib/domain";
import { SEO, Loading } from "../components/Layout";
import { ManuscriptEditor } from "../components/ManuscriptEditor";
import { Importer } from "../components/Importer";
import { ImageField } from "../components/ImageField";
import { MediaImage } from "../components/MediaImage";
import { authors as sourceProfiles } from "../data/editorial";
function Profile({
  onDone,
  onDirty,
  initial,
  onDraftChange,
}: {
  onDone: () => void;
  onDirty: (dirty: boolean) => void;
  initial?: Author;
  onDraftChange: (author: Author) => void;
}) {
  const { member } = useAuth();
  const { authors } = useCatalog();
  const [a, setA] = useState<Author>(
    initial || authors.find((p) => p.id === member?.authorId)!,
  );
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(
    JSON.stringify(authors.find((p) => p.id === member?.authorId)),
  );
  useEffect(() => onDraftChange(a), [a, onDraftChange]);
  const dirty = JSON.stringify(a) !== saved;
  useEffect(() => {
    onDirty(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const guard = (e: MouseEvent) => {
      if (
        dirty &&
        (e.target as Element)?.closest?.("a[href]") &&
        !window.confirm("Leave your profile and discard unsaved changes?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [dirty, onDirty]);
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          (a.image && !safeUrl(a.image, true)) ||
          (a.linkedin && !safeUrl(a.linkedin))
        ) {
          setMsg("Use valid HTTPS URLs.");
          return;
        }
        setBusy(true);
        try {
          await saveProfile(a);
          setSaved(JSON.stringify(a));
          setMsg("Your public profile was updated.");
          onDone();
        } catch (err) {
          setMsg(
            err instanceof Error ? err.message : "Profile could not be saved.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Your professional profile</h2>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          if (
            !dirty ||
            window.confirm("Replace unsaved edits with your main-site profile?")
          ) {
            const source = sourceProfiles.find(
              (p) => p.id === member?.authorId,
            );
            if (source) setA({ ...source });
          }
        }}
      >
        Use details from our main website
      </button>
      <small>
        Loads your existing portfolio details into this form. Review them before
        saving.
      </small>
      {(
        ["name", "role", "qualifications", "affiliation", "linkedin"] as const
      ).map((k) => (
        <label key={k}>
          {
            {
              name: "Display name",
              role: "Professional title",
              qualifications: "Qualifications",
              affiliation: "Clinical affiliation",
              linkedin: "LinkedIn profile",
            }[k]
          }
          <input
            value={a[k]}
            maxLength={
              k === "linkedin"
                ? 2000
                : k === "name"
                  ? 100
                  : k === "affiliation"
                    ? 300
                    : 150
            }
            onChange={(e) => setA({ ...a, [k]: e.target.value })}
          />
        </label>
      ))}
      <ImageField
        value={a.image}
        alt={a.name}
        ownerType="author"
        ownerId={a.id}
        onChange={(url) => setA({ ...a, image: url })}
      />
      <label htmlFor="profile-biography">
        Biography
        <textarea
          id="profile-biography"
          aria-label="Biography"
          rows={6}
          value={a.bio}
          maxLength={4000}
          onChange={(e) => setA({ ...a, bio: e.target.value })}
        />
      </label>
      <label>
        Expertise (comma-separated)
        <input
          value={a.expertise.join(", ")}
          onChange={(e) =>
            setA({
              ...a,
              expertise: e.target.value
                .split(",")
                .map((s) => s.trim())
                .slice(0, 15),
            })
          }
        />
      </label>
      <aside className="profile-preview">
        <span className="eyebrow">Public profile preview</span>
        {a.image && <MediaImage src={safeUrl(a.image, true)} alt={a.name} />}
        <h3>{a.name}</h3>
        <p>
          {a.qualifications} · {a.role}
        </p>
        <p>{a.bio}</p>
      </aside>
      <button disabled={busy}>{busy ? "Saving…" : "Update profile"}</button>
      <p role="status">{msg}</p>
    </form>
  );
}
function EditorialInbox() {
  const [tab, setTab] = useState("contact_inquiries");
  const [rows, setRows] = useState<
    Array<{ id: string; [key: string]: unknown }>
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      const s = await getDocs(
        query(
          collection(database(), tab),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
      );
      setRows(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setError("Unable to load the inbox.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setRows([]);
    void load();
  }, [tab]);
  return (
    <section className="panel">
      <h2>Editorial inbox</h2>
      <label>
        Collection
        <select value={tab} onChange={(e) => setTab(e.target.value)}>
          <option value="contact_inquiries">Contact & corrections</option>
          <option value="newsletter_signups">Newsletter interest</option>
        </select>
      </label>
      <p>
        Latest 100 records. Newsletter sending is not included; registrations
        record interest only.
      </p>
      {busy ? (
        <Loading />
      ) : (
        rows.map((r) => (
          <article key={r.id} className="inbox-record">
            <strong>{String(r.name || r.role || "Reader")}</strong>
            <p>{String(r.email)}</p>
            {!!r.message && (
              <p className="preserve-lines">{String(r.message)}</p>
            )}
            <button
              className="secondary"
              onClick={async () => {
                if (!window.confirm("Permanently delete this submission?"))
                  return;
                try {
                  await deleteDoc(doc(database(), tab, r.id));
                  await load();
                } catch {
                  setError("The submission could not be deleted.");
                }
              }}
            >
              Delete submission
            </button>
          </article>
        ))
      )}
      {!busy && !rows.length && <p>No submissions yet.</p>}
      <p role="alert">{error}</p>
    </section>
  );
}
function Admin() {
  const { user, member, loading, error: authError, login, logout } = useAuth();
  const { reload: reloadCatalog } = useCatalog();
  const [rows, setRows] = useState<Manuscript[]>([]);
  const [tab, setTab] = useState("articles");
  const [editor, setEditor] = useState<{
    session: string;
    manuscript?: Manuscript;
    initial?: Article;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [visible, setVisible] = useState(20);
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileBuffer, setProfileBuffer] = useState<Author>();
  const rememberProfile = useCallback((a: Author) => setProfileBuffer(a), []);
  const rememberDraft = useCallback(
    (article: Article) =>
      setEditor((old) =>
        !old || old.initial === article ? old : { ...old, initial: article },
      ),
    [],
  );
  const previousUid = useRef<string>();
  useEffect(() => {
    if (previousUid.current !== user?.uid) {
      previousUid.current = user?.uid;
      setEditor(null);
      setProfileBuffer(undefined);
      setProfileDirty(false);
      setRows([]);
      setLoaded(false);
    }
  }, [user?.uid]);
  useEffect(() => {
    if (member) return;
    const unsaved =
      profileDirty ||
      !!(
        editor?.initial &&
        JSON.stringify(editor.initial) !==
          JSON.stringify(editor.manuscript?.article)
      );
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const guard = (e: MouseEvent) => {
      if (
        unsaved &&
        (e.target as Element)?.closest?.("a[href]") &&
        !window.confirm("Leave this workspace and discard unsaved changes?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [member, editor, profileDirty]);
  useEffect(() => setVisible(20), [queryText, filter]);
  const reload = async () => {
    setBusy(true);
    try {
      setRows(await manuscripts());
      setLoaded(true);
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Could not load the workspace.",
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (member) void reload();
  }, [member]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setStatus("");
    try {
      await action();
      await reload();
      await reloadCatalog();
      setStatus("Changes saved.");
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "The change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <Loading />;
  if (!member)
    return (
      <div className="container section narrow">
        <SEO
          title="Editorial sign-in"
          description="Secure access for ThatVetGuy co-founders."
          noindex
        />
        <span className="eyebrow">The editorial workspace</span>
        <h1>Good work starts here.</h1>
        <p>
          Sign in with your approved Google account to draft, review and
          publish. Accounts receive access only after an administrator
          provisions their Firebase UID.
        </p>
        <div className="panel">
          <ShieldCheck />
          <h2>Co-founder access</h2>
          {configured ? (
            <button
              onClick={() => {
                void login().catch((err) => setStatus(authMessage(err)));
              }}
            >
              Continue with Google
            </button>
          ) : (
            <div className="notice">
              <strong>Firebase setup required</strong>
              <p>
                Connect the existing free Firebase project. Set the Firebase web
                configuration, enable Google sign-in, deploy the security rules
                and provision each founder. See{" "}
                <code>docs/FIREBASE-SPARK.md</code> in the repository.
              </p>
            </div>
          )}
          {user && (
            <>
              <p>Signed in as {user.email}</p>
              <p>
                Your account ID: <code className="wrap">{user.uid}</code>
              </p>
              <p>
                Give this account ID to the Firebase project owner to request
                editorial access.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  if (
                    (!editor && !profileDirty) ||
                    window.confirm(
                      "Sign out? Save your draft first to keep changes.",
                    )
                  )
                    void logout();
                }}
              >
                Sign out
              </button>
            </>
          )}
          <p className="error" role="alert">
            {authError || status}
          </p>
        </div>
        <Link to="/">Return to the blog</Link>
      </div>
    );
  return (
    <div className="admin-shell container">
      <SEO
        title="Editorial workspace"
        description="ThatVetGuy content management."
        noindex
      />
      <aside className="admin-sidebar">
        <span className="eyebrow">Editorial workspace</span>
        <h2>
          Make it
          <br />
          worth reading.
        </h2>
        <button
          className={tab === "articles" ? "active" : ""}
          onClick={() => {
            if (
              !profileDirty ||
              window.confirm("Leave your profile and discard unsaved changes?")
            )
              setTab("articles");
          }}
        >
          <LayoutDashboard size={18} />
          Manuscripts
        </button>
        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => {
            if (
              (!editor && !profileDirty) ||
              window.confirm(
                "Leave the editor? Save your draft first to keep changes.",
              )
            ) {
              setEditor(null);
              setTab("profile");
            }
          }}
        >
          <Users size={18} />
          My profile
        </button>
        <button
          className={tab === "inbox" ? "active" : ""}
          onClick={() => {
            if (
              (!editor && !profileDirty) ||
              window.confirm(
                "Leave the editor? Save your draft first to keep changes.",
              )
            ) {
              setEditor(null);
              setTab("inbox");
            }
          }}
        >
          <Inbox size={18} />
          Reader inbox
        </button>
        <button
          onClick={() => {
            if (
              (!editor && !profileDirty) ||
              window.confirm("Sign out? Save your draft first to keep changes.")
            )
              void logout();
          }}
        >
          <LogOut size={18} />
          Sign out
        </button>
        <p>{user?.email}</p>
      </aside>
      <div className="admin-main">
        {tab === "profile" ? (
          <Profile
            initial={profileBuffer}
            onDraftChange={rememberProfile}
            onDone={() => void reloadCatalog()}
            onDirty={setProfileDirty}
          />
        ) : tab === "inbox" ? (
          <EditorialInbox />
        ) : (
          <>
            <div className="section-title">
              <div>
                <span className="eyebrow">The publishing desk</span>
                <h1>Your articles, all in one place.</h1>
              </div>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    editor &&
                    !window.confirm(
                      "Start another article? Save this draft first.",
                    )
                  )
                    return;
                  setEditor({ session: crypto.randomUUID() });
                  setImporting(false);
                }}
              >
                <FilePlus size={17} />
                Create article
              </button>
            </div>
            <div className="metrics">
              <div>
                <strong>{rows.length}</strong>
                <span>Manuscripts</span>
              </div>
              <div>
                <strong>
                  {rows.filter((r) => r.status === "PUBLISHED").length}
                </strong>
                <span>Published</span>
              </div>
              <div>
                <strong>
                  {
                    rows.filter((r) =>
                      ["SUBMITTED FOR REVIEW", "UNDER REVIEW"].includes(
                        r.status,
                      ),
                    ).length
                  }
                </strong>
                <span>Awaiting review</span>
              </div>
            </div>
            <p role="status" className="notice">
              {status}
            </p>
            {editor ? (
              <ManuscriptEditor
                key={editor.session}
                {...editor}
                onDraftChange={rememberDraft}
                onSaved={(saved) => {
                  if (auth?.currentUser?.uid !== user?.uid) return;
                  if (editor.manuscript?.status === "PUBLISHED")
                    void reloadCatalog();
                  setRows((old) => [
                    saved,
                    ...old.filter((m) => m.article.id !== saved.article.id),
                  ]);
                  setEditor((old) =>
                    old
                      ? { ...old, manuscript: saved, initial: saved.article }
                      : null,
                  );
                }}
                onClose={() => setEditor(null)}
              />
            ) : importing ? (
              <Importer
                authorId={member.authorId}
                onImport={(a) => {
                  setImporting(false);
                  setEditor({ session: crypto.randomUUID(), initial: a });
                }}
                onClose={() => setImporting(false)}
              />
            ) : (
              <>
                <div className="workspace-actions">
                  <button
                    className="secondary"
                    onClick={() => setImporting(true)}
                  >
                    <Download size={17} />
                    Import LinkedIn article
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => void reload()}
                  >
                    Refresh
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(rows, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `thatvetguy-manuscripts-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    Export manuscripts
                  </button>
                </div>
                <div className="filter-bar">
                  <label>
                    Find a manuscript
                    <input
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Search titles…"
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="">All stages</option>
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {busy && !loaded ? (
                  <Loading />
                ) : (
                  <div className="manuscript-list">
                    {rows
                      .filter(
                        (m) =>
                          (!filter || m.status === filter) &&
                          m.article.title
                            .toLowerCase()
                            .includes(queryText.toLowerCase()),
                      )
                      .slice(0, visible)
                      .map((m) => (
                        <article key={m.article.id}>
                          <div>
                            <span
                              className={`status status-${m.status.toLowerCase().replaceAll(" ", "-")}`}
                            >
                              {m.status}
                            </span>
                            <h3>{m.article.title}</h3>
                            <p>
                              Revision {m.revision}
                              {dateLabel(m.updatedAt) &&
                                " · Updated " + dateLabel(m.updatedAt)}
                            </p>
                            {m.reviewNote && (
                              <p className="review-note">
                                Review note: {m.reviewNote}
                              </p>
                            )}
                          </div>
                          <div className="row-actions">
                            <button
                              className="secondary"
                              disabled={busy}
                              onClick={() =>
                                setEditor({
                                  session: crypto.randomUUID(),
                                  manuscript: m,
                                })
                              }
                            >
                              Open editor
                            </button>
                            {["DRAFT", "CHANGES REQUESTED"].includes(
                              m.status,
                            ) && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(() =>
                                    transition(
                                      m,
                                      "SUBMITTED FOR REVIEW",
                                      user!.uid,
                                    ),
                                  )
                                }
                              >
                                Submit for review
                              </button>
                            )}
                            {m.status === "SUBMITTED FOR REVIEW" &&
                              m.authorUid !== user!.uid &&
                              m.article.authorId !== member.authorId && (
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    void run(() =>
                                      transition(m, "UNDER REVIEW", user!.uid),
                                    )
                                  }
                                >
                                  Take review
                                </button>
                              )}
                            {m.status === "UNDER REVIEW" &&
                              m.reviewerUid === user!.uid && (
                                <>
                                  <button
                                    disabled={busy}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "I have checked the complete manuscript, clinical claims, sources and permissions. Approve this revision?",
                                        )
                                      )
                                        void run(() =>
                                          transition(m, "APPROVED", user!.uid),
                                        );
                                    }}
                                  >
                                    Approve revision
                                  </button>
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() => {
                                      const note = window.prompt(
                                        "Describe the changes required:",
                                      );
                                      if (note?.trim())
                                        void run(() =>
                                          transition(
                                            m,
                                            "CHANGES REQUESTED",
                                            user!.uid,
                                            note.trim(),
                                          ),
                                        );
                                    }}
                                  >
                                    Request changes
                                  </button>
                                </>
                              )}
                            {["APPROVED", "UNPUBLISHED"].includes(m.status) && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(() =>
                                    transition(m, "PUBLISHED", user!.uid),
                                  )
                                }
                              >
                                Publish
                              </button>
                            )}
                            {m.status === "PUBLISHED" && (
                              <>
                                <Link
                                  className="button secondary"
                                  to={`/article/${m.article.id}`}
                                >
                                  View article
                                </Link>
                                <button
                                  disabled={busy}
                                  className="secondary"
                                  onClick={() =>
                                    void run(() =>
                                      transition(m, "UNPUBLISHED", user!.uid),
                                    )
                                  }
                                >
                                  Unpublish
                                </button>
                              </>
                            )}
                            {m.status !== "PUBLISHED" && (
                              <button
                                className="link-button danger"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Permanently delete this manuscript? Export a backup first if needed.",
                                    )
                                  )
                                    void run(() => deleteDraft(m));
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                  </div>
                )}
                {rows.filter(
                  (m) =>
                    (!filter || m.status === filter) &&
                    m.article.title
                      .toLowerCase()
                      .includes(queryText.toLowerCase()),
                ).length > visible && (
                  <button
                    className="secondary"
                    onClick={() => setVisible((n) => n + 20)}
                  >
                    Show more articles
                  </button>
                )}
                {loaded && rows.length === 0 && (
                  <div className="panel">
                    <h2>Start with practical reader questions.</h2>
                    <p>
                      30 practical articles, five assigned to each founder,
                      covering all eight specialties. Suggested authors must
                      verify and accept the material; no clinical review or
                      publication is implied.
                    </p>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const { launchDrafts } = await import(
                            "../data/launch-drafts"
                          );
                          for (const a of launchDrafts)
                            await saveDraft(a, user!.uid);
                        })
                      }
                    >
                      Add 30 article drafts
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PrivateWorkspace() {
  return (
    <AuthProvider>
      <Admin />
    </AuthProvider>
  );
}
