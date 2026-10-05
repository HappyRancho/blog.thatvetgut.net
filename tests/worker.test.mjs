import test from "node:test";
import assert from "node:assert/strict";
import worker, {
  retrieveLinkedIn,
  readLimited,
  decode,
} from "../worker/index.js";
test("sitemap uses paginated public queries and includes articles beyond the first 500", async () => {
  const original = globalThis.fetch;
  const requests = [];
  const prefix =
    "projects/demo-thatvetguy/databases/(default)/documents/publications/";
  const document = (i) => ({
    name: prefix + "guide-" + String(i).padStart(4, "0"),
    fields: {
      article: { mapValue: { fields: { id: { stringValue: "guide-" + i } } } },
      publishedAt: { timestampValue: "2026-10-04T12:00:00Z" },
    },
  });
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /documents:runQuery$/);
    const q = JSON.parse(options.body).structuredQuery;
    requests.push(q);
    assert.equal(q.from[0].collectionId, "publications");
    assert.equal(q.orderBy[0].field.fieldPath, "__name__");
    return Response.json(
      (requests.length === 1
        ? Array.from({ length: 500 }, (_, i) => document(i))
        : [document(500)]
      ).map((d) => ({ document: d })),
    );
  };
  try {
    const r = await worker.fetch(
      new Request("https://blog.thatvetguy.net/sitemap.xml"),
      {},
    );
    assert.equal(r.status, 200);
    const xml = await r.text();
    assert.equal((xml.match(/\/article\/guide-/g) || []).length, 501);
    assert.match(xml, /\/article\/guide-500<\/loc>/);
    assert.equal(requests[0].startAt, undefined);
    assert.deepEqual(requests[1].startAt, {
      values: [{ referenceValue: prefix + "guide-0499" }],
      before: false,
    });
  } finally {
    globalThis.fetch = original;
  }
});
test("import fetch validates each redirect and cannot reach arbitrary hosts", async () => {
  const calls = [];
  await assert.rejects(
    retrieveLinkedIn("https://www.linkedin.com/pulse/example", async (url) => {
      calls.push(url);
      return new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data" },
      });
    }),
    /public linkedin/,
  );
  assert.equal(calls.length, 1);
  for (const u of [
    "https://evil.test/pulse/x",
    "https://linkedin.com.evil.test/pulse/x",
    "https://user:pass@linkedin.com/pulse/x",
    "https://www.linkedin.com:8443/pulse/x",
    "https://www.linkedin.com/pulse/%2f%2f127.0.0.1",
  ])
    await assert.rejects(
      retrieveLinkedIn(u, () => {
        throw new Error("must not fetch");
      }),
    );
});
test("public article retrieval rejects non-html, blocked and oversized bodies", async () => {
  await assert.rejects(
    retrieveLinkedIn(
      "https://linkedin.com/pulse/example",
      async () => new Response("blocked", { status: 403 }),
    ),
    /publicly accessible/,
  );
  await assert.rejects(
    retrieveLinkedIn(
      "https://linkedin.com/pulse/example",
      async () =>
        new Response("{}", { headers: { "content-type": "application/json" } }),
    ),
    /article page/,
  );
  await assert.rejects(
    readLimited(new Response("x".repeat(51)), 50),
    /size limit/,
  );
  const html = await retrieveLinkedIn(
    "https://linkedin.com/pulse/example?tracking=1",
    async () =>
      new Response("<article>Content</article>", {
        headers: { "content-type": "text/html" },
      }),
  );
  assert.match(html, /Content/);
});
test("import endpoint requires same-origin and authenticated requests", async () => {
  let r = await worker.fetch(
    new Request("https://blog.thatvetguy.net/api/linkedin", {
      method: "POST",
      headers: { origin: "https://evil.test" },
      body: "{}",
    }),
    {},
  );
  assert.equal(r.status, 403);
  r = await worker.fetch(
    new Request("https://blog.thatvetguy.net/api/linkedin", {
      method: "POST",
      headers: { origin: "https://blog.thatvetguy.net" },
      body: "{}",
    }),
    {},
  );
  assert.equal(r.status, 401);
});
test("CMS responses are never indexable or cached; robots disallows private routes", async () => {
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response("<html>CMS shell</html>", {
          headers: { "content-type": "text/html" },
        }),
    },
  };
  const response = await worker.fetch(
    new Request("https://blog.thatvetguy.net/admin"),
    env,
  );
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const robots = await worker.fetch(
    new Request("https://blog.thatvetguy.net/robots.txt"),
    env,
  );
  assert.match(await robots.text(), /Disallow: \/admin/);
});
test("Firestore REST values preserve nested articles and real timestamps", () => {
  assert.deepEqual(
    decode({
      mapValue: {
        fields: {
          title: { stringValue: "Article" },
          tags: { arrayValue: { values: [{ stringValue: "dogs" }] } },
          publishedAt: { timestampValue: "2026-10-01T12:00:00Z" },
        },
      },
    }),
    { title: "Article", tags: ["dogs"], publishedAt: "2026-10-01T12:00:00Z" },
  );
});
test("SSR returns only published content, safe metadata and real not-found status", async () => {
  const { default: config } = await import("../worker/public-config.js");
  const previous = config.projectId,
    originalFetch = globalThis.fetch,
    originalRewriter = globalThis.HTMLRewriter;
  config.projectId = "demo-thatvetguy";
  class Rewriter {
    handlers = [];
    on(selector, handler) {
      this.handlers.push([selector, handler]);
      return this;
    }
    transform(response) {
      let appended = "",
        root = "",
        title = "";
      for (const [selector, h] of this.handlers) {
        const e = {
          remove() {},
          append(v) {
            appended += v;
          },
          setInnerContent(v) {
            if (selector === "title") title = v;
            else if (selector === "#root") root = v;
          },
        };
        h.element(e);
      }
      return new Response(
        `<html><head><title>${title}</title>${appended}</head><body><div id="root">${root}</div></body></html>`,
        { headers: response.headers },
      );
    }
  }
  globalThis.HTMLRewriter = Rewriter;
  const encode = (v) =>
    typeof v === "string"
      ? { stringValue: v }
      : Array.isArray(v)
        ? { arrayValue: { values: v.map(encode) } }
        : v === null
          ? { nullValue: null }
          : typeof v === "number"
            ? { integerValue: String(v) }
            : {
                mapValue: {
                  fields: Object.fromEntries(
                    Object.entries(v).map(([k, val]) => [k, encode(val)]),
                  ),
                },
              };
  const article = {
    id: "published-guide",
    title: "A safe veterinary guide",
    subtitle: "Useful context",
    category: "pet-health",
    tags: [],
    authorId: "dr-chirag-patidar",
    content:
      '<h2>Useful context</h2><p>Published body<script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a></p>',
    image: "",
    imageAlt: "",
    references: [],
  };
  const publication = {
    article,
    revision: 1,
    reviewerAuthorId: "dr-ritesh-verma",
    reviewedAt: "2026-10-01T12:00:00Z",
    publishedAt: "2026-10-02T12:00:00Z",
  };
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/authors")) return Response.json({ documents: [] });
    if (url.includes("/publications/published-guide"))
      return Response.json({ fields: encode(publication).mapValue.fields });
    if (url.includes("/publications/"))
      return new Response("", { status: 404 });
    if (url.endsWith(":runQuery"))
      return Response.json([
        { document: { fields: encode(publication).mapValue.fields } },
      ]);
    if (url.includes("/publications?"))
      return Response.json({
        documents: [{ fields: encode(publication).mapValue.fields }],
      });
    throw new Error("Unexpected request " + url);
  };
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response("<html>shell</html>", {
          headers: { "content-type": "text/html" },
        }),
    },
  };
  try {
    let response = await worker.fetch(
      new Request("https://blog.thatvetguy.net/article/published-guide"),
      env,
    );
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Published body/);
    assert.match(html, /application\/ld\+json/);
    assert.ok(!html.includes("javascript:alert"));
    assert.ok(!html.includes("<script>alert"));
    response = await worker.fetch(
      new Request("https://blog.thatvetguy.net/article/private-draft"),
      env,
    );
    assert.equal(response.status, 404);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    response = await worker.fetch(
      new Request("https://blog.thatvetguy.net/article/published-guide/extra"),
      env,
    );
    assert.equal(response.status, 404);
    response = await worker.fetch(
      new Request("https://blog.thatvetguy.net/sitemap.xml"),
      env,
    );
    const sitemap = await response.text();
    assert.match(sitemap, /published-guide/);
    assert.ok(!sitemap.includes("private-draft"));
    assert.ok(!sitemap.includes("/admin"));
  } finally {
    config.projectId = previous;
    globalThis.fetch = originalFetch;
    globalThis.HTMLRewriter = originalRewriter;
  }
});

