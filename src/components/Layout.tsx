import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShieldCheck, BookOpen } from "lucide-react";
import { configured } from "../lib/firebase";
import { dateISO, safeUrl, type Publication } from "../lib/domain";
import { useCatalog } from "../lib/contexts";
import { categories, disclaimer } from "../data/editorial";
export function SEO({
  title,
  description,
  noindex = false,
  image = "",
  article,
}: {
  title: string;
  description: string;
  noindex?: boolean;
  image?: string;
  article?: Publication;
}) {
  const location = useLocation();
  const { authors } = useCatalog();
  useEffect(() => {
    document.title = `${title} | ThatVetGuy`;
    const set = (key: string, value: string, property = false) => {
      let el = document.head.querySelector<HTMLMetaElement>(
        `meta[${property ? "property" : "name"}="${key}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property ? "property" : "name", key);
        document.head.append(el);
      }
      el.content = value;
    };
    set("description", description);
    set("robots", noindex || !configured ? "noindex,nofollow" : "index,follow");
    set("og:title", title, true);
    set("og:description", description, true);
    set("twitter:card", image ? "summary_large_image" : "summary");
    set("og:type", article ? "article" : "website", true);
    set("og:site_name", "ThatVetGuy", true);
    set("twitter:title", title);
    set("twitter:description", description);
    let link = document.head.querySelector<HTMLLinkElement>(
      "link[rel=canonical]",
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href =
      (import.meta.env.VITE_SITE_URL || window.location.origin).replace(
        /\/$/,
        "",
      ) + location.pathname;
    set("og:url", link.href, true);
    const imageURL = safeUrl(image, true)
      ? new URL(safeUrl(image, true), link.href).href
      : "";
    set("og:image", imageURL, true);
    set("twitter:image", imageURL);
    document.getElementById("structured-data")?.remove();
    if (article && configured) {
      const a = article.article,
        person = authors.find((p) => p.id === a.authorId);
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: a.title,
        description: a.subtitle,
        mainEntityOfPage: link.href,
        ...(person
          ? {
              author: {
                "@type": "Person",
                name: person.name,
                url: new URL("/author/" + person.id, link.href).href,
              },
            }
          : {}),
        ...(dateISO(article.publishedAt)
          ? { datePublished: dateISO(article.publishedAt) }
          : {}),
        ...(dateISO(article.updatedAt)
          ? { dateModified: dateISO(article.updatedAt) }
          : {}),
        ...(imageURL ? { image: imageURL } : {}),
        publisher: {
          "@type": "Organization",
          name: "ThatVetGuy",
          url: new URL("/", link.href).href,
        },
      };
      const script = document.createElement("script");
      script.id = "structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.append(script);
    }
  }, [title, description, noindex, image, article, authors, location.pathname]);
  return null;
}
export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    if (!location.hash) window.scrollTo(0, 0);
    document.getElementById("main")?.focus();
  }, [location.pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {!configured && (
        <div className="preview-note">
          Design preview · Sample manuscripts await veterinary review.
          Publishing and sign-in require Firebase setup.
        </div>
      )}
      <div className="topline">
        <span>VETERINARY MEDICINE · ANIMAL HEALTH · PET EDUCATION</span>
        <Link to="/about">Our editorial promise</Link>
      </div>
      <header className="header">
        <div className="masthead">
          <Link className="wordmark" to="/">
            ThatVetGuy<span className="brand-dot">.</span>
          </Link>
          <div className="masthead-note">
            Animal health.
            <br />
            Everyday care.
          </div>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              nav(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="sr-only" htmlFor="header-search">
              Search the publication
            </label>
            <input
              id="header-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pet health & care"
            />
            <button aria-label="Search">
              <Search size={19} />
            </button>
          </form>
          <Link className="text-link desktop" to="/contributors">
            Meet the veterinarians
          </Link>
          <button
            className="icon-button mobile"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            aria-controls="navigation"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <nav id="navigation" className={open ? "nav open" : "nav"}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/articles">All articles</NavLink>
          <NavLink to="/tag/dogs">Dogs</NavLink>
          <NavLink to="/tag/cats">Cats</NavLink>
          <NavLink to="/category/animal-nutrition">Nutrition</NavLink>
          <NavLink to="/category/preventive-care">Prevention</NavLink>
          <NavLink to="/categories">More animal care</NavLink>
          <NavLink
            to="/category/emergency-critical-care"
            className="emergency-nav"
          >
            Urgent care
          </NavLink>
          <NavLink to="/search" className="mobile">
            Search
          </NavLink>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer>
        <div className="footer-grid">
          <div>
            <Link className="wordmark" to="/">
              ThatVetGuy.
            </Link>
            <p>
              For healthier pets.
              <br />
              And happier lives together.
            </p>
            <p className="muted">
              Practical animal-care education from six veterinarians.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/category/${c.id}`}>
                {c.name}
              </Link>
            ))}
          </div>
          <div>
            <h3>The collaborative</h3>
            <Link to="/contributors">Our veterinarians</Link>
            <Link to="/about">Editorial standards</Link>
            <Link to="/contact">Contact & corrections</Link>
            <Link to="/privacy">Privacy</Link>
            <a href="https://unsplash.com/">Animal photography via Unsplash</a>
            <a href="https://www.thatvetguy.net/">The ThatVetGuy Collective</a>
          </div>
          <div>
            <ShieldCheck size={24} />
            <h3>Care starts with a conversation.</h3>
            <p>{disclaimer}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ThatVetGuy Veterinary Collaborative
          </span>
          <span>Evidence. Empathy. Animal health.</span>
        </div>
      </footer>
    </>
  );
}
export function Disclaimer() {
  return (
    <aside className="disclaimer">
      <ShieldCheck size={22} />
      <p>{disclaimer}</p>
    </aside>
  );
}
export function Empty({
  title = "The next chapter is being reviewed.",
  text = "Our veterinary team is preparing this section. Explore the editorial standards or check back for new publications.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button secondary" to="/about">
        Read our editorial standards
      </Link>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Loading the blog…
    </div>
  );
}
