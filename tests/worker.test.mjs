import test from "node:test";
import assert from "node:assert/strict";
import worker, {
  retrieveLinkedIn,
  readLimited,
  decode,
} from "../worker/index.js";
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
