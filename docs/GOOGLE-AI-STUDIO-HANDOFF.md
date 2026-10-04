# Copy this prompt into the connected Google AI Studio project

You are working on the existing ThatVetGuy blog and its connected Firebase project. Complete the Firebase setup and content launch using the repository's actual implementation. The owner requested this work and wants the free plan retained. Do not rebuild the app again or discard the photo-led blog redesign.

## Confirm the exact project and code

Repository: `HappyRancho/blog.thatvetgut.net` (the repository spelling contains `gut`). The photo-led blog and 30-article pack are in PR #10, branch `enhance/pet-care-blog`. Inspect that branch and the latest `main`; integrate the PR changes before using the content pack. Preserve newer legitimate changes if another session has modified the repo. The previous enhancement and outage fallback were PRs #8 and #9.

- Public blog: `https://blog.thatvetguy.net/`.
- Private CMS: `https://blog.thatvetguy.net/admin`.
- Keep `https://www.thatvetguy.net/` as the existing portfolio/services website.
- This is a practical pet-health blog, not a journal. Retain pet photos, dog/cat discovery, bright teal/white design and clear mobile navigation.
- No public Admin, Login or CMS link.
- Stack: React 18, TypeScript, Vite, Firebase Authentication/Firestore and a Cloudflare Worker with static assets.
- Firebase project: `adroit-bus-1ghtt`.
- Expected Firestore database: `ai-studio-thatvetguy-7ee5cb09-c3e8-4d7e-8c1c-f5ef3b5df638`. Verify this exists and matches both the client and Worker build configuration. Do not silently use `(default)` or create another database.

Read `src/lib/firebase.ts`, `src/lib/auth-context.tsx`, `src/lib/repository.ts`, `src/lib/domain.ts`, `firestore.rules`, `worker/index.js`, `wrangler.jsonc`, `scripts/worker-config.mjs`, `docs/ENHANCEMENT-DEPLOYMENT.md` and `content/manifest.json` first.

## Fix authentication using the connected project

Use Google sign-in already implemented in the app. Enable the Google provider if it is disabled, configure its support email and verify that `blog.thatvetguy.net` is an authorised domain. Add a preview hostname only if it is actually used. Do not enable phone OTP/SMS, public privileged registration or demo login. No billing upgrade, Firebase Storage or Cloud Functions.

Check the real web-app configuration and Cloudflare **build-time** variables:

```
VITE_FIREBASE_API_KEY=<copy the actual Firebase web app value>
VITE_FIREBASE_AUTH_DOMAIN=adroit-bus-1ghtt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adroit-bus-1ghtt
VITE_FIREBASE_APP_ID=<copy the actual Firebase web app value>
VITE_FIREBASE_DATABASE_ID=ai-studio-thatvetguy-7ee5cb09-c3e8-4d7e-8c1c-f5ef3b5df638
VITE_SITE_URL=https://blog.thatvetguy.net
```

Verify values against the connected project; placeholders must never be deployed. Firebase web config is public app configuration, not an administrative credential. Do not put service-account keys, passwords or private tokens into Vite variables or Git. Vite variables require a rebuild, not only a runtime settings change.

Use exactly six explicit membership records: `cms_users/{actual Firebase Authentication UID}`. Each has:

```
role: "CO_FOUNDER"
status: "ACTIVE"
authorId: <one of the six IDs below>
```

| Founder                 | authorId               |
| ----------------------- | ---------------------- |
| Dr. Chirag Patidar      | dr-chirag-patidar      |
| Dr. Amaan Ahmed         | dr-amaan-ahmed         |
| Dr. Shivam Singh Thakur | dr-shivam-singh-thakur |
| Dr. Ritesh Verma        | dr-ritesh-verma        |
| Dr. Deepesh Mathur      | dr-deepesh-mathur      |
| Dr. Deepesh Chaware     | dr-deepesh-chaware     |

Verify each UID and verified Google identity against owner-confirmed founder details. A previous screenshot showed Chirag signed in as `chiragpatidar0369@gmail.com`, UID `ptZi4gyS4kdxBxvDqUBKbjUQ0C82`; verify this in the connected project's Authentication records before using it. Do not guess the other founders' addresses or UIDs. Ask only for missing identity information. All six have equal editorial permissions. Membership records must remain unwritable by the browser. Each person can edit only their own author profile.

Use author details already sourced from the main website in `src/data/editorial.ts`. Preserve existing authored profile changes; do not blindly overwrite profiles. Avoid creating a second author record for the same founder.

## Resolve the public read failure

The deployed site previously showed “The journal is temporarily unavailable.” PR #9 preserves the styled application shell when server rendering fails; it does not fix a denied Firebase read. Earlier anonymous REST probes returned HTTP 403 for `publications` and `authors`. Inspect the actual current error rather than assuming the cause.

