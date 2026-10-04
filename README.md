# ThatVetGuy publication and editorial workspace

The services/portfolio site at `www.thatvetguy.net` remains unchanged. This repository serves the journal at `blog.thatvetguy.net` and its direct private route `/admin`, with one Firebase data model and six equal founder memberships.

See [enhancement deployment](docs/ENHANCEMENT-DEPLOYMENT.md) for the named database, required live-rule configuration, free image handling, Worker rendering/importer, and verification limits. See [research evidence](docs/RESEARCH.md) for actual inspected pages and author sources.

## Stack

An enhanced publication and editorial workspace using the existing free Firebase project. React 18, TypeScript, Vite, Tailwind v4, Firebase Authentication/Firestore and DOMPurify.

## Run locally

Use Node 22 or later:

```sh
npm install
npm run dev
npm test
npm run build
```

Without Firebase configuration the application is an explicitly labelled, non-indexable design preview. It displays eight original launch manuscripts, **not clinically reviewed publications**. No submissions or logins are simulated. Copy `.env.example` to `.env.local` to connect a project.

## What is included

- Responsive emerald/cream editorial design, eight specialty collections, fuzzy search, reader-size controls, device bookmarks, sharing and source lists.
- Six founding veterinary profiles, editorial standards, corrections/contact and privacy pages.
- Google sign-in with manually provisioned, active co-founder records. No phone numbers embedded in the application, client role grants, SMS billing or paid Cloud Functions.
- Draft → submission → independent review → approval → publication workflow. Content edits increment a revision and invalidate approval. Publishing and withdrawal are atomic Firestore transactions. Concurrent edits are rejected instead of silently overwriting.
- Tiptap writing tools with undo/redo, headings, links, images, clinical callouts and tables; manuscript preview, metadata, sources, own-profile editing, exports and reader inbox.
- Authenticated LinkedIn URL extraction through the existing Cloudflare Worker, atomic duplicate-source reservations, bounded fetches and safe redirects. Blocked content receives an explanation and optional original-text recovery; imports are drafts.
- Firestore security rules and emulator regression tests; Firebase Hosting configuration; CI checks and a manual deployment workflow.

## Deployment and editorial setup

The existing Cloudflare Workers hosting integration is supported by `wrangler.jsonc`. See [Cloudflare hosting](docs/CLOUDFLARE.md) for build/deploy settings. Firebase Hosting remains an alternative; Cloudflare can host the public site while Firebase handles authentication and the database.

Read [Firebase Spark setup](docs/FIREBASE-SPARK.md), [Launch checklist](docs/LAUNCH.md) and [Editorial guide](docs/EDITORIAL.md). The deployment workflow is manual and requires your own Firebase/Google Cloud authorization; this repository does not contain credentials.

## Important boundaries

- Eight manuscripts are **drafts requiring verification, source checking and acceptance by the named contributors**. They are never silently seeded as live articles. Photos of unrelated people are not used as founder portraits.
- Featured, inline and profile uploads use optimised, bounded Firestore `media` documents without Firebase Storage or a billing upgrade. Draft images stay private until specifically referenced by a publication; profile media is limited to its own founder.
- Newsletter interest and contact submissions reach the editorial inbox. This does not include an email newsletter delivery service or promise automatic replies.
- LinkedIn may refuse automated retrieval. The paste fallback retains the normalized source URL and the same draft/review workflow.
- Search loads successive public pages (48 per page), with an explicit load-more control for browsing. Popularity tracking is intentionally absent: writing a view counter per visit would add free-tier costs and unreliable rankings.
- The Cloudflare Worker serves public article HTML and route-specific canonical, social metadata and structured data before JavaScript runs. It reads live public records, returns real missing-page status and generates a publications-only sitemap. Private routes are noindex.
- Free-tier quotas and provider terms apply. This implementation does not enable billing or automatically upgrade a project.

## Security architecture

`cms_users/{uid}` is provisioned by a Firebase project administrator, never by the browser. `manuscripts` contains private drafts; `publications` contains only reviewed public snapshots. The rules bind published snapshots to the exact reviewed revision and require an independent reviewer. Revoking the CMS member stops protected reads and writes. Legacy `articles`, `authorized_phones`, and Storage access are denied by the new rules; export and migrate existing data before replacing production rules.
