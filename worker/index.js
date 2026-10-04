import sanitizeHtml from "sanitize-html";
import config from "./public-config.js";
import {
  categories,
  authors as defaults,
  disclaimer,
} from "../src/data/editorial.ts";
import { normalizeLinkedInUrl, safeUrl, dateISO } from "../src/lib/domain.ts";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const origin = () => config.siteUrl.replace(/\/$/, "");
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
export function decode(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue)
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([k, v]) => [
        k,
        decode(v),
      ]),
    );
  return null;
}
async function rest(path, token) {
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(config.databaseId)}/documents/`;
  const r = await fetch(base + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Database access failed (${r.status}).`);
  return r.json();
}
const unpack = (d) =>
  Object.fromEntries(
    Object.entries(d.fields || {}).map(([k, v]) => [k, decode(v)]),
  );
async function list(collection, count = 48) {
  const d = await rest(`${collection}?pageSize=${count}`);
  return (d?.documents || []).map((d) => ({
    ...unpack(d),
    _id: d.name.split("/").at(-1),
  }));
}
const articleList = (items) =>
  items
    .map((p) => {
      const a = p.article;
      return `<article><p>${esc(categories.find((c) => c.id === a.category)?.name || "")}</p><h2><a href="/article/${esc(a.id)}">${esc(a.title)}</a></h2><p>${esc(a.subtitle)}</p></article>`;
    })
    .join("");
const nav =
  '<header><a href="/">ThatVetGuy.</a><nav><a href="/articles">Articles</a> · <a href="/categories">Topics</a> · <a href="/contributors">Our veterinarians</a> · <a href="/search">Search</a></nav></header>';
const footer = `<footer><p>${esc(disclaimer)}</p><a href="/about">Editorial standards</a> · <a href="/contact">Contact</a> · <a href="https://www.thatvetguy.net/">The Collective</a></footer>`;
const clean = (html) =>
  sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "img",
      "figcaption",
      "aside",
    ],
    allowedAttributes: {
      a: ["href", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      aside: ["class"],
      th: ["scope", "colspan"],
      td: ["colspan", "rowspan"],
    },
    allowedClasses: {
      aside: ["clinical-alert", "pro-tip", "dosage-warning", "key-takeaways"],
    },
    allowedSchemes: ["https", "http"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attrs) => ({
        tagName: tag,
        attribs: {
          href: safeUrl(attrs.href || ""),
          rel: "noopener noreferrer",
        },
      }),
      img: (tag, attrs) => ({
        tagName: tag,
        attribs: {
          src: safeUrl(attrs.src || "", true),
          alt: attrs.alt || "",
          loading: "lazy",
        },
      }),
    },
  });
