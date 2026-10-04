import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import appletConfig from "../../firebase-applet-config.json";

const e = import.meta.env;
const apiKey = e.VITE_FIREBASE_API_KEY || appletConfig.apiKey;
const authDomain = e.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain;
const projectId = e.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId;
const appId = e.VITE_FIREBASE_APP_ID || appletConfig.appId;
const databaseId =
  e.VITE_FIREBASE_DATABASE_ID && e.VITE_FIREBASE_DATABASE_ID !== "(default)"
    ? e.VITE_FIREBASE_DATABASE_ID
    : appletConfig.firestoreDatabaseId || "(default)";

export const configured = !!(apiKey && projectId && appId && authDomain);
export const app = configured
  ? initializeApp({
      apiKey,
      authDomain,
      projectId,
      appId,
    })
  : null;
if (app && e.VITE_APPCHECK_SITE_KEY)
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(e.VITE_APPCHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
export const db = app ? getFirestore(app, databaseId) : null;
export function database() {
  if (!db)
    throw new Error(
      "Firebase is not configured. Follow docs/FIREBASE-SPARK.md to connect the free project.",
    );
  return db;
}
