# Launch and migration checklist

## Current delivery boundary

The rebuild is source code and a reviewable GitHub change, not a claim that a live Firebase account is configured. No existing Firebase data, rules, accounts or production hosting have been modified. Network restrictions may prevent local dependency installation; consult the PR's checks for actual validation results.

## Before production

- Run the build, domain tests and Firestore emulator tests. Test public reading and the review workflow with two distinct Firebase test accounts.
- Confirm Google sign-in, all six UID mappings and rejection of an unapproved account.
- Verify publishing, withdrawal and an edit from two browser sessions. Public article detail reads never fall back to bundled or locally cached publications.
- Confirm contact/interest submissions appear in the private inbox. Do not advertise an active newsletter until an actual delivery service and consent process are ready.
- Check desktop/mobile layouts, keyboard navigation, large text, share dialog and empty/error states.
- Read and clinically verify every launch manuscript and reference. Replace broad reference pages with precise sources. Obtain contributor acceptance and independent review.
- Supply real portraits and properly licensed article images; keep assets small. The optional Unsplash image is inherited as an external illustrative source, not a claim about the depicted clinician.
- Confirm project, region, public domain, Google authorized domains and App Check enforcement.
- Keep a free-tier quota monitoring routine and a contact-submission retention policy.

## Existing data

The new schema deliberately uses `manuscripts` and `publications` rather than the old `articles` collection. Do not deploy the new rules to the original project before exporting its data and planning the migration. Never migrate old `PUBLISHED` labels as proof of clinical review. Import articles as drafts, verify authors and references, then pass them through independent review.

## Search and social metadata

The public bundle is split by route, with the CMS loaded only on demand. One catalog is used for homepage, search, specialties and profiles. Catalog reads are paged in batches of 48; readers can load more. Article detail fetches its current public record separately. Some social crawlers will see only the initial HTML metadata because the app is a static SPA; full crawlable article HTML requires a separately planned publication/deployment pipeline. Do not claim server rendering or immediate social-card indexing.

## Rollback

Keep the existing GitHub default branch and Firebase project intact until acceptance. The rebuild is on its own branch. Firebase Hosting releases can be rolled back in the console, but rules and data changes need their own reviewed rollback plan. A separate Spark project makes this boundary explicit.
