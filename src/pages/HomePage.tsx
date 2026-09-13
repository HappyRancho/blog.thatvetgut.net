import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getFeaturedArticle, getLatestArticles, getPopularArticles } from '../data/articles';
import { getArticlesFromFirestore } from '../services/articleService';
import { Article } from '../types';
import { FeaturedHero } from '../components/homepage/FeaturedHero';
import { CategoryStrip } from '../components/homepage/CategoryStrip';
import { TeamShowcase } from '../components/homepage/TeamShowcase';
import { NewsletterBox } from '../components/homepage/NewsletterBox';
import { ArticleCard } from '../components/article/ArticleCard';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

export const HomePage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [featured, setFeatured] = useState<Article | undefined>(() => getFeaturedArticle());
  const [latest, setLatest] = useState<Article[]>(() => getLatestArticles(6));
  const [popular, setPopular] = useState<Article[]>(() => getPopularArticles().slice(0, 3));

  useEffect(() => {
    let isMounted = true;
    async function loadLiveArticles() {
      try {
        const liveArticles = await getArticlesFromFirestore({ status: 'PUBLISHED' });
        if (!isMounted || !liveArticles || liveArticles.length === 0) return;

        const liveFeatured = liveArticles.find((a) => a.isFeatured) || liveArticles[0];
        if (liveFeatured) setFeatured(liveFeatured);

        const latestArticles = [...liveArticles]
          .sort((a, b) => new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime())
          .slice(0, 6);
        setLatest(latestArticles);

        const popularArticles = [...liveArticles]
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 3);
        setPopular(popularArticles);
      } catch (err) {
        console.warn('Could not load dynamic articles on home page:', err);
      }
    }
    loadLiveArticles();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10 sm:space-y-14">
      <SEOHead
        title="ThatVetGuy — Collaborative Veterinary Publication"
        description="Veterinary Medicine • Animal Health • Pet Education. Evidence-based articles authored and peer-reviewed collectively by ThatVetGuy Co-Founders."
      />

      {/* Featured Lead Story */}
      <FeaturedHero article={featured} />

      {/* Categories Strip */}
      <CategoryStrip />

      {/* Latest Articles Section */}
      <section id="latest-articles-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
              Fresh From the Clinic
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
              Latest Clinical Insights
            </h2>
          </div>
          <button
            onClick={() => navigateTo({ name: 'articles' })}
            className="text-xs sm:text-sm font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 min-h-[44px] self-start sm:self-auto"
          >
            Browse all articles <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Clinical Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* Recommended / Popular Articles */}
      <section id="popular-articles-section" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
          <Sparkles className="w-5 h-5 text-emerald-800" />
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
              Recommended Veterinary Reading
            </h2>
            <p className="text-xs text-stone-500">
              Essential foundational guides curated by the Co-Founders for everyday pet health and clinical clarity.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {popular.map((article) => (
            <ArticleCard key={article.id} article={article} layout="horizontal" />
          ))}
        </div>
      </section>

      {/* Meet the ThatVetGuy Team (Co-Founders Showcase) */}
      <TeamShowcase />

      {/* Newsletter Signup */}
      <NewsletterBox />
    </div>
  );
};
