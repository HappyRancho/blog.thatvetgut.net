import { lazy, Suspense, Component, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { CatalogProvider } from "./lib/contexts";
import { Layout, Loading, SEO } from "./components/Layout";
import Home from "./pages/Home";
const Archive = lazy(() => import("./pages/Archive"));
const Article = lazy(() => import("./pages/Article"));
const Admin = lazy(() => import("./pages/Admin"));
const Categories = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.Categories })),
);
const Contributors = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.Contributors })),
);
const Author = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.AuthorPage })),
);
const About = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.About })),
);
const Contact = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.Contact })),
);
const Privacy = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.Privacy })),
);
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="container section">
        <h1>Something interrupted this page.</h1>
        <p>Please reload. Unsaved edits may need to be entered again.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <CatalogProvider>
          <Layout>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/articles" element={<Archive />} />
                <Route path="/search" element={<Archive />} />
                <Route path="/tag/:tagSlug" element={<Archive />} />
                <Route path="/category/:slug" element={<Archive />} />
                <Route path="/article/:slug" element={<Article />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/contributors" element={<Contributors />} />
                <Route path="/author/:slug" element={<Author />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="*"
                  element={
                    <div className="container section">
                      <SEO
                        title="Page not found"
                        description="The requested page does not exist."
                        noindex
                      />
                      <h1>This page is not in the blog.</h1>
                      <Link to="/">Return to the homepage</Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </Layout>
        </CatalogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
