import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import appletConfig from "../../firebase-applet-config.json";
const e = import.meta.env;
const projectId = e.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId;
const sameProject = projectId === appletConfig.projectId;
const apiKey =
  e.VITE_FIREBASE_API_KEY || (sameProject ? appletConfig.apiKey : "");
const authDomain =
  e.VITE_FIREBASE_AUTH_DOMAIN || (sameProject ? appletConfig.authDomain : "");
const appId = e.VITE_FIREBASE_APP_ID || (sameProject ? appletConfig.appId : "");
const databaseId =
  sameProject &&
  (!e.VITE_FIREBASE_DATABASE_ID || e.VITE_FIREBASE_DATABASE_ID === "(default)")
    ? appletConfig.firestoreDatabaseId
    : e.VITE_FIREBASE_DATABASE_ID || "(default)";
// Only the isolated browser-test build uses the labelled, unauthenticated content preview.
// Production always uses the connected project; the test build is never deployed.
export const configured =
  import.meta.env.MODE !== "test" &&
  !!(apiKey && projectId && appId && authDomain);
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
