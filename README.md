# ThatVetGuy · Veterinary Collaborative

A complete replacement publication and editorial workspace designed for Firebase's no-cost Spark plan. React 18, TypeScript, Vite, Tailwind v4, Firebase Authentication/Firestore and DOMPurify.

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
- Rich text with clinical callouts and tables, metadata and source editors, profiles, manuscript exports, inbox and durable newsletter-interest records.
- Best-effort public LinkedIn URL extraction, optional explicitly consented external reader, duplicate-source checks and a text/HTML paste fallback. All imported HTML is sanitized. Clinical review is mandatory.
- Firestore security rules and emulator regression tests; Firebase Hosting configuration; CI checks and a manual deployment workflow.

## Deployment and editorial setup

Read [Firebase Spark setup](docs/FIREBASE-SPARK.md), [Launch checklist](docs/LAUNCH.md) and [Editorial guide](docs/EDITORIAL.md). The deployment workflow is manual and requires your own Firebase/Google Cloud authorization; this repository does not contain credentials.

## Important boundaries

- Eight manuscripts are **drafts requiring verification, source checking and acceptance by the named contributors**. They are never silently seeded as live articles. Photos of unrelated people are not used as founder portraits.
- Images use public HTTPS or `/images/...` assets committed to GitHub. There is no Firebase Storage upload feature because it would conflict with the no-billing requirement.
- Newsletter interest and contact submissions reach the editorial inbox. This does not include an email newsletter delivery service or promise automatic replies.
- LinkedIn may refuse automated retrieval. The paste fallback retains the normalized source URL and the same draft/review workflow.
- Search covers loaded articles (48 per page), with an explicit load-more control. Popularity tracking is intentionally absent: writing a view counter per visit would add free-tier costs and unreliable rankings.
- Metadata is updated client-side. Social crawlers that do not execute JavaScript may see the homepage metadata. SSR/prerendering for live content is not claimed; static article snapshots were avoided so withdrawals cannot be undermined by stale published content.
- Free-tier quotas and provider terms apply. This implementation does not enable billing or automatically upgrade a project.

## Security architecture

`cms_users/{uid}` is provisioned by a Firebase project administrator, never by the browser. `manuscripts` contains private drafts; `publications` contains only reviewed public snapshots. The rules bind published snapshots to the exact reviewed revision and require an independent reviewer. Revoking the CMS member stops protected reads and writes. Legacy `articles`, `authorized_phones`, and Storage access are denied by the new rules; export and migrate existing data before replacing production rules.
