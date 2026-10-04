import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
const project =
  process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const database = process.env.VITE_FIREBASE_DATABASE_ID || "(default)";
if (!project || !/^[a-z][a-z0-9-]+$/.test(project))
  throw new Error("Set the Firebase project ID before deploying.");
if (!/^(\(default\)|[a-z][a-z0-9-]+)$/.test(database))
  throw new Error("Invalid Firestore database ID.");
const config = JSON.parse(readFileSync("firebase.json", "utf8"));
config.firestore = [{ ...config.firestore, database }];
const file = ".firebase.deploy.json";
try {
  writeFileSync(file, JSON.stringify(config, null, 2));
  execFileSync(
    process.execPath,
    [
      "node_modules/firebase-tools/lib/bin/firebase.js",
      "deploy",
      "--project",
      project,
      "--config",
      file,
      "--only",
      "hosting,firestore:rules,firestore:indexes",
      ...(process.env.CI ? ["--non-interactive"] : []),
    ],
    { stdio: "inherit" },
  );
} finally {
  try {
    unlinkSync(file);
  } catch {}
}
