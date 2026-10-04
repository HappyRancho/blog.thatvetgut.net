# Article and photography audit — 4 October 2026

The content package contains 30 educational guides, five per named founder. Their public-health and clinical explanations were checked against retrieved institutional guidance. They are prepared manuscripts awaiting clinician adoption/review and live Firebase publication, not claimed medical peer reviews. Clinical advice is limited to general education, safe observation and appropriate escalation; the articles contain no home prescribing regimens or drug dosages.

## Retrieved pages used in the pack

HTTP 200 pages inspected as full text on 4 October 2026:

- [WSAVA nutrition guidelines and tools](https://wsava.org/global-guidelines/global-nutrition-guidelines/): body/muscle condition, diet histories, label selection, raw-diet risk resources and feeding tools.
- [WSAVA vaccination guidelines](https://wsava.org/global-guidelines/vaccination-guidelines/): the 2024 guideline resource and core/non-core framework. No universal vaccination timetable is reproduced.
- [AVMA pet dental care](https://www.avma.org/resources-tools/pet-owners/petcare/pet-dental-care) and [household hazards](https://www.avma.org/resources-tools/pet-owners/petcare/household-hazards).
- [WHO rabies](https://www.who.int/news-room/fact-sheets/detail/rabies): exposure routes, prevention, prompt wound washing and medical post-exposure assessment. No human dosing schedule is supplied.
- VCA's [CBC](https://vcahospitals.com/know-your-pet/complete-blood-count), [urinalysis](https://vcahospitals.com/know-your-pet/urinalysis), [faecal flotation](https://vcahospitals.com/know-your-pet/fecal-flotation), [vaccination failures](https://vcahospitals.com/know-your-pet/vaccination-failures-in-dogs), [heatstroke](https://vcahospitals.com/know-your-pet/heat-stroke-in-dogs), [leptospirosis](https://vcahospitals.com/know-your-pet/leptospirosis-in-dogs) and [postoperative instructions](https://vcahospitals.com/know-your-pet/post-operative-instructions-in-dogs). These inform factual checks, not copied article text or tables.
- [WOAH antimicrobial resistance](https://www.woah.org/en/what-we-do/global-initiatives/antimicrobial-resistance/) and [codes/manuals](https://www.woah.org/en/what-we-do/standards/codes-and-manuals/). Farm articles use general management guidance, not an invented local legal rule or withdrawal interval.
- [University of Minnesota cattle heat guidance](https://extension.umn.edu/agriculture/animals-and-livestock/dairy/heat-stress-in-dairy-cattle): heat balance, observations, shade, water and ventilation. No imported herd-specific threshold is prescribed.
- ACVS [colic](https://www.acvs.org/large-animal/colic-in-horses/) and [cruciate ligament disease](https://www.acvs.org/small-animal/cranial-cruciate-ligament-disease/): recognition, examination, treatment context and recovery restrictions. No procedures are taught for home performance.
- [RSPCA injured wildlife](https://www.rspca.org.uk/adviceandwelfare/wildlife/injured): safe distance and qualified help. The article directs Indian readers to local wildlife authorities; UK telephone numbers/laws and unsupported species assumptions are not copied.

These are institutional and professional educational sources. The package is not represented as 30 systematic literature reviews. Founders should verify local applicability, current recommendations and source support before publication.

## Remaining source check

The existing [Cat Friendly carrier page](https://catfriendly.com/cat-care-at-home/cat-carrier-tips/) returned HTTP 403 to automated retrieval. It remains a clearly identified manual verification item for the assigned clinician. Other blocked or missing candidate pages (CDC, FDA, RVC, some dairy links and an obsolete VCA carrier URL) were not treated as inspected evidence. Unavailable FDA pain-reliever references were replaced with the retrieved AVMA household-hazard guidance.

## Design benchmark

PetMD's homepage returned HTTP 200 on this pass. Its actual page content prioritises Dogs, Cats, other species, practical care topics, current articles and identifiable contributors. The revised blog uses species-first entry points, prominent animal photos, scannable article cards and a practical everyday-care section. It does not reproduce PetMD text, branding, statistics, chat services or symptom-checker claims. Existing real-page research into VCA, AKC and Preventive Vet is recorded in `RESEARCH.md`. The previous journal metaphor and sparse text-only feature are removed.

## Photography

The Unsplash URLs in `src/data/photography.ts` were fetched successfully and the dog, cat, retriever, ginger cat, horse and cow images were visually inspected. The final wildlife image is checked by `scripts/content-research.mjs` and the validation artifact. Portraits remain the existing main-site portraits. Photos illustrate a topic, not an actual clinical case or contributor endorsement. Cropping and responsive dimensions are reviewed in browser screenshots. Footer credit links to Unsplash; the exact image URLs remain in the article records.

CI research artifacts contain source retrieval statuses for reproducibility. Do not publish scraped source text as part of the blog. No publication/review timestamp is added to the article JSON; Firestore records the real event when the editorial workflow is completed.