test("LinkedIn requests verify identity and explicit active founder membership before retrieval", async () => {
  const originalFetch = globalThis.fetch;
  let verified = true,
    active = true,
    authorId = "dr-chirag-patidar",
    validToken = true,
    linkedInReads = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("https://identitytoolkit.googleapis.com/")) {
      assert.equal(JSON.parse(options.body).idToken, "fixture-token");
      return validToken
        ? Response.json({
            users: [{ localId: "worker-test-member", emailVerified: verified }],
          })
        : new Response("invalid", { status: 400 });
    }
    if (String(url).includes("/cms_users/worker-test-member")) {
      assert.equal(options.headers.Authorization, "Bearer fixture-token");
      return Response.json({
        fields: {
          role: { stringValue: "CO_FOUNDER" },
          status: { stringValue: active ? "ACTIVE" : "INACTIVE" },
          authorId: { stringValue: authorId },
        },
      });
    }
    assert.equal(url, "https://www.linkedin.com/pulse/real-public-article");
    linkedInReads++;
    return new Response(
      "<article>A publicly accessible article body.</article>",
      { headers: { "content-type": "text/html" } },
    );
  };
  const request = () =>
    worker.fetch(
      new Request("https://blog.thatvetguy.net/api/linkedin", {
        method: "POST",
        headers: {
          origin: "https://blog.thatvetguy.net",
          Authorization: "Bearer fixture-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: "https://www.linkedin.com/pulse/real-public-article",
        }),
      }),
      {},
    );
  try {
    validToken = false;
    assert.equal((await request()).status, 422);
    validToken = true;
    verified = false;
    assert.equal((await request()).status, 422);
    verified = true;
    active = false;
    assert.equal((await request()).status, 403);
    active = true;
    authorId = "outside-founder";
    assert.equal((await request()).status, 403);
    assert.equal(linkedInReads, 0);
    authorId = "dr-chirag-patidar";
    for (let i = 0; i < 6; i++) {
      const response = await request();
      assert.equal(response.status, 200);
      assert.match((await response.json()).html, /publicly accessible/);
    }
    assert.equal((await request()).status, 429);
    assert.equal(linkedInReads, 6);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("failed anonymous reads preserve the application shell without exposing drafts", async () => {
  const { default: config } = await import("../worker/public-config.js");
  const previous = config.projectId;
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  config.projectId = "demo-thatvetguy";
  globalThis.fetch = async () => new Response("denied", { status: 403 });
  console.error = () => {};
  const shell =
    '<html><head><link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
  let assetReads = 0;
  const env = {
    ASSETS: {
      fetch: async () => {
        assetReads++;
        return new Response(shell, {
          headers: { "content-type": "text/html" },
        });
      },
    },
  };
  try {
    for (const path of ["/", "/articles", "/article/example"]) {
      const response = await worker.fetch(
        new Request("https://blog.thatvetguy.net" + path),
        env,
      );
      assert.equal(response.status, 503);
      assert.equal(await response.text(), shell);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.match(response.headers.get("x-robots-tag"), /noindex/);
      assert.equal(response.headers.get("retry-after"), "60");
    }
    const before = assetReads;
    for (const path of [
      "/sitemap.xml",
      "/media/00000000-0000-0000-0000-000000000000",
    ]) {
      const response = await worker.fetch(
        new Request("https://blog.thatvetguy.net" + path),
        env,
      );
      assert.equal(response.status, 503);
      assert.match(response.headers.get("content-type"), /text\/plain/);
      assert.ok(!(await response.text()).includes("<html>"));
    }
    assert.equal(assetReads, before);
    const admin = await worker.fetch(
      new Request("https://blog.thatvetguy.net/admin"),
      env,
    );
    assert.equal(admin.status, 200);
  } finally {
    config.projectId = previous;
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});
