import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocsFromServer,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
  setDoc,
  addDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { database } from "./firebase";
import { sanitize } from "./sanitize";
import {
  type Article,
  type Manuscript,
  type Publication,
  type Author,
  validateArticle,
  normalizeLinkedInUrl,
  sourceKey,
} from "./domain";
export async function publishedPage(
  cursor?: QueryDocumentSnapshot<DocumentData>,
) {
  const q = query(
    collection(database(), "publications"),
    orderBy("publishedAt", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(48),
  );
  const snap = await getDocsFromServer(q);
  return {
    items: snap.docs.map((d) => d.data() as Publication),
    cursor: snap.docs.at(-1),
    more: snap.size === 48,
  };
}
export async function getPublication(id: string) {
  const snap = await getDocFromServer(doc(database(), "publications", id));
  return snap.exists() ? (snap.data() as Publication) : null;
}
export async function manuscripts() {
  const snap = await getDocs(collection(database(), "manuscripts"));
  return snap.docs.map((d) => d.data() as Manuscript);
}
export async function profiles() {
  const snap = await getDocs(collection(database(), "authors"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Author);
}
export async function saveProfile(a: Author) {
  await setDoc(doc(database(), "authors", a.id), a);
}
export async function saveDraft(
  article: Article,
  uid: string,
  expectedRevision?: number,
) {
  const errors = validateArticle(article);
  if (errors.length) throw new Error(errors.join(" "));
  const db = database();
  const ref = doc(db, "manuscripts", article.id);
  const sourceRef = article.sourceUrl
    ? doc(db, "source_imports", await sourceKey(article.sourceUrl))
    : null;
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existingSource = sourceRef ? await tx.get(sourceRef) : null;
    if (
      existingSource?.exists() &&
      existingSource.data().articleId !== article.id
    )
      throw new Error(
        "This LinkedIn source has already been imported. Open the existing manuscript.",
      );
    const old = snap.exists() ? (snap.data() as Manuscript) : null;
    if (old && expectedRevision === undefined)
      throw new Error("This slug is already used. Choose a different one.");
    if (old && old.revision !== expectedRevision)
      throw new Error(
        "Another founder changed this article. Reload before saving.",
      );
    const next: Manuscript = {
      article: {
        ...article,
        tags: article.tags.filter(Boolean),
        content: sanitize(article.content),
      },
      authorUid: old?.authorUid || uid,
      status: "DRAFT",
      revision: (old?.revision || 0) + 1,
      reviewerUid: "",
      reviewerAuthorId: "",
      reviewedAt: "",
      reviewNote: "",
      updatedAt: new Date().toISOString(),
    };
    tx.set(ref, next);
    if (sourceRef && !existingSource?.exists())
      tx.set(sourceRef, {
        articleId: article.id,
        sourceUrl: article.sourceUrl,
        importedBy: uid,
        importedAt: serverTimestamp(),
      });
    if (old?.status === "PUBLISHED")
      tx.delete(doc(db, "publications", article.id));
    return next;
  });
}
export async function transition(
  m: Manuscript,
  status: Manuscript["status"],
  uid: string,
  note = "",
) {
  const db = database();
  if (status === "SUBMITTED FOR REVIEW") {
    const errors = validateArticle(m.article, true);
    if (errors.length) throw new Error(errors.join(" "));
  }
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "manuscripts", m.article.id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("The manuscript was removed.");
    const live = snap.data() as Manuscript;
    if (
      live.revision !== m.revision ||
      live.status !== m.status ||
      live.reviewerUid !== m.reviewerUid
    )
      throw new Error(
        "The manuscript changed. Reload to see its latest state.",
      );
    const next: Manuscript = {
      ...live,
      status,
      updatedAt: new Date().toISOString(),
      reviewNote: note || live.reviewNote,
    };
    if (status === "UNDER REVIEW") {
      const reviewer = await tx.get(doc(db, "cms_users", uid));
      next.reviewerUid = uid;
      next.reviewerAuthorId = reviewer.data()?.authorId || "";
    }
    if (status === "APPROVED") next.reviewedAt = serverTimestamp();
    tx.set(ref, next);
    if (status === "PUBLISHED")
      tx.set(doc(db, "publications", m.article.id), {
        article: next.article,
        revision: next.revision,
        reviewerUid: next.reviewerUid,
        reviewerAuthorId: next.reviewerAuthorId,
        reviewedAt: next.reviewedAt,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    if (status === "UNPUBLISHED")
      tx.delete(doc(db, "publications", m.article.id));
  });
}
export async function deleteDraft(m: Manuscript) {
  const db = database();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "manuscripts", m.article.id);
    const snap = await tx.get(ref);
    const source = m.article.sourceUrl
      ? doc(db, "source_imports", await sourceKey(m.article.sourceUrl))
      : null;
    const imported = source ? await tx.get(source) : null;
    if (
      !snap.exists() ||
      snap.data().revision !== m.revision ||
      snap.data().status === "PUBLISHED"
    )
      throw new Error("Only a current, unpublished draft can be deleted.");
    tx.delete(ref);
    if (source && imported?.data()?.articleId === m.article.id)
      tx.delete(source);
  });
}
export async function duplicateSource(raw: string) {
  const url = normalizeLinkedInUrl(raw);
  const reservation = await getDoc(
    doc(database(), "source_imports", await sourceKey(url)),
  );
  return (
    reservation.exists() ||
    (await manuscripts()).some((m) => m.article.sourceUrl === url)
  );
}
export async function subscribe(email: string, role: string) {
  await addDoc(collection(database(), "newsletter_signups"), {
    email: email.trim().toLowerCase(),
    role,
    consent: true,
    createdAt: serverTimestamp(),
  });
}
export async function contact(name: string, email: string, message: string) {
  await addDoc(collection(database(), "contact_inquiries"), {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    createdAt: serverTimestamp(),
  });
}
