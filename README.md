# ThatVetGuy — Veterinary Medicine • Animal Health • Pet Education

A collaborative veterinary publication created and operated collectively by a team of veterinary professionals.

**Production Domain:** `blog.thatvetguy.net`  
**Platform Target:** Cloudflare Pages / Static SPA + Firebase Ready  
**Operating Principle:** Equal collaborative authority among all ThatVetGuy Co-Founders. Zero corporate hierarchy.

---

## 1. Brand & Team Identity

ThatVetGuy is a collective veterinary publication, not a personal blog or corporate hierarchy.
- **Brand:** ThatVetGuy
- **Tagline:** Veterinary Medicine • Animal Health • Pet Education
- **Design:** Deep emerald, dark charcoal, off-white, muted teal, and clean typography with Manrope and Inter.
- **Core Team Title:** **ThatVetGuy Co-Founders**
- **Equal Standing:** All core clinicians are Co-Founders with equal visual presentation, equal content authority, and equal peer review responsibility. No individual is labeled "Owner", "Sole Founder", "Administrator", or "Boss".

### Initial Co-Founders:
1. **Dr. Chirag Patidar** — BVSc & AH, MVSc (Veterinary Surgery & Radiology)
2. **Dr. Amaan Ahmed** — BVSc & AH, MVSc (Small Animal Internal Medicine)
3. **Dr. Shivam** — BVSc & AH (Clinical Nutrition & Companion Animal Health)
4. **Dr. Ritesh Verma** — BVSc & AH (Emergency & Critical Care, Anesthesiology)
5. **Dr. Deepesh Mathur** — BVSc & AH, MVSc (Veterinary Microbiology & One Health)

---

## 2. Public Pages & Clean URLs

| Route | Page | Purpose |
| :--- | :--- | :--- |
| `/` | Homepage | Featured clinical article, latest insights, specialties, Co-Founders showcase, newsletter |
| `/articles` | All Articles Archive | Search, category filters, tag filter, sorting, reading time, saved articles |
| `/article/:slug` | Article Detail | Scientific breakdown, clinical takeaways, data tables, references, author bio, social sharing |
| `/categories` | Categories Overview | 8 clinical veterinary disciplines with descriptions and article counts |
| `/category/:slug` | Category Page | Curated articles within a specific veterinary discipline |
| `/contributors` | Meet the Team | All ThatVetGuy Co-Founders with equal visual weight, qualifications, and bios |
| `/author/:slug` | Author Profile | Detailed background, clinical expertise, qualifications, and published articles |
| `/search` | Search Library | Real-time multi-field search across titles, excerpts, content, authors, and tags |
| `/about` | About ThatVetGuy | Founding philosophy, equal co-authorship model, and peer-review methodology |
| `/contact` | Contact & Inquiries | Inquiries, clinical case study submissions, and veterinary contributor interest |

---

## 3. Mobile-First Optimization for Android

The application is engineered from the ground up to be comfortable on Android devices across viewports (360px, 390px, 412px, 430px):
- Touch targets strictly maintain minimum 44px height and width.
- Slide-out mobile navigation drawer with quick access to disciplines and search.
- Sticky bottom reading action bar for single-handed reading, bookmarking, sharing, and navigation on smartphones.
- High contrast, eye-friendly typography using responsive scaling and optional font-size enlargement for reading comfort.

---

## 4. Local Development

### Prerequisites:
- Node.js 18+ or 20+
- npm or bun

### Setup:
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run linter and type-checking
npm run lint

# Production build test
npm run build
```

---

## 5. Deployment Guide (Cloudflare Pages & Custom Domain)

### GitHub Repository:
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: ThatVetGuy collaborative veterinary publication"
   git remote add origin https://github.com/your-username/thatvetguy.git
   git push -u origin main
   ```

### Deploying to Cloudflare Pages:
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
3. Select your `thatvetguy` repository.
4. Set Build Settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**.

### Configuring Custom Domain (`blog.thatvetguy.net`):
1. In Cloudflare Pages, go to **Custom Domains**.
2. Click **Set up a custom domain**.
3. Enter `blog.thatvetguy.net`.
4. Cloudflare automatically generates SSL/TLS certificates and configures DNS routing.

---

## 6. Architecture & Future Firebase Roadmap

The current public application runs as an ultra-fast, zero-latency client-side application with structured data, clean URL synchronization, and local storage bookmarks.

When ready to enable the collaborative CMS authoring system:
1. **Firebase Authentication:** Google Sign-In with an invite-approval list.
2. **Firestore Database:** Collections for `articles`, `authors`, `categories`, `tags`, `revisions`, and `reviews`.
3. **Security Rules:** Enforcing equal Co-Founder publishing authority so no single user has administrative dominance.
4. **Firebase Storage:** WebP optimized storage for clinical photographs, radiographs, and author headshots.

---

## 7. Veterinary Disclaimer

Information published by ThatVetGuy is intended strictly for educational purposes and should not replace professional veterinary consultation, physical examination, or in-person emergency hospital care.
