import { MediaImage } from "../components/MediaImage";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categories } from "../data/editorial";
import { useCatalog } from "../lib/contexts";
import { SEO, Disclaimer, Empty } from "../components/Layout";
import { ArticleCard } from "../components/ArticleCard";
import { contact } from "../lib/repository";
import { configured } from "../lib/firebase";
import { safeUrl } from "../lib/domain";
export function Categories() {
  return (
    <div className="container section">
      <SEO
        title="Eight perspectives on animal health"
        description="Browse eight veterinary specialties, from preventive care to herd health."
      />
      <span className="eyebrow">Explore the blog</span>
      <h1>Every kind of care.</h1>
      <p className="intro-text">
        A connected view of animal health, organised around what you want to
        understand.
      </p>
      <div className="specialty-grid">
        {categories.map((c, i) => (
          <Link key={c.id} to={`/category/${c.id}`}>
            <span className="category-index">0{i + 1}</span>
            <h2>{c.name}</h2>
            <p>{c.description}</p>
            <span className="text-link">Explore this specialty</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
export function Contributors() {
  const { authors } = useCatalog();
  return (
    <div className="container section">
      <SEO
        title="The veterinary collaborative"
        description="Meet the six founding veterinarians behind ThatVetGuy."
      />
      <span className="eyebrow">Six perspectives. One shared purpose.</span>
      <h1>Meet the collaborative.</h1>
      <p className="intro-text">
        Clinical experience is diverse. Our commitment to clear, responsible
        animal health education is shared.
      </p>
      <div className="people-grid">
        {authors.map((a) => (
          <article key={a.id}>
            <div className="portrait">
              {a.image && safeUrl(a.image, true) ? (
                <MediaImage
                  src={safeUrl(a.image, true)}
                  alt={a.name}
                  loading="lazy"
                  width={400}
                  height={400}
                />
              ) : (
                <span>
                  {a.name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
            </div>
            <span className="eyebrow">{a.qualifications}</span>
            <h2>
              <Link to={`/author/${a.id}`}>{a.name}</Link>
            </h2>
            <strong>{a.role}</strong>
            <p>{a.bio}</p>
          </article>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
export function AuthorPage() {
  const { slug } = useParams();
  const { authors, items } = useCatalog();
  const a = authors.find((p) => p.id === slug);
  if (!a)
    return (
      <>
        <SEO
          title="Contributor not found"
          description="This contributor does not exist."
          noindex
        />
        <Empty title="Contributor not found" />
      </>
    );
  return (
    <div className="container section">
      <SEO title={a.name} description={a.bio} />
      <span className="eyebrow">Co-founder · {a.qualifications}</span>
      <h1>{a.name}</h1>
      <p className="standfirst">{a.role}</p>
      <div className="profile-detail">
        {a.image && (
          <MediaImage
            className="profile-photo"
            width={220}
            height={220}
            src={safeUrl(a.image, true)}
            alt={a.name}
          />
        )}
        <p>{a.bio}</p>
        <p>{a.affiliation}</p>
        <div className="article-tags">
          {a.expertise.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        {a.linkedin && safeUrl(a.linkedin) && (
          <a
            href={safeUrl(a.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn profile
          </a>
        )}
      </div>
      {a.portfolio && safeUrl(a.portfolio) && (
        <a className="text-link" href={safeUrl(a.portfolio)}>
          Professional portfolio on ThatVetGuy
        </a>
      )}
      <h2 className="section-title">From this contributor</h2>
      {!items.some((p) => p.article.authorId === a.id) && (
        <p className="muted">
          No articles by this contributor are currently published. Explore their
          professional portfolio above.
        </p>
      )}
      <div className="article-grid">
        {items
          .filter((p) => p.article.authorId === a.id)
          .map((p) => (
            <ArticleCard key={p.article.id} item={p} />
          ))}
      </div>
    </div>
  );
}
export function About() {
  return (
    <div className="container section narrow">
      <SEO
        title="Our editorial promise"
        description="How ThatVetGuy approaches evidence, clinical review, corrections and responsible veterinary education."
      />
      <span className="eyebrow">About the collaborative</span>
      <h1>Good information is part of good care.</h1>
      <p className="standfirst">
        We bring veterinary knowledge closer to the people who care for animals.
      </p>
      <div className="prose">
        <p>
          ThatVetGuy is a collaborative publication founded by six veterinary
          professionals. Our fields span companion animal medicine, surgery,
          pathology, wildlife and large animal practice. We share a goal: making
          clinical knowledge clear without losing the context that makes it
          useful.
        </p>
        <h2>Evidence before certainty</h2>
        <p>
          Articles distinguish established guidance from emerging evidence and
          clinical judgement. Sources should be accessible, relevant and
          accurately represented. Where recommendations depend on location,
          species, life stage or an examination, we say so.
        </p>
        <h2>How a manuscript becomes a publication</h2>
        <ol>
          <li>A founder drafts an article and records its sources.</li>
          <li>
            A different founder reviews the evidence, clinical wording and
            safety implications.
          </li>
          <li>Requested changes return the manuscript for revision.</li>
          <li>
            Only an approved revision can be published. Editing that revision
            withdraws it for a new review.
          </li>
        </ol>
        <p>
          A clinical review badge is shown only after the review has been
          recorded. Starter manuscripts and imported articles do not arrive
          pre-approved.
        </p>
        <h2>Corrections and accountability</h2>
        <p>
          Readers can request a correction through our contact form. Material
          updates require renewed review. The editorial team records revisions
          and can withdraw an article while a concern is investigated.
        </p>
        <h2>What this publication cannot do</h2>
        <p>
          We cannot examine an animal, establish a diagnosis or prescribe
          individual treatment through an article or contact form. We avoid
          unsupported remedies and context-free dosage instructions. Urgent
          symptoms require direct veterinary help.
        </p>
        <h2>Independence and disclosure</h2>
        <p>
          Contributors must disclose relevant affiliations, commercial
          relationships and source material. Reusing external work requires
          permission or an appropriate licence. Importing a LinkedIn article is
          an editorial aid, not evidence of ownership or clinical accuracy.
        </p>
      </div>
      <Disclaimer />
      <Link className="button" to="/contributors">
        Meet the founders
      </Link>
    </div>
  );
}
export function Contact() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="container section narrow">
      <SEO
        title="Contact and corrections"
        description="Contact ThatVetGuy about editorial matters, clinical corrections and professional collaboration."
      />
      <span className="eyebrow">Keep the conversation thoughtful</span>
      <h1>Contact the editorial team.</h1>
      <p className="intro-text">
        For corrections, professional collaboration and publication enquiries.
        Include the article URL when requesting a correction.
      </p>
      <div className="alert">
        This form is not monitored for emergencies. For an unwell animal,
        contact a veterinary clinic directly.
      </div>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const d = new FormData(form);
          if (d.get("website")) return;
          setBusy(true);
          try {
            await contact(
              String(d.get("name")),
              String(d.get("email")),
              String(d.get("message")),
            );
            form.reset();
            setMessage("Your enquiry has been saved for the editorial team.");
          } catch (err) {
            setMessage(
              err instanceof Error
                ? err.message
                : "Unable to send. Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Your name
          <input name="name" required maxLength={100} />
        </label>
        <label>
          Email
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          Message
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={7}
          />
        </label>
        <label className="trap" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="check-label">
          <input type="checkbox" required />I agree to the{" "}
          <Link to="/privacy">privacy policy</Link> and understand this is not a
          clinical consultation.
        </label>
        <button disabled={busy || !configured}>
          {busy ? "Sending…" : "Send enquiry"}
        </button>
        {!configured && <p>Enquiries open when the publication launches.</p>}
        <p role="status">{message}</p>
      </form>
    </div>
  );
}
export function Privacy() {
  return (
    <div className="container section narrow">
      <SEO
        title="Privacy"
        description="How ThatVetGuy uses account, contact and device data."
      />
      <h1>Privacy, in plain language.</h1>
      <div className="prose">
        <h2>Reading the blog</h2>
        <p>
          Bookmarks stay in your browser on this device. We do not use
          advertising trackers in this implementation. Images hosted by third
          parties may disclose your network address to those providers.
        </p>
        <h2>Forms and accounts</h2>
        <p>
          Contact submissions and newsletter registrations are stored in
          Firebase for the editorial team. Google sign-in is used for approved
          editorial accounts. Public profiles contain professional information
          only; editorial access records are private.
        </p>
        <h2>Newsletter interest</h2>
        <p>
          Registration records your email and consent. Newsletter delivery is
          not yet active. You can request removal through the contact form.
        </p>
        <h2>LinkedIn imports</h2>
        <p>
          An authenticated importer requests publicly accessible LinkedIn
          article pages through our Cloudflare service. It sends no LinkedIn
          login credentials. Do not submit private links or material you do not
          have permission to reproduce.
        </p>
        <h2>Your requests</h2>
        <p>
          Use the contact form to request access, correction or deletion of
          information you submitted. Avoid sending sensitive personal or patient
          details. The editorial team should retain enquiries only for as long
          as they are needed.
        </p>
      </div>
    </div>
  );
}
