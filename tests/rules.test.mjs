import { readFile } from "node:fs/promises";
import { before, after, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-thatvetguy",
    firestore: {
      rules: await readFile("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8085,
    },
  });
});
after(async () => {
  await env?.cleanup();
});
const authorId = "dr-chirag-patidar";
const article = {
  id: "test-article",
  title: "An article for testing",
  subtitle: "Clinical summary",
  category: "pet-health",
  tags: ["dogs"],
  authorId,
  content: "<p>" + "Safe clinical education. ".repeat(20) + "</p>",
  image: "",
  imageAlt: "",
  seoTitle: "",
  seoDescription: "",
  references: [{ title: "Reference", url: "https://example.com", year: "" }],
  sourceUrl: "",
  audience: "Pet parents",
};
const manuscript = {
  article,
  authorUid: "author",
  status: "DRAFT",
  revision: 1,
  reviewerUid: "",
  reviewerAuthorId: "",
  reviewedAt: "",
  updatedAt: "2026-10-03T00:00:00Z",
  reviewNote: "",
};
const db = (uid) =>
  env
    .authenticatedContext(uid, {
      email_verified: true,
      email: uid + "@example.com",
    })
    .firestore();
const ref = (d, c = "manuscripts") => doc(d, c, article.id);
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const [uid, id, status] of [
      ["author", authorId, "ACTIVE"],
      ["reviewer", "dr-ritesh-verma", "ACTIVE"],
      ["inactive", "dr-deepesh-mathur", "INACTIVE"],
    ])
      await setDoc(doc(ctx.firestore(), "cms_users", uid), {
        authorId: id,
        role: "CO_FOUNDER",
        status,
      });
  });
});
test("public, inactive and unapproved accounts cannot read drafts or self-provision", async () => {
  await assertSucceeds(setDoc(ref(db("author")), manuscript));
  await assertFails(getDoc(ref(env.unauthenticatedContext().firestore())));
  await assertFails(getDocs(collection(db("outsider"), "manuscripts")));
  await assertFails(getDoc(ref(db("inactive"))));
  await assertFails(
    setDoc(doc(db("outsider"), "cms_users", "outsider"), {
      authorId,
      role: "CO_FOUNDER",
      status: "ACTIVE",
    }),
  );
  await assertFails(
    updateDoc(doc(db("inactive"), "cms_users", "inactive"), {
      status: "ACTIVE",
    }),
  );
});
test("no direct publish, no self-review, and no approval bypass", async () => {
  const a = db("author");
  await setDoc(ref(a), manuscript);
  await assertFails(updateDoc(ref(a), { status: "PUBLISHED" }));
  await assertFails(
    updateDoc(ref(a), {
      status: "APPROVED",
      reviewerUid: "author",
      reviewedAt: "today",
    }),
  );
  await assertSucceeds(updateDoc(ref(a), { status: "SUBMITTED FOR REVIEW" }));
  await assertFails(
    updateDoc(ref(a), { status: "UNDER REVIEW", reviewerUid: "author" }),
  );
});
test("independent review and atomic publish, withdrawal and stale-publication rejection", async () => {
  const a = db("author"),
    r = db("reviewer");
  await setDoc(ref(a), manuscript);
  await updateDoc(ref(a), { status: "SUBMITTED FOR REVIEW" });
  await updateDoc(ref(r), {
    status: "UNDER REVIEW",
    reviewerUid: "reviewer",
    reviewerAuthorId: "dr-ritesh-verma",
  });
  await assertFails(
    updateDoc(ref(a), { status: "APPROVED", reviewedAt: serverTimestamp() }),
  );
  await assertSucceeds(
    updateDoc(ref(r), { status: "APPROVED", reviewedAt: serverTimestamp() }),
  );
  await assertFails(updateDoc(ref(a), { status: "PUBLISHED" }));
  let b = writeBatch(a);
  b.update(ref(a), { status: "PUBLISHED" });
  const reviewed = (await getDoc(ref(a))).data().reviewedAt;
  b.set(ref(a, "publications"), {
    article,
    revision: 1,
    reviewerUid: "reviewer",
    reviewerAuthorId: "dr-ritesh-verma",
    reviewedAt: reviewed,
    publishedAt: serverTimestamp(),
  });
  await assertSucceeds(b.commit());
  await assertSucceeds(
    getDoc(ref(env.unauthenticatedContext().firestore(), "publications")),
  );
  await assertFails(updateDoc(ref(a), { status: "UNPUBLISHED" }));
  b = writeBatch(a);
  b.update(ref(a), { status: "UNPUBLISHED" });
  b.delete(ref(a, "publications"));
  await assertSucceeds(b.commit());
  await assertFails(
    setDoc(ref(a, "publications"), {
      article,
      revision: 1,
      reviewerUid: "reviewer",
      reviewerAuthorId: "dr-ritesh-verma",
      reviewedAt: "2026-10-03",
      publishedAt: serverTimestamp(),
    }),
  );
});
test("editing invalidates approval and requires a new revision", async () => {
  const a = db("author");
  await setDoc(ref(a), manuscript);
  await assertFails(
    updateDoc(ref(a), {
      article: { ...article, title: "Changed article title" },
    }),
  );
  await assertSucceeds(
    updateDoc(ref(a), {
      article: { ...article, title: "Changed article title" },
      revision: 2,
    }),
  );
  await assertFails(
    setDoc(ref(a), { ...manuscript, revision: 3, extra: "unsafe" }),
  );
});
test("profile writes are scoped to the mapped founder", async () => {
  const profile = {
    id: authorId,
    name: "Dr. Chirag Patidar",
    role: "Co-Founder",
    qualifications: "BVSc & AH",
    bio: "Biography",
    expertise: [],
    affiliation: "ThatVetGuy",
    image: "",
    linkedin: "",
  };
  await assertSucceeds(setDoc(doc(db("author"), "authors", authorId), profile));
  await assertFails(setDoc(doc(db("reviewer"), "authors", authorId), profile));
});
test("reader submissions are validated and private", async () => {
  const publicDb = env.unauthenticatedContext().firestore();
  const r = doc(publicDb, "newsletter_signups", "signup");
  await assertSucceeds(
    setDoc(r, {
      email: "reader@example.com",
      role: "Pet parent",
      consent: true,
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(r));
  await assertFails(
    setDoc(doc(publicDb, "newsletter_signups", "invalid"), {
      email: "bad",
      role: "Pet parent",
      consent: true,
      createdAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    getDoc(doc(db("author"), "newsletter_signups", "signup")),
  );
});
test("assigned author cannot review a draft created on their behalf", async () => {
  const a = db("author");
  await setDoc(ref(a), {
    ...manuscript,
    article: { ...article, authorId: "dr-ritesh-verma" },
  });
  await updateDoc(ref(a), { status: "SUBMITTED FOR REVIEW" });
  await assertFails(
    updateDoc(ref(db("reviewer")), {
      status: "UNDER REVIEW",
      reviewerUid: "reviewer",
      reviewerAuthorId: "dr-ritesh-verma",
    }),
  );
});
test("public snapshot cannot differ from approved clinical content", async () => {
  const a = db("author");
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(ref(ctx.firestore()), {
      ...manuscript,
      status: "APPROVED",
      reviewerUid: "reviewer",
      reviewerAuthorId: "dr-ritesh-verma",
      reviewedAt: "2026-10-03",
    });
  });
  const b = writeBatch(a);
  b.update(ref(a), { status: "PUBLISHED" });
  b.set(ref(a, "publications"), {
    article: { ...article, content: "Unreviewed substitute" },
    revision: 1,
    reviewerUid: "reviewer",
    reviewerAuthorId: "dr-ritesh-verma",
    reviewedAt: "2026-10-03",
    publishedAt: serverTimestamp(),
  });
  await assertFails(b.commit());
});

test("unrecognised founder mappings and unverified identities cannot manage content", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "cms_users", "unexpected"), {
      authorId: "outsider",
      role: "CO_FOUNDER",
      status: "ACTIVE",
    });
  });
  await assertFails(setDoc(ref(db("unexpected")), manuscript));
  const unverified = env
    .authenticatedContext("author", { email_verified: false })
    .firestore();
  await assertFails(getDoc(ref(unverified)));
});
test("review time cannot be forged and requesting changes cannot alter review metadata", async () => {
  const a = db("author"),
    r = db("reviewer");
  await setDoc(ref(a), manuscript);
  await updateDoc(ref(a), { status: "SUBMITTED FOR REVIEW" });
  await updateDoc(ref(r), {
    status: "UNDER REVIEW",
    reviewerUid: "reviewer",
    reviewerAuthorId: "dr-ritesh-verma",
  });
  await assertFails(
    updateDoc(ref(r), { status: "APPROVED", reviewedAt: "invented date" }),
  );
  await assertFails(
    updateDoc(ref(r), {
      status: "CHANGES REQUESTED",
      reviewedAt: "invented date",
    }),
  );
});
test("draft media remains private and another founder cannot upload profile media for me", async () => {
  const id = "11111111-1111-1111-1111-111111111111",
    a = db("author"),
    publicDb = env.unauthenticatedContext().firestore();
  const image = {
    ownerType: "article",
    ownerId: article.id,
    uploadedBy: "author",
    data: "data:image/webp;base64,AAAA",
    width: 800,
    height: 600,
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(a, "media", id), image));
  await assertFails(getDoc(doc(publicDb, "media", id)));
  await assertSucceeds(getDoc(doc(a, "media", id)));
  await assertFails(getDocs(collection(a, "media")));
  await assertFails(
    setDoc(
      doc(db("reviewer"), "media", "22222222-2222-2222-2222-222222222222"),
      {
        ...image,
        ownerType: "author",
        ownerId: authorId,
        uploadedBy: "reviewer",
      },
    ),
  );
  await assertFails(
    setDoc(doc(a, "media", "33333333-3333-3333-3333-333333333333"), {
      ...image,
      data: "data:image/svg+xml;base64,AAAA",
    }),
  );
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "publications", article.id), {
      article: { ...article, image: "/media/" + id },
    });
  });
  await assertSucceeds(getDoc(doc(publicDb, "media", id)));
  await env.withSecurityRulesDisabled(async (ctx) => {
    await deleteDoc(doc(ctx.firestore(), "publications", article.id));
  });
  await assertFails(getDoc(doc(publicDb, "media", id)));
});
test("each of the six founders can edit only their mapped profile", async () => {
  const ids = [
    "dr-chirag-patidar",
    "dr-amaan-ahmed",
    "dr-shivam-singh-thakur",
    "dr-ritesh-verma",
    "dr-deepesh-mathur",
    "dr-deepesh-chaware",
  ];
  for (let i = 0; i < ids.length; i++) {
    const uid = "founder-" + i;
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "cms_users", uid), {
        authorId: ids[i],
        role: "CO_FOUNDER",
        status: "ACTIVE",
      });
    });
    const profile = {
      id: ids[i],
      name: "Founder",
      role: "Veterinarian",
      qualifications: "BVSc & AH",
      bio: "Biography",
      expertise: [],
      affiliation: "ThatVetGuy",
      image: "",
      linkedin: "",
    };
    await assertSucceeds(setDoc(doc(db(uid), "authors", ids[i]), profile));
    await assertFails(
      setDoc(doc(db(uid), "authors", ids[(i + 1) % ids.length]), {
        ...profile,
        id: ids[(i + 1) % ids.length],
      }),
    );
  }
});
