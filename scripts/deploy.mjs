import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { firestoreDeployment } from "./firebase-target.mjs";
const { project, config } = firestoreDeployment(
  JSON.parse(readFileSync("firebase.json", "utf8")),
  JSON.parse(readFileSync("firebase-applet-config.json", "utf8")),
  process.env,
);
console.log(
  `Firestore rules/indexes target: ${project}/${config.firestore[0].database}`,
);
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify(config, null, 2));
  process.exit(0);
}
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
      "firestore:rules,firestore:indexes",
      ...(process.env.CI ? ["--non-interactive"] : []),
    ],
    { stdio: "inherit" },
  );
} finally {
  try {
    unlinkSync(file);
  } catch {}
}
