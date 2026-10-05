export function firestoreDeployment(config, connected, env = {}) {
  const project =
    env.VITE_FIREBASE_PROJECT_ID ||
    env.FIREBASE_PROJECT_ID ||
    connected.projectId;
  const database =
    env.VITE_FIREBASE_DATABASE_ID || connected.firestoreDatabaseId;
  if (!/^[a-z][a-z0-9-]+$/.test(project || ""))
    throw new Error("Set a valid Firebase project ID before deploying.");
  if (!/^(\(default\)|[a-z][a-z0-9-]+)$/.test(database || ""))
    throw new Error("Set the intended Firestore database ID before deploying.");
  if (
    project === connected.projectId &&
    database !== connected.firestoreDatabaseId
  )
    throw new Error(
      "This blog uses the connected named database. Refusing to deploy rules to a different database.",
    );
  const entries = Array.isArray(config.firestore)
    ? config.firestore
    : [config.firestore];
  const selected =
    entries.find((entry) => entry?.database === database) ||
    (!Array.isArray(config.firestore) && config.firestore);
  if (!selected?.rules || !selected?.indexes)
    throw new Error(
      "No rules and indexes are configured for the selected database.",
    );
  return {
    project,
    config: {
      firestore: [
        { database, rules: selected.rules, indexes: selected.indexes },
      ],
    },
  };
}
