// Read-only deployment inspection. Never authenticates or changes production records.
import { readFile, mkdir, writeFile } from "node:fs/promises";
const config = JSON.parse(
  await readFile("firebase-applet-config.json", "utf8"),
);
const site = "https://blog.thatvetguy.net";
const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(config.firestoreDatabaseId)}/documents`;
const report = {
  inspectedAt: new Date().toISOString(),
  pages: [],
  database: [],
  publications: null,
};
await mkdir("live-check", { recursive: true });
for (const path of [
  "/",
  "/admin",
  "/articles",
  "/contributors",
  "/author/dr-chirag-patidar",
  "/sitemap.xml",
  "/article/deployment-probe-" + crypto.randomUUID(),
]) {
  try {
    const r = await fetch(site + path, {
      signal: AbortSignal.timeout(20000),
      headers: { "Cache-Control": "no-cache" },
    });
    const html = await r.text();
    report.pages.push({
      path,
      status: r.status,
      type: r.headers.get("content-type"),
      title: html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1],
      articleUrls: [
        ...new Set(
          [
            ...html.matchAll(
              /https:\/\/blog\.thatvetguy\.net\/article\/([a-z0-9-]+)/g,
            ),
          ].map((x) => x[1]),
        ),
      ],
      unavailable: /temporarily unavailable/i.test(html),
    });
  } catch (e) {
    report.pages.push({ path, error: e.message });
  }
}
for (const collection of [
  "publications",
  "authors",
  "manuscripts",
  "cms_users",
  "media",
]) {
  try {
    let r = await fetch(`${base}/${collection}?pageSize=100`, {
      signal: AbortSignal.timeout(20000),
    });
    let d = await r.json();
    const listStatus = r.status;
    let method = "list";
    if (!r.ok) {
      const q = await fetch(`${base}:runQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collection }],
            limit: 100,
          },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (q.ok) {
        const items = (await q.json()).filter((x) => x.document);
        r = q;
        d = { documents: items.map((x) => x.document) };
        method = "query";
      }
    }
    report.database.push({
      collection,
      status: r.status,
      listStatus,
      method,
      count: r.ok ? d.documents?.length || 0 : undefined,
      hasMore:
        !!d.nextPageToken || (method === "query" && d.documents.length === 100),
      error: r.ok ? undefined : d.error?.message,
    });
    if (collection === "publications" && r.ok) {
      const docs = d.documents || [];
      const counts = {};
      for (const doc of docs) {
        const id =
          doc.fields?.article?.mapValue?.fields?.authorId?.stringValue ||
          "unknown";
        counts[id] = (counts[id] || 0) + 1;
      }
      report.publications = {
        count: docs.length,
        hasMore:
          !!d.nextPageToken || (method === "query" && docs.length === 100),
        byAuthor: counts,
      };
    }
  } catch (e) {
    report.database.push({ collection, error: e.message });
  }
}
report.publicDocumentReads = [];
for (const path of [
  "authors/dr-chirag-patidar",
  "publications/deployment-probe-" + crypto.randomUUID(),
]) {
  try {
    const r = await fetch(`${base}/${path}`, {
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json();
    report.publicDocumentReads.push({
      path,
      status: r.status,
      error: data.error?.message,
    });
  } catch (e) {
    report.publicDocumentReads.push({ path, error: e.message });
  }
}
try {
  const r = await fetch(site + "/api/linkedin", {
    method: "POST",
    headers: { Origin: site, "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.linkedin.com/pulse/example" }),
    signal: AbortSignal.timeout(15000),
  });
  report.unauthenticatedImporterStatus = r.status;
} catch (e) {
  report.importerError = e.message;
}
await writeFile("live-check/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
