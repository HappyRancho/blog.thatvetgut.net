import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const e = import.meta.env;
const apiKey =
  e.VITE_FIREBASE_API_KEY || "AIzaSyDvoUKv8ergiYefqQd4XMOBJDZSf3v7UEU";
const authDomain =
  e.VITE_FIREBASE_AUTH_DOMAIN || "adroit-bus-1ghtt.firebaseapp.com";
const projectId = e.VITE_FIREBASE_PROJECT_ID || "adroit-bus-1ghtt";
const appId =
  e.VITE_FIREBASE_APP_ID || "1:848868631308:web:8745e698037df398eb9f29";
const databaseId =
  e.VITE_FIREBASE_DATABASE_ID && e.VITE_FIREBASE_DATABASE_ID !== "(default)"
    ? e.VITE_FIREBASE_DATABASE_ID
    : "ai-studio-thatvetguy-7ee5cb09-c3e8-4d7e-8c1c-f5ef3b5df638";

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
