import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "../lib/contexts";
import { configured } from "../lib/firebase";
import { readingTime, safeUrl } from "../lib/domain";
import { categories, categoryName } from "../data/editorial";
import { SEO, Disclaimer, Empty, Loading } from "../components/Layout";
import { ArticleCard } from "../components/ArticleCard";
import { MediaImage } from "../components/MediaImage";
export default function Home() {
  const { items, authors, loading, error, reload } = useCatalog();
  const lead = items[0]?.article;
  const featuredAuthor = authors.find((a) => a.id === lead?.authorId);
  return (
    <>
      <SEO
        title="Animal care, with context"
        description="Practical veterinary reading for people who care for animals. Explore pet health, prevention, nutrition, welfare and clinical perspectives."
      />
      <section className="publication-intro container">
        <div>
          <span className="eyebrow">The ThatVetGuy journal</span>
          <h1>
            Animal care,
            <br />
            <em>with context.</em>
          </h1>
        </div>
        <div className="intro-aside">
          <p>
            Good questions deserve clear answers.
            <br />
            Veterinary knowledge for the decisions
            <br className="desktop" /> you make every day.
          </p>
          <Link className="text-link" to="/articles">
            Find your next read <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="container error" role="alert">
          {error}
          <button onClick={() => void reload()}>Try again</button>
        </div>
      ) : lead ? (
        <section
          className={`editorial-feature container ${lead.image ? "has-image" : ""}`}
        >
          {lead.image && safeUrl(lead.image, true) && (
            <Link
              to={`/article/${lead.id}`}
              className="feature-photo"
              aria-label={lead.title}
            >
              <MediaImage
                src={safeUrl(lead.image, true)}
                alt={lead.imageAlt}
                width={960}
                height={720}
                fetchPriority="high"
              />
            </Link>
          )}
          <div className="feature-copy">
            <span className="eyebrow">
              Featured reading · {categoryName(lead.category)}
            </span>
            <h2>
              <Link to={`/article/${lead.id}`}>{lead.title}</Link>
            </h2>
            <p>{lead.subtitle}</p>
            <div className="feature-byline">
              {featuredAuthor && (
                <>
                  <MediaImage
                    src={featuredAuthor.image}
                    alt=""
                    width={40}
                    height={40}
                  />
                  <span>
                    {!configured ? "Proposed contributor: " : ""}
                    {featuredAuthor.name}
                  </span>
                </>
              )}
              <span>{readingTime(lead.content)} min read</span>
            </div>
            <Link className="button" to={`/article/${lead.id}`}>
              Read the story <ArrowUpRight size={17} />
            </Link>
          </div>
          <aside className="feature-reading">
            <span className="eyebrow">Also in the journal</span>
            {items.slice(1, 4).map((p, i) => (
              <Link key={p.article.id} to={`/article/${p.article.id}`}>
                <span className="reading-number">0{i + 1}</span>
                <div>
                  <small>{categoryName(p.article.category)}</small>
                  <h3>{p.article.title}</h3>
                  <span>{readingTime(p.article.content)} min read</span>
                </div>
              </Link>
            ))}
          </aside>
        </section>
      ) : (
        <div className="container">
          <Empty
            title="The journal is preparing its first publications."
            text="Our founders are developing practical guides and reviewing their sources. Meet the contributors or explore our editorial standards."
          />
        </div>
      )}
      <section className="topic-ledger container">
        <div>
          <span className="eyebrow">Start with what matters</span>
          <h2>Explore animal health.</h2>
        </div>
        <div className="topic-links">
          {categories.map((c, i) => (
            <Link key={c.id} to={`/category/${c.id}`}>
              <span>0{i + 1}</span>
              <strong>{c.name}</strong>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      {items.length > 1 && (
        <section className="section container">
          <div className="section-title">
            <div>
              <span className="eyebrow">
                {configured
                  ? "Recently published"
                  : "Manuscripts awaiting review"}
              </span>
              <h2>More to understand.</h2>
            </div>
            <Link className="text-link" to="/articles">
              All articles <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="article-grid">
            {items.slice(1, 4).map((p) => (
              <ArticleCard key={p.article.id} item={p} />
            ))}
          </div>
        </section>
      )}
      <section className="care-note container">
        <span className="eyebrow">When it cannot wait</span>
        <div>
          <h2>Urgent symptoms need direct care.</h2>
          <p>
            Difficulty breathing, collapse, suspected poisoning or repeated
            unproductive retching warrants urgent veterinary attention. Contact
            a clinic before reading further.
          </p>
        </div>
        <Link className="text-link" to="/category/emergency-critical-care">
          Emergency reading <ArrowUpRight size={16} />
        </Link>
      </section>
      <section className="section container contributors-ledger">
        <div>
          <span className="eyebrow">The people behind the reading</span>
          <h2>
            Six perspectives.
            <br />A shared duty of care.
          </h2>
          <p>
            Companion animals, wildlife, pathology and herd health. Meet the
            clinicians shaping the journal.
          </p>
          <Link className="text-link" to="/contributors">
            Our contributors <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="contributor-rows">
          {authors.map((a) => (
            <Link key={a.id} to={`/author/${a.id}`}>
              <MediaImage
                src={safeUrl(a.image, true)}
                alt=""
                width={64}
                height={64}
                loading="lazy"
              />
              <div>
                <strong>{a.name}</strong>
                <small>{a.role}</small>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <div className="container">
        <Disclaimer />
      </div>
    </>
  );
}