1. Save the current database rules before changing them.
2. Inspect the rules on the exact named database above.
3. Apply the repository's tested `firestore.rules` to that database. Do not replace them with test-mode or allow-all rules.
4. Public `publications` and `authors` must be readable. Draft `manuscripts`, member records and unreferenced/draft media must remain private.
5. Check whether wrong project/database identifiers, a disabled API or an enforced App Check policy explains a remaining denial. The Worker uses anonymous REST for public data, so App Check requires a compatible integration. Do not blindly toggle security controls to hide a failure.
6. Verify anonymous public reads succeed and unauthorised private reads fail using real requests.

No production reset, collection deletion, duplicate database or blanket migration is authorised.

## Load and publish the 30-article pack

The owner requested **five useful articles per founder, 30 total, visible on the live blog**. The complete article bodies, images, alt text, categories, tags, SEO fields and sources are in the six JSON files listed by `content/manifest.json`. `src/data/launch-drafts.ts` consumes the same files for the unconfigured design preview. Preview content is not a published database record.

Read `content/README.md` and `docs/ARTICLE-SOURCE-AUDIT.md`. The material is newly prepared educational text assigned to the founders for adoption. It does not contain evidence that those clinicians already authored or reviewed it. Verify clinical claims and references, including the cat-carrier source that blocked automated retrieval. Preserve accurate source attribution and do not claim a review happened when it did not.

Use the existing CMS **Articles → Add missing article drafts** action, or the same data model through the trusted connected environment. The action skips existing manuscript IDs; existing work must not be overwritten. If earlier starter versions already exist, compare them with the improved pack and report the differences before replacing editorial work. Check `publications` too if using a trusted import: an existing published slug must never be silently replaced.

For a new manuscript, preserve the Article object and store:

```
article: <complete validated article object>
authorUid: <verified UID of its assigned founder, or the real importing member when using the CMS>
status: "DRAFT"
revision: 1
reviewerUid: ""
reviewerAuthorId: ""
reviewedAt: ""
updatedAt: <actual import time as ISO string>
reviewNote: ""
```

The publication pipeline is already implemented:
`DRAFT → SUBMITTED FOR REVIEW → UNDER REVIEW → APPROVED → PUBLISHED`.
A different eligible founder must complete the clinical review; the creator and assigned author cannot self-review. Record actual review identity and timestamps only after the review occurs. Once author adoption and real review are confirmed, publish all 30 through the existing transition logic. It atomically creates the public snapshot in `publications/{article.id}`. Do not bypass this with fake reviewer UIDs, invented past dates or an unauthenticated import endpoint.

If clinical approval is not available, complete the import and every independent setup task, identify exactly which approvals remain, and do not falsely report the articles as published. Once approval is supplied, finish publication rather than stopping at advice. The acceptance target remains five live articles per founder.

Do not bundle the draft pack as a production public fallback. The single authoritative public content source is Firestore `publications`. A denied or empty collection must not silently reveal unpublished material.

## Images and LinkedIn import

All 30 prepared guides have HTTPS animal photos and descriptive alt text. Keep the source-sized responsive images. Photography is illustrative and not evidence of clinical cases or an endorsement. The site credits Unsplash; the audit records URLs. Preserve the author's existing profile photo.

The existing free upload system stores compressed image documents in Firestore and serves authorised public references through `/media/{id}`. Keep its rules, limits and private-draft protections. Do not enable billable Firebase Storage.

Keep `/api/linkedin` in the Cloudflare Worker. It verifies Google identity and active founder membership, validates LinkedIn URLs/redirects and bounds responses. Imports become reviewable drafts. Do not bypass LinkedIn login, CAPTCHA, paywalls or blocking, and do not fabricate article bodies when retrieval fails.

## Build, deploy and verify

Run the actual checks and fix failures:

```
npm ci
npm run lint
npm run test
npm run test:content
npm run build
npm run test:worker
npm run test:rules
npm run test:browser
npm run test:cms
```

The rules/CMS checks use isolated Firebase emulators; never point tests at production. Review mobile screenshots. If your environment cannot run a check, use the GitHub validation workflow and report the result accurately.

The existing Cloudflare Worker name is `blog-thatvetgut-net`; production branch is `main`, root `/`, build command `npm run build` or `bun run build`, deployment command `npx wrangler deploy`. `npx wrangler versions upload` alone does not move production traffic. Preserve the `ASSETS` binding, `./dist` directory and Worker entry point. If Cloudflare is not connected to your session, prepare the exact change and state the remaining dashboard step; do not claim deployment.

Verify after deployment:

- Blog homepage is styled and shows animal photos on a phone.
- All 30 genuinely approved publications appear, five per author, with working article URLs and images.
- Real Google founder login and logout work; an unapproved Google account cannot enter the CMS.
- Profiles are editable only by their associated member.
- Drafts remain unavailable to unauthenticated database requests and are absent from sitemaps.
- Article refreshes, categories, dog/cat tags, search, sources and share links work.
- LinkedIn failure states are honest and imports never auto-publish.
- No credentials, clinical review claims or deployment results are invented.

Finish with counts for imported, already existing, awaiting review and actually published records; production URLs tested; checks passed; and any precise action still requiring the owner. Do not report “complete” if the live publication or authentication is still broken.
