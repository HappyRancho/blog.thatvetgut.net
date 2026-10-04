import { writeFile } from "node:fs/promises";
try {
  process.loadEnvFile(".env.local");
} catch {}
const config = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  databaseId: process.env.VITE_FIREBASE_DATABASE_ID || "(default)",
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  siteUrl: process.env.VITE_SITE_URL || "https://blog.thatvetguy.net",
  cmsUrl: process.env.VITE_CMS_URL || "https://blog.thatvetguy.net",
};
await writeFile(
  "worker/public-config.js",
  `// Generated public configuration. Contains no administrative credentials.\nexport default ${JSON.stringify(config)};\n`,
);
