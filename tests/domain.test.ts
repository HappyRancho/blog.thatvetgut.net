import test from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  safeUrl,
  normalizeLinkedInUrl,
  canTransition,
  validateArticle,
  emptyArticle,
  readingTime,
  dateISO,
  sourceKey,
} from "../src/lib/domain.ts";
test("slugs remove accents and unsafe path characters", () => {
  assert.equal(
    slugify("A vétérinary guide / for cats!"),
    "a-veterinary-guide-for-cats",
  );
  assert.equal(slugify("..."), "");
});
test("links reject executable schemes and hostile image protocols", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "//evil.example/x",
  ])
    assert.equal(safeUrl(url, true), "");
  assert.equal(safeUrl("/images/dog.webp", true), "/images/dog.webp");
  assert.equal(safeUrl("https://example.com/a", true), "https://example.com/a");
});
test("LinkedIn URL canonicalisation rejects lookalikes and credentials", () => {
  assert.equal(
    normalizeLinkedInUrl("https://linkedin.com/pulse/example/?tracking=1#top"),
    "https://www.linkedin.com/pulse/example",
  );
  for (const url of [
    "https://linkedin.com.evil.test/pulse/a",
    "https://evil.test/?url=linkedin.com/pulse/a",
    "http://linkedin.com/pulse/a",
    "https://user@linkedin.com/pulse/a",
    "https://www.linkedin.com:444/pulse/a",
    "https://linkedin.com/login",
  ])
    assert.throws(() => normalizeLinkedInUrl(url));
});
test("workflow requires review rather than draft-to-publish", () => {
  assert.equal(canTransition("DRAFT", "PUBLISHED", true), false);
  assert.equal(canTransition("UNDER REVIEW", "APPROVED", true), false);
  assert.equal(canTransition("UNDER REVIEW", "APPROVED", false), true);
  assert.equal(canTransition("APPROVED", "PUBLISHED", true), true);
});
test("submission validates content and sources", () => {
  const a = {
    ...emptyArticle("dr-chirag-patidar"),
    id: "healthy-dogs",
    title: "A healthy dog",
  };
  assert.equal(validateArticle(a).length, 0);
  assert.equal(validateArticle(a, true).length, 2);
  assert.equal(readingTime("<p>Short article.</p>"), 1);
});

test("URLs reject backslashes, credentials and encoded LinkedIn path tricks", () => {
  for (const u of [
    "/\\evil.test/image",
    "https://user:pass@evil.test/image",
    "https://example.com/a b",
  ])
    assert.equal(safeUrl(u, true), "");
  for (const u of [
    "https://linkedin.com/pulse/%2f%2f127.0.0.1",
    "https://linkedin.com/pulse/%0asecret",
  ])
    assert.throws(() => normalizeLinkedInUrl(u));
});
test("metadata dates omit unavailable or invalid values and source keys canonicalise duplicates", async () => {
  assert.equal(dateISO("not a date"), "");
  assert.equal(dateISO(null), "");
  assert.equal(dateISO({ seconds: 0 }), "1970-01-01T00:00:00.000Z");
  assert.equal(
    await sourceKey("https://linkedin.com/pulse/example?tracking=1"),
    await sourceKey("https://www.linkedin.com/pulse/example"),
  );
});
