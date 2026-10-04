# Evidence and design decisions

## Scope and domains

Inspected real rendered pages on 3 October 2026 using Playwright in GitHub Actions. Evidence is in the `publication-benchmark` artifacts of PR #8. The primary site is a services/portfolio site, not a publication homepage. The user explicitly chose to retain it. The publication and the only CMS remain on `https://blog.thatvetguy.net`; `/admin` is accessed directly. Canonicals remain on the blog domain. No second content database or membership system was created.

## Accessible publication benchmarks

| Publication       | Pages inspected                                               | Useful pattern                                                                          | Adaptation                                                                                |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| VCA Know Your Pet | Library landing page                                          | Search at the start, practical descriptions, topic discovery                            | Visible search, concise category descriptions, readable archives                          |
| AKC Expert Advice | Advice landing page and breed directory                       | Clear topic navigation and introductory context                                         | Compact navigation and recoverable filters; avoid a large commercial mega-menu            |
| Preventive Vet    | Homepage and Cleaning Products That Are Safe for Pets article | Question-led subjects, named author, published/updated dates, actionable reading        | Practical titles, genuine dates, clear sources and reading tools                          |
| Works in Progress | Homepage                                                      | Typographic hierarchy, distinctive feature composition, author credits and topic labels | Purposeful feature plus a quieter reading list, warm paper and restrained forest accents  |
| HappyPet (India)  | Main site; original `/blog` returned 404                      | Local audience, pet-care tracking and media navigation                                  | Indian context in editorial proposals without copying the app or inventing local services |

PetMD returned an access-denied page (HTTP 403). The Spruce Pets and Daily Paws returned restricted-access pages (HTTP 402). Dogsee's Indian blog returned a security-check page. These were not treated as reviewed content. The follow-up also inspected `/dog` and the public vomiting-in-dogs article URL; both returned HTTP 403 access-denied pages. No authentication or anti-bot protection was bypassed.

## Writing-interface research

Read Ghost's actual “Intro to the editor” documentation and Tiptap's editor overview. The useful principle is keeping writing prominent and formatting predictable. Tiptap/ProseMirror replaces deprecated `execCommand`, supports undo/redo, links, images, tables and structured clinical callouts, and preserves a document model while editing. The editor remains inside the lazy CMS route.

## Author source records

All six founder pages and the collective directory were rendered and captured:

- `https://www.thatvetguy.net/chirag`
- `https://www.thatvetguy.net/amaan`
- `https://www.thatvetguy.net/Shivam`
- `https://www.thatvetguy.net/ritesh`
- `https://www.thatvetguy.net/deepesh-m`
- `https://www.thatvetguy.net/deepesh-c`
- `https://www.thatvetguy.net/experts`

The shared defaults use editorial summaries, the site's actual portraits and published professional links. Ritesh's page explicitly lists MVSc in Veterinary Pathology. Shivam's page describes postgraduate study as ongoing despite a qualification headline; the publication therefore retains BVSc & AH and describes postgraduate study in the bio. Promotional follower counts, endorsements and surgery statistics were omitted. Main-site publication is evidence of what the team presents, not independent verification of credentials. Existing saved Firestore profiles take precedence; each founder can adopt the refreshed default through their own profile editor.

## Content

Replaced the eight sample manuscripts with practical reader questions. No manuscript is automatically inserted or published. Attribution is proposed until a founder accepts it; preview labels say so. Sources, recommendations and local context must be checked by an independent founder before approval. References are not given invented publication years.

## Observed deployment problem

Anonymous REST reads against the configured named Firestore database returned HTTP 403 for both `publications` and `authors`. Private `manuscripts` and `cms_users` also denied anonymous reads, as expected. The former indicates public collection rules/configuration need owner verification before launch. These observations do not establish what the live rules currently contain, or verify authenticated CMS writes. No production data was changed.

Seven of eight proposed source landing pages returned HTTP 200 with matching titles. Cat Friendly's carrier guide returned HTTP 403 and still requires verification by a founder. Availability of a source page is not evidence that every draft claim has been clinically verified.
