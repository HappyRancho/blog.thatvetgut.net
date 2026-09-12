import React from 'react';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { Article } from '../../types';
import { getAuthorById } from '../../data/authors';
import { getCategoryBySlug } from '../../data/categories';
import { useNavigation } from '../../context/NavigationContext';

interface FeaturedHeroProps {
  article: Article;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ article }) => {
  const { navigateTo } = useNavigation();
  const author = getAuthorById(article.authorId);
  const category = getCategoryBySlug(article.category);

  return (
    <section id="featured-hero-section" className="py-6 sm:py-8">
      <div className="bg-stone-900 text-white rounded-3xl overflow-hidden border border-stone-800 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Text Content */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-emerald-800 text-emerald-100 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Lead Clinical Editorial
                </span>
                <span className="bg-stone-800 text-stone-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {category?.name || 'Veterinary Clinical'}
                </span>
                {article.isDemo && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Demo Content
                  </span>
                )}
              </div>

              <h1
                onClick={() => navigateTo({ name: 'article', slug: article.slug })}
                className="font-serif font-extrabold text-2xl sm:text-4xl lg:text-[40px] leading-tight text-white hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {article.title}
              </h1>

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-2xl font-normal">
                {article.subtitle || article.excerpt}
              </p>
            </div>

            <div className="pt-6 border-t border-stone-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Author Info */}
                <div
                  onClick={() => author && navigateTo({ name: 'author', slug: author.slug })}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  {author?.avatarUrl && (
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
                    />
                  )}
                  <div>
                    <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors block text-sm">
                      {author?.name || 'ThatVetGuy Team'}
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {author?.designation || 'Co-Founder, ThatVetGuy'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {article.readingTimeMinutes} min read
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Peer Reviewed
                  </span>
                </div>
              </div>

              <div>
                <button
                  id="featured-read-article-btn"
                  onClick={() => navigateTo({ name: 'article', slug: article.slug })}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md min-h-[44px]"
                >
                  <span>Read Clinical Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Image */}
          <div
            onClick={() => navigateTo({ name: 'article', slug: article.slug })}
            className="lg:col-span-5 relative cursor-pointer overflow-hidden min-h-[260px] lg:min-h-full bg-stone-950"
          >
            <img
              src={article.featuredImage}
              alt={article.imageAlt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
};
