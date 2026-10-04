import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Publication, Author } from "./domain";
import { configured } from "./firebase";
import { authors as defaults } from "../data/editorial";
import { profiles, publishedPage } from "./repository";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
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
function bootstrap(): { items: Publication[]; authors: Author[] } | null {
  try {
    const raw = document.getElementById("journal-data")?.textContent;
    if (!raw) return null;
    const d = JSON.parse(raw);
    return Array.isArray(d.items) && Array.isArray(d.authors) ? d : null;
  } catch {
    return null;
  }
}
export function CatalogProvider({ children }: { children: ReactNode }) {
  const initial = useRef(bootstrap());
  const ready = useRef(!!initial.current);
  const [items, setItems] = useState<Publication[]>(
    initial.current?.items || [],
  );
  const [authors, setAuthors] = useState(initial.current?.authors || defaults);
  const [loading, setLoading] = useState(!initial.current);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData>>();
  const reload = useCallback(async () => {
    setLoading(!ready.current);
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
      ready.current = true;
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
