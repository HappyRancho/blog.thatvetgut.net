import { writeFile, readFile } from "node:fs/promises";
try {
  process.loadEnvFile(".env");
} catch {}
try {
  process.loadEnvFile(".env.local");
} catch {}
let appletConfig = {};
try {
  appletConfig = JSON.parse(
    await readFile("firebase-applet-config.json", "utf8"),
  );
} catch {}
const config = {
  projectId:
    process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "",
  databaseId:
    process.env.VITE_FIREBASE_DATABASE_ID &&
    process.env.VITE_FIREBASE_DATABASE_ID !== "(default)"
      ? process.env.VITE_FIREBASE_DATABASE_ID
      : appletConfig.firestoreDatabaseId || "(default)",
  apiKey: process.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "",
  siteUrl: process.env.VITE_SITE_URL || "https://blog.thatvetguy.net",
  cmsUrl: process.env.VITE_CMS_URL || "https://blog.thatvetguy.net",
};
await writeFile(
  "worker/public-config.js",
  `// Generated public configuration. Contains no administrative credentials.\nexport default ${JSON.stringify(config)};\n`,
);
