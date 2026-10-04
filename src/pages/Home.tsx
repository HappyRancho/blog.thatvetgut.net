import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Heart,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useCatalog } from "../lib/contexts";
import { configured } from "../lib/firebase";
import { readingTime } from "../lib/domain";
import { categories } from "../data/editorial";
import { petPhoto, photos, type PhotoKey } from "../data/photography";
import { SEO, Disclaimer, Empty, Loading } from "../components/Layout";
import { ArticleCard } from "../components/ArticleCard";
import { MediaImage } from "../components/MediaImage";
const paths: {
  title: string;
  description: string;
  image: PhotoKey;
  to: string;
}[] = [
  {
    title: "Dogs",
    description: "From puppy days to grey muzzles",
    image: "dog",
    to: "/tag/dogs",
  },
  {
    title: "Cats",
    description: "Understand your curious companion",
    image: "cat",
    to: "/tag/cats",
  },
  {
    title: "New pet parents",
    description: "A little help with the first steps",
    image: "puppy",
    to: "/category/preventive-care",
  },
  {
    title: "Food & nutrition",
    description: "Make sense of what goes in the bowl",
    image: "kitten",
    to: "/category/animal-nutrition",
  },
  {
    title: "Farm & large animals",
    description: "Practical care beyond the home",
    image: "horse",
    to: "/category/livestock-large-animals",
  },
];
export default function Home() {
  const { items, authors, loading, error, reload } = useCatalog();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const featured = items[0];
  const prevention = items
    .filter((p) =>
      ["preventive-care", "animal-nutrition", "animal-welfare"].includes(
        p.article.category,
      ),
    )
    .slice(0, 3);
  return (
    <>
      <SEO
        title="Pet health, happier everyday lives"
        description="Practical pet-health guides, nutrition advice and animal-care education from the ThatVetGuy veterinary collective."
        image={petPhoto("dog", 1200)}
      />
      <section className="pet-hero container">
        <div className="pet-hero-copy">
          <span className="eyebrow">
            FOR THE ANIMALS WHO MAKE OUR LIVES WHOLE
          </span>
          <h1>
            Big love.
            <br />
            Better care.
            <br />
            <span>Healthier pets.</span>
          </h1>
          <p>
            Understand the little things. Know when to get help. Make everyday
            care feel a little less complicated.
          </p>
          <form
            className="pet-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            <label className="sr-only" htmlFor="pet-search">
              Search pet health and animal care
            </label>
            <Search size={21} aria-hidden="true" />
            <input
              id="pet-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What can we help your pet with?"
            />
            <button aria-label="Find articles">
              <ArrowRight size={21} />
            </button>
          </form>
          <div className="hero-popular">
            <span>Start here:</span>
            <Link to="/tag/dogs">Dog care</Link>
            <Link to="/tag/cats">Cat care</Link>
            <Link to="/category/preventive-care">Prevention</Link>
          </div>
        </div>
        <div className="pet-hero-image">
          <img
            src={petPhoto("dog", 1200)}
            srcSet={`${petPhoto("dog", 640)} 640w, ${petPhoto("dog", 1200)} 1200w`}
            sizes="(max-width: 760px) 100vw, 50vw"
            alt={photos.dog.alt}
            width="1200"
            height="1100"
            {...{ fetchpriority: "high" }}
          />
          <div className="photo-note">
            <Heart size={23} />
            <div>
              <strong>Everyday questions. Thoughtful answers.</strong>
              <span>Pet health · Nutrition · Life together</span>
            </div>
          </div>
        </div>
      </section>
      <div className="care-values container">
        <span>
          <Stethoscope size={20} /> A veterinary perspective
        </span>
        <span>
          <Heart size={20} /> Practical help for everyday care
        </span>
        <Link to="/about">
          <ShieldCheck size={20} /> Read our editorial standards{" "}
          <ArrowRight size={16} />
        </Link>
      </div>
      <section className="container pet-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">WHO ARE YOU CARING FOR?</span>
            <h2>A good place to start.</h2>
          </div>
          <Link className="text-link" to="/categories">
            All topics <ArrowRight size={17} />
          </Link>
        </div>
        <div className="pet-paths">
          {paths.map((p) => (
            <Link to={p.to} key={p.title}>
              <img
                src={petPhoto(p.image, 480)}
                alt=""
                width="480"
                height="360"
                loading="lazy"
              />
              <div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <ArrowRight size={19} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="container pet-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</span>
            <h2>
              {configured ? "Fresh from the blog." : "Your next useful read."}
            </h2>
          </div>
          <Link className="text-link" to="/articles">
            Browse all articles <ArrowRight size={17} />
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="content-recovery" role="alert">
            <h3>We couldn’t load the articles.</h3>
            <p>
              Please try again. You can still explore the animal-care topics and
              meet our veterinarians.
            </p>
            <button onClick={() => void reload()}>Try again</button>
          </div>
        ) : items.length ? (
          <div className="article-grid">
            {items.slice(0, 6).map((p) => (
              <ArticleCard key={p.article.id} item={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="New guides are on their way."
            text="Our team is preparing practical articles. In the meantime, explore our topics and meet the veterinarians behind ThatVetGuy."
          />
        )}
      </section>
      <section className="everyday-band">
        <div className="container everyday-layout">
          <div className="everyday-photo">
            <img
              src={petPhoto("cat", 900)}
              alt={photos.cat.alt}
              width="900"
              height="900"
              loading="lazy"
            />
          </div>
          <div className="everyday-copy">
            <span className="eyebrow">THE EVERYDAY CARE EDIT</span>
            <h2>
              Small habits.
              <br />A healthier life together.
            </h2>
            <p>
              Food, prevention, comfort and connection. Start with the choices
              you make every day.
            </p>
            {prevention.length ? (
              <div className="everyday-reads">
                {prevention.map((p) => (
                  <Link key={p.article.id} to={`/article/${p.article.id}`}>
                    <div>
                      <h3>{p.article.title}</h3>
                      <span>{readingTime(p.article.content)} min read</span>
                    </div>
                    <ArrowRight size={20} />
                  </Link>
                ))}
              </div>
            ) : (
              <Link className="button" to="/category/preventive-care">
                Explore preventive care <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>
      <section className="container pet-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">LOOK A LITTLE DEEPER</span>
            <h2>More ways to care.</h2>
          </div>
        </div>
        <div className="pet-topic-grid">
          {categories
            .filter(
              (c) =>
                !["pet-health", "animal-nutrition", "preventive-care"].includes(
                  c.id,
                ),
            )
            .map((c) => (
              <Link key={c.id} to={`/category/${c.id}`}>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <ArrowRight size={20} />
              </Link>
            ))}
        </div>
      </section>
      <section className="container urgent-note">
        <div>
          <span className="eyebrow">WHEN IT CAN’T WAIT</span>
          <h2>Reading can wait. Urgent care can’t.</h2>
          <p>
            Breathing difficulty, collapse, suspected poisoning or repeated
            retching without bringing anything up needs urgent veterinary
            attention. Contact a clinic now.
          </p>
        </div>
        <Link to="/category/emergency-critical-care" className="text-link">
          Emergency guides <ArrowRight size={18} />
        </Link>
      </section>
      <section className="container pet-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">MEET THE PEOPLE BEHIND THATVETGUY</span>
            <h2>
              Six veterinarians.
              <br />A shared love for animal health.
            </h2>
          </div>
          <Link className="text-link" to="/contributors">
            Meet the team <ArrowRight size={17} />
          </Link>
        </div>
        <div className="pet-team">
          {authors.map((a) => (
            <Link key={a.id} to={`/author/${a.id}`}>
              <MediaImage
                src={a.image}
                alt={a.name}
                width={160}
                height={160}
                loading="lazy"
              />
              <h3>{a.name}</h3>
              <span>{a.qualifications}</span>
              <p>{a.role.replace(/^Co-Founder,?\s*/, "")}</p>
            </Link>
          ))}
        </div>
      </section>
      {featured && (
        <section className="container explore-banner">
          <div>
            <h2>Find an answer worth reading.</h2>
            <p>
              Browse practical guides for every stage of your animal’s life.
            </p>
          </div>
          <Link className="button" to="/articles">
            Explore the blog <ArrowRight size={18} />
          </Link>
        </section>
      )}
      <div className="container">
        <Disclaimer />
      </div>
    </>
  );
}
