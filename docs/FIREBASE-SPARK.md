# Existing free Firebase project

For this enhancement, use the existing AI Studio Starter/free project and named database. It does not require a new project or billing upgrade. Updated image uploads use bounded Firestore media documents, not Firebase Storage. Follow [ENHANCEMENT-DEPLOYMENT.md](ENHANCEMENT-DEPLOYMENT.md) for current setup and limitations.

## Connect Firebase without a payment card

## 1. Use the correct project type

The original repository references `adroit-bus-1ghtt`, an AI Studio Starter-tier project with a named Firestore database. Starter tier is not the same as a regular Firebase Spark project. Do not click a paid upgrade merely to launch this rebuild.

First check whether the existing Starter project permits Google sign-in and the database/Hosting features needed here without upgrading. If it does, keep the current no-cost plan and configure VITE_FIREBASE_DATABASE_ID with the actual database ID. The deploy script uses VITE_FIREBASE_DATABASE_ID for the rules target as well as the web app, including a named Starter database. Back up existing data and review legacy-rule impact before deployment.

If a required feature is unavailable without billing, create a separate project at https://console.firebase.google.com/ without linking a Cloud Billing account. Confirm the project is on the no-cost **Spark** plan. Disable optional Google Analytics if it is not needed. If the console only offers a billing-required action, stop that action; this code does not need it.

The new project isolates the rebuild from the existing application's data and rules. No Firebase project has been created or modified by this repository.

## 2. Register a web app

Project settings → General → Your apps → Web. Copy the public Firebase web configuration into `.env.local` using `.env.example` as the template:

- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `appId` → `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_ID=(default)`
- `VITE_SITE_URL=https://YOUR_PROJECT_ID.web.app` initially, or your actual custom domain after setup.

These are web identifiers, not Admin credentials. Security is enforced by Firebase rules. Never commit an Admin SDK private key, password or login token.

## 3. Enable Google authentication

Authentication → Sign-in method → Google → Enable. Set the project's public support email. Under Settings → Authorized domains, add the intended Hosting domain, custom domain and `localhost` if developing locally. Some project creation flows no longer add localhost automatically.

No Phone Authentication or SMS service is used. Founders can authenticate with their own Google accounts, but authentication alone grants no CMS access.

## 4. Create Firestore

Create the **(default)** Cloud Firestore database, choose a suitable region and start in production mode. Deploy `firestore.rules` and `firestore.indexes.json` before using the CMS. Do not temporarily open the database to everyone. The application deliberately denies old collection paths.

## 5. Provision the six founders

Ask each founder to sign in once on `/admin`. The login screen displays the Firebase UID when access has not yet been granted. In the Firebase console, an administrator creates `cms_users/{EXACT_UID}` with:

```
role: CO_FOUNDER
status: ACTIVE
authorId: dr-chirag-patidar
```

Use the correct author mapping for each person:

- `dr-chirag-patidar`
- `dr-amaan-ahmed`
- `dr-shivam-singh-thakur`
- `dr-ritesh-verma`
- `dr-deepesh-mathur`
- `dr-deepesh-chaware`

Each founder should sign out and in after provisioning. Set `status` to `INACTIVE` to revoke protected access. Client code cannot create, list or modify these access records. Do not provide access to an account solely because it knows a founder's public name or email.

## 6. Legacy Firebase Hosting deployment

For the current enhancement, deploy the database rules through the Console and use Cloudflare as described in [ENHANCEMENT-DEPLOYMENT.md](ENHANCEMENT-DEPLOYMENT.md). The commands below retain the original Firebase Hosting alternative; they do not deploy the Cloudflare Worker and therefore do not provide its importer, public HTML or media endpoint. Do not use this alternative to release the enhanced journal.

### From your own computer

With Node 22 installed, in the repository:

```sh
npm install
npx firebase login
npm test
npm run build
npm run deploy
```

The login happens in your browser. No password or token needs to be shared in chat. The command deploys no Cloud Functions or Storage service. The deploy script reads the project and database from `.env.local`, matching the web build.

If you only have a phone, use GitHub Actions after configuring keyless Google Cloud access below, or perform the same browser login in your own development environment. Do not paste service-account keys into chat.

## 7. Optional keyless GitHub deployment

The manual `Deploy Firebase Spark` workflow uses Google Cloud Workload Identity Federation and short-lived credentials. Configure a dedicated deploy service account, an identity pool/provider trusting `https://token.actions.githubusercontent.com`, and restrict the provider's attribute condition to **your exact repository and intended deployment ref**. Bind only that repository principal to the deploy account using Workload Identity User. Google Cloud IAM setup requires the project owner's authorization; a project ID alone cannot grant it.

Grant only the deployment permissions needed: Firebase Hosting Admin and Firebase Rules Admin; if deploying indexes, include Datastore Index Admin. Some projects also require Service Usage Consumer for quota-project access. Do not use Owner or Editor as a convenience. Consult current Firebase CLI requirements if an API reports an additional specific missing permission.

Configure a GitHub `production` environment with a required reviewer and the following repository/environment variables:

- `FIREBASE_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` (full provider resource name)
- `GCP_DEPLOY_SERVICE_ACCOUNT` (service-account email)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_APP_ID`
- `VITE_SITE_URL`
- `VITE_FIREBASE_DATABASE_ID` when using a named database; omit for `(default)`
- Optional `VITE_APPCHECK_SITE_KEY`

Run the manual workflow from the reviewed branch. No automatic production deployment is triggered by a PR. The account owner must configure IAM; the GitHub connector does not provide Firebase administration access.

## 8. Protect the free allowance

Use App Check with a supported no-cost reCAPTCHA provider for the web app, test it, then enable Firestore enforcement. The application supports a reCAPTCHA v3 site key via `VITE_APPCHECK_SITE_KEY`. Public contact/interest forms cannot enforce per-IP rate limits using Firestore rules alone, so App Check and quota monitoring matter. A honeypot is a usability layer, not a security boundary.

Check the current Spark quotas in your console. Do not attach billing to bypass a quota. Keep uploaded Firestore media within its documented limits (or use optimised public HTTPS images), avoid large polling workloads, and use manuscript exports for backups. App Check reduces abuse; it does not guarantee that quotas cannot be exhausted.
