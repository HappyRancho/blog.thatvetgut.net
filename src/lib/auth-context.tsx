import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onIdTokenChanged,
  signOut,
  getAuth,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { app, db } from "./firebase";
import { authors } from "../data/editorial";
import type { Member } from "./domain";
export const auth = app ? getAuth(app) : null;
const AuthContext = createContext({
  user: null as User | null,
  member: null as Member | null,
  loading: !!auth,
  error: "",
  login: async () => {},
  logout: async () => {},
});
export function authMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/unauthorized-domain":
      "This website domain needs to be added under Firebase Authentication → Settings → Authorized domains.",
    "auth/popup-blocked":
      "Your browser blocked the sign-in window. Allow popups for this website and try again.",
    "auth/popup-closed-by-user":
      "Sign-in was closed. Choose Continue with Google when you are ready.",
    "auth/operation-not-allowed":
      "Google sign-in needs to be enabled in Firebase Authentication.",
    "auth/network-request-failed":
      "Sign-in could not reach Google. Check your connection and retry.",
    "auth/too-many-requests":
      "Too many attempts. Please wait before trying again.",
  };
  return (
    messages[code || ""] || "Sign-in could not be completed. Please try again."
  );
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [member, setMember] = useState<Member | null>(null),
    [loading, setLoading] = useState(!!auth),
    [error, setError] = useState("");
  useEffect(() => {
    if (!auth || !db) return;
    let stopMember = () => {};
    let generation = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const stop = onIdTokenChanged(auth, (u) => {
      const current = ++generation;
      stopMember();
      clearTimeout(timeout);
      setUser(u);
      setMember(null);
      setError("");
      setLoading(!!u);
      if (!u) return;
      const timeOut = () => {
        if (current !== generation) return;
        setMember(null);
        setLoading(false);
        setError(
          "Access verification timed out. Reconnect to resume your workspace, or sign out to switch accounts.",
        );
      };
      timeout = setTimeout(timeOut, 12000);
      stopMember = onSnapshot(
        doc(db!, "cms_users", u.uid),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (current !== generation) return;
          // Cached membership must never keep a revoked or offline session in the workspace.
          if (snapshot.metadata.fromCache) {
            setMember(null);
            setLoading(true);
            clearTimeout(timeout);
            timeout = setTimeout(timeOut, 12000);
            return;
          }
          clearTimeout(timeout);
          const m = snapshot.exists() ? (snapshot.data() as Member) : null;
          if (
            u.emailVerified &&
            m?.role === "CO_FOUNDER" &&
            m.status === "ACTIVE" &&
            authors.some((a) => a.id === m.authorId)
          ) {
            setError("");
            setMember(m);
          } else {
            setMember(null);
            setError(
              "This Google account has not been approved for the editorial team.",
            );
          }
          setLoading(false);
        },
        () => {
          if (current !== generation) return;
          clearTimeout(timeout);
          setMember(null);
          setLoading(false);
          setError(
            "Unable to verify editorial access. Check your connection and retry.",
          );
        },
      );
    });
    return () => {
      generation++;
      clearTimeout(timeout);
      stopMember();
      stop();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        member,
        loading,
        error,
        login: async () => {
          if (!auth) throw new Error("Firebase setup is required.");
          const p = new GoogleAuthProvider();
          p.setCustomParameters({ prompt: "select_account" });
          await signInWithPopup(auth, p);
        },
        logout: async () => {
          if (auth) await signOut(auth);
          setMember(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
