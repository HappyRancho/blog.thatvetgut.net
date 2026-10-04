import { MediaImage } from "./MediaImage";
import { Link } from "react-router-dom";
import { Clock, BookOpen } from "lucide-react";
import type { Publication } from "../lib/domain";
import { readingTime, safeUrl } from "../lib/domain";
import { configured } from "../lib/firebase";
import { categoryName } from "../data/editorial";
import { useCatalog } from "../lib/contexts";
export function ArticleCard({
  item,
  compact = false,
}: {
  item: Publication;
  compact?: boolean;
}) {
  const a = item.article;
  const { authors } = useCatalog();
  const author = authors.find((x) => x.id === a.authorId);
  return (
    <article className={compact ? "article-card compact" : "article-card"}>
      {a.image && safeUrl(a.image, true) && (
        <Link
          tabIndex={-1}
          aria-hidden="true"
          className="card-image"
          to={`/article/${a.id}`}
        >
          <MediaImage
            loading="lazy"
            src={safeUrl(a.image, true)}
            alt=""
            width={640}
            height={400}
          />
        </Link>
      )}
      <div className="card-body">
        <span className="eyebrow">{categoryName(a.category)}</span>
        <h3>
          <Link to={`/article/${a.id}`}>{a.title}</Link>
        </h3>
        {!compact && <p>{a.subtitle}</p>}
        <div className="card-meta">
          <span>
            {author ? `${!configured ? "Proposed: " : ""}${author.name}` : ""}
          </span>
          <span>
            <Clock size={13} />
            {readingTime(a.content)} min read
          </span>
        </div>
      </div>
    </article>
  );
}