export async function readLimited(response, max = 2000000) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable content was returned.");
  let size = 0;
  const parts = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max)
        throw new Error("The article exceeds the import size limit.");
      parts.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.length;
  }
  return new TextDecoder().decode(bytes);
}
export async function retrieveLinkedIn(raw, fetcher = fetch) {
  let url = normalizeLinkedInUrl(raw);
  for (let step = 0; step < 4; step++) {
    const r = await fetcher(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "text/html" },
    });
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const location = r.headers.get("location");
      if (!location)
        throw new Error("The source returned an invalid redirect.");
      url = normalizeLinkedInUrl(new URL(location, url).href);
      continue;
    }
    if (!r.ok)
      throw new Error(
        "LinkedIn did not make this article publicly accessible. Open the original and try a public article link.",
      );
    if (!r.headers.get("content-type")?.includes("text/html"))
      throw new Error("The URL did not return an article page.");
    return await readLimited(r);
  }
  throw new Error("Too many redirects. Use the final public article URL.");
}
const attempts = new Map();
async function importer(request) {
  if (request.method !== "POST")
    return Response.json({ error: "Use POST." }, { status: 405, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token)
    return Response.json(
      { error: "Sign in to import an article." },
      { status: 401, headers },
    );
  const body = await readLimited(request, 5000);
  let raw;
  try {
    raw = JSON.parse(body).url;
  } catch {
    return Response.json(
      { error: "Invalid import request." },
      { status: 400, headers },
    );
  }
  try {
    const identity = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!identity.ok) throw new Error("Your session expired. Sign in again.");
    const u = (await identity.json()).users?.[0];
    if (!u?.emailVerified)
      throw new Error("Sign in with a verified Google account.");
    const record = await rest(
        `cms_users/${encodeURIComponent(u.localId)}`,
        token,
      ),
      m = record ? unpack(record) : null;
    if (
      m?.role !== "CO_FOUNDER" ||
      m.status !== "ACTIVE" ||
      !defaults.some((a) => a.id === m.authorId)
    )
      return Response.json(
        { error: "Editorial access is required." },
        { status: 403, headers },
      );
    const now = Date.now(),
      history = (attempts.get(u.localId) || []).filter((n) => now - n < 60000);
    if (history.length >= 6)
      return Response.json(
        { error: "Please wait a minute before another import." },
        { status: 429, headers },
      );
    history.push(now);
    attempts.set(u.localId, history);
    if (attempts.size > 100) attempts.clear();
    const canonical = normalizeLinkedInUrl(raw);
    const html = await retrieveLinkedIn(canonical);
    return Response.json({ html, sourceUrl: canonical }, { headers });
  } catch (e) {
    return Response.json(
      { error: e.message || "Import could not be completed." },
      { status: 422, headers },
    );
  }
}
async function sitemap() {
  let token = "",
    entries = [],
    pages = 0;
  do {
    const d = await rest(
      `publications?pageSize=500${token ? "&pageToken=" + encodeURIComponent(token) : ""}`,
    );
    entries.push(...(d?.documents || []).map(unpack));
    token = d?.nextPageToken || "";
    pages++;
  } while (token && pages < 20);
  if (token) throw new Error("Sitemap exceeds the configured page limit.");
  const paths = [
    "/",
    "/articles",
    "/categories",
    "/contributors",
    "/about",
    ...categories.map((c) => "/category/" + c.id),
    ...defaults.map((a) => "/author/" + a.id),
  ];
  const urls = paths.map((p) => `<url><loc>${esc(origin() + p)}</loc></url>`);
  for (const p of entries) {
    const updated = dateISO(p.updatedAt || p.publishedAt);
    urls.push(
      `<url><loc>${esc(origin() + "/article/" + p.article.id)}</loc>${updated ? "<lastmod>" + esc(updated) + "</lastmod>" : ""}</url>`,
    );
  }
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
    {
      headers: { ...headers, "Content-Type": "application/xml; charset=utf-8" },
    },
  );
}
async function media(path) {
  const d = await rest("media/" + path.split("/").at(-1));
  if (!d) return new Response("Image unavailable", { status: 404, headers });
  const v = unpack(d);
  const match =
    /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(v.data);
  if (!match) return new Response("Invalid image", { status: 404, headers });
  return new Response(
    Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0)),
    { headers: { ...headers, "Content-Type": match[1] } },
  );
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url),
      path = url.pathname;
    if (path === "/api/linkedin") return importer(request);
    if (path === "/robots.txt")
      return new Response(
        `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /search\nSitemap: ${origin()}/sitemap.xml\n`,
        { headers: { ...headers, "Content-Type": "text/plain" } },
      );
    try {
      if (path === "/sitemap.xml") return await sitemap();
      if (/^\/media\/[a-f0-9-]{36}$/.test(path)) return await media(path);
      const base = await env.ASSETS.fetch(request);
      if (!base.headers.get("content-type")?.includes("text/html")) return base;
      if (path === "/admin" || path.startsWith("/admin/"))
        return new Response(base.body, {
          status: base.status,
          headers: {
            ...Object.fromEntries(base.headers),
            ...headers,
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      if (!config.projectId) return base;
      let title = "Veterinary medicine, clearly explained",
        description =
          "Practical veterinary reading for people who care for animals.",
        content = "",
        status = 200,
        structured = null,
        image = "";
      let initialItems = [],
        initialAuthors = defaults;
      if (path.startsWith("/article/")) {
        const d = await rest(
          "publications/" + encodeURIComponent(path.split("/")[2]),
        );
        if (!d) {
          status = 404;
          title = "Article unavailable";
          content =
            '<h1>This article is not available.</h1><p>It may have been withdrawn for review.</p><a href="/articles">Browse articles</a>';
        } else {
          const p = unpack(d),
            a = p.article;
          initialItems = [p];
          const people = await list("authors", 6);
          initialAuthors = defaults.map(
            (a) => people.find((p) => p.id === a.id || p._id === a.id) || a,
          );
          const author =
            people.find((x) => x.id === a.authorId || x._id === a.authorId) ||
            defaults.find((x) => x.id === a.authorId);
          const reviewer =
            people.find(
              (x) =>
                x.id === p.reviewerAuthorId || x._id === p.reviewerAuthorId,
            ) || defaults.find((x) => x.id === p.reviewerAuthorId);
          title = a.seoTitle || a.title;
          description = a.seoDescription || a.subtitle;
          image = safeUrl(a.image, true);
          content = `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/category/${esc(a.category)}">${esc(categories.find((c) => c.id === a.category)?.name || "")}</a></nav><h1>${esc(a.title)}</h1><p>${esc(a.subtitle)}</p>${author ? '<p>By <a href="/author/' + esc(author.id) + '">' + esc(author.name) + "</a> · " + esc(author.qualifications) + "</p>" : ""}${dateISO(p.publishedAt) ? "<p>Published " + esc(dateISO(p.publishedAt).slice(0, 10)) + "</p>" : ""}${reviewer && dateISO(p.reviewedAt) ? "<p>Reviewed by " + esc(reviewer.name) + " · " + esc(dateISO(p.reviewedAt).slice(0, 10)) + "</p>" : ""}${image ? '<figure><img src="' + esc(image) + '" alt="' + esc(a.imageAlt) + '"/></figure>' : ""}<div class="prose">${clean(a.content)}</div><aside>${esc(disclaimer)}</aside>${a.references?.length ? "<h2>Sources and references</h2><ol>" + a.references.map((r) => '<li><a href="' + esc(safeUrl(r.url)) + '">' + esc(r.title) + "</a>" + esc(r.year ? " (" + r.year + ")" : "") + "</li>").join("") + "</ol>" : ""}`;
          structured = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.subtitle,
            mainEntityOfPage: origin() + path,
            ...(author
              ? {
                  author: {
                    "@type": "Person",
                    name: author.name,
                    url: origin() + "/author/" + author.id,
                  },
                }
              : {}),
            ...(dateISO(p.publishedAt)
              ? { datePublished: dateISO(p.publishedAt) }
              : {}),
            ...(dateISO(p.updatedAt)
              ? { dateModified: dateISO(p.updatedAt) }
              : {}),
            ...(image ? { image: new URL(image, origin()).href } : {}),
            publisher: {
              "@type": "Organization",
              name: "ThatVetGuy",
              url: origin(),
            },
          };
        }
      } else if (path.startsWith("/author/")) {
        const id = path.split("/")[2],
          d = await rest("authors/" + encodeURIComponent(id)),
          a = d ? { ...unpack(d), id } : defaults.find((a) => a.id === id);
        if (!a) {
          status = 404;
          title = "Contributor not found";
          content = "<h1>Contributor not found</h1>";
        } else {
          title = a.name;
          description = a.bio;
          initialAuthors = defaults.map((p) => (p.id === a.id ? a : p));
          const publications = await list("publications");
          initialItems = publications;
          content = `<h1>${esc(a.name)}</h1><p>${esc(a.qualifications)} · ${esc(a.role)}</p><p>${esc(a.bio)}</p><p>${esc(a.affiliation)}</p><h2>Articles by ${esc(a.name)}</h2>${articleList(publications.filter((p) => p.article.authorId === id))}`;
          structured = {
            "@context": "https://schema.org",
            "@type": "Person",
            name: a.name,
            description: a.bio,
            url: origin() + path,
          };
        }
      } else if (
        path === "/" ||
        path === "/articles" ||
        path.startsWith("/category/") ||
        path.startsWith("/tag/")
      ) {
        const all = (await list("publications")).sort((a, b) =>
            dateISO(b.publishedAt).localeCompare(dateISO(a.publishedAt)),
          ),
          category = path.startsWith("/category/")
            ? categories.find((c) => c.id === path.split("/")[2])
            : null,
          tag = path.startsWith("/tag/")
            ? decodeURIComponent(path.split("/")[2])
            : "";
        if (path.startsWith("/category/") && !category) {
          status = 404;
          title = "Topic not found";
          content = "<h1>Topic not found</h1>";
        } else {
          initialItems = all;
          title =
            category?.name ||
            (tag
              ? "Articles tagged " + tag
              : path === "/"
                ? "Animal care, with context."
                : "The reading room");
          description = category?.description || description;
          const items = all.filter(
            (p) =>
              (!category || p.article.category === category.id) &&
              (!tag || p.article.tags.includes(tag)),
          );
          content = `<h1>${esc(title)}</h1><p>${esc(description)}</p>${articleList(items)}${!items.length ? "<p>No articles have been published here yet.</p>" : ""}`;
        }
      } else if (path === "/categories") {
        title = "Explore animal health";
        content =
          "<h1>Every kind of care.</h1>" +
          categories
            .map(
              (c) =>
                '<h2><a href="/category/' +
                c.id +
                '">' +
                esc(c.name) +
                "</a></h2><p>" +
                esc(c.description) +
                "</p>",
            )
            .join("");
      } else if (path === "/contributors") {
        title = "Our veterinary contributors";
        const people = await list("authors", 6);
        content =
          "<h1>Meet the collaborative.</h1>" +
          defaults
            .map(
              (a) => people.find((p) => p.id === a.id || p._id === a.id) || a,
            )
            .map(
              (a) =>
                '<h2><a href="/author/' +
                a.id +
                '">' +
                esc(a.name) +
                "</a></h2><p>" +
                esc(a.qualifications) +
                " · " +
                esc(a.bio) +
                "</p>",
            )
            .join("");
      } else if (path === "/about") {
        title = "Our editorial promise";
        content =
          "<h1>Good information is part of good care.</h1><p>ThatVetGuy is a veterinary collaborative. Articles require sources and review by a different founder before publication. Editing published clinical content requires a new review.</p><h2>Corrections</h2><p>Use the contact page to request an editorial correction.</p>";
      } else if (path === "/contact") {
        title = "Contact and corrections";
        content =
          "<h1>Contact the editorial team.</h1><p>For editorial enquiries and corrections. This form is not monitored for emergencies.</p>";
      } else if (path === "/privacy") {
        title = "Privacy";
        content =
          "<h1>Privacy, in plain language.</h1><p>Bookmarks remain on your device. Contact submissions are stored in Firebase for the editorial team. Approved accounts use Google sign-in.</p>";
      } else if (path === "/search") {
        title = "Search the journal";
        content =
          "<h1>Search the journal</h1><p>Search titles, topics and contributors.</p>";
      } else {
        status = 404;
        title = "Page not found";
        content =
          '<h1>This page is not in the journal.</h1><a href="/">Return to the homepage</a>';
      }
      const canonical = origin() + path,
        meta = `<meta name="description" content="${esc(description)}"><meta name="robots" content="${status !== 200 || path === "/search" ? "noindex,follow" : "index,follow"}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="${path.startsWith("/article/") ? "article" : "website"}"><meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">${image ? '<meta property="og:image" content="' + esc(new URL(image, origin()).href) + '">' : ""}${structured ? '<script id="structured-data" type="application/ld+json">' + JSON.stringify(structured).replace(/</g, "\\u003c") + "</script>" : ""}`;
      const response = new HTMLRewriter()
        .on("meta[name=description], meta[name=robots], link[rel=canonical]", {
          element(e) {
            e.remove();
          },
        })
        .on("title", {
          element(e) {
            e.setInnerContent(esc(title) + " | ThatVetGuy", { html: true });
          },
        })
        .on("head", {
          element(e) {
            e.append(
              meta +
                '<script id="journal-data" type="application/json">' +
                JSON.stringify({
                  items: initialItems,
                  authors: initialAuthors,
                }).replace(/</g, "\\u003c") +
                "</script>",
              { html: true },
            );
          },
        })
        .on("#root", {
          element(e) {
            e.setInnerContent(
              `${nav}<main class="container section server-page">${content}</main>${footer}`,
              { html: true },
            );
          },
        })
        .transform(base);
      return new Response(response.body, {
        status,
        headers: {
          ...Object.fromEntries(response.headers),
          ...headers,
          ...(status !== 200 ? { "X-Robots-Tag": "noindex" } : {}),
        },
      });
    } catch (e) {
      return new Response(
        '<!doctype html><html><head><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Publication temporarily unavailable</title></head><body><main><h1>The journal is temporarily unavailable.</h1><p>Please try again shortly. </p></main></body></html>',
        {
          status: 503,
          headers: {
            ...headers,
            "Content-Type": "text/html; charset=utf-8",
            "Retry-After": "60",
          },
        },
      );
    }
  },
};
