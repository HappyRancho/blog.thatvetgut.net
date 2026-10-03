# Cloudflare Workers hosting + free Firebase backend

This repository supports the existing Cloudflare Workers build integration. Cloudflare serves the Vite output; Firebase provides authentication and Firestore. No custom Worker script is needed.

Cloudflare build settings:

- Root directory: repository root
- Build command: `npm run build`
- Production deploy command: `npx wrangler deploy`
- Non-production version command: `npx wrangler versions upload`
- Node version: 22 (`.node-version` is committed; remove a conflicting NODE_VERSION override in Cloudflare if present)

`wrangler.jsonc` retains the existing Worker name `blog-thatvetgut-net`, serves `./dist`, and uses single-page-application fallback so direct visits to `/article/...` and `/admin` load the React app. Run commands from the repository root so Wrangler can find this file. Version upload creates a version; it does not itself switch production traffic.

Set the public VITE_FIREBASE_* build variables described in FIREBASE-SPARK.md in Cloudflare's build environment. Use the actual named database ID if retaining the AI Studio Starter project. Runtime Worker secrets cannot retroactively configure an already-built static Vite bundle. Without these build variables the website intentionally displays design-preview mode.

Deploy Firebase rules separately, after reviewing the migration instructions. Cloudflare asset deployment does not install rules or provision founder accounts. Add the actual Cloudflare/custom domain to Firebase Authentication's authorized domains for Google sign-in.

The error `Missing entry-point to Worker script or to assets directory` means Wrangler did not find an asset directory or Worker configuration. The committed Wrangler configuration fixes it. Vite's bundle-size warning and npm's dependency warnings were not the cause of that deployment failure.
