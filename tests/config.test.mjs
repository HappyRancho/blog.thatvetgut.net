import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { firestoreDeployment } from "../scripts/firebase-target.mjs";
const fixture = JSON.parse(
  await readFile("firebase-applet-config.json", "utf8"),
);
test("rules deployment selects only the connected named database and never Hosting", async () => {
  const config = JSON.parse(await readFile("firebase.json", "utf8"));
  const result = firestoreDeployment(config, fixture);
  assert.equal(result.project, fixture.projectId);
  assert.deepEqual(result.config, {
    firestore: [
      {
        database: fixture.firestoreDatabaseId,
        rules: "firestore.rules",
        indexes: "firestore.indexes.json",
      },
    ],
  });
  assert.equal("hosting" in result.config, false);
  assert.equal(config.firestore.length, 1);
  assert.throws(
    () =>
      firestoreDeployment(config, fixture, {
        VITE_FIREBASE_DATABASE_ID: "(default)",
      }),
    /Refusing/,
  );
  const multi = {
    firestore: [
      ...config.firestore,
      { database: "(default)", rules: "other.rules", indexes: "other.json" },
    ],
  };
  assert.deepEqual(firestoreDeployment(multi, fixture), result);
  assert.deepEqual(
    firestoreDeployment(
      {
        firestore: {
          rules: "firestore.rules",
          indexes: "firestore.indexes.json",
        },
      },
      fixture,
    ),
    result,
  );
  assert.throws(
    () => firestoreDeployment({ firestore: [] }, fixture),
    /No rules/,
  );
});
test("Worker defaults and isolated project overrides select the intended database", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "tvg-config-"));
  try {
    await mkdir(join(cwd, "worker"));
    await copyFile("scripts/worker-config.mjs", join(cwd, "worker-config.mjs"));
    await copyFile(
      "firebase-applet-config.json",
      join(cwd, "firebase-applet-config.json"),
    );
    const cleanEnv = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith("VITE_")),
    );
    async function generated(extra = {}) {
      execFileSync(process.execPath, ["worker-config.mjs"], {
        cwd,
        env: { ...cleanEnv, ...extra },
      });
      const s = await readFile(join(cwd, "worker/public-config.js"), "utf8");
      return JSON.parse(s.split("export default ")[1].replace(/;\s*$/, ""));
    }
    let config = await generated();
    assert.equal(config.projectId, fixture.projectId);
    assert.equal(config.databaseId, fixture.firestoreDatabaseId);
    config = await generated({ VITE_FIREBASE_DATABASE_ID: "(default)" });
    assert.equal(config.databaseId, fixture.firestoreDatabaseId);
    config = await generated({
      VITE_FIREBASE_PROJECT_ID: "demo-thatvetguy",
      VITE_FIREBASE_DATABASE_ID: "(default)",
      VITE_FIREBASE_API_KEY: "demo-test-key",
    });
    assert.equal(config.projectId, "demo-thatvetguy");
    assert.equal(config.databaseId, "(default)");
    assert.equal(config.apiKey, "demo-test-key");
    config = await generated({ VITE_FIREBASE_PROJECT_ID: "another-project" });
    assert.equal(config.databaseId, "(default)");
    assert.equal(config.apiKey, "");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
