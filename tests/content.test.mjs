import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateArticle } from "../src/lib/domain.ts";
const read = async (name) =>
  JSON.parse(
    await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"),
  );
const manifest = await read("manifest.json");
const groups = await Promise.all(manifest.files.map(read));
const articles = groups.flat();
assert.equal(articles.length, 30);
assert.equal(new Set(articles.map((a) => a.id)).size, 30);
assert.equal(new Set(articles.map((a) => a.authorId)).size, 6);
for (const group of groups) {
  assert.equal(group.length, 5);
  assert.equal(new Set(group.map((a) => a.authorId)).size, 1);
}
for (const a of articles) {
  assert.deepEqual(validateArticle(a, true), [], a.id);
  assert.ok(
    a.content
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length >= 350,
    a.id + " substantive content",
  );
  assert.ok(a.image.startsWith("https://images.unsplash.com/"));
  assert.ok(a.imageAlt.length > 10);
  assert.ok(!/<script|javascript:|onerror=|<iframe/i.test(a.content));
  assert.ok(!("reviewedAt" in a || "publishedAt" in a || "reviewerUid" in a));
  for (const ref of a.references)
    assert.equal(new URL(ref.url).protocol, "https:");
  for (const match of a.content.matchAll(/href="\/article\/([^"]+)"/g)) {
    assert.ok(
      articles.some((other) => other.id === match[1]),
      `${a.id}: broken internal link ${match[1]}`,
    );
  }
}
console.log(
  "Content checks passed: 30 complete articles, five per founder, stable unique slugs, safe HTML, references, photos and valid internal links. No fabricated publication/review records.",
);
