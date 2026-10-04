# ThatVetGuy launch content

Thirty complete educational guides, five assigned to each founder, prepared on 4 October 2026. The six JSON files contain about 12,000 words of original explanatory text with actionable checklists, source links, category/tag metadata, SEO descriptions and illustrative animal photography. The eight previous starter slugs are preserved and expanded.

These files are the editorial import package, not a second public database. `src/data/launch-drafts.ts` uses them only for the explicitly labelled unconfigured preview and the authenticated CMS import action. A configured production site reads published records from Firestore. Nothing here asserts completed clinician authorship, review or a historical publication date.

The owner requests all 30 to be published. The connected Google AI Studio session should finish the Firebase setup, verify/adopt the content with the named founders, record real independent review and publish through the existing pipeline. See [the complete handoff](../docs/GOOGLE-AI-STUDIO-HANDOFF.md). Do not invent reviewer records to make that pipeline pass.

Import is available in the CMS article list as **Add missing article drafts**. Existing slugs are skipped; no published material is overwritten. A partial import can be retried. Because earlier starter drafts may already exist, compare those eight records separately if the owner wants the expanded versions adopted.

Run `npm run test:content` to verify count, author distribution, safe structure, valid article metadata, substantive body length, photos, reference URLs and internal links. Automated structural checks do not constitute veterinary review.

The founder allocation follows the owner's specification. Current biographies and portraits remain sourced from the main website; no extra professional certification is added. References are linked for further reading; sources' text, tables and proprietary images are not reproduced. Publication years are omitted where not verified.
