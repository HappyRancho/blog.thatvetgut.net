import React from 'react';
import { Bookmark, Clock, ShieldCheck } from 'lucide-react';
import { Article } from '../../types';
import { getAuthorById } from '../../data/authors';
import { getCategoryBySlug } from '../../data/categories';
import { useNavigation } from '../../context/NavigationContext';
import { useBookmarks } from '../../context/BookmarksContext';

interface ArticleCardProps {
  article: Article;
  layout?: 'grid' | 'horizontal' | 'compact';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, layout = 'grid' }) => {
  const { navigateTo } = useNavigation();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const author = getAuthorById(article.authorId);
  const category = getCategoryBySlug(article.category);
  const bookmarked = isBookmarked(article.id);

  const formattedDate = new Date(article.publishedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (layout === 'horizontal') {
    return (
      <article
        id={`article-card-${article.slug}`}
        className="group bg-white rounded-2xl border border-stone-200 hover:border-emerald-700/40 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row"
      >
        <div
          onClick={() => navigateTo({ name: 'article', slug: article.slug })}
          className="cursor-pointer sm:w-2/5 relative overflow-hidden bg-stone-100 min-h-[200px]"
        >
          <img
            src={article.featuredImage}
            alt={article.imageAlt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
          {article.isDemo && (
            <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Demo Content
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 sm:w-3/5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo({ name: 'category', slug: article.category });
                }}
                className="text-xs font-semibold text-emerald-800 uppercase tracking-wider hover:underline"
              >
                {category?.name || article.category}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(article.id);
                }}
                className="p-1.5 text-stone-400 hover:text-emerald-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={bookmarked ? 'Remove bookmark' : 'Save article'}
              >
                <Bookmark
                  className={`w-4 h-4 ${bookmarked ? 'fill-emerald-800 text-emerald-800' : ''}`}
                />
              </button>
            </div>

            <h3
              onClick={() => navigateTo({ name: 'article', slug: article.slug })}
              className="font-serif font-bold text-lg sm:text-xl text-stone-900 group-hover:text-emerald-950 transition-colors cursor-pointer leading-snug line-clamp-2"
            >
              {article.title}
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-2 leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div
              onClick={() => author && navigateTo({ name: 'author', slug: author.slug })}
              className="flex items-center gap-2.5 cursor-pointer group/author"
            >
              {author?.avatarUrl && (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  className="w-7 h-7 rounded-full object-cover border border-stone-200"
                />
              )}
              <div>
                <span className="font-semibold text-stone-800 group-hover/author:text-emerald-900 block leading-tight">
                  {author?.name || 'ThatVetGuy Author'}
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  {author?.designation || 'Co-Founder, ThatVetGuy'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-stone-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readingTimeMinutes} min
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Grid Card
  return (
    <article
      id={`article-card-${article.slug}`}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-emerald-700/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div>
        {/* Thumbnail */}
        <div
          onClick={() => navigateTo({ name: 'article', slug: article.slug })}
          className="cursor-pointer relative aspect-16/10 overflow-hidden bg-stone-100"
        >
          <img
            src={article.featuredImage}
            alt={article.imageAlt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
          {article.isDemo && (
            <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Demo Content
            </span>
          )}
          {article.reviewerId && (
            <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-emerald-900 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Peer Reviewed
            </span>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateTo({ name: 'category', slug: article.category });
              }}
              className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider hover:underline"
            >
              {category?.name || article.category}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(article.id);
              }}
              className="p-1 text-stone-400 hover:text-emerald-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={bookmarked ? 'Remove bookmark' : 'Save article'}
            >
              <Bookmark
                className={`w-4 h-4 ${bookmarked ? 'fill-emerald-800 text-emerald-800' : ''}`}
              />
            </button>
          </div>

          <h3
            onClick={() => navigateTo({ name: 'article', slug: article.slug })}
            className="font-serif font-bold text-base sm:text-lg text-stone-900 group-hover:text-emerald-950 transition-colors cursor-pointer leading-snug line-clamp-2"
          >
            {article.title}
          </h3>

          <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Author and meta footer */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div
            onClick={() => author && navigateTo({ name: 'author', slug: author.slug })}
            className="flex items-center gap-2 cursor-pointer group/author"
          >
            {author?.avatarUrl && (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-6 h-6 rounded-full object-cover border border-stone-200"
              />
            )}
            <div>
              <span className="font-semibold text-stone-800 group-hover/author:text-emerald-900 block leading-tight text-[11px]">
                {author?.name || 'ThatVetGuy Team'}
              </span>
              <span className="text-[10px] text-emerald-800 font-medium">
                Co-Founder
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-stone-400">
            <span>{formattedDate}</span>
            <span className="mx-1">•</span>
            <span>{article.readingTimeMinutes}m</span>
          </div>
        </div>
      </div>
    </article>
  );
};
