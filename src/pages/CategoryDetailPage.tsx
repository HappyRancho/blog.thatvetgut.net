import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';
import { getCategoryBySlug } from '../data/categories';
import { getArticlesByCategory } from '../data/articles';
import { ArticleCard } from '../components/article/ArticleCard';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

interface CategoryDetailPageProps {
  slug: string;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({ slug }) => {
  const { navigateTo } = useNavigation();
  const category = getCategoryBySlug(slug);
  const articles = getArticlesByCategory(slug);

  if (!category) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-stone-900">Category Not Found</h2>
        <p className="text-xs text-stone-500">The requested veterinary specialty could not be located.</p>
        <button
          onClick={() => navigateTo({ name: 'categories' })}
          className="px-5 py-2.5 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors min-h-[44px]"
        >
          View All Categories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEOHead
        title={`${category.name} Articles — ThatVetGuy`}
        description={category.description}
      />

      <div className="space-y-3 border-b border-stone-200 pb-6">
        <button
          onClick={() => navigateTo({ name: 'categories' })}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-900 transition-colors py-1 min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Specialties</span>
        </button>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
            Specialty Archive
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <Compass className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-900">No articles yet in this specialty</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Our Co-Founders are currently drafting evidence-based articles for this discipline.
          </p>
          <button
            onClick={() => navigateTo({ name: 'articles' })}
            className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors min-h-[44px]"
          >
            Explore Other Articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};
