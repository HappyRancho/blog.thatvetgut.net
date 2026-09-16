import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Share2,
  ShieldCheck,
  Tag as TagIcon,
  Type,
  Loader2,
} from 'lucide-react';
import { getArticleBySlug } from '../data/articles';
import { getAuthorById } from '../data/authors';
import { getCategoryBySlug } from '../data/categories';
import { getArticleBySlugFromFirestore } from '../services/articleService';
import { Article } from '../types';
import { ArticleContent } from '../components/article/ArticleContent';
import { ReferenceList } from '../components/article/ReferenceList';
import { AuthorBox } from '../components/article/AuthorBox';
import { RelatedArticles } from '../components/article/RelatedArticles';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { ShareModal } from '../components/common/ShareModal';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';
import { useBookmarks } from '../context/BookmarksContext';
import { useAuth } from '../context/AuthContext';

interface ArticleDetailPageProps {
  slug: string;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ slug }) => {
  const { navigateTo } = useNavigation();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { currentAuthor } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [fontScale, setFontScale] = useState<'normal' | 'large'>('normal');

  const [article, setArticle] = useState<Article | undefined>(() => getArticleBySlug(slug));
  const [loading, setLoading] = useState<boolean>(!article);

  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      try {
        const found = await getArticleBySlugFromFirestore(slug);
        if (isMounted && found) {
          setArticle(found);
        }
      } catch (err) {
        console.warn('Could not fetch article from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-sm text-stone-500 font-medium">Loading clinical publication...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-stone-900">Article Not Found</h2>
        <p className="text-xs text-stone-500">
          The requested veterinary publication could not be located.
        </p>
        <button
          onClick={() => navigateTo({ name: 'articles' })}
          className="px-5 py-2.5 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors min-h-[44px]"
        >
          Return to Articles Archive
        </button>
      </div>
    );
  }

  // Draft Privacy Enforcement: Drafts must remain private to authenticated CMS editors
  const isDraftOrUnpublished = article.status && article.status !== 'PUBLISHED';
  if (isDraftOrUnpublished && !currentAuthor) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
          🔒
        </div>
        <h2 className="font-serif font-bold text-2xl text-stone-900">Publication Is Private</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          This veterinary article is currently an unpublished draft or under clinical peer review.
          Drafts are private to authorized ThatVetGuy editors and do not appear publicly.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => navigateTo({ name: 'articles' })}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors min-h-[44px]"
          >
            Return to Articles Archive
          </button>
          <button
            onClick={() => navigateTo({ name: 'admin' })}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl hover:bg-stone-200 transition-colors min-h-[44px]"
          >
            Staff Login
          </button>
        </div>
      </div>
    );
  }

  const staticAuthor = getAuthorById(article.authorId);
  const author = staticAuthor || (article.authorProfile ? {
    id: article.authorId,
    slug: article.authorId,
    name: article.authorProfile.name,
    designation: article.authorProfile.designation || 'Contributor, ThatVetGuy',
    qualifications: article.authorProfile.qualifications || 'DVM',
    professionalRole: article.authorProfile.professionalRole || 'Veterinary Clinician',
    bio: article.authorProfile.bio || 'Veterinary author and clinician contributing to ThatVetGuy animal health education.',
    avatarUrl: article.authorProfile.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    isCoFounder: false,
  } : undefined);

  const reviewer = article.reviewerId ? getAuthorById(article.reviewerId) : undefined;
  const category = getCategoryBySlug(article.category);
  const bookmarked = isBookmarked(article.id);

  const formattedPubDate = new Date(article.publishedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedUpDate = new Date(article.updatedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://blog.thatvetguy.net/article/${article.slug}`;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <SEOHead
        title={article.title}
        description={article.excerpt || article.subtitle}
        article={article}
        authorName={author?.name}
      />

      {/* Staff Draft Preview Banner */}
      {isDraftOrUnpublished && currentAuthor && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold uppercase tracking-wider text-[10px]">
              {article.status || 'DRAFT'}
            </span>
            <span>
              <strong>Staff View:</strong> This publication is an unpublished draft. It is strictly private to ThatVetGuy editors and not visible to public visitors.
            </span>
          </div>
          <button
            onClick={() => navigateTo({ name: 'admin', section: 'all-articles', articleId: article.id })}
            className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Edit in CMS
          </button>
        </div>
      )}

      {/* Breadcrumbs & Back Button */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <button
          onClick={() => navigateTo({ name: 'articles' })}
          className="inline-flex items-center gap-1.5 text-stone-600 hover:text-emerald-900 font-medium transition-colors py-1 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {article.isDemo && (
            <span className="bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Demo Content
            </span>
          )}
          <button
            onClick={() => navigateTo({ name: 'category', slug: article.category })}
            className="text-emerald-900 font-semibold uppercase tracking-wider hover:underline"
          >
            {category?.name || article.category}
          </button>
        </div>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-stone-900 leading-tight tracking-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-base sm:text-xl text-stone-600 leading-relaxed font-normal">
            {article.subtitle}
          </p>
        )}

        {article.excerpt && article.excerpt !== article.subtitle && (
          <div className="p-4 bg-stone-50 border-l-4 border-emerald-900 rounded-r-xl text-sm text-stone-700 italic">
            <span className="font-semibold not-italic text-stone-900 mr-2">Key Takeaways:</span>
            {article.excerpt}
          </div>
        )}

        {/* Metadata & Author Bar */}
        <div className="pt-4 border-y border-stone-200 flex flex-wrap items-center justify-between gap-4">
          {/* Author Card */}
          <div
            onClick={() => author && navigateTo({ name: 'author', slug: author.slug })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {author?.avatarUrl && (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover border border-emerald-900/30 shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors text-sm">
                  {author?.name || 'ThatVetGuy Team'}
                </span>
              </div>
              <span className="text-xs text-emerald-900 font-medium block">
                {author?.designation || 'Co-Founder, ThatVetGuy'}
              </span>
              <span className="text-[11px] text-stone-500 block">
                {author?.qualifications}
              </span>
            </div>
          </div>

          {/* Dates & Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Published {formattedPubDate}</span>
              {article.updatedDate !== article.publishedDate && (
                <span className="text-stone-400 hidden sm:inline">(Updated {formattedUpDate})</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{article.readingTimeMinutes} min read</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Share Button */}
              <button
                id="article-share-btn"
                onClick={() => setShareOpen(true)}
                className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Share article"
                title="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Bookmark Button */}
              <button
                id="article-bookmark-btn"
                onClick={() => toggleBookmark(article.id)}
                className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
                title={bookmarked ? 'Remove bookmark' : 'Save article'}
              >
                <Bookmark
                  className={`w-4 h-4 ${bookmarked ? 'fill-emerald-800 text-emerald-800' : ''}`}
                />
              </button>

              {/* Font Size Toggle for Reading Comfort */}
              <button
                onClick={() => setFontScale(fontScale === 'normal' ? 'large' : 'normal')}
                className="p-2 text-stone-600 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-semibold"
                aria-label="Toggle font size"
                title="Adjust reading text size"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Peer Review Callout */}
        {reviewer && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              <strong>Clinical Peer Review:</strong> Medically reviewed by{' '}
              <button
                onClick={() => navigateTo({ name: 'author', slug: reviewer.slug })}
                className="font-semibold underline hover:text-emerald-800"
              >
                {reviewer.name}
              </button>{' '}
              ({reviewer.designation}) for scientific accuracy and clinical integrity.
            </span>
          </div>
        )}
      </header>

      {/* Featured Image */}
      <figure className="space-y-2">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs max-h-[500px]">
          <img
            src={article.featuredImage}
            alt={article.imageAlt}
            className="w-full h-auto object-cover"
          />
        </div>
        {article.imageCaption && (
          <figcaption className="text-xs text-stone-500 italic text-center px-4">
            {article.imageCaption}
          </figcaption>
        )}
      </figure>

      {/* Main Article Body with responsive text sizing */}
      <div className={fontScale === 'large' ? 'text-lg' : ''}>
        <ArticleContent blocks={article.contentBlocks} contentHtml={article.content} />
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <TagIcon className="w-3.5 h-3.5" />
            Tags:
          </span>
          {article.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => navigateTo({ name: 'articles', tag })}
              className="text-xs bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 px-3 py-1 rounded-full font-medium transition-colors min-h-[36px]"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Clinical Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* Scientific References */}
      <ReferenceList references={article.references} />

      {/* Equal Co-Founder Author Profile */}
      {author && (
        <AuthorBox
          author={author}
          reviewer={reviewer}
          reviewedDate={article.reviewedDate}
        />
      )}

      {/* Related Clinical Articles */}
      <RelatedArticles
        currentArticleId={article.id}
        category={article.category}
        tags={article.tags}
      />

      {/* Share Modal Dialog */}
      <ShareModal
        url={shareUrl}
        title={article.title}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Mobile Sticky Reading Action Bar (Optimized for Android 360-430px) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 truncate max-w-[60%]">
          <span className="font-semibold truncate">{article.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toggleBookmark(article.id)}
            className="p-2 text-stone-700 hover:text-emerald-900 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Save"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-emerald-800 text-emerald-800' : ''}`} />
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="p-2 text-stone-700 hover:text-emerald-900 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-3 py-1.5 bg-emerald-900 text-white rounded-lg text-xs font-semibold min-h-[40px] flex items-center"
          >
            Top &uarr;
          </button>
        </div>
      </div>
    </div>
  );
};
