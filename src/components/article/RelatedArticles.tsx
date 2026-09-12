import React from 'react';
import { Article } from '../../types';
import { ARTICLES } from '../../data/articles';
import { ArticleCard } from './ArticleCard';

interface RelatedArticlesProps {
  currentArticleId: string;
  category: string;
  tags: string[];
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  currentArticleId,
  category,
  tags,
}) => {
  // Find related articles sharing category or tags
  const related = ARTICLES.filter((a) => a.id !== currentArticleId)
    .map((a) => {
      let score = 0;
      if (a.category === category) score += 3;
      a.tags.forEach((t) => {
        if (tags.includes(t)) score += 1;
      });
      return { article: a, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section id="related-articles-section" className="mt-14 pt-10 border-t border-stone-200">
      <div className="mb-6">
        <h3 className="font-serif font-bold text-2xl text-stone-900">
          Related Veterinary Insights
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Continue exploring evidence-based animal health and clinical medicine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};
