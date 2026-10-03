import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
import { publishedPage, profiles } from "./repository";
import { authors as defaults } from "../data/editorial";
import type { Author, Publication, Member } from "./domain";
const AuthContext = createContext<{
  user: User | null;
  member: Member | null;
  loading: boolean;
  error: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  user: null,
  member: null,
  loading: true,
  error: "",
  login: async () => {},
  logout: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(!!auth);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!auth || !db) return;
    let generation = 0;
    return onAuthStateChanged(auth, async (u) => {
      const current = ++generation;
      setUser(u);
      setMember(null);
      setError("");
      if (!u) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const s = await getDoc(doc(db!, "cms_users", u.uid));
        if (current !== generation) return;
        const m = s.exists() ? (s.data() as Member) : null;
        if (
          m?.role === "CO_FOUNDER" &&
          m.status === "ACTIVE" &&
          defaults.some((a) => a.id === m.authorId) &&
          u.emailVerified
        )
          setMember(m);
        else
          setError(
            "This Google account has not been approved for the editorial team.",
          );
      } catch {
        if (current === generation)
          setError("Unable to verify editorial access. Please try again.");
      } finally {
        if (current === generation) setLoading(false);
      }
    });
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        member,
        loading,
        error,
        login: async () => {
          if (!auth) throw new Error("Connect Firebase before signing in.");
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          await signInWithPopup(auth, provider);
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
const CatalogContext = createContext<{
  items: Publication[];
  authors: Author[];
  loading: boolean;
  error: string;
  more: boolean;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}>({
  items: [],
  authors: defaults,
  loading: true,
  error: "",
  more: false,
  reload: async () => {},
  loadMore: async () => {},
});
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Publication[]>([]);
  const [authors, setAuthors] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!configured) {
        const { launchDrafts } = await import("../data/launch-drafts");
        setItems(
          launchDrafts.map((article) => ({
            article,
            revision: 1,
            reviewerUid: "",
            reviewerAuthorId: "",
            reviewedAt: "",
            publishedAt: null,
          })),
        );
        setMore(false);
      } else {
        const [result, people] = await Promise.all([
          publishedPage(),
          profiles(),
        ]);
        setItems(result.items);
        setCursor(result.cursor);
        setMore(result.more);
        setAuthors(defaults.map((a) => people.find((p) => p.id === a.id) || a));
      }
    } catch {
      setItems([]);
      setError("The publication could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const loadMore = async () => {
    setLoading(true);
    try {
      const r = await publishedPage(cursor);
      setItems((old) => [
        ...old,
        ...r.items.filter(
          (p) => !old.some((o) => o.article.id === p.article.id),
        ),
      ]);
      setCursor(r.cursor);
      setMore(r.more);
    } catch {
      setError("More articles could not be loaded. Try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <CatalogContext.Provider
      value={{ items, authors, loading, error, more, reload, loadMore }}
    >
      {children}
    </CatalogContext.Provider>
  );
}
export const useCatalog = () => useContext(CatalogContext);
