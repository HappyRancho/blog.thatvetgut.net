// Development-only entry; never included in the production build.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { app, db } from "../src/lib/firebase";
import "../src/styles.css";
if (!import.meta.env.DEV || app?.options.projectId !== "demo-thatvetguy")
  throw new Error("Test entry requires the demo emulator project.");
connectFirestoreEmulator(db!, "127.0.0.1", 8085);
const auth = getAuth(app!);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
// Emulator-only credentials. No fixture API is imported by the application.
(window as any).fixtureSignIn = async (name: string) => {
  const result = await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub: name,
        email: `${name}@example.test`,
        email_verified: true,
        name,
      }),
    ),
  );
  return result.user.uid;
};
const [{ default: Admin }, { CatalogProvider }] = await Promise.all([
  import("../src/pages/Admin"),
  import("../src/lib/contexts"),
]);
createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={["/admin"]}>
    <CatalogProvider>
      <Admin />
    </CatalogProvider>
  </MemoryRouter>,
);
