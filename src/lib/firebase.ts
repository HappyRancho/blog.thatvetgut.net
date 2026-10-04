import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
const e = import.meta.env;
export const configured = !!(
  e.VITE_FIREBASE_API_KEY &&
  e.VITE_FIREBASE_PROJECT_ID &&
  e.VITE_FIREBASE_APP_ID &&
  e.VITE_FIREBASE_AUTH_DOMAIN
);
export const app = configured
  ? initializeApp({
      apiKey: e.VITE_FIREBASE_API_KEY,
      authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: e.VITE_FIREBASE_PROJECT_ID,
      appId: e.VITE_FIREBASE_APP_ID,
    })
  : null;
if (app && e.VITE_APPCHECK_SITE_KEY)
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(e.VITE_APPCHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
export const db = app
  ? getFirestore(app, e.VITE_FIREBASE_DATABASE_ID || "(default)")
  : null;
export function database() {
  if (!db)
    throw new Error(
      "Firebase is not configured. Follow docs/FIREBASE-SPARK.md to connect the free project.",
    );
  return db;
}
